const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // License management
  activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  exitApp: () => ipcRenderer.invoke('exit-app'),
  
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
