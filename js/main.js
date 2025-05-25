const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let mainWindow;
const TOKEN_KEY = 'agent700_access_token';

// Debug mode detection
const isDebugMode = () => {
    return (
        process.env.NODE_ENV === 'development' || 
        !app.isPackaged || 
        process.env.DEBUG_MODE === 'true'
    );
};

// File-based logging system (development only)
class DebugLogger {
    constructor() {
        this.isEnabled = isDebugMode();
        if (!this.isEnabled) {
            // Production mode - create dummy logger
            this.log = () => {};
            this.error = () => {};
            this.warn = () => {};
            this.info = () => {};
            this.debug = () => {};
            return;
        }

        // Development mode - create real logger
        this.logDir = __dirname;
        this.logFile = path.join(this.logDir, 'debug.log');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 3;
        
        this.initLogger();
    }

    initLogger() {
        if (!this.isEnabled) return;
        
        try {
            // Clean up old debug files if they exist from previous production runs
            this.cleanupOldLogs();
            
            // Initialize log file
            this.log('INFO', 'MAIN', 'Debug logger initialized');
        } catch (error) {
            console.error('Failed to initialize debug logger:', error);
        }
    }

    cleanupOldLogs() {
        if (!this.isEnabled) return;
        
        try {
            // Remove old log files
            for (let i = this.maxLogFiles; i < 10; i++) {
                const oldFile = `${this.logFile}.${i}`;
                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    rotateLog() {
        if (!this.isEnabled) return;
        
        try {
            if (!fs.existsSync(this.logFile)) return;
            
            const stats = fs.statSync(this.logFile);
            if (stats.size < this.maxLogSize) return;

            // Rotate existing files
            for (let i = this.maxLogFiles - 1; i > 0; i--) {
                const currentFile = i === 1 ? this.logFile : `${this.logFile}.${i - 1}`;
                const nextFile = `${this.logFile}.${i}`;
                
                if (fs.existsSync(currentFile)) {
                    if (fs.existsSync(nextFile)) {
                        fs.unlinkSync(nextFile);
                    }
                    fs.renameSync(currentFile, nextFile);
                }
            }
        } catch (error) {
            // Ignore rotation errors
        }
    }

    formatMessage(level, source, message, ...args) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ') : '';
        
        return `[${timestamp}] [${level}] [${source}] ${message}${formattedArgs}`;
    }

    writeToFile(message) {
        if (!this.isEnabled) return;
        
        try {
            this.rotateLog();
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            // Fall back to console if file writing fails
            console.log(message);
        }
    }

    log(level, source, message, ...args) {
        if (!this.isEnabled) return;
        
        const formattedMessage = this.formatMessage(level, source, message, ...args);
        this.writeToFile(formattedMessage);
        
        // Also log to console in development
        console.log(formattedMessage);
    }

    error(source, message, ...args) {
        this.log('ERROR', source, message, ...args);
    }

    warn(source, message, ...args) {
        this.log('WARN', source, message, ...args);
    }

    info(source, message, ...args) {
        this.log('INFO', source, message, ...args);
    }

    debug(source, message, ...args) {
        this.log('DEBUG', source, message, ...args);
    }
}

// Initialize logger
const logger = new DebugLogger();

// Secure token storage functions
function storeToken(token) {
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(token);
            require('fs').writeFileSync(path.join(app.getPath('userData'), 'token.dat'), encrypted);
            logger.info('MAIN', 'Token stored successfully');
            return true;
        }
    } catch (error) {
        logger.error('MAIN', 'Failed to store token:', error.message);
    }
    return false;
}

function retrieveToken() {
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const tokenPath = path.join(app.getPath('userData'), 'token.dat');
            if (require('fs').existsSync(tokenPath)) {
                const encrypted = require('fs').readFileSync(tokenPath);
                const token = safeStorage.decryptString(encrypted);
                logger.info('MAIN', 'Token retrieved successfully');
                return token;
            }
        }
    } catch (error) {
        logger.error('MAIN', 'Failed to retrieve token:', error.message);
    }
    return null;
}

function deleteToken() {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'token.dat');
        if (require('fs').existsSync(tokenPath)) {
            require('fs').unlinkSync(tokenPath);
            logger.info('MAIN', 'Token deleted successfully');
            return true;
        }
    } catch (error) {
        logger.error('MAIN', 'Failed to delete token:', error.message);
    }
    return false;
}

app.whenReady().then(async () => {
    logger.info('MAIN', 'Application starting...');
    
    mainWindow = new BrowserWindow({
        width: 920,
        height: 680,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        }
    });

    // Enable developer tools for debugging (development only)
    if (isDebugMode()) {
        mainWindow.webContents.openDevTools();
        logger.info('MAIN', 'Developer tools enabled');
    }

    // Simplified approach: always start with login and let the renderer handle auto-auth
    logger.info('MAIN', 'Starting with login page...');
    
    // Check if we have a stored token and pass it to the page
    const storedToken = retrieveToken();
    if (storedToken) {
        logger.info('MAIN', 'Found stored token, will attempt auto-auth from renderer');
        // Set the token in sessionStorage after the page loads
        mainWindow.webContents.once('did-finish-load', async () => {
            try {
                await mainWindow.webContents.executeJavaScript(`
                    sessionStorage.setItem('accessToken', '${storedToken}');
                    console.log('Set stored token in sessionStorage');
                `);
                // Load the chat page directly since we have a token
                logger.info('MAIN', 'Loading chat page with stored token');
                mainWindow.loadFile('agent-chat.html');
            } catch (error) {
                logger.error('MAIN', 'Failed to set token in sessionStorage:', error.message);
                // If setting fails, stay on login page
            }
        });
    }
    
    // Always start with login page initially
    mainWindow.loadFile('login.html');
});

// IPC handlers
ipcMain.on('login-success', (event, data) => {
    const { token, remember } = data;
    
    logger.info('MAIN', 'Login success received, remember:', remember);
    
    if (remember && token) {
        storeToken(token);
    }
    
    mainWindow.loadFile('agent-chat.html');
});

ipcMain.handle('store-token', (event, token) => {
    return storeToken(token);
});

ipcMain.handle('retrieve-token', (event) => {
    return retrieveToken();
});

ipcMain.handle('delete-token', (event) => {
    return deleteToken();
});

ipcMain.on('navigate-to-login', (event) => {
    logger.info('MAIN', 'Navigate to login requested');
    mainWindow.loadFile('login.html');
});

// IPC handler for renderer logging
ipcMain.on('debug-log', (event, level, source, message, ...args) => {
    logger.log(level, source, message, ...args);
});

app.on('window-all-closed', () => {
    logger.info('MAIN', 'All windows closed');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    logger.info('MAIN', 'Application shutting down');
});
