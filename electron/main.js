const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_URL = 'http://localhost:5000';
let backendProcess = null;
let mainWindow = null;

function startBackend() {
  if (backendProcess) {
    return;
  }

  console.log('Starting backend directly (node backend/api/server.js)...');
  backendProcess = spawn(process.execPath, ['backend/api/server.js'], {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'inherit', 'inherit']
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
    dialog.showErrorBox('Open-Antigravity', 'Unable to start backend service. ' + err.message);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code} signal ${signal}`);
    backendProcess = null;
  });
}

async function waitForBackend(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(`${BACKEND_URL}/health`);
      if (resp.ok) {
        return true;
      }
    } catch (err) {
      // backend not ready yet, keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Backend did not respond at ${BACKEND_URL}/health after ${timeoutMs} ms`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const page = path.join(__dirname, 'index.html');
  mainWindow.loadFile(page);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForBackend(20000);
    console.log('Backend is available. Launching UI.');
  } catch (err) {
    console.error(err);
    dialog.showErrorBox('Open-Antigravity', `Backend did not start: ${err.message}`);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
