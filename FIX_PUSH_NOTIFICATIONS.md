# 🔧 Fix Push Notification Error - Quick Guide

## ✅ You're Ready to Build!

You have:
- ✅ EAS CLI installed (`eas-cli/16.28.0`)
- ✅ Logged in to Expo (`elishak`)
- ✅ EAS build profiles configured
- ✅ Error handling improved in code

---

## 🚀 Next Steps: Build Android Development Build

### Step 1: Build Development Build (Recommended for Testing)

This build allows you to test push notifications on a physical device.

```powershell
# Build development build for Android
eas build --platform android --profile development
```

**What happens:**
- Build runs in the cloud (10-20 minutes)
- You'll get a download link when complete
- Download the APK file
- Install on your Android device

**Alternative (faster for testing):**
```powershell
# Build preview APK (quicker build, still tests push notifications)
eas build --platform android --profile preview
```

---

### Step 2: Install APK on Your Device

1. **Download the APK** from the build link (emailed to you or shown in terminal)
2. **Transfer to your Android device** (via USB, email, or cloud storage)
3. **Enable "Install from Unknown Sources"** on your device:
   - Go to Settings → Security → Enable "Unknown Sources" or "Install unknown apps"
   - Or when installing, tap "Settings" and enable for your file manager
4. **Install the APK** by tapping it on your device
5. **Open the app** - it will look like a standalone app (not Expo Go)

---

### Step 3: Test Push Notifications

1. **Start your Expo dev server** (in a terminal):
   ```powershell
   npm start
   ```

2. **Open the app** on your device (the one you just installed, NOT Expo Go)

3. **Connect to dev server**:
   - The app should automatically connect, OR
   - Open the app menu (shake device or press menu button)
   - Enter the URL manually if needed

4. **Login to your app**

5. **Enable push notifications**:
   - Go to Settings → Notifications
   - Toggle on "Push Notifications"
   - Grant permission when prompted

6. **Test it!** Push notifications should now work! 🎉

---

## 📱 What Changed?

### Before (Expo Go - Not Working ❌):
- Running in Expo Go app
- Android push notifications **don't work** in SDK 53+
- Error: "Failed to register for push notifications"

### After (Development Build - Working ✅):
- Running in your own built app
- Android push notifications **work perfectly**
- Push notification registration succeeds

---

## 🔄 Future Development Workflow

### Option A: Use Development Build (Recommended)
```powershell
# 1. Build once (takes 10-20 minutes)
eas build --platform android --profile development

# 2. Install on device

# 3. Start dev server
npm start

# 4. Open your development build app on device
# 5. Make code changes - they hot reload automatically!
```

### Option B: Use Preview Build (Quick Testing)
```powershell
# Build preview APK (faster, but requires full rebuild for code changes)
eas build --platform android --profile preview

# Install APK
# Test push notifications
```

---

## 🐛 Troubleshooting

### "Build failed" or errors during build
- Check that your `app.json` is valid
- Ensure you're logged in: `eas whoami`
- Check EAS build logs in the terminal

### "App won't connect to dev server"
- Make sure phone and computer are on same Wi-Fi network
- Check firewall isn't blocking connections
- Try using tunnel mode: `npm start --tunnel`

### "Push notifications still not working"
1. **Check device permissions**:
   - Settings → Apps → Your App → Notifications → Enabled

2. **Check the error message**:
   - The improved error handling will show the specific issue
   - Look in console logs for detailed errors

3. **Verify build type**:
   - Make sure you're using the development build app (not Expo Go)
   - Check app icon - should be your app icon, not Expo Go icon

4. **Check internet connection**:
   - Push token registration needs internet
   - Try on Wi-Fi and mobile data

---

## 📋 Quick Command Reference

```powershell
# Build development build (for testing with hot reload)
eas build --platform android --profile development

# Build preview APK (quick test)
eas build --platform android --profile preview

# Build production APK/AAB (for release)
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view

# Start dev server
npm start

# Start dev server with tunnel (if Wi-Fi issues)
npm start --tunnel
```

---

## ✅ Success Checklist

After building and installing:
- [ ] Development build APK installed on device
- [ ] App opens (not Expo Go)
- [ ] Can login to app
- [ ] Can navigate through app
- [ ] Push notification permission prompt appears
- [ ] Permission granted
- [ ] Push notification toggle works in Settings
- [ ] No "failed to register" error
- [ ] Push token registered successfully

---

## 🎯 Next Steps After Push Notifications Work

1. **Test local notifications** (event reminders)
2. **Test server-side push notifications** (if you have backend set up)
3. **Build production build** when ready to release:
   ```powershell
   eas build --platform android --profile production
   ```

---

**Need help?** The app now shows detailed error messages - check the error when enabling push notifications for specific guidance!

