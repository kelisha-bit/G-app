# 🚀 Deploy to Firebase Hosting - Step by Step Guide

This guide will walk you through deploying your web app to Firebase Hosting.

---

## ✅ Prerequisites

- ✅ Firebase project created: `greater-works-city-churc-4a673`
- ✅ Firebase CLI installed
- ✅ `firebase.json` configured (already done!)
- ✅ Node.js installed

---

## 📋 Quick Deployment (3 Steps)

### Step 1: Authenticate with Firebase

```powershell
firebase login --reauth
```

This will:
- Open your browser
- Ask you to log in to your Google account
- Authorize Firebase CLI

**If browser doesn't open:**
```powershell
firebase login --no-localhost
```

---

### Step 2: Build Your Web App

```powershell
npm run build:web
```

This creates the `web-build` folder that Firebase will deploy.

**Verify the build:**
```powershell
# Check if web-build folder exists
Test-Path web-build

# List contents
Get-ChildItem web-build
```

---

### Step 3: Deploy to Firebase Hosting

```powershell
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
```

**What this does:**
- `$env:NODE_OPTIONS="--no-warnings"` - Fixes Node.js v22 compatibility issue
- `firebase deploy --only hosting` - Deploys only the hosting (not Firestore/Storage)

**Alternative (if the above doesn't work):**
```powershell
firebase deploy --only hosting
```

---

## 🎯 Complete Deployment Script

You can also use the automated script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firebase-hosting.ps1
```

This script will:
1. ✅ Check if web-build exists (builds if needed)
2. ✅ Verify Firebase authentication
3. ✅ Set the correct project
4. ✅ Deploy with Node.js workaround

---

## 📝 Detailed Step-by-Step

### 1. Verify Firebase Project

```powershell
firebase use
```

Should show: `greater-works-city-churc-4a673`

If not, set it:
```powershell
firebase use greater-works-city-churc-4a673
```

---

### 2. Check Hosting Site

```powershell
firebase hosting:sites:list
```

Should show:
```
Site ID: greater-works-city-churc-4a673
URL: https://greater-works-city-churc-4a673.web.app
```

---

### 3. Build Web Version

```powershell
npm run build:web
```

Wait for the build to complete. You should see:
```
✓ Built web assets
```

---

### 4. Deploy

```powershell
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
```

You'll see output like:
```
=== Deploying to 'greater-works-city-churc-4a673'...

i  deploying hosting
i  hosting[greater-works-city-churc-4a673]: beginning deploy...
i  hosting[greater-works-city-churc-4a673]: found 123 files
✔  hosting[greater-works-city-churc-4a673]: file upload complete
✔  hosting[greater-works-city-churc-4a673]: deploy complete!

✔  Deploy complete!
```

---

### 5. View Your Site

After successful deployment, your site will be live at:

🌐 **https://greater-works-city-churc-4a673.web.app**

Or check the Firebase Console:
- Go to: https://console.firebase.google.com/project/greater-works-city-churc-4a673/hosting

---

## 🔄 Update Deployment

To update your site after making changes:

1. **Make your code changes**
2. **Rebuild:**
   ```powershell
   npm run build:web
   ```
3. **Redeploy:**
   ```powershell
   $env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
   ```

---

## 🐛 Troubleshooting

### Error: "Authentication Error"

**Solution:**
```powershell
firebase login --reauth
```

---

### Error: "No hosting site found"

**Solution:**
1. Go to Firebase Console: https://console.firebase.google.com/project/greater-works-city-churc-4a673/hosting
2. Click "Get started" to create hosting site
3. The site ID will be `greater-works-city-churc-4a673`

---

### Error: "web-build folder not found"

**Solution:**
```powershell
npm run build:web
```

---

### Error: "Circular structure to JSON"

**Solution:**
This is a Node.js v22 compatibility issue. Use the workaround:
```powershell
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
```

Or downgrade to Node.js v20 LTS (see FIREBASE_DEPLOYMENT_FIX.md)

---

### Error: "Project not found"

**Solution:**
```powershell
firebase use greater-works-city-churc-4a673
```

---

## 📊 Deployment Options

### Deploy Only Hosting (Recommended)

```powershell
firebase deploy --only hosting
```

### Deploy Everything (Hosting + Firestore + Storage)

```powershell
firebase deploy
```

### Deploy to Preview Channel

```powershell
firebase hosting:channel:deploy preview
```

This creates a preview URL you can share before going live.

---

## 🔐 Environment Variables

If your app uses environment variables, set them in Firebase:

1. **Go to Firebase Console** → Project Settings → Environment Variables
2. **Add variables** (they should start with `EXPO_PUBLIC_`)
3. **Redeploy** after adding variables

Or use `.env` file locally (already configured in webpack.config.js)

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Site is accessible at the URL
- [ ] All pages load correctly
- [ ] Firebase Authentication works
- [ ] Firestore data loads
- [ ] Images and assets load
- [ ] Mobile responsive design works
- [ ] Payment links work (if configured)

---

## 🚀 Quick Reference Commands

```powershell
# Authenticate
firebase login --reauth

# Set project
firebase use greater-works-city-churc-4a673

# Build web
npm run build:web

# Deploy
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting

# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

---

## 📱 Your Site URLs

After deployment:

- **Live Site:** https://greater-works-city-churc-4a673.web.app
- **Firebase Console:** https://console.firebase.google.com/project/greater-works-city-churc-4a673/hosting

---

## 💡 Pro Tips

1. **Use Preview Channels** for testing before going live
2. **Set up CI/CD** for automatic deployments
3. **Monitor deployments** in Firebase Console
4. **Use custom domain** (optional) - configure in Firebase Console
5. **Enable HTTPS** (automatic with Firebase Hosting)

---

## 🎉 You're All Set!

Your Firebase Hosting is configured and ready. Just run the 3 steps above whenever you want to deploy!

**Need help?** Check:
- `FIREBASE_HOSTING_FIX.md` - Troubleshooting guide
- `FIREBASE_DEPLOYMENT_FIX.md` - Node.js compatibility fixes
- Firebase Docs: https://firebase.google.com/docs/hosting

Happy deploying! 🚀

