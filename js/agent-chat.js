class getAgents {
  constructor() {
    this.agents = document.querySelector(".agents-list");
    let token = sessionStorage.getItem('accessToken');

    fetch("https://agent700.ai/api/agents", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
      if (data) {
        const agentsList = document.querySelector(".agents-list"); 
        agentsList.innerHTML = "";

        data.forEach(agent => {
          const agentDiv = document.createElement("div");
          agentDiv.classList.add("agent-selector");
          agentDiv.textContent = agent.revisions[agent.revisions.length - 1].name;
          agentDiv.setAttribute("data-agent-id", agent.id);
          agentsList.appendChild(agentDiv);
        });
        this.selectAgent = new selectAgent()
      } else {
        this.errorElement.textContent = "Incorrect.";
      }
    })
    .catch((error) => {
      console.log("Error in request:", error);
    });
  }
}

class selectAgent {
  constructor() {
    this.agents = document.querySelector(".agents-list");
    this.main = document.querySelector(".agent-container");
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

    if (this.conversationHistory.length > 1) {
      this.conversationHistory.forEach(({ role, content }) => {
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
    }
  }

  welcomeMessage() {
    fetch("https://agent700.ai/api/agents/" + this.getActiveAgentId)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        let introductoryText = data?.revisions[0]?.introductoryText;
        console.log('introductory', data.revisions[data.revisions.length - 1]);

        if (introductoryText && introductoryText != "") {
          this.displayBotResponseTypingEffect(data.revisions[0].introductoryText);
          this.conversationHistory.push({ role: 'assistant', content: introductoryText || 'No response received' });
          this.saveConversationHistory(this.getActiveAgentId);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  async postRequest() {
    if (!this.agentId) {
      console.error("No agent ID selected.");
      return;
    }
  
    const validMessages = this.conversationHistory.filter(msg => {
      return msg.role && msg.content && !msg.content.startsWith("📎 Uploaded file:");
    });
  
    if (validMessages.length === 0) {
      console.warn("No valid messages to send.");
      return;
    }
  
    const requestData = {
      agentId: this.agentId,
      messages: validMessages,
    };
  
    try {
      const response = await fetch("https://app.agent700.ai/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
  
      const result = await response.json();
      this.conversationHistory.push({ role: 'assistant', content: result.response || 'No response received' });
      this.displayBotResponseTypingEffect(result.response || 'No response received'); 
      this.saveConversationHistory(this.getActiveAgentId);
    } catch (error) {
      console.error("Request error:", error);
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
    const typingSpeed = 20;

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
  
      const fileName = file.name;
      const fileType = file.type;
      let extractedText = '';
  
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
        };
        reader.readAsDataURL(file);
        return;
  
      } else {
        alert('Unsupported file type');
        return;
      }
  
      this.showUpload = true;
      this.chatInputMsg.focus();
      this.fileName.innerHTML = `${fileName}`;
      this.agentSendBtn.disabled = false;
      this.agentSendBtn.classList.remove("disabled");
    };
  
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }
  
  sendToAPI(text, fileName) {
    const token = sessionStorage.getItem('accessToken');
    const key = 'upload.file.' + fileName;

    fetch('https://agent700.ai/api/alignment-data', {
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
    })
    .catch(err => {
        console.error('API Error:', err);
    });
  }

  checkToken() {
    this.accessToken = sessionStorage.getItem('accessToken');
    
    if (!this.accessToken) {
      window.location.href = "/login.html";
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
    }

    //input search agent
    this.inputSearch.addEventListener('input', () => {
      this.searchAgent();
    });
    //clear input agent search
    this.clearSearchAgent.addEventListener('click', () => {
      this.inputSearch.value = '';
      this.searchAgent();
    });

    //clear active chat (by agentId)
    this.resetAgentBtn.addEventListener('click', () => {      
      this.resetChat(true);
      this.conversationHistory = [{ role: 'system', content: '' }];
      this.welcomeMessage();
      this.chatInputMsg.focus();
    });

    //upload file btn
    this.uploadFileBtn.addEventListener('click', () => {
      // this.uploadFile();
      // this.showUpload = true;
      this.uploadFile();
    })

    //cancel upload
    this.uploadCancel.addEventListener('click', () => {
      this.showUpload = false;
    })
  }

  handleSendMessage(activeAgentId) {
    if (!this.agentId) {
      console.warn("No agent selected.");
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
          this.conversationHistory.push({ role: "user", content: userInput });
          this.saveConversationHistory(this.agentId);
          this.displayUserMessage(userInput);
          this.postRequest();
          this.chatInputMsg.value = "";
          this.toggleagentSendBtn();
        }
  
        if (this.pendingUpload) {
          const fileMessage = `Uploaded file: ${this.pendingUpload.fileName}`;
          this.conversationHistory.push({ role: "user", content: fileMessage });
          this.displayUserMessage(fileMessage);
          this.sendToAPI(this.pendingUpload.text, this.pendingUpload.fileName);
          this.pendingUpload = null;
          this.showUpload = false;
          this.fileName.innerHTML = '';
        }
      }
    }
  }  
}

//Events
document.addEventListener("DOMContentLoaded", () => {
  new getAgents();
});