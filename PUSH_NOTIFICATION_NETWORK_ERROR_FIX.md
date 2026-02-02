# 🔧 Fixing "Network request failed" Error for Push Notifications

## ❌ Error You're Seeing

```
Network request failed
```

This error occurs when the app tries to send push notifications through the backend API but cannot connect to the backend server.

---

## 🔍 Common Causes

### 1. **Backend Server Not Running** (Most Common)
The app is trying to connect to `http://localhost:3001/api/notifications/send`, but the backend server isn't running.

### 2. **Testing on Physical Device with Localhost**
If you're testing on a physical device (not an emulator), `localhost` won't work because it refers to the device itself, not your development computer.

### 3. **Wrong Backend URL Configuration**
The `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` environment variable might not be set correctly.

---

## ✅ Solutions

### Solution 1: Start the Backend Server

**If you're using a backend server for push notifications:**

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Verify it's running:**
   - Open your browser and go to: `http://localhost:3001/api/health`
   - You should see a response like: `{"status":"ok"}`

### Solution 2: Fix Localhost for Physical Devices

**If you're testing on a physical device (not an emulator/simulator):**

1. **Find your computer's IP address:**
   
   **On Windows:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).
   Example: `192.168.1.100`

   **On Mac/Linux:**
   ```bash
   ifconfig
   ```
   Or:
   ```bash
   ip addr show
   ```
   Look for your local network IP (usually starts with `192.168.` or `10.`).

2. **Create or update `.env` file in the root directory:**
   ```bash
   # In the root directory of your project (G-app/)
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://YOUR_IP_ADDRESS:3001
   ```
   
   Example:
   ```
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://192.168.1.100:3001
   ```

3. **Restart your Expo/React Native development server:**
   - Stop the current server (Ctrl+C)
   - Clear cache: `npx expo start -c`
   - Restart the app on your device

4. **Make sure both devices are on the same Wi-Fi network:**
   - Your computer and your physical device must be on the same Wi-Fi network

### Solution 3: Use Production Backend URL

**If you have a deployed backend server:**

1. **Create or update `.env` file:**
   ```
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=https://your-backend-domain.com
   ```
   
   Example:
   ```
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=https://my-app-backend.herokuapp.com
   ```

2. **Restart your development server:**
   ```bash
   npx expo start -c
   ```

### Solution 4: Skip Backend (Development Only)

**If you just want to test locally without a backend:**

The app will automatically fall back to local notifications in development mode if the backend is unavailable. However, this only sends notifications to the current device, not to all users.

**To disable backend completely in development:**

You can temporarily modify `src/utils/notificationHelpers.js` line 16:

```javascript
// Temporarily disable backend for testing
const BACKEND_URL = null; // or set to undefined
```

Then update the `sendPushNotificationToBackend` function to skip backend calls.

**Note:** This is NOT recommended for production. You need a backend server to send push notifications to all users.

---

## 🧪 Testing Steps

1. **Check if backend is accessible:**
   - On your computer: Open `http://localhost:3001/api/health` in a browser
   - On your device: Try opening `http://YOUR_IP:3001/api/health` in a mobile browser
   - Both should return: `{"status":"ok"}`

2. **Test notification sending:**
   - Try creating an announcement as an admin
   - Check the console logs for detailed error messages
   - The improved error handling will now show helpful messages

3. **Check environment variables:**
   ```bash
   # In your project root
   cat .env
   # or on Windows:
   type .env
   ```
   
   Make sure `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` is set correctly.

---

## 📝 Current Configuration

The app is currently configured to use:
- **Backend URL**: `http://localhost:3001` (default)
- **Environment Variable**: `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL`

You can check the current backend URL in:
- `src/utils/notificationHelpers.js` (line 16)
- Your `.env` file (if it exists)

---

## 🔍 Debug Information

**Check the console logs** - The improved error handling will now show:
- Whether it's a network error
- The backend URL being used
- Helpful tips if using localhost on a physical device
- Retry attempts being made

**Common log messages:**
```
⚠️ Network error connecting to backend (http://localhost:3001): Network request failed
💡 TIP: If testing on a physical device, replace "localhost" with your computer's IP address
💡 Or make sure your backend server is running: cd backend && npm start
```

---

## 🚀 Quick Fix Checklist

- [ ] Backend server is running (`cd backend && npm start`)
- [ ] Backend is accessible (`http://localhost:3001/api/health` works)
- [ ] If testing on physical device: `.env` file has correct IP address
- [ ] Both devices are on the same Wi-Fi network
- [ ] Restarted Expo server after changing `.env`
- [ ] Check console logs for detailed error messages

---

## 💡 Still Having Issues?

1. **Check firewall settings** - Make sure port 3001 isn't blocked
2. **Check network connectivity** - Ensure both devices can reach each other
3. **Try ping test** - From your device, try pinging your computer's IP
4. **Check backend logs** - Look at the backend server terminal for errors
5. **Review error messages** - The improved error handling should provide more details

---

**Last Updated:** January 2025  
**Related Files:**
- `src/utils/notificationHelpers.js` - Notification sending logic
- `backend/server.js` - Backend API server
- `.env` - Environment configuration (create if it doesn't exist)

