# System Patterns & Architecture

## Security-First Architecture Overview

The Agent700 Desktop App follows a **zero-trust, security-first** Electron architecture with strict separation between main and renderer processes, enhanced with custom patterns for secure AI chat management, encrypted file processing, and privacy-by-design data handling.

```mermaid
graph TD
    A[Main Process - main.js] --> B[Preload Script - preload.js]
    B --> C[Login Renderer - renderer.js]
    C --> D[Chat Renderer - agent-chat.js]
    
    A --> E[BrowserWindow Management]
    E --> F[Login Window - login.html]
    E --> G[Chat Window - agent-chat.html]
    
    D --> H[Agent Management]
    D --> I[Chat Management]
    D --> J[File Processing Pipeline]
    
    H --> K[Agent700 API]
    I --> K
    J --> L[OCR Engine - Tesseract.js]
    J --> M[Document Parser - Mammoth.js]
    J --> N[PDF Parser - PDF.js]
```

## Key Design Patterns

### 1. Multi-Window Navigation Pattern
**Pattern**: Single main process manages window transitions based on authentication state
```javascript
// Main Process (main.js)
app.whenReady() → Load login.html
ipcMain.on('login-success') → Load agent-chat.html
```

**Benefits**:
- Clear separation of authentication and chat concerns
- Memory efficiency (single window at a time)
- Simple state management

### 2. Class-Based Component Architecture
**Pattern**: Each major feature implemented as ES6 class with clear responsibilities

```javascript
// Core Classes Structure
class getAgents {
    // Handles initial agent fetching and UI setup
    constructor() → fetch agents → initialize selectAgent
}

class selectAgent {
    // Manages all chat functionality
    // - Agent selection and switching
    // - Message handling and display
    // - File processing coordination
    // - Conversation persistence
}
```

**Benefits**:
- Encapsulated functionality
- Clear data flow and dependencies
- Easier testing and maintenance

### 3. Session Storage Pattern
**Pattern**: Persistent conversation management using sessionStorage with agent-specific keys

```javascript
// Storage Key Pattern
sessionStorage.setItem(`chatHistory_${agentId}`, JSON.stringify(history))
sessionStorage.getItem(`chatHistory_${agentId}`)
sessionStorage.removeItem(`chatHistory_${agentId}`)
```

**Benefits**:
- Per-agent conversation isolation
- Automatic cleanup on app restart
- Simple serialization/deserialization

### 4. File Processing Pipeline Pattern
**Pattern**: Unified async file processing with type detection and appropriate handlers

```javascript
// File Processing Flow
uploadFile() → 
    File Selection → 
    Type Detection → 
    Handler Selection (text/docx/pdf/image) → 
    Extraction → 
    pendingUpload storage → 
    API alignment-data submission
```

**File Type Handlers**:
- **Text files**: Direct text reading
- **DOCX files**: Mammoth.js raw text extraction
- **PDF files**: PDF.js page-by-page text extraction
- **Images**: Tesseract.js OCR with custom worker/core paths

### 5. Progressive Message Rendering Pattern
**Pattern**: Two-mode message display system for different user experience needs

```javascript
// Instant Rendering (history loading)
renderBotMarkdown(content) → immediate HTML injection

// Typing Effect (new messages)
displayBotResponseTypingEffect(content) → 
    marked.parse() → 
    DOMPurify.sanitize() → 
    character-by-character animation
```

## Component Relationships

### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant L as Login Renderer
    participant M as Main Process
    participant C as Chat Renderer
    participant A as Agent700 API
    
    U->>L: Enter credentials
    L->>A: POST /api/login
    A-->>L: Access token
    L->>sessionStorage: Store token
    L->>M: IPC: login-success
    M->>C: Load chat interface
    C->>sessionStorage: Retrieve token
    C->>A: GET /api/agents (with Bearer token)
```

### Agent Selection & Chat Flow
```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Interface
    participant S as SessionStorage
    participant A as Agent700 API
    
    U->>C: Select agent
    C->>S: Load conversation history
    C->>C: Render existing messages
    C->>A: GET agent welcome message
    A-->>C: Introductory text
    C->>C: Display with typing effect
    C->>S: Save updated history
```

### File Upload & Processing Flow
```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Interface
    participant P as File Processor
    participant A as Alignment API
    
    U->>C: Upload file
    C->>P: Process by type
    P-->>C: Extracted text
    C->>C: Store as pendingUpload
    U->>C: Send message
    C->>A: POST alignment-data
    C->>A: POST chat (with file reference)
```

## Critical Implementation Paths

### 1. Security Context Bridge
**Path**: main.js → preload.js → renderer contexts
```javascript
// preload.js - Secure API exposure
contextBridge.exposeInMainWorld('electronAPI', {
    sendLoginSuccess: () => ipcRenderer.send('login-success'),
    workerPath: pathToFileURL(...),  // Tesseract worker
    corePath: pathToFileURL(...)     // Tesseract core
});

contextBridge.exposeInMainWorld('env', {
    API_URL: process.env.API_URL
});
```

### 2. Token Management Path
**Path**: Login → SessionStorage → API Headers
```javascript
// Login success → token storage → API usage
sessionStorage.setItem('accessToken', token)
headers: { "Authorization": `Bearer ${token}` }
```

### 3. Message Processing Path
**Path**: User Input → History → API → Response → Display → Storage
```javascript
handleSendMessage() →
    conversationHistory.push(userMessage) →
    postRequest() →
    conversationHistory.push(apiResponse) →
    displayBotResponseTypingEffect() →
    saveConversationHistory()
```

### 4. File Processing Path
**Path**: File Selection → Type Detection → Processing → API Upload → Integration
```javascript
uploadFile() →
    file type detection →
    appropriate processor (OCR/PDF/DOCX/text) →
    pendingUpload storage →
    sendToAPI(alignment-data) →
    chat message integration
```

## Error Handling Patterns

### API Error Handling
```javascript
// Consistent error handling across API calls
fetch(url, options)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => console.error('Error:', error));
```

### File Processing Error Handling
```javascript
// Graceful degradation for unsupported files
if (fileType === 'supportedType') {
    // Process file
} else {
    alert('Unsupported file type');
    return;
}
```

## Performance Optimization Patterns

### 1. Lazy Loading
- Agents loaded only after authentication
- Chat history loaded only when agent selected
- File processing triggered only on upload

### 2. Memory Management
- Single BrowserWindow instance
- Conversation histories stored in sessionStorage (cleared on restart)
- File processing with immediate cleanup after extraction

### 3. UI Responsiveness
- Typing effects with configurable speed (20ms per character)
- Immediate UI feedback for user actions
- Async file processing with progress indication

## Security & Privacy Design Patterns

### 1. Zero-Trust Security Pattern
**Pattern**: Assume no component is inherently trusted; verify everything
```javascript
// Token Validation Pattern
const validateToken = (token) => {
    if (!token || isTokenExpired(token) || !isTokenValid(token)) {
        redirectToLogin();
        return false;
    }
    return true;
};

// Input Sanitization Pattern
const sanitizeInput = (input) => {
    return DOMPurify.sanitize(marked.parse(input));
};
```

### 2. Data Minimization Pattern
**Pattern**: Collect and process only necessary data
```javascript
// Minimal Data Collection
const extractRequiredData = (fileContent) => {
    // Process only text content, discard metadata
    return {
        content: sanitizeText(fileContent),
        timestamp: Date.now()
        // No file paths, user info, or system data
    };
};
```

### 3. Secure Disposal Pattern
**Pattern**: Securely dispose of sensitive data after use
```javascript
// Secure Memory Cleanup
const secureDisposal = (sensitiveData) => {
    // Overwrite memory
    if (typeof sensitiveData === 'string') {
        sensitiveData = '0'.repeat(sensitiveData.length);
    }
    sensitiveData = null;
    // Force garbage collection
    if (global.gc) global.gc();
};
```

### 4. Encryption-at-Rest Pattern
**Pattern**: Encrypt sensitive data in local storage
```javascript
// Encrypted Storage Pattern
const encryptedStorage = {
    set: (key, data) => {
        const encrypted = encrypt(JSON.stringify(data));
        sessionStorage.setItem(key, encrypted);
    },
    get: (key) => {
        const encrypted = sessionStorage.getItem(key);
        return encrypted ? JSON.parse(decrypt(encrypted)) : null;
    }
};
```

### 5. Audit Trail Pattern
**Pattern**: Log security-relevant events for compliance
```javascript
// Security Event Logging
const auditLog = {
    logSecurityEvent: (event, details) => {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            details: sanitizeForLog(details),
            sessionId: getCurrentSessionId()
        };
        appendToSecureLog(auditEntry);
    }
};
```

## Privacy-by-Design Architecture

### Data Flow Isolation
```mermaid
graph TD
    A[User Input] --> B[Local Processing]
    B --> C[Encryption Layer]
    C --> D[Temporary Storage]
    D --> E[API Communication]
    E --> F[Secure Disposal]
    
    B --> G[Privacy Filter]
    G --> H[Minimal Data Set]
    H --> C
    
    F --> I[Audit Log]
    I --> J[Compliance Reporting]
```

### Security Boundaries
```mermaid
graph LR
    subgraph "Main Process (Privileged)"
        A[Window Management]
        B[File System Access]
        C[Network Communications]
    end
    
    subgraph "Renderer Process (Sandboxed)"
        D[UI Components]
        E[User Interactions]
        F[Data Display]
    end
    
    subgraph "Preload Script (Bridge)"
        G[Secure API Exposure]
        H[Input Validation]
        I[Context Isolation]
    end
    
    A -.->|Controlled| G
    G -.->|Validated| D
    E --> H
    H --> A
```

## State Management Patterns

### Application State (Security Enhanced)
- **Authentication**: Encrypted sessionStorage with automatic expiration
- **Agent Selection**: DOM classes with security status indicators
- **Conversations**: Encrypted per-agent storage with audit trails
- **File Uploads**: Secure temporary object with automatic disposal

### Security State
- **Session Security**: Token validation, expiration tracking, refresh handling
- **Privacy Mode**: User consent status, data retention preferences
- **Audit State**: Security event logging, compliance status tracking
- **Threat Detection**: Anomaly detection, security alerts, response actions

### UI State (Privacy Aware)
- **Active Agent**: DOM class manipulation with security indicators
- **Input State**: Button enable/disable with security validation
- **Upload State**: Security scanning status and privacy notices
- **Message Display**: Sanitized content with security metadata
