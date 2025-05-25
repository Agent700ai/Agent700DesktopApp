# API Integration: Agent700 Complete Reference

## Complete OpenAPI 3.0.0 Specification

The Agent700 API provides comprehensive functionality for AI agent interactions, chat management, document processing, and user data management. Below is the complete API specification.

### API Base URLs
- **Production**: `https://app.agent700.ai`
- **Development**: `http://localhost:5601`

### Authentication
All API endpoints (except login) require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Complete API Endpoint Reference

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "email": "user@example.com",
  "accessToken": "jwt_token_string",
  "organizationsRoles": [
    {
      "name": "Organization Name",
      "id": "org-uuid",
      "role": "admin"
    }
  ],
  "defaultOrganization": {
    "id": "org-uuid",
    "name": "Organization Name"
  },
  "redirectUrl": null
}
```

### Chat Endpoints

#### POST /api/chat
Send a chat request to an AI agent and receive a response.

**Request Body:**
```json
{
  "model": "gpt-4.1-2025-04-14",
  "temperature": 0.7,
  "topP": 0.9,
  "maxTokens": 32768,
  "agentId": "agent-uuid",
  "agentRevisionId": 1,
  "messages": [
    {
      "id": "message-uuid",
      "role": "user",
      "content": "Hello, how can you help me?"
    }
  ]
}
```

**Multimodal Content (OpenAI models only):**
```json
{
  "model": "gpt-4o",
  "agentId": "agent-uuid",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Describe this image"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,..."
          }
        }
      ]
    }
  ]
}
```

**Response (200):**
```json
{
  "response": "Assistant response text",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 5,
    "totalTokens": 15
  }
}
```

#### GET /api/chat/fetch-url-metadata
Retrieve metadata from a URL including title, description, and image.

**Query Parameters:**
- `url` (required): URL to fetch metadata from

**Response (200):**
```json
{
  "title": "Article Title",
  "description": "Article description",
  "image": "https://example.com/image.jpg",
  "url": "https://example.com/article"
}
```

### Agent Management Endpoints

#### GET /api/agents
Retrieve all agents accessible to the authenticated user.

**Query Parameters:**
- `organization_id` (optional): Filter agents by organization ID

**Response (200):**
```json
[
  {
    "id": "agent-uuid",
    "currentRevision": 1,
    "userId": "user-uuid",
    "organizationId": "org-uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "customShareUrl": null,
    "allowPublicSharing": false,
    "hasPhoneNumber": false,
    "phoneNumber": null,
    "revisions": [
      {
        "agentId": "agent-uuid",
        "id": 1,
        "name": "Agent Name",
        "userId": "user-uuid",
        "masterPrompt": "System prompt text",
        "introductoryText": "Welcome message",
        "streamResponses": false,
        "model": "gpt-4.1",
        "temperature": 0.7,
        "topP": 0.9,
        "maxTokens": 2048,
        "reasoningEffort": "medium",
        "thinkingEnabled": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
]
```

#### POST /api/agents
Create a new agent.

**Request Body:**
```json
{
  "name": "My New Agent",
  "masterPrompt": "You are a helpful assistant",
  "introductoryText": "Hello! How can I help you today?",
  "model": "gpt-4.1",
  "temperature": 0.7,
  "organizationId": "org-uuid"
}
```

#### GET /api/agents/{agent_id}
Get a specific agent by ID.

#### PUT /api/agents/{agent_id}
Update an existing agent.

#### DELETE /api/agents/{agent_id}
Delete an agent.

#### GET /api/agents/{agent_id}/revision/{revision_id}
Get a specific revision of an agent.

### Document Processing Endpoints

#### POST /api/helpers/parse-document
Parse various document formats to extract text content.

**Supported Formats:**
- PDF (.pdf) - with optional OCR
- Word (.docx)
- Excel (.xlsx)
- PowerPoint (.pptx)
- CSV/TSV (.csv, .tsv)
- Rich Text Format (.rtf)
- OpenDocument formats (.odt, .ods, .odp)
- eBook (.epub)
- Markdown (.md)
- Text (.txt)
- XML (.xml)
- JSON (.json)
- LaTeX (.tex)
- Images (.png, .jpg, .jpeg, .bmp, .tiff, .tif) - with OCR

**Request (multipart/form-data):**
- `document` (required): File to parse
- `convertForDatatable` (optional): Boolean, default false

**Query Parameters:**
- `use_ocr` (optional): Boolean, default false

**Response (200):**
```json
{
  "text": "Extracted text content with filename tags"
}
```

**Or when convertForDatatable is true:**
```json
{
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ]
}
```

### Alignment Data Endpoints

#### GET /api/alignment-data
Get all alignment data for the authenticated user.

#### POST /api/alignment-data
Create or update alignment data.

**Request Body:**
```json
{
  "key": "data.key.path",
  "value": "stored value"
}
```

#### GET /api/alignment-data/construct-json
Construct a nested JSON object from all alignment data.

### QA Sheets Endpoints

#### GET /api/agents/{agent_id}/qa-sheets
Get all QA sheets for a specific agent.

#### POST /api/agents/{agent_id}/qa-sheets
Create a new QA sheet for an agent.

#### GET /api/agents/{agent_id}/qa-sheets/{qa_sheet_id}
Get a specific QA sheet.

#### PUT /api/agents/{agent_id}/qa-sheets/{qa_sheet_id}
Update a QA sheet.

#### DELETE /api/agents/{agent_id}/qa-sheets/{qa_sheet_id}
Delete a QA sheet.

### Ratings Endpoints

#### POST /api/ratings
Create a rating for a conversation.

#### GET /api/ratings/agent/{agent_id}
Get all ratings for an agent.

#### GET /api/ratings/agent/{agent_id}/revision/{revision_id}
Get ratings for a specific agent revision.

### Workflows Endpoints

#### GET /api/workflows
Get all workflows accessible to the user.

#### POST /api/workflows
Create a new workflow.

#### GET /api/workflows/{workflow_guid}
Get a specific workflow.

#### PUT /api/workflows/{workflow_guid}
Update a workflow.

## Chrome Extension Integration Patterns

### API Configuration
```javascript
const API_CONFIG = {
  production: 'https://app.agent700.ai',
  development: 'http://localhost:5601',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};
```

### Error Handling
```javascript
class APIError extends Error {
  constructor(status, message, endpoint) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function handleAPIResponse(response, endpoint) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      errorData.error || 'Unknown API error',
      endpoint
    );
  }
  return response.json();
}
```

### Background Script API Client
```javascript
class Agent700BackgroundClient {
  constructor() {
    this.baseURL = API_CONFIG.production;
    this.requestQueue = new RequestQueue();
    this.tokenManager = new TokenManager();
  }
  
  async request(endpoint, options = {}) {
    return this.requestQueue.enqueue(async () => {
      const token = await this.tokenManager.getValidToken();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      return handleAPIResponse(response, endpoint);
    });
  }
  
  async chat(agentId, messages, options = {}) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId,
        messages,
        model: 'gpt-4.1',
        temperature: 0.7,
        maxTokens: 2048,
        ...options
      })
    });
  }
  
  async getAgents(organizationId) {
    const params = organizationId ? `?organization_id=${organizationId}` : '';
    return this.request(`/api/agents${params}`);
  }
  
  async parseDocument(file, useOCR = false) {
    const formData = new FormData();
    formData.append('document', file);
    
    return this.request(`/api/helpers/parse-document?use_ocr=${useOCR}`, {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type for FormData
    });
  }
}
```

### Message Passing Pattern
```javascript
const API_MESSAGE_TYPES = {
  CHAT_REQUEST: 'CHAT_REQUEST',
  GET_AGENTS: 'GET_AGENTS',
  PARSE_DOCUMENT: 'PARSE_DOCUMENT',
  GET_ALIGNMENT_DATA: 'GET_ALIGNMENT_DATA'
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case API_MESSAGE_TYPES.CHAT_REQUEST:
      apiClient.chat(message.agentId, message.messages, message.options)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case API_MESSAGE_TYPES.GET_AGENTS:
      apiClient.getAgents(message.organizationId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
  }
});
```

## Streaming Implementation Notes

**Important**: The Agent700 API does **not** support real-time streaming responses. The `/api/chat` endpoint returns complete responses. However, the AgentRevision schema includes a `streamResponses` boolean property, suggesting this may be a planned feature.

**Current Implementation**: The Chrome extension implements client-side "streaming" by progressively displaying the complete response word-by-word to simulate the streaming experience users expect from modern AI chat interfaces.

### Client-Side Streaming Pattern
```javascript
// Extension implements word-by-word progressive display
// See: src/hooks/useStreamingDisplay.js
const { displayedContent, isStreaming, completeStreaming } = useStreamingDisplay(
  fullResponse,
  75, // 75ms delay between words
  true // streaming enabled
);
```

This approach provides the visual streaming experience while working within the current API constraints.

## Rate Limiting and Request Management

### Request Queue Implementation
```javascript
class RequestQueue {
  constructor(maxConcurrent = 5, rateLimitPerMinute = 60) {
    this.maxConcurrent = maxConcurrent;
    this.rateLimitPerMinute = rateLimitPerMinute;
    this.queue = [];
    this.active = 0;
    this.requestTimes = [];
  }
  
  async enqueue(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    if (this.requestTimes.length >= this.rateLimitPerMinute) {
      setTimeout(() => this.processQueue(), 1000);
      return;
    }
    
    const { requestFn, resolve, reject } = this.queue.shift();
    this.active++;
    this.requestTimes.push(now);
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      this.processQueue();
    }
  }
}
```

## Desktop App Integration Notes

### Currently Used Endpoints
The Agent700 Desktop App currently uses a subset of these API endpoints:
- `POST /api/auth/login` - User authentication
- `GET /api/agents` - Loading available agents
- `GET /api/agents/{agent_id}` - Getting specific agent details for welcome messages
- `POST /api/chat` - Main chat functionality
- `POST /api/alignment-data` - File content storage for uploaded documents

### Enhanced File Processing Opportunities
The desktop app could benefit from the comprehensive document processing endpoint:

**Current Implementation:**
- Client-side processing with Tesseract.js, Mammoth.js, PDF.js
- Limited to basic text extraction
- Manual OCR configuration

**Potential Enhancement with `/api/helpers/parse-document`:**
- Server-side processing with professional-grade tools
- Support for many more file formats (Excel, PowerPoint, RTF, OpenDocument, eBook, etc.)
- Advanced OCR capabilities
- Structured data extraction with `convertForDatatable` option

### Error Handling Enhancement Opportunities
The Chrome extension patterns provide more robust error handling that could improve the desktop app:

```javascript
// Enhanced error handling pattern for desktop app
class DesktopAPIClient {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }
  
  async requestWithRetry(endpoint, options = {}) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${window.env.API_URL}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw new APIError(response.status, await response.text(), endpoint);
        }
        
        return response.json();
      } catch (error) {
        if (attempt === this.retryAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }
}
```

### Additional Features Available
The comprehensive API reference reveals many capabilities not yet utilized in the desktop app:
- **QA Sheets**: Quality assurance and testing capabilities
- **Ratings**: User feedback and response rating systems
- **Workflows**: Advanced automation and process management
- **URL Metadata**: Web content integration
- **Organization Management**: Multi-organization support

This comprehensive API reference provides the complete foundation for understanding and extending the Agent700 platform integration within the desktop application and beyond.
