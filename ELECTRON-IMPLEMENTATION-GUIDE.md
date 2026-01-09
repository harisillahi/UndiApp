# 🚀 Electron Desktop App Implementation Guide

**Complete Step-by-Step Instructions for Converting UndiApp to Desktop Application**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Setup Electron](#phase-1-setup-electron)
4. [Phase 2: Configure Next.js](#phase-2-configure-nextjs)
5. [Phase 3: Implement License System](#phase-3-implement-license-system)
6. [Phase 4: Improve Storage System](#phase-4-improve-storage-system)
7. [Phase 5: Build & Package](#phase-5-build--package)
8. [Phase 6: Testing & Distribution](#phase-6-testing--distribution)

---

## Overview

### What We're Building

A standalone desktop application (.exe for Windows, .app for macOS) that:
- ✅ Runs locally without browser
- ✅ Requires license key activation
- ✅ Validates license online (with offline grace period)
- ✅ Stores unlimited prize images (no 5-image limit)
- ✅ Uses SQLite database instead of localStorage
- ✅ Can be distributed as single installer file

### Architecture

```
┌─────────────────────────────────────────┐
│         Electron Desktop App            │
│  ┌───────────────────────────────────┐  │
│  │    Browser Window (Renderer)      │  │
│  │    - React/Next.js UI             │  │
│  │    - Your existing components     │  │
│  └───────────────────────────────────┘  │
│              ↕ IPC                      │
│  ┌───────────────────────────────────┐  │
│  │    Node.js (Main Process)         │  │
│  │    - License validation           │  │
│  │    - SQLite database              │  │
│  │    - File system access           │  │
│  │    - Next.js server               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↕ HTTPS
┌─────────────────────────────────────────┐
│      License Server (Vercel)            │
│      - Validate licenses                │
│      - Check expiration                 │
│      - Track activations                │
└─────────────────────────────────────────┘
```

---

## Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
   - Check: `node --version`
   - Install: https://nodejs.org/

2. **Git** (for version control)
   - Check: `git --version`
   - Install: https://git-scm.com/

3. **Code Editor** (VS Code recommended)
   - Install: https://code.visualstudio.com/

### Required Knowledge

- ✅ Basic terminal/command line usage
- ✅ Understanding of how to run npm commands
- ✅ Basic understanding of environment variables
- ⚠️ No advanced programming required (I'll provide all code)

### Estimated Time

- **Phase 1-2:** 1-2 hours (Electron setup)
- **Phase 3:** 2-3 hours (License system)
- **Phase 4:** 1-2 hours (Storage improvement)
- **Phase 5:** 1 hour (Building & packaging)
- **Total:** 5-8 hours (can be done over multiple days)

---

## Phase 1: Setup Electron

### Step 1.1: Install Electron Dependencies

Open terminal in your project folder and run:

```bash
cd /Users/harisillahi/Documents/myapp/UndiApp

npm install --save-dev electron electron-builder concurrently cross-env wait-on
npm install electron-store better-sqlite3
```

**What each package does:**
- `electron` - Core Electron framework
- `electron-builder` - Packages app into .exe/.app
- `concurrently` - Run Next.js and Electron together
- `cross-env` - Set environment variables (works on Mac/Windows)
- `wait-on` - Wait for Next.js to start before opening window
- `electron-store` - Store app settings (encrypted)
- `better-sqlite3` - Fast SQLite database

### Step 1.2: Create Electron Files Structure

Create these new files in your project:

```bash
# Create electron folder
mkdir -p electron

# Create main electron files
touch electron/main.js
touch electron/preload.js
touch electron/license-manager.js
touch electron/database.js
```

### Step 1.3: Create Main Process File

Create/edit `electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');
const LicenseManager = require('./license-manager');
const Database = require('./database');

// Initialize secure storage
const store = new Store({
  encryptionKey: 'undi-app-secret-key-2026', // Change this!
});

let mainWindow;
let nextServer;
let licenseManager;
let database;

const NEXT_DEV_PORT = 3000;
const isDev = !app.isPackaged;

// Initialize database
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'undi-app.db');
  database = new Database(dbPath);
  console.log('Database initialized at:', dbPath);
}

// Start Next.js server
function startNextServer() {
  return new Promise((resolve, reject) => {
    const nextCommand = isDev ? 'npm' : path.join(process.resourcesPath, 'app', 'node_modules', '.bin', 'next');
    const nextArgs = isDev ? ['run', 'dev'] : ['start'];

    nextServer = spawn(nextCommand, nextArgs, {
      cwd: isDev ? __dirname + '/..' : path.join(process.resourcesPath, 'app'),
      stdio: 'inherit',
      shell: true
    });

    nextServer.on('error', (err) => {
      console.error('Failed to start Next.js server:', err);
      reject(err);
    });

    // Wait for server to be ready
    setTimeout(() => {
      console.log('Next.js server started');
      resolve();
    }, isDev ? 5000 : 3000);
  });
}

// Create license activation window
function createActivationWindow() {
  const activationWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Create simple HTML for activation
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
          <h1>🔐 Aktivasi UndiApp</h1>
          <p style="text-align: center; color: #666;">Masukkan kode lisensi Anda</p>
          <input 
            type="text" 
            id="licenseKey" 
            placeholder="UNDI-XXXX-XXXX-XXXX"
            maxlength="19"
          />
          <button id="activateBtn">Aktivasi</button>
          <div id="message"></div>
          <p class="help">Hubungi admin untuk mendapatkan kode lisensi</p>
        </div>
        <script>
          const input = document.getElementById('licenseKey');
          const btn = document.getElementById('activateBtn');
          const msg = document.getElementById('message');

          // Format license key as user types
          input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^A-Z0-9]/g, '');
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

          // Enter key support
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

  mainWindow.loadURL(`http://localhost:${NEXT_DEV_PORT}`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('App starting...');
  
  // Initialize database
  initDatabase();
  
  // Initialize license manager
  licenseManager = new LicenseManager(store);
  
  // Start Next.js server
  await startNextServer();
  
  // Check license status
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
ipcMain.handle('activate-license', async (event, licenseKey) => {
  try {
    const result = await licenseManager.activateLicense(licenseKey);
    if (result.success) {
      // Close activation window and open main window
      setTimeout(() => {
        BrowserWindow.getFocusedWindow()?.close();
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

// Database IPC handlers
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
```

### Step 1.4: Create Preload Script

Create `electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // License management
  activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  
  // Database operations
  addPrize: (prize) => ipcRenderer.invoke('db-add-prize', prize),
  getPrizes: () => ipcRenderer.invoke('db-get-prizes'),
  updatePrize: (id, prize) => ipcRenderer.invoke('db-update-prize', id, prize),
  deletePrize: (id) => ipcRenderer.invoke('db-delete-prize', id),
  
  // File operations
  saveImage: (buffer, filename) => ipcRenderer.invoke('db-save-image', buffer, filename),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});
```

### Step 1.5: Create License Manager

Create `electron/license-manager.js`:

```javascript
const os = require('os');
const crypto = require('crypto');

class LicenseManager {
  constructor(store) {
    this.store = store;
    this.apiUrl = process.env.LICENSE_API_URL || 'https://your-app.vercel.app/api/license';
  }

  // Generate unique device ID
  getDeviceId() {
    const networkInterfaces = os.networkInterfaces();
    const cpuInfo = os.cpus()[0].model;
    const platform = os.platform();
    
    let macAddress = '';
    for (let name of Object.keys(networkInterfaces)) {
      for (let net of networkInterfaces[name]) {
        if (!net.internal && net.mac !== '00:00:00:00:00:00') {
          macAddress = net.mac;
          break;
        }
      }
      if (macAddress) break;
    }
    
    const fingerprint = `${macAddress}-${cpuInfo}-${platform}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  // Activate license
  async activateLicense(licenseKey) {
    const deviceId = this.getDeviceId();
    
    try {
      const response = await fetch(`${this.apiUrl}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial_key: licenseKey, device_id: deviceId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store license locally
        this.store.set('license', {
          serial_key: licenseKey,
          device_id: deviceId,
          expires_at: data.expires_at,
          client_name: data.client_name,
          activated_at: new Date().toISOString()
        });
        
        this.store.set('last_validated', new Date().toISOString());
        
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('License activation error:', error);
      return { success: false, error: 'Tidak dapat terhubung ke server lisensi' };
    }
  }

  // Check if license is valid
  async checkLicense() {
    const license = this.store.get('license');
    
    if (!license) {
      return { valid: false, reason: 'no_license' };
    }

    // Check expiration locally first
    const expiresAt = new Date(license.expires_at);
    if (new Date() > expiresAt) {
      return { valid: false, reason: 'expired', expires_at: license.expires_at };
    }

    // Try to validate with server
    try {
      const deviceId = this.getDeviceId();
      const response = await fetch(`${this.apiUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_key: license.serial_key,
          device_id: deviceId
        }),
        timeout: 5000
      });

      const data = await response.json();
      
      if (data.valid) {
        this.store.set('last_validated', new Date().toISOString());
        return { valid: true, expires_at: data.expires_at, days_remaining: data.days_remaining };
      } else {
        return { valid: false, reason: 'server_rejected' };
      }
    } catch (error) {
      // Offline mode - use grace period
      console.log('Cannot reach license server, using offline validation');
      
      const lastValidated = this.store.get('last_validated');
      if (!lastValidated) {
        return { valid: false, reason: 'never_validated' };
      }

      const hoursSinceLastCheck = (new Date() - new Date(lastValidated)) / (1000 * 60 * 60);
      const GRACE_PERIOD_HOURS = 48;

      if (hoursSinceLastCheck < GRACE_PERIOD_HOURS) {
        return { 
          valid: true, 
          offline: true, 
          hours_remaining: Math.floor(GRACE_PERIOD_HOURS - hoursSinceLastCheck) 
        };
      } else {
        return { valid: false, reason: 'grace_period_expired' };
      }
    }
  }

  // Get license info
  getLicenseInfo() {
    return this.store.get('license');
  }
}

module.exports = LicenseManager;
```

### Step 1.6: Create Database Module

Create `electron/database.js`:

```javascript
const Database = require('better-sqlite3');

class AppDatabase {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    // Create prizes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prizes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        image_path TEXT,
        remaining INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create participants table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create winners table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS winners (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL,
        participant_name TEXT NOT NULL,
        prize_id TEXT NOT NULL,
        prize_name TEXT NOT NULL,
        won_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_id) REFERENCES participants(id),
        FOREIGN KEY (prize_id) REFERENCES prizes(id)
      )
    `);

    console.log('Database tables initialized');
  }

  // Prize operations
  addPrize(prize) {
    const stmt = this.db.prepare(`
      INSERT INTO prizes (id, name, quantity, image_path, remaining)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const id = prize.id || Date.now().toString();
    stmt.run(id, prize.name, prize.quantity, prize.image_path || '', prize.quantity);
    
    return { id, ...prize };
  }

  getPrizes() {
    const stmt = this.db.prepare('SELECT * FROM prizes ORDER BY created_at DESC');
    return stmt.all();
  }

  updatePrize(id, prize) {
    const stmt = this.db.prepare(`
      UPDATE prizes 
      SET name = ?, quantity = ?, image_path = ?, remaining = ?
      WHERE id = ?
    `);
    
    stmt.run(prize.name, prize.quantity, prize.image_path || '', prize.remaining, id);
    return { id, ...prize };
  }

  deletePrize(id) {
    const stmt = this.db.prepare('DELETE FROM prizes WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Participant operations
  addParticipant(participant) {
    const stmt = this.db.prepare('INSERT INTO participants (id, name) VALUES (?, ?)');
    const id = participant.id || Date.now().toString();
    stmt.run(id, participant.name);
    return { id, ...participant };
  }

  getParticipants() {
    const stmt = this.db.prepare('SELECT * FROM participants ORDER BY created_at DESC');
    return stmt.all();
  }

  // Winner operations
  addWinner(winner) {
    const stmt = this.db.prepare(`
      INSERT INTO winners (id, participant_id, participant_name, prize_id, prize_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const id = winner.id || Date.now().toString();
    stmt.run(id, winner.participant_id, winner.participant_name, winner.prize_id, winner.prize_name);
    
    return { id, ...winner };
  }

  getWinners() {
    const stmt = this.db.prepare('SELECT * FROM winners ORDER BY won_at DESC');
    return stmt.all();
  }

  close() {
    this.db.close();
  }
}

module.exports = AppDatabase;
```

### Step 1.7: Update package.json

Add these scripts to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "PORT=3000 next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "next build && electron-builder",
    "electron:build:win": "next build && electron-builder --win",
    "electron:build:mac": "next build && electron-builder --mac",
    "electron:build:linux": "next build && electron-builder --linux"
  },
  "build": {
    "appId": "com.undiapp.lottery",
    "productName": "UndiApp",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron/**/*",
      ".next/**/*",
      "public/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "public/icon.png"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "public/icon.png",
      "category": "public.app-category.utilities"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "public/icon.png",
      "category": "Utility"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

---

## Phase 2: Configure Next.js

### Step 2.1: Enable Standalone Output

Edit `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Enable standalone mode for Electron
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**',
      },
    ],
    // Allow local file:// protocol in Electron
    unoptimized: true,
  },
}

export default nextConfig
```

### Step 2.2: Create Electron Detection Hook

Create `src/hooks/use-electron.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!(window as any).electronAPI);
  }, []);

  return {
    isElectron,
    electronAPI: isElectron ? (window as any).electronAPI : null
  };
}
```

### Step 2.3: Add TypeScript Definitions

Create `src/types/electron.d.ts`:

```typescript
export interface ElectronAPI {
  // License
  activateLicense: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  checkLicense: () => Promise<{ valid: boolean; reason?: string }>;
  
  // Database
  addPrize: (prize: any) => Promise<any>;
  getPrizes: () => Promise<any[]>;
  updatePrize: (id: string, prize: any) => Promise<any>;
  deletePrize: (id: string) => Promise<{ success: boolean }>;
  
  // Files
  saveImage: (buffer: Uint8Array, filename: string) => Promise<string>;
  
  // Platform
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

---

## Phase 3: Implement License System

### Step 3.1: Choose Database (Supabase Recommended)

Go to https://supabase.com and:
1. Create free account
2. Create new project
3. Note your project URL and API key

### Step 3.2: Create License Table

In Supabase SQL Editor, run:

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_key TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_validated TIMESTAMP,
  notes TEXT
);

-- Add index for faster lookups
CREATE INDEX idx_serial_key ON licenses(serial_key);
CREATE INDEX idx_device_id ON licenses(device_id);
```

### Step 3.3: Create License API Routes

Create `src/app/api/license/activate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { serial_key, device_id } = await request.json();

    if (!serial_key || !device_id) {
      return NextResponse.json(
        { error: 'Serial key and device ID required' },
        { status: 400 }
      );
    }

    // Find license
    const { data: license, error: fetchError } = await supabase
      .from('licenses')
      .select('*')
      .eq('serial_key', serial_key)
      .single();

    if (fetchError || !license) {
      return NextResponse.json(
        { error: 'Kode lisensi tidak valid' },
        { status: 404 }
      );
    }

    // Check if already activated on different device
    if (license.device_id && license.device_id !== device_id) {
      return NextResponse.json(
        { error: 'Lisensi sudah diaktifkan di perangkat lain' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Lisensi sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Check if active
    if (!license.is_active) {
      return NextResponse.json(
        { error: 'Lisensi telah dicabut' },
        { status: 400 }
      );
    }

    // Activate license
    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        device_id: device_id,
        last_validated: new Date().toISOString()
      })
      .eq('serial_key', serial_key);

    if (updateError) {
      return NextResponse.json(
        { error: 'Gagal mengaktifkan lisensi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expires_at: license.expires_at,
      client_name: license.client_name
    });
  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/license/validate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { serial_key, device_id } = await request.json();

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('serial_key', serial_key)
      .single();

    if (error || !license) {
      return NextResponse.json({ valid: false });
    }

    const isValid =
      license.is_active &&
      license.device_id === device_id &&
      new Date(license.expires_at) > new Date();

    if (isValid) {
      // Update last validation time
      await supabase
        .from('licenses')
        .update({ last_validated: new Date().toISOString() })
        .eq('serial_key', serial_key);

      const daysRemaining = Math.ceil(
        (new Date(license.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return NextResponse.json({
        valid: true,
        expires_at: license.expires_at,
        days_remaining: daysRemaining
      });
    }

    return NextResponse.json({ valid: false });
  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
```

Create `src/app/api/license/revoke/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Simple admin authentication (improve this in production!)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serial_key } = await request.json();

    const { error } = await supabase
      .from('licenses')
      .update({ is_active: false })
      .eq('serial_key', serial_key);

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Step 3.4: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 3.5: Create Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Admin
ADMIN_API_KEY=your_secure_admin_key_here

# License API (for Electron)
LICENSE_API_URL=https://your-app.vercel.app/api/license
```

---

## Phase 4: Improve Storage System

### Step 4.1: Update LotteryContext for Electron

Edit `src/context/LotteryContext.tsx`:

```typescript
// Add at the top
import { useElectron } from '@/hooks/use-electron';

// In the LotteryProvider component
export function LotteryProvider({ children }: { children: React.ReactNode }) {
  const { isElectron, electronAPI } = useElectron();
  
  // Load data from Electron DB or localStorage
  useEffect(() => {
    const loadData = async () => {
      if (isElectron && electronAPI) {
        // Load from SQLite
        const prizes = await electronAPI.getPrizes();
        setState(prev => ({ ...prev, prizes }));
      } else {
        // Load from localStorage (browser mode)
        const saved = localStorage.getItem('lottery-state');
        if (saved) {
          setState(JSON.parse(saved));
        }
      }
    };
    
    loadData();
  }, [isElectron]);

  // Save data
  useEffect(() => {
    if (isElectron) {
      // Don't use localStorage in Electron
      return;
    }
    
    // Save to localStorage (browser mode only)
    localStorage.setItem('lottery-state', JSON.stringify(state));
  }, [state, isElectron]);
  
  // ... rest of your code
}
```

### Step 4.2: Update PrizeInput for Electron

Update the image upload handler in `src/components/PrizeInput.tsx`:

```typescript
const { isElectron, electronAPI } = useElectron();

const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  setImageError('');

  try {
    let imagePath: string;
    
    if (isElectron && electronAPI) {
      // Electron: Save to disk
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const filename = `prize-${Date.now()}-${file.name}`;
      imagePath = await electronAPI.saveImage(buffer, filename);
    } else {
      // Browser: Use ImgBB or base64
      if (useImgBB) {
        imagePath = await uploadImageToImgBB(file);
      } else {
        imagePath = await fileToBase64(file);
      }
    }
    
    setNewPrize({ ...newPrize, image: imagePath });
  } catch (error) {
    setImageError('Gagal mengunggah gambar');
  } finally {
    setIsUploading(false);
  }
};
```

---

## Phase 5: Build & Package

### Step 5.1: Create App Icon

Create a 512x512 PNG icon and save as `public/icon.png`.

You can use a free tool like:
- https://www.canva.com
- https://www.figma.com
- Or hire on Fiverr for $5

### Step 5.2: Test in Development

```bash
npm run electron:dev
```

This will:
1. Start Next.js dev server
2. Wait for it to be ready
3. Launch Electron window
4. Show activation dialog (first time)

### Step 5.3: Build for Production

**For Windows:**
```bash
npm run electron:build:win
```

**For macOS:**
```bash
npm run electron:build:mac
```

**For Linux:**
```bash
npm run electron:build:linux
```

Output will be in `dist/` folder:
- `UndiApp-Setup-1.1.0.exe` (Windows installer)
- `UndiApp-1.1.0-portable.exe` (Windows portable)
- `UndiApp-1.1.0.dmg` (macOS)
- `UndiApp-1.1.0.AppImage` (Linux)

---

## Phase 6: Testing & Distribution

### Step 6.1: Create Test License

In Supabase, insert a test license:

```sql
INSERT INTO licenses (serial_key, client_name, expires_at, is_active)
VALUES (
  'UNDI-TEST-1234-5678',
  'Test User',
  NOW() + INTERVAL '30 days',
  true
);
```

### Step 6.2: Test the App

1. Install the built app on a clean computer
2. Open it - should show activation dialog
3. Enter: `UNDI-TEST-1234-5678`
4. Should activate successfully
5. Close and reopen - should go directly to app
6. Test all features:
   - Add 20+ prizes with images
   - Add participants
   - Run lottery
   - Check that everything works

### Step 6.3: Create Admin Dashboard (Optional)

Create `src/app/admin/page.tsx` for license management:

```typescript
'use client';

import { useState } from 'react';

export default function AdminPanel() {
  const [newLicense, setNewLicense] = useState({
    clientName: '',
    durationDays: 30
  });

  const generateLicense = async () => {
    const serialKey = `UNDI-${randomString(4)}-${randomString(4)}-${randomString(4)}`;
    
    // Add to database
    const response = await fetch('/api/admin/create-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serial_key: serialKey,
        client_name: newLicense.clientName,
        duration_days: newLicense.durationDays
      })
    });
    
    const data = await response.json();
    alert(`License created: ${data.serial_key}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">License Management</h1>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Client Name"
          value={newLicense.clientName}
          onChange={(e) => setNewLicense({...newLicense, clientName: e.target.value})}
          className="border p-2"
        />
        
        <input
          type="number"
          placeholder="Duration (days)"
          value={newLicense.durationDays}
          onChange={(e) => setNewLicense({...newLicense, durationDays: parseInt(e.target.value)})}
          className="border p-2"
        />
        
        <button onClick={generateLicense} className="bg-blue-500 text-white px-4 py-2">
          Generate License
        </button>
      </div>
    </div>
  );
}

function randomString(length: number) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}
```

### Step 6.4: Deploy License Server

```bash
# Deploy to Vercel
vercel --prod

# Note the production URL
# Update LICENSE_API_URL in your Electron app
```

### Step 6.5: Distribution

**Option 1: Direct Download**
- Upload .exe to Google Drive / Dropbox
- Share link with clients
- They download and run

**Option 2: Your Website**
- Host on your website
- Add download button
- Track downloads

**Option 3: Auto-Updates (Advanced)**
- Use electron-updater
- Host updates on GitHub releases
- App auto-updates itself

---

## 📝 Summary Checklist

- [ ] Install all dependencies
- [ ] Create Electron files (main.js, preload.js, etc.)
- [ ] Create license system (database + API routes)
- [ ] Update Next.js config for standalone mode
- [ ] Update components to use Electron storage
- [ ] Create app icon
- [ ] Test in development mode
- [ ] Build production executable
- [ ] Test on clean computer
- [ ] Create test licenses
- [ ] Deploy license server to Vercel
- [ ] Document distribution process

---

## 🆘 Troubleshooting

### "Cannot find module 'electron'"
```bash
npm install --save-dev electron
```

### "Port 3000 already in use"
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
```

### "License server connection failed"
- Check .env.local has correct URL
- Check Supabase credentials
- Check internet connection

### "App won't start"
- Check console for errors
- Run `npm run electron:dev` to see logs
- Check Next.js server started successfully

---

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Electron Builder Docs](https://www.electron.build/)
- [Supabase Docs](https://supabase.com/docs)

---

## 🎉 Congratulations!

You now have a complete desktop application with:
- ✅ Standalone .exe file
- ✅ License validation system
- ✅ Unlimited image storage
- ✅ SQLite database
- ✅ Offline support
- ✅ Professional packaging

**Need Help?** Feel free to ask questions at any step!
