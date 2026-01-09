# 🚀 UndiApp Build & Distribution Guide

## Prerequisites

Before building, ensure you have:
- ✅ Node.js installed
- ✅ All dependencies installed (`npm install`)
- ✅ Supabase database set up with licenses table
- ✅ App deployed to Vercel (for license API)

---

## 🔧 Pre-Build Configuration

### 1. Update Production API URL

**CRITICAL:** Before building for distribution, update the license API URL in `electron/license-manager.js`:

```javascript
// Change from:
this.apiUrl = process.env.LICENSE_API_URL || 'http://localhost:3000/api/license';

// To your Vercel production URL:
this.apiUrl = process.env.LICENSE_API_URL || 'https://your-app.vercel.app/api/license';
```

Or set the environment variable during build (recommended):

```bash
export LICENSE_API_URL=https://your-app.vercel.app/api/license
```

### 2. Verify Supabase Table Name

Make sure your API routes use the correct table name `"UndiApp V1.2"`:
- `src/app/api/license/activate/route.ts`
- `src/app/api/license/validate/route.ts`
- `src/app/api/license/revoke/route.ts`

---

## 📦 Build Commands

### Build for All Platforms (from Mac)
```bash
npm run electron:build
```

### Build for Windows Only
```bash
npm run electron:build:win
```

### Build for Mac Only
```bash
npm run electron:build:mac
```

### Build for Linux Only
```bash
npm run electron:build:linux
```

---

## 🪟 Building Windows App from Mac

### Method 1: Using electron-builder (Recommended)

electron-builder can build Windows executables on Mac without needing a Windows machine:

```bash
npm run electron:build:win
```

This creates:
- `dist/UndiApp Setup X.X.X.exe` - Installer (NSIS)
- `dist/UndiApp X.X.X.exe` - Portable version

**Output Location:** `/Users/harisillahi/Documents/myapp/UndiApp/dist/`

### Method 2: Install wine for better Windows builds

For more reliable Windows builds on Mac:

```bash
brew install wine-stable
npm run electron:build:win
```

---

## 🍎 Building Mac App

```bash
npm run electron:build:mac
```

Creates:
- `dist/UndiApp-X.X.X.dmg` - DMG installer
- `dist/UndiApp-X.X.X-mac.zip` - ZIP archive

**Note:** Mac apps need to be signed for distribution. For testing, unsigned apps work fine.

---

## 📤 Build Output

After running build commands, find executables in the `dist/` folder:

```
dist/
├── UndiApp Setup 1.1.0.exe          # Windows installer
├── UndiApp 1.1.0.exe                # Windows portable
├── UndiApp-1.1.0.dmg                # Mac installer
├── UndiApp-1.1.0-mac.zip            # Mac zip
├── UndiApp-1.1.0.AppImage           # Linux AppImage
└── undiapp_1.1.0_amd64.deb         # Linux Debian package
```

---

## 🎯 Distribution Checklist

Before sharing your app:

### 1. ✅ Deploy to Vercel
- Push code to GitHub
- Connect to Vercel
- Set environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `ADMIN_API_KEY`

### 2. ✅ Update License API URL
```javascript
// electron/license-manager.js
this.apiUrl = 'https://undi-app.vercel.app/api/license';
```

### 3. ✅ Create Licenses in Supabase
```sql
INSERT INTO "UndiApp V1.2" (serial_key, client_name, expires_at, notes)
VALUES (
  'UNDI-2026-0001',
  'Customer Name',
  NOW() + INTERVAL '1 year',
  'Annual license'
);
```

### 4. ✅ Test License Activation
- Build development version
- Clear cache: `rm -rf ~/Library/Application\ Support/undi-app/`
- Run and activate with test license

### 5. ✅ Build Production Executables
```bash
# For Windows customers
npm run electron:build:win

# For Mac customers
npm run electron:build:mac
```

### 6. ✅ Test Executables
- Test Windows .exe on Windows machine (or VM)
- Test Mac .dmg on Mac
- Verify license activation works
- Check offline grace period (48 hours)

---

## 📋 What Customers Receive

### For Windows Users:
**Option 1: Installer (Recommended)**
- File: `UndiApp Setup 1.1.0.exe`
- Installation: Double-click → Choose install location → Desktop shortcut created

**Option 2: Portable**
- File: `UndiApp 1.1.0.exe`
- Usage: Double-click to run (no installation needed)

### For Mac Users:
- File: `UndiApp-1.1.0.dmg`
- Installation: Double-click → Drag to Applications folder

### First Launch:
1. App opens with activation window
2. Customer enters serial key you provided
3. App validates online via Supabase
4. Binds to their device
5. Works offline for 48 hours

---

## 🔍 Build Process Explained

When you run `npm run electron:build:win`, here's what happens:

1. **Next.js Build** (`next build`)
   - Compiles React app to `.next/standalone`
   - Optimizes for production

2. **Electron Builder** (`electron-builder --win`)
   - Packages Next.js app
   - Bundles Electron runtime
   - Includes `electron/` folder (main, preload, license-manager, database)
   - Packages `node_modules` (better-sqlite3, electron-store, etc.)
   - Creates Windows executable with icon

3. **Output**
   - `.exe` files in `dist/` folder
   - Ready to distribute

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
pkill -f "next dev"
pkill -f "Electron"
```

### Windows build fails on Mac
```bash
# Install wine (optional but helps)
brew install wine-stable

# Or ignore and use standard build
npm run electron:build:win
```

### "App is damaged" on Mac
```bash
# Users need to right-click → Open (first time only)
# Or remove quarantine:
xattr -cr /Applications/UndiApp.app
```

### License activation fails
- Check Vercel is deployed: `curl https://your-app.vercel.app/api/license/validate`
- Verify Supabase credentials in Vercel env vars
- Check license exists in Supabase table
- Ensure customer has internet connection

---

## 🔐 Security Notes

### Production Build Security:
- ✅ License API uses HTTPS (Vercel)
- ✅ Device fingerprint prevents sharing
- ✅ Local license cache encrypted (electron-store)
- ✅ 48-hour offline grace period
- ✅ Service role key never exposed (server-side only)

### What Customers Can't Do:
- ❌ Use license on multiple computers
- ❌ Share license key (binds to first device)
- ❌ Bypass expiration (validated online every 24h)
- ❌ Work offline forever (48h limit)

---

## 📊 Version Bumping

Before building new version:

1. Update `version` in `package.json`:
```json
{
  "version": "1.2.0"
}
```

2. Build creates: `UndiApp Setup 1.2.0.exe`

3. Track versions in release notes

---

## 🚢 Quick Build Workflow

```bash
# 1. Ensure production API URL is set
export LICENSE_API_URL=https://undi-app.vercel.app/api/license

# 2. Build for Windows customers
npm run electron:build:win

# 3. Build for Mac customers (if needed)
npm run electron:build:mac

# 4. Executables are in dist/ folder
ls -lh dist/

# 5. Share .exe files with customers + serial keys
```

---

## 📬 Customer Delivery

### Package Contents:
1. **UndiApp Setup 1.1.0.exe** (or portable .exe)
2. **Serial key** (via email/WhatsApp)
3. **Installation instructions**

### Email Template:
```
Subject: UndiApp License - [Customer Name]

Hi [Customer Name],

Your UndiApp license is ready!

Serial Key: UNDI-2026-XXXX-XXXX
Expires: [Date]

Installation:
1. Download: UndiApp Setup 1.1.0.exe
2. Run installer
3. Enter serial key when prompted
4. Enjoy!

Need help? Contact: haris.illahi@gmail.com

Best regards,
UndiApp Team
```

---

## 🎉 You're Ready!

Build your app and start distributing to customers. The license system will handle activation, validation, and device binding automatically.

**Next Steps:**
1. Deploy to Vercel (if not done)
2. Update LICENSE_API_URL in code
3. Run `npm run electron:build:win`
4. Test the .exe file
5. Create customer licenses in Supabase
6. Share executables + serial keys

Good luck! 🚀
