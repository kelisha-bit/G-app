# 🚀 Quick Guide: Start Backend Server for Push Notifications

## ✅ Problem Fixed

Your `.env` file is now configured with the correct backend URL:
```
EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://172.20.10.3:3001
```

## 📋 Next Steps

### Step 1: Start the Backend Server

**Open a NEW terminal window** (keep your current Metro terminal running):

```powershell
cd C:\Users\Amasco DE-General\Desktop\G-pp3\G-app\backend
npm start
```

**You should see:**
```
Server running on port 3001
Listening for push notification requests...
```

### Step 2: Restart Your Expo Dev Server

**In your Metro terminal:**
- Press `Ctrl+C` to stop Metro
- Restart with cache cleared:
  ```powershell
  npm start --clear
  ```

**Why?** The `.env` file is only loaded when the server starts, so you need to restart Metro to pick up the new backend URL.

### Step 3: Test Push Notifications

**Now try sending a push notification again:**
- Create an announcement
- Check the logs - you should see successful backend connection instead of "Network request failed"

---

## ✅ What Should Happen Now

**Before (what you saw):**
```
⚠️ Network error connecting to backend (http://localhost:3001): Network request failed
💡 TIP: If testing on a physical device, replace "localhost" with your computer's IP address
```

**After (what you should see):**
```
✅ Push notification sent successfully
📱 Notification sent to X devices
```

---

## 🔍 Troubleshooting

### If backend won't start:

1. **Check if port 3001 is already in use:**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Install backend dependencies (if needed):**
   ```powershell
   cd backend
   npm install
   ```

3. **Check backend logs** for errors

### If still getting network errors:

1. **Verify backend is running:**
   - Open browser: `http://localhost:3001/api/health`
   - Should see: `{"status":"ok"}`

2. **Verify device can reach your computer:**
   - From device browser: `http://172.20.10.3:3001/api/health`
   - Should see: `{"status":"ok"}`

3. **Check firewall:**
   - Windows Firewall might be blocking port 3001
   - Allow Node.js through firewall

---

## 💡 Pro Tip

**Keep two terminals open:**

**Terminal 1: Metro Bundler**
```powershell
npm start
```

**Terminal 2: Backend Server**
```powershell
cd backend
npm start
```

Both need to be running for push notifications to work! 🎯

---

**Last Updated:** January 2025

