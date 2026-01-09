# Supabase + GitHub + Vercel Deployment Guide

## Overview
Your app now uses Supabase PostgreSQL for license management instead of local files. This guide covers:
1. Setting up Supabase database
2. Configuring credentials locally
3. Deploying to Vercel via GitHub
4. Building desktop executable with production URL

---

## Step 1: Create Supabase Database Table

### 1.1 Go to your Supabase project
- Visit https://supabase.com/dashboard
- Select your project

### 1.2 Create licenses table
- Click **SQL Editor** in left sidebar
- Click **New Query**
- Paste this SQL:

```sql
-- Create licenses table
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_key TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_validated TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_serial_key ON licenses(serial_key);
CREATE INDEX idx_device_id ON licenses(device_id);
CREATE INDEX idx_is_active ON licenses(is_active);

-- Insert a test license (valid for 30 days)
INSERT INTO licenses (serial_key, client_name, expires_at, notes)
VALUES (
  'UNDI-TEST-1234-5678',
  'Test Client',
  NOW() + INTERVAL '30 days',
  'Test license for development'
);
```

- Click **Run** to execute
- You should see: "Success. No rows returned"

### 1.3 Verify table creation
- Click **Table Editor** in left sidebar
- You should see `licenses` table with 1 row (test license)

---

## Step 2: Get Supabase Credentials

### 2.1 Get Project URL
- In Supabase dashboard, go to **Settings** → **API**
- Copy **Project URL** (looks like: https://xxxxx.supabase.co)

### 2.2 Get Service Role Key
- On same page, scroll to **Project API keys**
- Copy **service_role** key (NOT the anon key)
- ⚠️ **Keep this secret** - it has full database access

### 2.3 Update local .env.local
Open `.env.local` and replace placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
ADMIN_API_KEY=your-random-secure-password-123
LICENSE_API_URL=http://localhost:3000
```

**Generate ADMIN_API_KEY**: Use any random string (e.g., `openssl rand -base64 32`)

---

## Step 3: Test Locally with Supabase

### 3.1 Restart development server
```bash
npm run electron:dev
```

### 3.2 Test activation
- Activation window should appear
- Enter: `UNDI-TEST-1234-5678`
- Click **Activate**
- Should succeed and open main app

### 3.3 Verify in Supabase
- Go to **Table Editor** → **licenses**
- The test license should now have:
  - `device_id`: Your computer's fingerprint
  - `last_validated`: Current timestamp

---

## Step 4: Deploy to Vercel via GitHub

### 4.1 Update .gitignore (Already done ✅)
Your `.env.local` is excluded from Git - credentials stay safe

### 4.2 Commit and push to GitHub
```bash
git add .
git commit -m "Add Supabase license management"
git push origin main
```

### 4.3 Connect Vercel to GitHub
- Go to https://vercel.com
- Click **Add New** → **Project**
- Select your GitHub repository
- Vercel will auto-detect Next.js

### 4.4 Configure environment variables in Vercel
Before deploying, add these in **Environment Variables** section:

| Key | Value | Source |
|-----|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | From Step 2.1 |
| `SUPABASE_SERVICE_KEY` | Your service_role key | From Step 2.2 |
| `ADMIN_API_KEY` | Same as local .env.local | From Step 2.3 |

**Don't set LICENSE_API_URL** - it's only for Electron desktop app

### 4.5 Deploy
- Click **Deploy**
- Wait 2-3 minutes
- You'll get a URL like: `https://undi-app.vercel.app`

---

## Step 5: Update Electron for Production

### 5.1 Update LICENSE_API_URL in electron/license-manager.js

Open `electron/license-manager.js` and change line 3:

```javascript
// Change from:
const API_URL = 'http://localhost:3000';

// To your Vercel production URL:
const API_URL = 'https://undi-app.vercel.app';
```

**Or better - make it configurable:**

```javascript
const API_URL = process.env.LICENSE_API_URL || 'https://undi-app.vercel.app';
```

Then in your `.env.local` for local dev, keep:
```env
LICENSE_API_URL=http://localhost:3000
```

### 5.2 Build desktop executable

```bash
# For Windows
npm run electron:build

# For Mac
npm run electron:build -- --mac

# For Linux
npm run electron:build -- --linux
```

Find executable in `dist/` folder.

---

## Step 6: Manage Licenses in Supabase

### 6.1 Add new license manually
Go to **Table Editor** → **licenses** → **Insert row**:

```
serial_key: UNDI-PROD-XXXX-YYYY
client_name: Customer Name
expires_at: 2025-12-31 23:59:59
is_active: true
notes: 1 year license
```

### 6.2 View all licenses
```sql
SELECT 
  serial_key, 
  client_name, 
  device_id, 
  expires_at, 
  is_active,
  last_validated
FROM licenses
ORDER BY created_at DESC;
```

### 6.3 Revoke a license via API
```bash
curl -X POST https://undi-app.vercel.app/api/license/revoke \
  -H "Authorization: Bearer your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"serial_key": "UNDI-XXXX-YYYY-ZZZZ"}'
```

### 6.4 Check license status
```sql
-- Find licenses about to expire (next 7 days)
SELECT serial_key, client_name, expires_at
FROM licenses
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND is_active = true;

-- Find inactive licenses
SELECT serial_key, client_name, device_id
FROM licenses
WHERE is_active = false;

-- Find licenses by device
SELECT serial_key, client_name, expires_at
FROM licenses
WHERE device_id = 'xxx-device-fingerprint-xxx';
```

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Desktop App                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────────┐
                   │  Electron Main.js   │
                   │  Check local cache  │
                   └──────────┬──────────┘
                              │
                 ┌────────────┴───────────┐
                 │                        │
          ✅ Valid cache              ❌ No cache/Expired
          (< 48 hours)                    │
                 │                        │
                 │                        ▼
                 │              ┌──────────────────┐
                 │              │ Activation Dialog│
                 │              │ User enters key  │
                 │              └────────┬─────────┘
                 │                       │
                 │                       ▼
                 │         ┌─────────────────────────────┐
                 │         │ POST /api/license/activate  │
                 │         │ via Vercel (HTTPS)          │
                 │         └──────────┬──────────────────┘
                 │                    │
                 │                    ▼
                 │         ┌──────────────────────────┐
                 │         │   Supabase PostgreSQL    │
                 │         │ - Check serial_key       │
                 │         │ - Verify not expired     │
                 │         │ - Bind device_id         │
                 │         │ - Update last_validated  │
                 │         └──────────┬───────────────┘
                 │                    │
                 │              ✅ Success
                 └────────────────────┴──────────────────┐
                                                          │
                                                          ▼
                                              ┌─────────────────────┐
                                              │  Open Main Window   │
                                              │  App fully functional│
                                              └─────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         Every 24 hours: Background Validation               │
│  POST /api/license/validate → Supabase check               │
│  If offline > 48h: Block app until online                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Error: "Cannot connect to database"
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Verify Supabase project is not paused (free tier pauses after 7 days inactivity)
- Check internet connection

### Error: "Invalid serial key"
- Verify license exists in Supabase **Table Editor**
- Check `is_active = true` and `expires_at > now()`
- Serial key is case-sensitive

### Desktop app can't reach Vercel
- Check `API_URL` in `electron/license-manager.js` points to production URL
- Ensure Vercel deployment succeeded (visit URL in browser)
- Check environment variables are set in Vercel dashboard

### License activated on wrong device
- Go to Supabase **Table Editor**
- Find license row
- Set `device_id = NULL` to allow re-activation
- Optionally set `is_active = false` to force re-entry

---

## Next Steps

1. ✅ Create production licenses in Supabase for real customers
2. ✅ Build executables with production API_URL
3. ✅ Distribute .exe files to customers
4. 📊 (Optional) Build admin dashboard at `/admin` to manage licenses via web UI
5. 🔔 (Optional) Add email notifications for expiring licenses using Supabase Edge Functions

---

## Security Notes

- **Never commit** `.env.local` to Git (already in .gitignore ✅)
- **Service role key** has full database access - only use in server-side code
- **ADMIN_API_KEY** should be a strong random password
- Vercel environment variables are encrypted at rest
- Device fingerprint uses SHA256 hash - not reversible
- 48-hour offline grace period prevents license server downtime from blocking users

