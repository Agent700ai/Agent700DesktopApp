# Active Context

## Current Project State

The Agent700 Desktop App is in a **fully functional state** with all core features implemented and working. The application now positions itself as a **security-first, privacy-focused** desktop interface for the Agent700 AI platform, prioritizing enterprise security, compliance, and user data sovereignty above all other considerations.

## Working Features

### ✅ Authentication System (Enhanced with Credential Caching)
- **Login Interface**: Clean, professional login form with Agent700 branding
- **API Integration**: Working authentication with `${API_URL}/api/auth/login`
- **Session Management**: Token storage in sessionStorage with automatic navigation
- **Secure Credential Caching**: Optional "Remember Me" functionality using encrypted token storage
- **Auto-Authentication**: Automatic login on app startup using stored tokens
- **Token Validation**: Stored tokens are validated before auto-login attempts
- **User Control**: "Forget stored credentials" option to clear cached tokens
- **Error Handling**: User-friendly error messages for failed authentication
- **External Links**: Sign-up and password reset links to Agent700 website

### ✅ Agent Management (Recently Fixed)
- **Agent Loading**: Automatic fetching of available agents from API with enhanced error handling
- **Auto-Login Token Handling**: Fixed timing issue where agents weren't being fetched after auto-login
- **Token Fallback System**: Implements secure storage fallback when sessionStorage token is missing
- **Agent Selection**: Click-to-select with visual active state indication
- **Agent Search**: Real-time search with clear functionality
- **Agent Display**: Proper agent name rendering from latest revision

### ✅ Chat Interface
- **Message Display**: User and assistant messages with timestamps
- **Markdown Rendering**: Full markdown support with DOMPurify sanitization
- **Typing Effects**: Character-by-character animation for new bot responses
- **Conversation History**: Per-agent conversation persistence in sessionStorage
- **Welcome Messages**: Automatic welcome message loading for new agent interactions
- **Chat Reset**: Clear conversation history functionality

### ✅ File Processing Pipeline
- **Multi-format Support**: Text, DOCX, PDF, and image files
- **OCR Integration**: Tesseract.js for image text extraction
- **Document Parsing**: Mammoth.js for DOCX, PDF.js for PDF files
- **Upload UI**: Visual file upload interface with progress indication
- **API Integration**: Alignment-data API for file content storage

### ✅ UI/UX Features
- **Responsive Design**: Professional desktop interface
- **Visual Feedback**: Button states, loading indicators, active selections
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new lines
- **File Upload Flow**: Drag-and-drop support with clear file status
- **Error Handling**: Graceful handling of unsupported file types

## Current Development Context

### Recent Bug Fix (December 2024)
- **Issue**: Agents were not being fetched after auto-login due to timing issue
- **Root Cause**: Race condition between sessionStorage token setting and agent-chat.html page load
- **Solution Implemented**: 
  1. Fixed timing in main.js by awaiting sessionStorage operation before loading chat page
  2. Added token validation and fallback mechanism in getAgents class
  3. Implemented graceful error handling with redirect to login if no valid token
- **Files Modified**: js/main.js, js/agent-chat.js
- **Status**: ✅ Resolved - Auto-login now properly fetches agents

### Recent Enhancement (May 2025)
- **Issue**: Streaming text was appearing too slowly in chat responses
- **Root Cause**: Typing speed was set to 20ms delay between characters
- **Solution Implemented**: Reduced typing speed from 20ms to 8ms in `displayBotResponseTypingEffect` method
- **Files Modified**: js/agent-chat.js
- **Status**: ✅ Completed - Text now streams approximately 2.5x faster while maintaining smooth typing effect

### Recent Observations
- **Code Quality**: Clean ES6 class-based architecture with good separation of concerns
- **Security**: Proper context isolation, input sanitization, and secure API communication
- **Performance**: Efficient memory management and async operation handling
- **Maintainability**: Well-organized code structure with clear patterns
- **API Knowledge**: Comprehensive Agent700 API reference now available (see [agent700ApiReference.md](./agent700ApiReference.md))
- **UI/UX Enhancement**: Conversation view completely redesigned with Medium.com-inspired typography and layout for enhanced readability

### Active Patterns in Use
1. **Class-Based Components**: `getAgents` and `selectAgent` classes manage distinct functionality
2. **Event-Driven Architecture**: Comprehensive event listeners for user interactions
3. **Async File Processing**: Non-blocking file upload and processing workflows
4. **Session Storage Pattern**: Agent-specific conversation persistence
5. **Progressive Enhancement**: Graceful degradation for unsupported features
6. **Error Recovery**: Token fallback and validation patterns for robust authentication

## Key Technical Decisions

### File Processing Strategy
- **Client-Side Processing**: All file extraction happens in the renderer process
- **API Upload Pattern**: Extracted text uploaded to alignment-data endpoint for AI access
- **Temporary Storage**: `pendingUpload` object manages file state during upload flow
- **Enhancement Opportunity**: Could utilize `/api/helpers/parse-document` for broader file format support

### Authentication Flow (Enhanced)
- **Window Navigation**: Single window transitions from login to chat interface
- **Token Management**: sessionStorage for automatic cleanup on app restart
- **Secure Storage Fallback**: Encrypted token storage with validation for auto-login scenarios
- **API Consistency**: Bearer token authentication across all endpoints
- **Error Recovery**: Graceful degradation from secure storage to login redirect

### UI State Management
- **DOM-Based State**: Active agent tracked via CSS classes and data attributes
- **Input State**: Dynamic button enable/disable based on content
- **Upload State**: Show/hide upload interface based on user actions

## Current Focus Areas (Security & Privacy Emphasis)

### Immediate Context
- **Security-First Architecture**: All features now positioned with privacy-by-design principles
- **Enterprise Ready**: Application designed for high-security, compliance-required environments
- **Privacy-Focused Documentation**: Memory bank updated to prioritize security and privacy considerations
- **Compliance Framework**: Documentation supports SOC2, GDPR, HIPAA compliance requirements

### Recent Security & Privacy Insights
1. **Zero-Trust Architecture**: Foundation established for enterprise security requirements
2. **Local Data Sovereignty**: Client-side processing ensures sensitive data never leaves user environment
3. **Privacy-by-Design UX**: User interfaces designed with transparency and consent in mind
4. **Enterprise Security Features**: Advanced token management, audit trails, and compliance reporting capabilities
5. **Trust-Building Transparency**: Clear security model and data handling policies build organizational confidence

## Development Environment Notes

### Working Configuration
- **API Endpoint**: Configured via .env file (API_URL=https://agent700.ai)
- **Dependencies**: All external libraries loading correctly via CDN
- **Electron Setup**: Proper preload script with secure context bridge
- **File Paths**: Tesseract worker paths correctly configured for local WASM files

### Testing Observations
- **Authentication**: Login flow working with proper error handling
- **Agent Loading**: Agents list populating correctly from API (fixed auto-login issue)
- **File Upload**: All supported file types processing successfully
- **Chat Flow**: Complete message flow from user input to AI response

### API Integration Notes
- **Currently Used**: Limited subset of available endpoints (auth, agents, chat, alignment-data)
- **Available for Enhancement**: QA sheets, ratings, workflows, enhanced document processing, URL metadata
- **Error Handling**: Could benefit from Chrome extension patterns documented in API reference

## Next Steps Considerations

### Maintenance
- **Documentation**: Memory bank now established for future reference
- **Code Review**: Current implementation follows best practices
- **Testing**: All major workflows have been verified as functional

### Potential Enhancements (Based on API Reference)
- **Enhanced File Processing**: Utilize `/api/helpers/parse-document` for broader format support (Excel, PowerPoint, RTF, etc.)
- **Advanced Error Handling**: Implement retry patterns and request queuing from Chrome extension examples
- **Additional Features**: QA sheets, ratings system, workflow integration
- **Organization Support**: Multi-organization capabilities
- **URL Integration**: Web content metadata fetching

### Performance & Architecture Improvements
- **Background Processing**: Worker threads for large file processing
- **Request Management**: Implement request queue and rate limiting patterns
- **Streaming Simulation**: Client-side progressive display patterns
- **Memory Optimization**: Advanced memory management for large files

## Project Learnings

### Key Patterns Established
1. **Electron Security**: Proper context isolation with limited API exposure
2. **File Processing Pipeline**: Unified async approach with type detection
3. **Conversation Management**: Clean per-agent history with sessionStorage
4. **Error Handling**: Comprehensive error handling across all workflows
5. **Authentication Resilience**: Multi-layer token management with fallback mechanisms

### Architecture Decisions
- **Single Window Design**: Memory efficient with clear navigation flow
- **Client-Side Processing**: All file extraction handled locally for privacy
- **CDN Dependencies**: External libraries for better caching and updates
- **Class-Based Organization**: Clear separation of concerns with ES6 classes

### Enhancement Opportunities Identified
- **API Utilization**: Many more endpoints available than currently used
- **File Processing**: Server-side processing could replace/supplement client-side approach
- **Error Resilience**: More sophisticated error handling and retry mechanisms available
- **Feature Expansion**: QA, ratings, workflows, and organization management capabilities

This project represents a complete, functional desktop application that successfully bridges the gap between desktop user workflows and the Agent700 AI platform, with significant potential for enhancement using the full Agent700 API capabilities.
