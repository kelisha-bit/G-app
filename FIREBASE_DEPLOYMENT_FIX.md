# 🔧 Firebase Hosting Deployment Fix

## ⚠️ Current Issue

You're encountering this error:
```
TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'TLSSocket'
    |     property 'parser' -> object with constructor 'HTTPParser'
    --- property 'socket' closes the circle
```

**Root Cause:** This is a known compatibility issue between Firebase CLI and Node.js v22.20.0. The Firebase CLI has trouble handling TLS socket errors in Node.js v22.

---

## ✅ Solution 1: Use Node.js LTS (Recommended)

The most reliable fix is to use Node.js LTS (v20 or v18) instead of v22.

### Option A: Install Node.js LTS using NVM (Node Version Manager)

1. **Install NVM for Windows:**
   - Download from: https://github.com/coreybutler/nvm-windows/releases
   - Install `nvm-setup.exe`

2. **Install Node.js v20 LTS:**
   ```powershell
   nvm install 20.11.0
   nvm use 20.11.0
   ```

3. **Verify:**
   ```powershell
   node --version  # Should show v20.x.x
   ```

4. **Retry deployment:**
   ```powershell
   firebase deploy --only hosting
   ```

### Option B: Download Node.js LTS directly

1. **Download Node.js v20 LTS:**
   - Visit: https://nodejs.org/
   - Download the LTS version (v20.x.x)
   - Install it (this will replace your current Node.js)

2. **Verify:**
   ```powershell
   node --version  # Should show v20.x.x
   ```

3. **Retry deployment:**
   ```powershell
   firebase deploy --only hosting
   ```

---

## ✅ Solution 2: Manual Upload via Firebase Console

If you can't change Node.js versions, you can deploy manually:

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `greater-works-city-churc-4a673`

2. **Navigate to Hosting:**
   - Click **Hosting** in the left sidebar
   - Click **Get started** (if first time) or **Add another site**

3. **Deploy files:**
   - Click **Advanced** or **Manual deployment**
   - Drag and drop your `web-build` folder contents
   - Or use the Firebase CLI with a workaround (see Solution 3)

---

## ✅ Solution 3: Workaround with Environment Variable (✅ WORKING!)

**This solution works!** Set this environment variable before deploying:

```powershell
$env:NODE_OPTIONS="--no-warnings"
firebase deploy --only hosting
```

**Or use it in a single command:**
```powershell
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
```

**✅ Verified:** This successfully deployed to Firebase Hosting!

**What it does:** The `--no-warnings` flag suppresses Node.js warnings that were causing the circular JSON structure error in the Firebase CLI's error handling.

**Note:** This is a workaround, but it's safe and effective. For a permanent fix, consider using Node.js v20 LTS (Solution 1).

---

## ✅ Solution 4: Deploy Individual Files (Workaround)

If the above don't work, you can try deploying in smaller batches:

1. **Create a script to deploy files individually:**
   ```powershell
   # This is a workaround - deploy critical files first
   cd "C:\Users\Amasco DE-General\Desktop\G-pp3\G-app"
   
   # Deploy essential files first
   firebase deploy --only hosting --only files:index.html,manifest.json
   ```

   However, Firebase CLI doesn't support selective file deployment easily.

---

## ✅ Solution 5: Use Alternative Deployment Method

### Option A: Use Firebase Console Drag & Drop

1. **Zip your web-build folder:**
   ```powershell
   Compress-Archive -Path "web-build\*" -DestinationPath "web-build.zip"
   ```

2. **Upload via Firebase Console:**
   - Go to Firebase Console → Hosting
   - Use the manual upload option
   - Upload the zip file

### Option B: Use GitHub Actions / CI/CD

Set up automated deployment via GitHub Actions that uses Node.js v20:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g firebase-tools
      - run: firebase deploy --only hosting
```

---

## 🎯 Recommended Action Plan

1. **✅ Immediate Fix (WORKING NOW!):** Use NODE_OPTIONS workaround (Solution 3)
   - Works immediately with your current setup
   - Quick and easy
   - Use this for now: `$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting`

2. **Long-term Fix:** Use Node.js v20 LTS (Solution 1)
   - Most reliable permanent solution
   - Takes about 5-10 minutes to set up
   - Works for all future deployments without workarounds

3. **Alternative:** Manual upload via Firebase Console (Solution 2)
   - Works immediately
   - Good for one-time deployments
   - Not ideal for frequent updates

4. **Best Practice:** Set up CI/CD with Node.js v20 (Solution 5B)
   - Automated deployments
   - Consistent environment
   - Best for production

---

## 📝 Additional Notes

- **Node.js v22 Compatibility:** Firebase CLI is still catching up with Node.js v22 features
- **Firebase CLI Updates:** Keep checking for Firebase CLI updates that might fix this
- **Alternative:** Consider using other hosting options (Netlify, Vercel) if this persists

---

## 🔍 Verify Your Setup

After applying a solution, verify:

```powershell
# Check Node.js version
node --version

# Check Firebase CLI version
firebase --version

# Test deployment
firebase deploy --only hosting
```

---

## 💡 Quick Reference

**Current Setup:**
- Node.js: v22.20.0 ❌ (causing issues)
- Firebase CLI: 15.2.1 ✅ (latest)
- Project: greater-works-city-churc-4a673

**Recommended Setup:**
- Node.js: v20.11.0 ✅ (LTS, stable)
- Firebase CLI: 15.2.1 ✅ (latest)
- Project: greater-works-city-churc-4a673

