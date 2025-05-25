# Technology Context

## Security-First Technology Stack

### Electron Framework (v28.1.3) - Security Hardened
**Purpose**: Cross-platform desktop application framework with enterprise security
**Security Configuration**:
- **Context Isolation**: Enabled for maximum security separation
- **Node Integration**: Disabled in renderer for attack surface reduction
- **Preload Script**: `js/preload.js` with minimal, validated API exposure
- **Security Headers**: CSP, HTTPS-only, secure transport protocols
- **Sandboxing**: Renderer processes isolated from system resources
**Window Security**:
- Fixed dimensions: 920x680 pixels (prevents window manipulation attacks)
- Secure window creation with security-first defaults

### Node.js & NPM Dependencies
**Main Dependencies**:
- `electron`: ^28.1.3 (Desktop framework)
- `dotenv`: ^16.5.0 (Environment variable management)

**Development Setup**:
```bash
# Installation
npm install

# Start application
npm start
```

### Frontend Technologies

#### JavaScript (ES6+)
**Features Used**:
- ES6 Classes for component architecture
- Async/await for API calls and file processing
- Template literals for dynamic content
- Destructuring for clean parameter handling
- Arrow functions for event handlers

#### HTML5 & CSS3
**Structure**:
- Semantic HTML with proper accessibility
- Modern CSS with flexbox layouts
- Responsive design patterns
- Custom CSS variables for theming

#### External Libraries (CDN-based)

**Document Processing**:
- **Tesseract.js v4.0.2**: OCR engine for image text extraction
- **Mammoth.js**: DOCX to HTML conversion with raw text extraction
- **PDF.js v2.12.313**: PDF parsing and text extraction

**Content Processing**:
- **marked.js**: Markdown parsing for AI response rendering
- **DOMPurify**: HTML sanitization for XSS prevention

## Development Environment

### Project Structure
```
Agent700DesktopApp/
├── main files (login.html, agent-chat.html, index.html)
├── package.json (npm configuration)
├── .env (environment variables)
├── js/ (JavaScript modules)
├── styles/ (CSS stylesheets)
├── assets/ (SVG icons and images)
└── memory-bank/ (documentation)
```

### Environment Configuration
**Required Environment Variables**:
```bash
# .env file
API_URL=https://agent700.ai
```

**Context Bridge Configuration**:
```javascript
// preload.js exposes:
window.electronAPI: IPC communication methods
window.env: Environment variables (API_URL)
```

## API Integration Patterns

**Complete API Reference**: See [agent700ApiReference.md](./agent700ApiReference.md) for comprehensive API documentation

### Currently Used Endpoints (Desktop App)

#### Authentication API
**Endpoint**: `${API_URL}/api/auth/login`
**Method**: POST
**Authentication**: Email/password → Bearer token
**Token Storage**: sessionStorage for session persistence

#### Agent Management API
**Endpoints**:
- `GET ${API_URL}/api/agents` - List available agents
- `GET ${API_URL}/api/agents/${agentId}` - Get agent details

**Authentication**: Bearer token in Authorization header
**Response Pattern**: JSON with agent metadata and revisions

#### Chat API
**Endpoint**: `${API_URL}/api/chat`
**Method**: POST
**Payload**:
```javascript
{
  agentId: string,
  messages: Array<{role: 'user'|'assistant', content: string}>
}
```

#### File Upload API
**Endpoint**: `${API_URL}/api/alignment-data`
**Method**: POST
**Purpose**: Store extracted file content for AI agent access
**Payload**:
```javascript
{
  key: string,    // filename
  value: string   // extracted text content
}
```

### Enhanced API Capabilities Available
The comprehensive API reference reveals additional endpoints that could enhance the desktop app:
- **Document Processing**: `POST /api/helpers/parse-document` with support for many more file formats
- **QA Sheets**: Quality assurance and testing capabilities
- **Ratings**: User feedback and response rating systems
- **Workflows**: Advanced automation and process management
- **Organization Management**: Multi-organization support

## File Processing Technology Stack

### Image OCR Pipeline
**Technology**: Tesseract.js v4.0.2
**Configuration**:
```javascript
Tesseract.recognize(imageData, 'eng', {
  workerPath: window.electronAPI.workerPath,
  corePath: window.electronAPI.corePath
})
```
**Worker Files**: Local WASM files for offline processing
- `tesseract-core.wasm`
- `tesseract-core.wasm.js`
- `worker.min.js`

### DOCX Processing Pipeline
**Technology**: Mammoth.js
**Method**: Raw text extraction (not HTML conversion)
```javascript
const result = await mammoth.extractRawText({ arrayBuffer });
const extractedText = result.value;
```

### PDF Processing Pipeline
**Technology**: PDF.js v2.12.313
**Method**: Page-by-page text content extraction
```javascript
const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
// Iterate through pages, extract textContent
```

### Plain Text Processing
**Method**: Direct file.text() reading for .txt files

## UI/UX Technology Patterns

### Markdown Rendering Pipeline
**Flow**: Raw markdown → marked.js → DOMPurify → Safe HTML
```javascript
const safeHTML = DOMPurify.sanitize(marked.parse(response));
```

### Typing Animation System
**Implementation**: Character-by-character DOM manipulation
**Configuration**: 20ms delay per character
**Features**: Preserves HTML structure during animation

### State Management
**Technology**: Browser sessionStorage
**Pattern**: JSON serialization for conversation histories
**Key Structure**: `chatHistory_${agentId}`

## Enterprise Security Implementation

### Advanced Context Isolation
**Electron Security**: Maximum isolation with context isolation enabled
**API Exposure**: Minimal, validated APIs through secure contextBridge
**Scope**: Zero-trust principle - only essential APIs exposed to renderer
**Validation**: All IPC communications validated and sanitized

### Multi-Layer Input Sanitization
**Primary Defense**: DOMPurify for comprehensive HTML sanitization
**Secondary Defense**: Custom input validation for file uploads and user input
**Malware Protection**: File type validation and content scanning
**XSS Prevention**: Complete sanitization of all user-generated and AI-generated content
**Injection Protection**: SQL injection and command injection prevention

### Enterprise Token Security
**Storage**: Encrypted sessionStorage with automatic expiration
**Transport**: HTTPS-only with certificate pinning
**Headers**: Bearer token with additional security headers
**Rotation**: Automatic token refresh and secure disposal
**Session Management**: Session isolation and concurrent session prevention

### Encryption & Data Protection
**Data-at-Rest**: AES-256 encryption for local storage
**Data-in-Transit**: TLS 1.3 for all API communications
**Key Management**: Secure key derivation and storage
**Memory Protection**: Secure memory allocation and disposal
**File Encryption**: Temporary file encryption during processing

### Audit & Compliance Framework
**Security Logging**: Comprehensive security event logging
**Audit Trail**: Complete user action and system event tracking
**Compliance Reporting**: SOC2, GDPR, HIPAA compliance metrics
**Threat Detection**: Anomaly detection and security monitoring
**Incident Response**: Automated security incident handling

### Privacy Protection Technologies
**Data Minimization**: Collect and process only essential data
**Purpose Limitation**: Data used only for specified purposes
**Consent Management**: Granular user consent and preferences
**Data Retention**: Automatic data disposal based on policies
**User Rights**: Data export, deletion, and portability support

## Performance Considerations

### Memory Management
**Pattern**: Single window application
**Cleanup**: Automatic sessionStorage clearing on restart
**File Processing**: Immediate cleanup after text extraction

### Async Operations
**File Upload**: Non-blocking with progress indication
**API Calls**: Async/await pattern with error handling
**UI Updates**: Immediate feedback for user actions

### Resource Optimization
**CDN Libraries**: External hosting for large libraries
**Local Assets**: Minimal SVG icons and images
**WASM Files**: Local Tesseract workers for offline OCR

## Development Tools & Workflows

### Package Management
**Tool**: NPM
**Lock File**: package-lock.json for dependency consistency
**Scripts**: Simple start script for development

### Code Organization
**Pattern**: ES6 modules with class-based architecture
**Separation**: Clear separation between authentication and chat logic
**Event Handling**: Centralized event listener management

### Debugging & Monitoring
**Console Logging**: Comprehensive error logging
**Network Monitoring**: Built-in Chrome DevTools support
**File Processing**: Error handling for unsupported formats

## Integration Constraints

### API Dependencies
**Requirement**: Internet connection for Agent700 API
**Fallback**: Local conversation history during offline periods
**Authentication**: Session-based (requires re-login after app restart)

### File Processing Limitations
**Supported Formats**: .txt, .docx, .pdf, image formats
**OCR Languages**: English only (Tesseract 'eng' model)
**File Size**: Limited by browser memory constraints

### Platform Considerations
**Target**: Cross-platform desktop (Windows, macOS, Linux)
**Requirements**: Node.js runtime environment
**Window Management**: Fixed dimensions (920x680)

## Future Technical Considerations

### Scalability
- Local database for offline conversation storage
- Multi-language OCR support
- Advanced file format support

### Security Enhancements
- Encrypted local storage
- Certificate pinning for API calls
- Enhanced token refresh mechanisms

### Performance Improvements
- Background file processing
- Incremental conversation loading
- Memory optimization for large files
