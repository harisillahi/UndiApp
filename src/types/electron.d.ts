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

export {};
