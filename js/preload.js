const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

// Debug mode detection (same logic as main process)
const isDebugMode = () => {
    return (
        process.env.NODE_ENV === 'development' || 
        !require('electron').app?.isPackaged || 
        process.env.DEBUG_MODE === 'true'
    );
};

// Create logger that sends to main process
const createLogger = () => {
    const debugEnabled = isDebugMode();
    
    if (!debugEnabled) {
        // Production mode - return dummy logger
        return {
            error: () => {},
            warn: () => {},
            info: () => {},
            debug: () => {},
            log: () => {}
        };
    }
    
    // Development mode - return real logger
    return {
        error: (source, message, ...args) => {
            ipcRenderer.send('debug-log', 'ERROR', source, message, ...args);
        },
        warn: (source, message, ...args) => {
            ipcRenderer.send('debug-log', 'WARN', source, message, ...args);
        },
        info: (source, message, ...args) => {
            ipcRenderer.send('debug-log', 'INFO', source, message, ...args);
        },
        debug: (source, message, ...args) => {
            ipcRenderer.send('debug-log', 'DEBUG', source, message, ...args);
        },
        log: (level, source, message, ...args) => {
            ipcRenderer.send('debug-log', level, source, message, ...args);
        }
    };
};

contextBridge.exposeInMainWorld('electronAPI', {
    sendLoginSuccess: (data) => ipcRenderer.send('login-success', data),
    storeToken: (token) => ipcRenderer.invoke('store-token', token),
    retrieveToken: () => ipcRenderer.invoke('retrieve-token'),
    deleteToken: () => ipcRenderer.invoke('delete-token'),
    navigateToLogin: () => ipcRenderer.send('navigate-to-login'),
    workerPath: pathToFileURL(path.join(__dirname, 'worker.min.js')).href,
    corePath: pathToFileURL(path.join(__dirname, 'tesseract-core.wasm.js')).href
});

contextBridge.exposeInMainWorld('env', {
    API_URL: process.env.API_URL
});

// Expose debug logger
contextBridge.exposeInMainWorld('debugLogger', createLogger());

// Expose debug mode flag
contextBridge.exposeInMainWorld('isDebugMode', isDebugMode());
