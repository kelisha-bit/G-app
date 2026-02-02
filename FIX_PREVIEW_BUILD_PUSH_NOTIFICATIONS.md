# 🔧 Fixing Push Notifications in Preview Build

## ❌ Problem

Push notifications work in **development build** but **NOT in preview build**.

**Why?**
- Development builds can access `.env` file or use localhost (via Metro bundler)
- Preview builds are standalone APKs that don't have access to `.env` file
- The `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` environment variable isn't set in preview builds
- Defaults to `http://localhost:3001` which doesn't work on physical devices

---

## 🔍 Root Cause Analysis

### Development Build (Works ✅)
```json
"development": {
  "developmentClient": true,  // ← Can connect to Metro bundler
  // No env section needed because Metro can access .env
}
```

### Preview Build (Broken ❌)
```json
"preview": {
  // No developmentClient
  // No env section
  // Can't access .env file
}
```

**Result:** `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` is undefined → defaults to `http://localhost:3001` → fails ❌

---

## ✅ Solutions

### Solution 1: Use EAS Secrets (Recommended for Production)

**Set the backend URL as an EAS secret so it's included in preview builds:**

```powershell
# Set backend URL as EAS secret
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "YOUR_BACKEND_URL"
```

**For preview builds, you need a deployed backend URL (not localhost):**

```powershell
# Example: If your backend is deployed to Heroku, Railway, etc.
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-backend.herokuapp.com"

# Or if testing with local network IP (less reliable)
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "http://172.20.10.3:3001"
```

**Verify it's set:**
```powershell
eas secret:list
```

**Then rebuild:**
```powershell
eas build --platform android --profile preview
```

---

### Solution 2: Add to eas.json (Quick Fix for Testing)

**Add environment variable directly to preview profile in `eas.json`:**

```json
"preview": {
  "distribution": "internal",
  "node": "20.19.4",
  "android": {
    "buildType": "apk"
  },
  "env": {
    "EXPO_PUBLIC_NOTIFICATION_BACKEND_URL": "http://172.20.10.3:3001"
  }
}
```

**⚠️ Warning:** This hardcodes the IP address. Not ideal for:
- Devices on different networks
- Production use
- Sharing builds with others

**✅ Good for:** Quick testing if you know your network IP won't change

---

### Solution 3: Deploy Backend Service (Best for Production)

**Deploy your backend to a cloud service so it's always accessible:**

**Option A: Heroku**
```powershell
cd backend
heroku create your-app-name
git push heroku main
# Get URL: https://your-app-name.herokuapp.com
```

**Option B: Railway**
```powershell
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up
# Get URL from Railway dashboard
```

**Option C: Render**
1. Connect GitHub repo
2. Select `backend/server.js`
3. Set start command: `npm start`
4. Get URL from Render dashboard

**Then use that URL:**
```powershell
# Set as EAS secret
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-backend.herokuapp.com"
```

---

## 🎯 Recommended Approach

### For Testing Preview Builds:

**Option A: Use EAS Secret with Local Network IP (Quick Testing)**
```powershell
# Find your IP
ipconfig
# Look for IPv4 Address (e.g., 172.20.10.3)

# Set as EAS secret
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "http://172.20.10.3:3001"

# Make sure backend is running
cd backend
npm start

# Rebuild preview
eas build --platform android --profile preview
```

**⚠️ Limitations:**
- Only works on same Wi-Fi network
- IP might change
- Backend must be running

### For Production Preview Builds:

**Deploy backend + Use EAS Secret:**
```powershell
# 1. Deploy backend (see Solution 3 above)
# Get deployed URL: https://your-backend.herokuapp.com

# 2. Set as EAS secret
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-backend.herokuapp.com"

# 3. Rebuild
eas build --platform android --profile preview
```

---

## 📋 Step-by-Step Fix

### Step 1: Check Current Secrets

```powershell
eas secret:list
```

**Look for:** `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL`

If it doesn't exist, continue to Step 2.

---

### Step 2: Set Backend URL Secret

**For Testing (Local Network):**
```powershell
# Get your computer's IP
ipconfig
# Use IPv4 Address (e.g., 172.20.10.3)

# Set secret
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "http://172.20.10.3:3001"
```

**For Production (Deployed Backend):**
```powershell
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-backend-domain.com"
```

---

### Step 3: Verify Secret is Set

```powershell
eas secret:list
```

**Should show:**
```
EXPO_PUBLIC_NOTIFICATION_BACKEND_URL  [hidden]
```

---

### Step 4: Rebuild Preview Build

```powershell
eas build --platform android --profile preview
```

**Note:** Environment variables (EAS secrets) are baked into the build at build time, so you MUST rebuild after setting secrets.

---

### Step 5: Test Push Notifications

1. **Install the new preview build APK**
2. **Make sure backend is running** (if using local IP)
3. **Test sending a notification** (create announcement)
4. **Check logs** - should see successful backend connection

---

## 🔍 Verify It's Working

### Check Backend URL in Code

The code uses:
```javascript
const BACKEND_URL = process.env.EXPO_PUBLIC_NOTIFICATION_BACKEND_URL || 'http://localhost:3001';
```

**In preview build:**
- If EAS secret is set: `process.env.EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` = your secret value ✅
- If not set: defaults to `http://localhost:3001` ❌

### Test Connection

**In your app logs, you should see:**
- ✅ `Sending notification to backend: https://your-backend.com`
- ❌ NOT `Network error connecting to backend (http://localhost:3001)`

---

## 🐛 Troubleshooting

### Issue: "Still using localhost after setting secret"

**Fix:**
1. **Rebuild the app** - Secrets are baked in at build time
2. **Verify secret is set:** `eas secret:list`
3. **Check secret name** - Must be exactly: `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL`

---

### Issue: "Can't connect to local IP"

**Fix:**
1. **Make sure backend is running:** `cd backend && npm start`
2. **Check firewall** - Port 3001 must be open
3. **Verify same Wi-Fi network** - Device and computer must be on same network
4. **Test from device browser:** `http://YOUR_IP:3001/api/health`
5. **Consider deploying backend** - More reliable than local IP

---

### Issue: "Network request failed even with secret set"

**Fix:**
1. **Verify backend is accessible:**
   - If using deployed URL: Test in browser: `https://your-backend.com/api/health`
   - If using local IP: Test from device: `http://YOUR_IP:3001/api/health`

2. **Check backend logs** for connection attempts

3. **Verify secret value is correct:**
   ```powershell
   # Can't directly view secret value, but can verify it exists
   eas secret:list
   ```

4. **Rebuild after changing secret**

---

## 📝 Summary

**Why development works but preview doesn't:**
- Development builds: Can access `.env` file or Metro bundler
- Preview builds: Standalone APK, no `.env` file access

**The Fix:**
1. Set `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` as EAS secret
2. Use deployed backend URL (preferred) or local network IP (testing only)
3. Rebuild the preview build
4. Verify backend is accessible

**Key Point:** EAS secrets are included at build time, so you must rebuild after setting/updating secrets!

---

**Last Updated:** January 2025  
**Related Files:**
- `eas.json` - Build configuration
- `src/utils/notificationHelpers.js` - Backend URL configuration
- `START_BACKEND_SERVER.md` - Backend setup guide

