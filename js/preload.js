const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('electronAPI', {
    sendLoginSuccess: (data) => ipcRenderer.send('login-success', data),
    storeToken: (token) => ipcRenderer.invoke('store-token', token),
    retrieveToken: () => ipcRenderer.invoke('retrieve-token'),
    deleteToken: () => ipcRenderer.invoke('delete-token'),
    workerPath: pathToFileURL(path.join(__dirname, 'worker.min.js')).href,
    corePath: pathToFileURL(path.join(__dirname, 'tesseract-core.wasm.js')).href
});

contextBridge.exposeInMainWorld('env', {
    API_URL: process.env.API_URL
});
