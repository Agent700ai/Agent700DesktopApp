const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('electronAPI', {
    sendLoginSuccess: () => ipcRenderer.send('login-success'),
    workerPath: pathToFileURL(path.join(__dirname, 'worker.min.js')).href,
    corePath: pathToFileURL(path.join(__dirname, 'tesseract-core.wasm.js')).href
});