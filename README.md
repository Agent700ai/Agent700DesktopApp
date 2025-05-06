# Agent700 Desktop App

Agent700 Desktop App is an Electron-based desktop application that provides a secure and feature-rich interface for interacting with the Agent700 AI platform. It supports text chat, file uploads with OCR and document parsing, markdown-rendered responses, and persistent conversation histories.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Introduction

The Agent700 Desktop App allows users to authenticate with their Agent700 account, browse available AI agents, and maintain conversations in a desktop environment. It integrates OCR for image-based text extraction and document parsing for PDFs and DOCX files.

## Features

- Secure login using email and password via Agent700 API
- Browse and search available AI agents
- Persistent, per-agent conversation history stored locally
- Send and receive text messages
- Upload files (images, PDFs, DOCX) with automatic text extraction
- OCR support for images via Tesseract.js
- Document parsing for DOCX via Mammoth.js and PDFs via PDF.js
- Markdown rendering of AI responses with marked.js and DOMPurify sanitization

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Internet connection

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/agent700-desktop-app.git
   ```

2. Navigate into the project directory and install dependencies:

   ```bash
   sudo npm install
   ```

## Configuration

1. Create a `.env` file in the project root:

   ```env
   API_URL=https://agent700.ai
   ```

2. Replace `https://agent700.ai` with your Agent700 API endpoint if different.

## Usage

Start the application:

```bash
npm start
```

- Enter your email and password to log in.
- Select an agent from the sidebar or search by name.
- Type messages in the input field and click the send button.
- Click the "+" button to upload files and extract text automatically.
- View AI responses rendered in markdown format.

## Project Structure

```
.
├── login.html              # Login screen
├── agent-chat.html         # Main chat interface
├── index.html              # Placeholder or entry file
├── js/
│   ├── main.js             # Electron main process
│   ├── preload.js          # Preload script exposing APIs
│   ├── renderer.js         # Login renderer logic
│   ├── agent-chat.js       # Chat interface logic
│   └── marked.min.js       # Markdown parser
├── styles/
│   ├── login.css           # Styles for login screen
│   └── agent-chat.css      # Styles for chat interface
├── assets/
│   └── [icons and logos]   # Image assets
├── .env                    # Environment variables
├── package.json            # Project metadata and scripts
├── package-lock.json       # Dependency lockfile
└── LICENSE                 # MIT License
```

## Dependencies

- [Electron](https://www.electronjs.org/) – Desktop application framework
- [dotenv](https://github.com/motdotla/dotenv) – Environment variable loader
- [marked.js](https://github.com/markedjs/marked) – Markdown parser
- [DOMPurify](https://github.com/cure53/DOMPurify) – HTML sanitizer
- [Tesseract.js](https://github.com/naptha/tesseract.js) – OCR engine
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) – DOCX to HTML
- [PDF.js](https://github.com/mozilla/pdf.js) – PDF parsing library

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
