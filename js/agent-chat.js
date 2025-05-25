class getAgents {
  constructor() {
    this.agents = document.querySelector(".agents-list");
    
    // Add loading state immediately
    this.showLoadingState();
    
    let token = sessionStorage.getItem('accessToken');

    debugLogger.info('RENDERER:agent-chat', 'getAgents constructor - token found:', !!token);

    // Check if token exists, if not try to handle missing token
    if (!token) {
      debugLogger.info('RENDERER:agent-chat', 'No token in sessionStorage, handling missing token...');
      this.handleMissingToken();
      return;
    }

    this.fetchAgents(token);
  }

  showLoadingState() {
    if (this.agents) {
      this.agents.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Loading agents...</div>';
    }
  }

  showErrorState(message) {
    if (this.agents) {
      this.agents.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff6b6b;">
        <div>Error: ${message}</div>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 10px;">Retry</button>
      </div>`;
    }
  }

  async handleMissingToken() {
    debugLogger.warn('RENDERER:agent-chat', 'No access token found in sessionStorage');
    
    // Try to get token from secure storage as fallback
    try {
      debugLogger.info('RENDERER:agent-chat', 'Attempting to retrieve stored token...');
      const storedToken = await window.electronAPI.retrieveToken();
      
      if (storedToken) {
        debugLogger.info('RENDERER:agent-chat', 'Found stored token, validating...');
        
        // Validate the stored token
        const response = await fetch(`${window.env.API_URL}/api/agents`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          debugLogger.info('RENDERER:agent-chat', 'Stored token is valid, using it');
          // Token is valid, store it in sessionStorage and fetch agents
          sessionStorage.setItem('accessToken', storedToken);
          this.fetchAgents(storedToken);
          return;
        } else {
          debugLogger.warn('RENDERER:agent-chat', 'Stored token is invalid, status:', response.status);
        }
      } else {
        debugLogger.info('RENDERER:agent-chat', 'No stored token found');
      }
    } catch (error) {
      debugLogger.error('RENDERER:agent-chat', 'Failed to retrieve stored token:', error.message);
    }
    
    // If we get here, no valid token is available, navigate to login using IPC
    debugLogger.info('RENDERER:agent-chat', 'No valid token found, navigating to login');
    this.showErrorState('Authentication required');
    
    setTimeout(() => {
      window.electronAPI.navigateToLogin();
    }, 2000);
  }

  fetchAgents(token) {
    debugLogger.info('RENDERER:agent-chat', 'Fetching agents with token...');
    
    fetch(`${window.env.API_URL}/api/agents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    .then((response) => {
        debugLogger.info('RENDERER:agent-chat', 'Agents API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
      debugLogger.info('RENDERER:agent-chat', 'Agents data received:', data?.length || 0, 'agents');
      
      if (data && Array.isArray(data) && data.length > 0) {
        const agentsList = document.querySelector(".agents-list"); 
        agentsList.innerHTML = "";

        data.forEach(agent => {
          const agentDiv = document.createElement("div");
          agentDiv.classList.add("agent-selector");
          agentDiv.textContent = agent.revisions[agent.revisions.length - 1].name;
          agentDiv.setAttribute("data-agent-id", agent.id);
          agentsList.appendChild(agentDiv);
        });
        
        debugLogger.info('RENDERER:agent-chat', 'Agents rendered successfully, initializing selectAgent...');
        this.selectAgent = new selectAgent();
        
      } else {
        debugLogger.warn('RENDERER:agent-chat', 'No agents data received or empty array');
        this.showErrorState('No agents available');
      }
    })
    .catch((error) => {
      debugLogger.error('RENDERER:agent-chat', 'Error fetching agents:', error.message);
      this.showErrorState('Failed to load agents');
      
      // If there's an error fetching agents, also try to navigate to login
      debugLogger.info('RENDERER:agent-chat', 'Error fetching agents, navigating to login in 3 seconds...');
      setTimeout(() => {
        window.electronAPI.navigateToLogin();
      }, 3000);
    });
  }
}

class selectAgent {
  constructor() {
    try {
      debugLogger.info('RENDERER:agent-chat', 'Initializing selectAgent...');
      
      this.agents = document.querySelector(".agents-list");
      this.main = document.querySelector(".agent-container");
      
      if (!this.main) {
        debugLogger.error('RENDERER:agent-chat', 'Could not find .agent-container element');
        return;
      }
      
      this.chatBox = this.main.querySelector(".chat-content");
      this.chatInputMsg = this.main.querySelector(".chat-text-input");
      this.agentSendBtn = this.main.querySelector(".agent-send-btn");
      this.inputSearch = document.querySelector('.agent-search-input');
      this.clearSearchAgent = document.querySelector('.agent-search-clear');
      this.agentSelectors = document.querySelectorAll('.agent-selector');
      this.resetAgentBtn = this.main.querySelector('.reset-chat');
      this.activeAgent = this.main.querySelector('.agent-selector.active');
      this.uploadFileBtn = this.main.querySelector('.chat-bottom-upload');
      this.uploadContent = this.main.querySelector('.upload-file');
      this.uploadCancel = this.main.querySelector('.file-close-icon');
      this.fileName = this.main.querySelector('.file-name');
      this._showUpload = false;

      this.agents.querySelectorAll('.agent-selector').forEach(element => {
        element.addEventListener('click', this.switchActiveAgent.bind(this))
      });

      this.chatInputMsg.disabled = true;
      this.agentSendBtn.disabled = true;
      this.agentSendBtn.classList.add("disabled");
      this.uploadFileBtn.disabled = true;

      this.addActions(this.agentId);
      
      debugLogger.info('RENDERER:agent-chat', 'selectAgent initialized successfully');
      
    } catch (error) {
      debugLogger.error('RENDERER:agent-chat', 'Error initializing selectAgent:', error.message);
    }
  }

  set setActiveAgentId (value) {
    this.agentId = value;
  }

  get getActiveAgentId () {
    return this.agentId;
  }
  
  loadConversationHistory() {
    const history = sessionStorage.getItem(`chatHistory_${this.getActiveAgentId}`);
    return history ? JSON.parse(history) : [{ role: 'system', content: '' }];
  }

  saveConversationHistory() {
    sessionStorage.setItem(`chatHistory_${this.getActiveAgentId}`, JSON.stringify(this.conversationHistory));
  }

  renderChatHistory(noTypping) {
    this.resetChat(false);

    const alignmentDataPattern = /^\{\{.+\}\}$/;

    if (this.conversationHistory.length > 1) {
      this.conversationHistory.forEach(({ role, content }) => {
        if (role === "user" && alignmentDataPattern.test(content)) {
          return;
        }
        
        if (role === "user") {
          this.displayUserMessage(content);
        } else if (role === "assistant") {
          if(noTypping) {
            this.renderBotMarkdown(content);
          }
          else {
            this.displayBotResponseTypingEffect(content);
          }
        }
      });
    } else {
      this.welcomeMessage(this.getActiveAgentId);
    }
  }

  switchActiveAgent(event) {
    const clickedElement = event.target;
  
    if (clickedElement.classList.contains("agent-selector")) {
      debugLogger.info('RENDERER:agent-chat', 'Agent selected:', clickedElement.textContent);
      
      this.chatInputMsg.disabled = false;
      this.agentSendBtn.disabled = false;
      this.agentSendBtn.classList.remove("disabled");
      this.uploadFileBtn.disabled = false;
  
      this.setActiveAgentId = clickedElement.getAttribute("data-agent-id");
      this.conversationHistory = this.loadConversationHistory();
  
      if (!clickedElement.classList.contains('active')) {
        document.querySelectorAll('.agent-selector.active').forEach(el => {
          el.classList.remove('active');
        });
  
        clickedElement.classList.add('active');
        document.querySelector('.chat-header h1').innerText = clickedElement.innerText;
  
        this.renderChatHistory(true);
      }
    }
  }  

  searchAgent() {
    const searchTerm = this.inputSearch.value.toLowerCase();

    this.agentSelectors.forEach(agent => {
      const agentName = agent.textContent.toLowerCase();
      if (agentName.includes(searchTerm)) {
        agent.style.display = '';
      } else {
        agent.style.display = 'none';
      }
    })
  }

  resetChat(value) {
    document.querySelector('.chat-content').innerHTML = '';

    if(value) {
      // reset chat historial (sessionStorage)
      sessionStorage.removeItem('chatHistory_'+this.getActiveAgentId);
      debugLogger.info('RENDERER:agent-chat', 'Chat history cleared for agent:', this.getActiveAgentId);
    }
  }

  welcomeMessage() {
    let token = sessionStorage?.getItem('accessToken');

    debugLogger.info('RENDERER:agent-chat', 'Loading welcome message for agent:', this.getActiveAgentId);

    fetch(
      `${window.env.API_URL}/api/agents/${this.getActiveAgentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const introductoryText = data?.revisions?.[0]?.introductoryText;
        if (introductoryText) {
          debugLogger.debug('RENDERER:agent-chat', 'Welcome message loaded successfully');
          this.displayBotResponseTypingEffect(introductoryText);
          this.conversationHistory.push({
            role: 'assistant',
            content: introductoryText,
          });
          this.saveConversationHistory(this.getActiveAgentId);
        }
      })
      .catch((error) => {
        debugLogger.error('RENDERER:agent-chat', 'Error loading welcome message:', error.message);
      });    
  }

  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  showLoadingIndicator() {
    // Remove any existing loading indicator first
    this.hideLoadingIndicator();
    
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading-indicator";
    loadingDiv.id = "chat-loading-indicator";

    const messageDiv = document.createElement("div");
    messageDiv.className = "loading-message";

    const textSpan = document.createElement("span");
    textSpan.className = "loading-text";
    textSpan.textContent = "Agent is typing";

    const dotsSpan = document.createElement("span");
    dotsSpan.className = "loading-dots";

    // Create animated dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.textContent = ".";
      dotsSpan.appendChild(dot);
    }

    messageDiv.appendChild(textSpan);
    messageDiv.appendChild(dotsSpan);

    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    timestampSpan.textContent = this.getCurrentTime();

    loadingDiv.appendChild(messageDiv);
    loadingDiv.appendChild(timestampSpan);

    this.chatBox.appendChild(loadingDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;

    debugLogger.info('RENDERER:agent-chat', 'Loading indicator shown');
  }

  hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("chat-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
      debugLogger.info('RENDERER:agent-chat', 'Loading indicator hidden');
    }
  }

  async postRequest() {
    if (!this.agentId) {
      debugLogger.error('RENDERER:agent-chat', 'No agent ID selected for chat request');
      return;
    }
  
    const validMessages = this.conversationHistory.filter(msg => {
      return msg.role && msg.content && !msg.content.startsWith("📎 Uploaded file:");
    });
  
    if (validMessages.length === 0) {
      debugLogger.warn('RENDERER:agent-chat', 'No valid messages to send');
      return;
    }

    // Show loading indicator before making the API call
    this.showLoadingIndicator();

    debugLogger.info('RENDERER:agent-chat', 'Sending chat request with', validMessages.length, 'messages');
  
    const requestData = {
      agentId: this.agentId,
      messages: validMessages,
    };
  
    try {
      let token = sessionStorage?.getItem('accessToken');
      const response = await fetch(`${window.env.API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestData),
      });
  
      const result = await response.json();
      debugLogger.info('RENDERER:agent-chat', 'Chat response received');
      this.conversationHistory.push({ role: 'assistant', content: result.response || 'No response received' });
      this.displayBotResponseTypingEffect(result.response || 'No response received'); 
      this.saveConversationHistory(this.getActiveAgentId);
    } catch (error) {
      debugLogger.error('RENDERER:agent-chat', 'Chat request error:', error.message);
      // Hide loading indicator on error
      this.hideLoadingIndicator();
    }
  }

  toggleagentSendBtn() {
    if (this.chatInputMsg) {
      if (this.chatInputMsg.value.trim()) {
        this.agentSendBtn.classList.remove("disabled");
        this.agentSendBtn.disabled = false;
      } else {
        this.agentSendBtn.classList.add("disabled");
        this.agentSendBtn.disabled = true;
      }
    }
  }

  displayMessages(message) {
    const botResponse = document.createElement("div");
    botResponse.className = "botResponse";
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    botResponse.appendChild(messageSpan);
    
    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    timestampSpan.textContent = this.getCurrentTime();
    botResponse.appendChild(timestampSpan);

    this.chatBox.appendChild(botResponse);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  displayUserMessage(message) {
    const userMessage = document.createElement("div");
    userMessage.className = "userMessage";

    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    userMessage.appendChild(messageSpan);

    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    timestampSpan.textContent = this.getCurrentTime();
    userMessage.appendChild(timestampSpan);

    this.chatBox.appendChild(userMessage);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  displayBotResponseTypingEffect(response) {
    // Hide loading indicator before showing the response
    this.hideLoadingIndicator();
    
    const botResponse = document.createElement("div");
    botResponse.className = "botResponse";

    const messageSpan = document.createElement("span");
    botResponse.appendChild(messageSpan);

    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    timestampSpan.textContent = this.getCurrentTime();
    botResponse.appendChild(timestampSpan);

    this.chatBox.appendChild(botResponse);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;

    // Convert Markdown to sanitized HTML
    const safeHTML = DOMPurify.sanitize(marked.parse(response));

    // Create a temporary container to parse the HTML structure
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeHTML;

    const nodes = Array.from(tempDiv.childNodes);
    let currentNodeIndex = 0;
    const typingSpeed = 8;

    const self = this;

    function typeText(node, parentElement, callback) {
      const textContent = node.textContent;
      let charIndex = 0;
      const textNode = document.createTextNode("");
      parentElement.appendChild(textNode);

      function typeChar() {
        if (charIndex < textContent.length) {
          textNode.textContent += textContent[charIndex];
          self.chatBox.scrollTop = self.chatBox.scrollHeight;
          charIndex++;
          setTimeout(typeChar, typingSpeed);
        } else {
          callback();
        }
      }
      typeChar();
    }

    function typeNode(node, parentElement, callback) {
      if (node.nodeType === Node.TEXT_NODE) {
        typeText(node, parentElement, callback);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node.cloneNode(false);
        parentElement.appendChild(element);

        const childNodes = Array.from(node.childNodes);
        let childIndex = 0;

        function typeNextChild() {
          if (childIndex < childNodes.length) {
            typeNode(childNodes[childIndex], element, typeNextChild);
            childIndex++;
          } else {
            callback();
          }
        }

        typeNextChild();
      } else {
        callback();
      }
    }

    function typeNextNode() {
      if (currentNodeIndex < nodes.length) {
        const currentNode = nodes[currentNodeIndex];
        currentNodeIndex++;
        typeNode(currentNode, messageSpan, typeNextNode);
      } else {}
    }
    typeNextNode();
  }

  renderBotMarkdown(content) {
    const botResponse = document.createElement("div");
    botResponse.className = "botResponse";
  
    const messageSpan = document.createElement("span");
    botResponse.appendChild(messageSpan);
  
    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    timestampSpan.textContent = this.getCurrentTime();
    botResponse.appendChild(timestampSpan);
  
    this.chatBox.appendChild(botResponse);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  
    const safeHTML = DOMPurify.sanitize(marked.parse(content));
    messageSpan.innerHTML = safeHTML;
  }

  uploadFile() {
    debugLogger.info('RENDERER:agent-chat', 'File upload initiated');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.style.display = 'none';
  
    input.onchange = async (event) => {
      if (!this.agentId) {
        alert("Please select an agent before uploading a file.");
        return;
      }
      
      const file = event.target.files[0];
      if (!file) return;

      debugLogger.info('RENDERER:agent-chat', 'Processing file upload:', file.name, 'type:', file.type);
  
      const fileName = file.name;
      const fileType = file.type;
      let extractedText = '';
  
      try {
        if (fileType === 'text/plain') {
          extractedText = await file.text();
          this.pendingUpload = { text: extractedText, fileName };
    
        } else if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
          this.pendingUpload = { text: extractedText, fileName };
    
        } else if (fileType === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            extractedText += pageText + '\\n';
          }
    
          this.pendingUpload = { text: extractedText, fileName };
    
        } else if (fileType.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const { data: { text } } = await Tesseract.recognize(
                e.target.result,
                'eng',
                {
                  workerPath: window.electronAPI.workerPath,
                  corePath: window.electronAPI.corePath
                }
              );
              this.pendingUpload = { text, fileName };
              this.showUpload = true;
              this.chatInputMsg.focus();
              this.fileName.innerHTML = `${fileName}`;
              debugLogger.info('RENDERER:agent-chat', 'OCR processing completed for:', fileName);
            } catch (error) {
              debugLogger.error('RENDERER:agent-chat', 'OCR processing failed:', error.message);
              alert('Failed to process image: ' + error.message);
            }
          };
          reader.readAsDataURL(file);
          return;
    
        } else {
          alert('Unsupported file type');
          debugLogger.warn('RENDERER:agent-chat', 'Unsupported file type:', fileType);
          return;
        }

        debugLogger.info('RENDERER:agent-chat', 'File processed successfully:', fileName);
        this.showUpload = true;
        this.chatInputMsg.focus();
        this.fileName.innerHTML = `${fileName}`;
        this.agentSendBtn.disabled = false;
        this.agentSendBtn.classList.remove("disabled");
        
      } catch (error) {
        debugLogger.error('RENDERER:agent-chat', 'File processing error:', error.message);
        alert('Failed to process file: ' + error.message);
      }
    };
  
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }
  
  sendToAPI(text, fileName) {
    const token = sessionStorage?.getItem('accessToken');
    const key = fileName;

    debugLogger.info('RENDERER:agent-chat', 'Uploading file content to API:', fileName);

    fetch(`${window.env.API_URL}/api/alignment-data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            key: key,
            value: text
        })
    })
    .then(async res => {
        const responseText = await res.text();

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        debugLogger.info('RENDERER:agent-chat', 'File content uploaded successfully:', fileName);
    })
    .catch(err => {
        debugLogger.error('RENDERER:agent-chat', 'API upload error:', err.message);
    });
  }

  checkToken() {
    this.accessToken = sessionStorage.getItem('accessToken');
    
    if (!this.accessToken) {
      debugLogger.warn('RENDERER:agent-chat', 'No access token found, navigating to login');
      window.electronAPI.navigateToLogin();
    }
  }

  set showUpload(value) {
    this._showUpload = value;
    
    if(value) {
      this.uploadContent.classList.add('show');
    }
    else {
      this.uploadContent.classList.remove('show');
    }
  }

  addActions(agentId) {
    try {
      if (this.agentSendBtn && this.chatInputMsg) {
        this.agentSendBtn.addEventListener("click", () => {
          this.handleSendMessage(agentId);
        });

        this.chatInputMsg.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            if (event.shiftKey) {
              event.preventDefault();
              this.chatInputMsg.value += "\n";
            } else {
              event.preventDefault();
              this.handleSendMessage(agentId);
            }
          }
        });

        // Add input listener for send button toggle
        this.chatInputMsg.addEventListener("input", () => {
          this.toggleagentSendBtn();
        });
      }

      //input search agent
      if (this.inputSearch) {
        this.inputSearch.addEventListener('input', () => {
          this.searchAgent();
        });
      }
      
      //clear input agent search
      if (this.clearSearchAgent) {
        this.clearSearchAgent.addEventListener('click', () => {
          this.inputSearch.value = '';
          this.searchAgent();
        });
      }

      //clear active chat (by agentId)
      if (this.resetAgentBtn) {
        this.resetAgentBtn.addEventListener('click', () => {      
          this.resetChat(true);
          this.conversationHistory = [{ role: 'system', content: '' }];
          this.welcomeMessage();
          this.chatInputMsg.focus();
        });
      }

      //upload file btn
      if (this.uploadFileBtn) {
        this.uploadFileBtn.addEventListener('click', () => {
          this.uploadFile();
        });
      }

      //cancel upload
      if (this.uploadCancel) {
        this.uploadCancel.addEventListener('click', () => {
          this.showUpload = false;
        });
      }
    } catch (error) {
      debugLogger.error('RENDERER:agent-chat', 'Error adding event listeners:', error.message);
    }
  }

  handleSendMessage(activeAgentId) {
    if (!this.agentId) {
      debugLogger.warn('RENDERER:agent-chat', 'No agent selected for sending message');
      return;
    }
    
    if (this.chatInputMsg) {
      const userInput = this.chatInputMsg.value.trim();
  
      const shouldSend =
        userInput.length > 0 || this.pendingUpload !== null;
  
      if (shouldSend) {
        // Ensure conversationHistory is initialized
        if (!this.conversationHistory) {
          this.conversationHistory = this.loadConversationHistory();
        }
  
        if (userInput.length > 0) {
          debugLogger.info('RENDERER:agent-chat', 'Sending user message');
          this.conversationHistory.push({ role: "user", content: userInput });
          this.saveConversationHistory(this.agentId);
          this.displayUserMessage(userInput);
          this.postRequest();
          this.chatInputMsg.value = "";
          this.toggleagentSendBtn();
        }
  
        if (this.pendingUpload) {
          debugLogger.info('RENDERER:agent-chat', 'Processing pending file upload:', this.pendingUpload.fileName);
          this.conversationHistory.push({ role: "user", content: `{{${this.pendingUpload.fileName}}}` });

          this.sendToAPI(this.pendingUpload.text, this.pendingUpload.fileName);

          this.pendingUpload = null;
          this.showUpload = false;
          this.fileName.innerHTML = '';

          this.saveConversationHistory(this.agentId);
        }
      }
    }
  }  
}

//Events
document.addEventListener("DOMContentLoaded", () => {
  debugLogger.info('RENDERER:agent-chat', 'DOM loaded, initializing getAgents...');
  try {
    new getAgents();
  } catch (error) {
    debugLogger.error('RENDERER:agent-chat', 'Error initializing getAgents:', error.message, error.stack);
    // Show error in UI
    const agentsList = document.querySelector(".agents-list");
    if (agentsList) {
      agentsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff6b6b;">
        <div>Application Error: ${error.message}</div>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 10px;">Reload</button>
      </div>`;
    }
  }
});
