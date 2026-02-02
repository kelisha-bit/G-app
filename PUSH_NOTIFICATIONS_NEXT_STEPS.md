# 🚀 Push Notifications - Next Steps to Get It Working

## ✅ What's Already Done

- ✅ Backend service created (`backend/` directory)
- ✅ Notification helpers updated to call backend API
- ✅ Mobile app notification service configured
- ✅ Environment files created (`.env` in backend)

---

## 📋 Step-by-Step Setup

### Step 1: Start the Backend Server

1. **Open a terminal** and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. **Start the server**:
   ```powershell
   npm start
   ```

   You should see:
   ```
   🚀 Push Notifications Backend running on port 3001
   📡 Environment: development
   🔗 Health check: http://localhost:3001/api/health
   ```

3. **Keep this terminal open** - the server needs to keep running.

---

### Step 2: Configure Mobile App Environment

1. **Open your root `.env` file** (in the main project directory, not backend)

2. **Add the backend URL**:
   ```env
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://localhost:3001
   ```

   **For production**, use your deployed backend URL:
   ```env
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=https://your-backend.herokuapp.com
   ```

3. **If you don't have a `.env` file**, create one in the root directory:
   ```powershell
   # In the root directory (G-app)
   @"
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://localhost:3001
   "@ | Out-File -FilePath .env -Encoding utf8
   ```

---

### Step 3: Restart Expo Server

**IMPORTANT**: You must restart Expo for environment variables to load.

1. **Stop your current Expo server** (Ctrl+C if running)

2. **Start it again with cache clear**:
   ```powershell
   npm start --clear
   ```

   The `--clear` flag ensures the new environment variable is loaded.

---

### Step 4: Test the Setup

#### Test 1: Verify Backend is Running

1. Open a browser and go to: `http://localhost:3001/api/health`
2. You should see:
   ```json
   {
     "status": "ok",
     "service": "push-notifications",
     "timestamp": "..."
   }
   ```

#### Test 2: Test on Physical Device

**⚠️ IMPORTANT**: Push notifications **DO NOT work** in simulators/emulators. You need a **physical device**.

**🚨 CRITICAL: Expo Go Limitation (SDK 53+)**

**Android push notifications DO NOT work in Expo Go** starting with Expo SDK 53. You **MUST** use a development build or production build to test Android push notifications.

**✅ RECOMMENDED METHOD: Development Build (No Android SDK needed!)**

1. **Install EAS CLI** (if not already installed):
   ```powershell
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```powershell
   eas login
   ```
   (Create a free account at https://expo.dev/signup if needed)

3. **Build a development build for Android**:
   ```powershell
   eas build --platform android --profile development
   ```

4. **Wait for build to complete** (10-20 minutes):
   - You'll get a download link when the build finishes
   - Or check status: `eas build:list`

5. **Install the APK on your device**:
   - Download the APK from the build link
   - Enable "Install from Unknown Sources" in Android Settings
   - Install the APK

6. **Start Expo server**:
   ```powershell
   npm start
   ```

7. **Open the development build app** on your device:
   - The app will connect to your Expo dev server
   - Scan the QR code if prompted

8. **Login to the app** - notification permission should be requested automatically

9. **Grant notification permission** when prompted

10. **Check Firebase** - Your push token should be saved in the user's document:
    - Go to Firebase Console → Firestore
    - Find your user document
    - Check for `pushTokens` array with your Expo push token

**Alternative: Preview Build (APK for testing)**
```powershell
# Build APK for Android (faster, but requires rebuild for code changes)
eas build --platform android --profile preview

# Then install the APK on your device
```

**Note**: 
- Development builds allow hot reloading and fast refresh (like Expo Go)
- Preview builds are standalone APKs (no hot reload, but faster to build)
- iOS: Expo Go still works for testing, but development builds are recommended for production-like testing

#### Test 3: Send a Test Notification

1. **Create an announcement** (as admin):
   - Go to Admin → Manage Announcements
   - Create a new announcement
   - The app should call the backend API to send notifications

2. **Check backend terminal** - You should see logs about sending notifications

3. **Check your device** - You should receive the push notification

---

## 🔧 Troubleshooting

### Backend Not Starting

**Error**: `Cannot find module 'expo-server-sdk'`
- **Solution**: Run `npm install` in the `backend/` directory

**Error**: Port already in use
- **Solution**: Change `PORT` in `backend/.env` to a different port (e.g., 3002)
- Update `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` in your root `.env` to match

### Notifications Not Sending

1. **Check backend is running**:
   - Visit `http://localhost:3001/api/health` in browser
   - Should return `{"status": "ok"}`

2. **Check environment variable**:
   - Verify `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` is in root `.env`
   - Restart Expo server with `--clear` flag

3. **Check device connection**:
   - If testing on physical device, make sure it's on the same network
   - For localhost, use your computer's IP address instead:
     ```env
     EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://192.168.1.XXX:3001
     ```
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

4. **Check Firebase tokens**:
   - Verify user has `pushTokens` array in Firestore
   - Tokens should start with `ExponentPushToken[` or `ExpoPushToken[`

5. **Check backend logs**:
   - Look for errors in the backend terminal
   - Check for invalid tokens or API errors

### Android Push Notifications Not Working in Expo Go

**Error**: `Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53`

**Solution**: 
- **Expo Go does NOT support Android push notifications in SDK 53+**
- You **MUST** use a development build or production build
- See "Test 2: Test on Physical Device" section above for development build instructions
- iOS: Expo Go still works, but development builds are recommended for production-like testing

### Permission Not Requested

1. **Clear app data** and reinstall
2. **Login again** - permission should be requested on login
3. **Manually check**: Go to Settings → Notifications in the app

### Backend Connection Error

**Error**: `Network request failed` or `fetch failed`

- **For physical device testing**:
  - Replace `localhost` with your computer's IP address
  - Example: `http://192.168.1.100:3001`
  - Make sure device and computer are on same WiFi network

- **For production**:
  - Make sure backend is deployed and accessible
  - Use HTTPS URL in production

---

## 🚢 Production Deployment

### Deploy Backend

1. **Deploy to Heroku/Railway/etc.**:
   ```bash
   cd backend
   # Follow deployment instructions in backend/README.md
   ```

2. **Update environment variable**:
   ```env
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=https://your-backend.herokuapp.com
   ```

3. **Rebuild app** with new environment variable

### Security Considerations

- ✅ Add authentication to backend endpoints (API keys, JWT)
- ✅ Use HTTPS in production
- ✅ Add rate limiting
- ✅ Configure CORS properly

---

## ✅ Verification Checklist

- [ ] Backend server running on port 3001
- [ ] Backend health check returns `{"status": "ok"}`
- [ ] `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` set in root `.env`
- [ ] Expo server restarted with `--clear` flag
- [ ] App installed on physical device (not simulator)
- [ ] Notification permission granted
- [ ] Push token saved in Firebase user document
- [ ] Test notification sent successfully

---

## 📚 Additional Resources

- **Backend Setup**: See `backend/README.md`
- **Complete Guide**: See `PUSH_NOTIFICATIONS_GUIDE.md`
- **Quick Setup**: See `BACKEND_SERVICE_SETUP.md`

---

## 🆘 Still Having Issues?

1. Check backend terminal for errors
2. Check Expo/Metro logs for errors
3. Verify Firebase configuration
4. Check device notification settings
5. Review `PUSH_NOTIFICATIONS_GUIDE.md` troubleshooting section

