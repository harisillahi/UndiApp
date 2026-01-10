const os = require('os');
const crypto = require('crypto');

class LicenseManager {
  constructor(store) {
    this.store = store;
    // PRODUCTION: Change this to your Vercel URL before building
    // Example: https://undiappv12.vercel.app
    this.apiUrl = process.env.LICENSE_API_URL || 'https://undiappv12.vercel.app/api/license';
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
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'Dare25-Wind149'
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'Dare25-Wind149'
        },
        body: JSON.stringify({
          serial_key: license.serial_key,
          device_id: deviceId
        }),
        signal: AbortSignal.timeout(5000)
      });

      // Parse response
      const data = await response.json();
      
      if (data.valid) {
        // License is valid - update last validated timestamp
        this.store.set('last_validated', new Date().toISOString());
        return { valid: true, expires_at: data.expires_at, days_remaining: data.days_remaining };
      } else {
        // Server explicitly rejected the license (deleted, expired, wrong device, etc.)
        // Do NOT allow offline mode - clear the stored license
        this.store.delete('license');
        this.store.delete('last_validated');
        return { valid: false, reason: data.error || 'server_rejected' };
      }
    } catch (error) {
      // Network error (no internet, timeout, etc.) - use grace period
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
