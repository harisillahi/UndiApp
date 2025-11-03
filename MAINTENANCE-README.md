# 🛠️ UndiApp Maintenance Mode System

## Overview
Professional maintenance mode system for UndiApp with Next.js middleware integration. Shows a beautiful "Pardon our dust!" message with animated elements.

## 📁 Files Created
- `middleware.ts` - Next.js middleware for automatic redirection
- `public/maintenance.html` - Maintenance page accessible at `/maintenance.html`
- `maintenance-config.js` - Configuration file (for reference)

## 🚀 Quick Setup (Already Done!)

The maintenance system is now ready to use. Here's how it works:

### ✅ What's Already Set Up:
1. **Next.js Middleware**: Automatically redirects all routes to maintenance page when enabled
2. **Maintenance Page**: Professional design with UndiApp branding at `/maintenance.html`
3. **Admin Bypass**: Access your app with `?bypass=admin123` in the URL
4. **Auto-refresh**: Maintenance page refreshes every 30 seconds
5. **External Config**: Uses `maintenance-config.js` for easy toggling

## ⚙️ How to Use

### 🔴 Enable Maintenance Mode
1. Open `maintenance-config.js`
2. Change `enabled: false` to `enabled: true`
3. Save the file
4. **Maintenance mode is now active!** 🎯

### 🟢 Disable Maintenance Mode
1. Open `maintenance-config.js`
2. Change `enabled: true` to `enabled: false`
3. Save the file
4. **Site is back online!** ✅

### 🔧 Admin Emergency Access
If you need to access your app while maintenance is active:
- Add `?bypass=admin123` to any URL
- Example: `http://localhost:3000/?bypass=admin123`
- This sets a cookie for 1 hour of bypass access
- You can change `admin123` to your preferred bypass key

## 🎨 Maintenance Page Features

### Visual Design:
- Beautiful gradient background (purple to blue)
- UndiApp branding with dice emoji 🎲
- Animated spinning gear icon ⚙️
- Smooth progress bar animation
- Glass-morphism design with backdrop blur
- Fully responsive for all devices

### Functionality:
- Auto-refresh every 30 seconds
- Contact email for support
- Professional messaging
- Smooth animations

## 📱 What Users See

When maintenance is enabled, users visiting any page will see:

```
🎲 UndiApp

⚙️ (spinning gear animation)

Pardon our dust!

We are performing a quick system upgrade and should be back in a moment. 
Please check back shortly.

[Animated progress bar]
System upgrade in progress...

Need immediate assistance?
haris.illahi@gmail.com

⟳ This page will automatically refresh every 30 seconds
```

## 🔧 Customization

### Change Messages:
Edit the `MAINTENANCE_CONFIG` in `maintenance-config.js`:

```javascript
const MAINTENANCE_CONFIG = {
    enabled: false,              // Toggle here
    message: "Pardon our dust!", // Main title
    description: "We are performing a quick system upgrade...", // Description
    estimatedTime: "",           // Optional estimated time
    contact: "haris.illahi@gmail.com", // Support email
    adminBypass: "admin123"      // Change bypass key
};
```

### Styling:
Edit `public/maintenance.html` to customize:
- Colors and gradients
- Typography
- Layout and spacing
- Animation timing
- Contact information

## 🔍 Testing

### Test Activation:
1. Set `enabled: true` in `middleware.ts`
2. Visit `http://localhost:3000` - should show maintenance page
3. Test bypass: `http://localhost:3000/?bypass=admin123`
4. Set `enabled: false` to disable

### Test Different Routes:
- All app routes redirect to maintenance when enabled
- Static files (images, CSS, JS) still work
- API routes are not affected
- Maintenance page itself is always accessible

## 📂 File Structure
```
UndiApp/
├── middleware.ts ← Toggle maintenance here
├── public/
│   └── maintenance.html ← Maintenance page
├── maintenance-config.js ← Reference config
├── maintenance-check.js ← Legacy browser script
└── maintenance.html ← Legacy maintenance page
```

## 🚨 Important Notes

### For Production:
- Test thoroughly in development first
- Consider notifying users in advance
- Keep the bypass key secure
- Monitor server logs during maintenance

### Next.js Specific:
- Middleware runs on all requests automatically
- No need to modify individual pages
- Works with both dev server and production builds
- Respects Next.js routing patterns

## 📋 Quick Reference

**Enable Maintenance:**
```javascript
// In maintenance-config.js
enabled: true
```

**Disable Maintenance:**
```javascript
// In maintenance-config.js
enabled: false
```

**Admin Access:**
```
http://localhost:3000/?bypass=admin123
```

**Change Bypass Key:**
```javascript
// In maintenance-config.js
adminBypass: "your-secret-key"
```

---

## ✅ Ready to Use!

Your maintenance system is fully configured and ready. Simply toggle `enabled: true` in `maintenance-config.js` when you need to perform maintenance on UndiApp.

**Simple. Professional. Effective.** 🎯