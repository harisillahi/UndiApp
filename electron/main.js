const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const LicenseManager = require('./license-manager');
const Database = require('./database');

let Store;
let store;
let mainWindow;
let nextServer;
let licenseManager;
let database;

const NEXT_DEV_PORT = 3000;
const isDev = !app.isPackaged;

// Initialize electron-store (ES module)
async function initStore() {
  const module = await import('electron-store');
  Store = module.default;
  store = new Store({
    encryptionKey: 'undi-app-secret-key-2026',
  });
  return store;
}

// Initialize database
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'undi-app.db');
  database = new Database(dbPath);
  console.log('Database initialized at:', dbPath);
}

// Start Next.js server
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // Development: use npm run dev
      nextServer = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: '3000' }
      });

      nextServer.on('error', (err) => {
        console.error('Failed to start Next.js dev server:', err);
        reject(err);
      });

      setTimeout(() => {
        console.log('Next.js dev server started');
        resolve();
      }, 5000);
    } else {
      // Production: No local server - uses Vercel API
      console.log('Production mode: Using Vercel API for license validation');
      resolve();
    }
  });
}

// Create license activation window
function createActivationWindow() {
  const activationWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    frame: true,
    alwaysOnTop: true,
    closable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Prevent window from being closed
  activationWindow.on('close', (e) => {
    e.preventDefault();
  });

  const activationHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Activate UndiApp</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 90%;
          }
          h1 {
            margin-top: 0;
            color: #333;
            text-align: center;
            font-size: 24px;
          }
          input {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          button {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
          }
          button:hover {
            background: #5568d3;
          }
          button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          .exit-btn {
            background: #95a5a6;
            margin-top: 10px;
          }
          .exit-btn:hover {
            background: #7f8c8d;
          }
          .error {
            color: #e74c3c;
            margin-top: 10px;
            text-align: center;
            font-size: 14px;
          }
          .loading {
            color: #3498db;
            margin-top: 10px;
            text-align: center;
            font-size: 14px;
          }
          .help {
            color: #666;
            font-size: 12px;
            text-align: center;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Aktivasi UndiApp V1.2</h1>
          <p style="text-align: center; color: #666;">Masukkan kode lisensi Anda</p>
          <input 
            type="text" 
            id="licenseKey" 
            placeholder="UNDI-XXXX-XXXX-XXXX"
            maxlength="19"
          />
          <button id="activateBtn">Aktivasi</button>
          <button id="exitBtn" class="exit-btn">Keluar Aplikasi</button>
          <div id="message"></div>
          <p class="help">Hubungi haris.illahi@gmail.com untuk mendapatkan kode lisensi</p>
        </div>
        <script>
          const input = document.getElementById('licenseKey');
          const btn = document.getElementById('activateBtn');
          const exitBtn = document.getElementById('exitBtn');
          const msg = document.getElementById('message');

          exitBtn.addEventListener('click', () => {
            window.electronAPI.exitApp();
          });

          input.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            let formatted = '';
            for (let i = 0; i < value.length && i < 16; i++) {
              if (i > 0 && i % 4 === 0) formatted += '-';
              formatted += value[i];
            }
            e.target.value = formatted;
          });

          btn.addEventListener('click', async () => {
            const key = input.value.trim();
            
            if (!key || key.length < 19) {
              msg.className = 'error';
              msg.textContent = 'Masukkan kode lisensi yang valid';
              return;
            }

            btn.disabled = true;
            msg.className = 'loading';
            msg.textContent = 'Memvalidasi lisensi...';

            try {
              const result = await window.electronAPI.activateLicense(key);
              if (result.success) {
                msg.className = 'loading';
                msg.textContent = '✓ Aktivasi berhasil! Membuka aplikasi...';
                setTimeout(() => window.close(), 1500);
              } else {
                msg.className = 'error';
                msg.textContent = result.error || 'Aktivasi gagal';
                btn.disabled = false;
              }
            } catch (error) {
              msg.className = 'error';
              msg.textContent = 'Gagal terhubung ke server';
              btn.disabled = false;
            }
          });

          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btn.click();
          });
        </script>
      </body>
    </html>
  `;

  activationWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(activationHTML));
  
  return activationWindow;
}

// Create main application window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load from localhost in dev, Vercel in production
  const appURL = isDev 
    ? `http://localhost:${NEXT_DEV_PORT}` 
    : 'https://undiappv12.vercel.app';
  
  mainWindow.loadURL(appURL);

  // DevTools disabled - uncomment below to enable during development
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('App starting...');
  
  // Initialize store first
  await initStore();
  
  initDatabase();
  licenseManager = new LicenseManager(store);
  
  await startNextServer();
  
  const licenseStatus = await licenseManager.checkLicense();
  
  if (licenseStatus.valid) {
    console.log('Valid license found, opening main window');
    createMainWindow();
  } else {
    console.log('No valid license, showing activation window');
    createActivationWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServer) {
      nextServer.kill();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// IPC Handlers
ipcMain.handle('exit-app', () => {
  // Destroy all windows first to bypass close prevention
  BrowserWindow.getAllWindows().forEach(window => {
    window.destroy();
  });
  // Force quit the app
  app.exit(0);
});

ipcMain.handle('activate-license', async (event, licenseKey) => {
  try {
    const result = await licenseManager.activateLicense(licenseKey);
    if (result.success) {
      // Close activation window (now we can close it)
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.removeAllListeners('close');
        focusedWindow.destroy();
      }
      // Open main window
      setTimeout(() => {
        createMainWindow();
      }, 100);
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-license', async () => {
  return await licenseManager.checkLicense();
});

ipcMain.handle('db-add-prize', async (event, prize) => {
  return database.addPrize(prize);
});

ipcMain.handle('db-get-prizes', async () => {
  return database.getPrizes();
});

ipcMain.handle('db-update-prize', async (event, id, prize) => {
  return database.updatePrize(id, prize);
});

ipcMain.handle('db-delete-prize', async (event, id) => {
  return database.deletePrize(id);
});

ipcMain.handle('db-save-image', async (event, buffer, filename) => {
  const imagesDir = path.join(app.getPath('userData'), 'images');
  const fs = require('fs');
  
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  const imagePath = path.join(imagesDir, filename);
  fs.writeFileSync(imagePath, Buffer.from(buffer));
  
  return imagePath;
});
