const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
require('dotenv').config();

let mainWindow;
const TOKEN_KEY = 'agent700_access_token';

// Secure token storage functions
function storeToken(token) {
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(token);
            require('fs').writeFileSync(path.join(app.getPath('userData'), 'token.dat'), encrypted);
            return true;
        }
    } catch (error) {
        console.error('Failed to store token:', error);
    }
    return false;
}

function retrieveToken() {
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const tokenPath = path.join(app.getPath('userData'), 'token.dat');
            if (require('fs').existsSync(tokenPath)) {
                const encrypted = require('fs').readFileSync(tokenPath);
                return safeStorage.decryptString(encrypted);
            }
        }
    } catch (error) {
        console.error('Failed to retrieve token:', error);
    }
    return null;
}

function deleteToken() {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'token.dat');
        if (require('fs').existsSync(tokenPath)) {
            require('fs').unlinkSync(tokenPath);
            return true;
        }
    } catch (error) {
        console.error('Failed to delete token:', error);
    }
    return false;
}

// Auto-authentication function
async function attemptAutoAuth() {
    const token = retrieveToken();
    if (token) {
        try {
            // Validate token by trying to fetch agents
            const response = await fetch(`${process.env.API_URL}/api/agents`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                // Token is valid, store in session and go to chat
                mainWindow.webContents.executeJavaScript(`
                    sessionStorage.setItem('accessToken', '${token}');
                `);
                mainWindow.loadFile('agent-chat.html');
                return true;
            } else {
                // Token is invalid, delete it
                deleteToken();
            }
        } catch (error) {
            console.error('Auto-auth failed:', error);
            deleteToken();
        }
    }
    return false;
}

app.whenReady().then(async () => {
    mainWindow = new BrowserWindow({
        width: 920,
        height: 680,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        }
    });

    // Try auto-authentication first
    const autoAuthSuccess = await attemptAutoAuth();
    
    // If auto-auth failed, show login page
    if (!autoAuthSuccess) {
        mainWindow.loadFile('login.html');
    }
});

// IPC handlers
ipcMain.on('login-success', (event, data) => {
    const { token, remember } = data;
    
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
