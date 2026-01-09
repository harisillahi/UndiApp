# 🚀 Vercel Deployment + Desktop App Build Guide

## Overview
Your Electron app will be a **thin client** that connects to your Vercel-hosted API for license validation. This approach:
- ✅ Smaller executable file size
- ✅ Easier to update API without rebuilding app
- ✅ Centralized license management
- ✅ Works on Windows and Mac

---

## Step 1: Deploy to Vercel

### 1.1 Push Code to GitHub

```bash
cd /Users/harisillahi/Documents/myapp/UndiApp

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - UndiApp with license system"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/UndiApp.git
git branch -M main
git push -u origin main
```

### 1.2 Connect to Vercel

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 1.3 Configure Environment Variables in Vercel

**CRITICAL:** Before deploying, add these in Vercel dashboard:

Go to: **Project Settings** → **Environment Variables**

Add:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxypsabcdnojitiayzy.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHlwc2FiY2Rub2ppdGlheXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzkxMjE1MywiZXhwIjoyMDgzNDg4MTUzfQ._eGiICvIk6TbjkDNHdMp2YGIBnsfibLNRDu8jjR1sgw
ADMIN_API_KEY=admin123
```

Apply to: **Production, Preview, and Development**

### 1.4 Deploy

Click **"Deploy"** and wait 2-3 minutes.

You'll get a URL like: `https://undi-app.vercel.app`

### 1.5 Test the API

```bash
curl https://undi-app.vercel.app/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{"serial_key":"UNDI-TEST-1234-5678","device_id":"test"}'
```

Should return: `{"valid":false}` (because device doesn't match)

---

## Step 2: Update Desktop App Configuration

### 2.1 Update License Manager

**Open:** `electron/license-manager.js`

**Line 7** - Change from:
```javascript
this.apiUrl = process.env.LICENSE_API_URL || 'REPLACE_WITH_YOUR_VERCEL_URL';
```

**To your Vercel URL:**
```javascript
this.apiUrl = process.env.LICENSE_API_URL || 'https://undi-app.vercel.app/api/license';
```

**Save the file!**

### 2.2 Verify Supabase Table

Make sure your Supabase table `"UndiApp V1.2"` has test license:

```sql
SELECT * FROM "UndiApp V1.2" WHERE serial_key = 'UNDI-TEST-1234-5678';
```

Should show:
- `is_active = true`
- `expires_at` = future date

---

## Step 3: Build Desktop App

### 3.1 Build for Mac

```bash
npm run electron:build:mac
```

Output: `dist/UndiApp-1.1.0.dmg`

### 3.2 Build for Windows (from Mac)

```bash
npm run electron:build:win
```

Output:
- `dist/UndiApp Setup 1.1.0.exe` (installer)
- `dist/UndiApp 1.1.0.exe` (portable)

### 3.3 Check dist folder

```bash
ls -lh dist/
```

You should see your executables!

---

## Step 4: Test the Built App

### 4.1 Test Mac App

1. Go to `dist/` folder
2. Double-click `UndiApp-1.1.0.dmg`
3. Drag to Applications
4. Open UndiApp
5. Activation window appears
6. Enter: `UNDI-TEST-1234-5678`
7. Click Activate
8. Should connect to Vercel → Supabase → Success!

### 4.2 Clear cache to test again

```bash
rm -rf ~/Library/Application\ Support/undi-app/
```

Then reopen app to test activation again.

---

## Step 5: Distribute to Customers

### 5.1 Create License in Supabase

```sql
INSERT INTO "UndiApp V1.2" (serial_key, client_name, expires_at, notes)
VALUES (
  'UNDI-2026-0001',
  'John Doe',
  NOW() + INTERVAL '1 year',
  'Annual license - Paid Jan 9, 2026'
);
```

### 5.2 Package for Customer

**For Windows:**
- File: `UndiApp Setup 1.1.0.exe`
- Serial: `UNDI-2026-0001`

**For Mac:**
- File: `UndiApp-1.1.0.dmg`
- Serial: `UNDI-2026-0001`

### 5.3 Email Template

```
Subject: Your UndiApp License

Hi [Customer Name],

Your UndiApp license is ready!

🔑 Serial Key: UNDI-2026-0001
📅 Valid Until: Jan 9, 2027

📥 Download: [Attach file or provide link]

Installation:
1. Install the app
2. Enter your serial key when prompted
3. Start creating lotteries!

Questions? Reply to this email.

Best regards,
UndiApp Team
```

---

## 🔧 Architecture

```
┌────────────────┐
│  Customer's    │
│   Computer     │
│                │
│  ┌──────────┐  │
│  │ UndiApp  │  │ ← Electron App (5-10 MB)
│  │   .exe   │  │
│  └────┬─────┘  │
└───────┼────────┘
        │
        │ HTTPS License Validation
        │
        ▼
┌────────────────┐
│   Vercel       │
│  (Your API)    │ ← Next.js API Routes
│                │
│  /api/license  │
│    /activate   │
│    /validate   │
└───────┬────────┘
        │
        │ SQL Queries
        │
        ▼
┌────────────────┐
│   Supabase     │
│  (Database)    │ ← PostgreSQL
│                │
│ "UndiApp V1.2" │
│  licenses      │
└────────────────┘
```

---

## ⚡ Quick Command Reference

```bash
# Deploy to Vercel
git push origin main  # Auto-deploys

# Build Windows app
npm run electron:build:win

# Build Mac app
npm run electron:build:mac

# Test in development
npm run electron:dev

# Clear license cache
rm -rf ~/Library/Application\ Support/undi-app/
```

---

## 🐛 Troubleshooting

### "Kode lisensi tidak valid"
- Check Vercel is deployed: Visit `https://your-app.vercel.app`
- Verify license exists in Supabase table
- Check `electron/license-manager.js` has correct URL
- Ensure customer has internet connection

### App won't open on Windows
- Customer needs to right-click → "Run as administrator" (first time)
- Or install using `UndiApp Setup.exe` (recommended)

### App won't open on Mac
- Customer needs to right-click → "Open" (first time)
- macOS security will ask for confirmation
- Or run: `xattr -cr /Applications/UndiApp.app`

### Build fails
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run electron:build:mac
```

---

## 🔐 Security Checklist

Before distributing:
- ✅ Vercel environment variables set (never in code)
- ✅ `SUPABASE_SERVICE_KEY` is server-side only
- ✅ License API URL updated in `license-manager.js`
- ✅ Test license activation works
- ✅ Verify 48-hour offline grace period works
- ✅ Confirm device binding prevents sharing

---

## 📊 Version Updates

When you need to release update:

1. **Update version** in `package.json`:
   ```json
   "version": "1.2.0"
   ```

2. **Update code** (bug fixes, new features)

3. **Deploy to Vercel**:
   ```bash
   git commit -am "Version 1.2.0 - Bug fixes"
   git push origin main
   ```

4. **Rebuild executables**:
   ```bash
   npm run electron:build:win
   npm run electron:build:mac
   ```

5. **Distribute new .exe files** to customers

---

## 🎉 You're Ready!

Your setup:
- ✅ Electron app configured as thin client
- ✅ API routes ready for Vercel deployment
- ✅ Supabase database with test license
- ✅ Build scripts simplified

**Next steps:**
1. Push to GitHub
2. Deploy to Vercel
3. Update `electron/license-manager.js` with Vercel URL
4. Build executables
5. Test activation
6. Share with customers!

Good luck! 🚀
