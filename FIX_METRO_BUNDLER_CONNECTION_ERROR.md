# 🔧 Fixing "There was a problem loading the project" Error

## ❌ Error You're Seeing

```
There was a problem loading the project.
This development build encountered the following error.
```

The development build can't connect to Metro bundler to load the JavaScript bundle.

---

## 🔍 Root Cause

The development build app on your device is trying to connect to Metro bundler (the JavaScript development server) but can't reach it. This happens because:

1. **Metro bundler is not running** (most common)
2. **Device can't reach the dev server** (network/Wi-Fi issues)
3. **Port forwarding not set up** (if using USB connection)

---

## ✅ Quick Fix Solutions

### Solution 1: Start Metro Bundler (Most Common Fix)

**The development build requires Metro bundler to be running.**

1. **Open a terminal** in your project directory:
   ```powershell
   cd C:\Users\Amasco DE-General\Desktop\G-pp3\G-app
   ```

2. **Start the development server:**
   ```powershell
   npm start
   ```
   
   Or with cache cleared:
   ```powershell
   npm start --clear
   ```

3. **Wait for Metro to start** - You should see:
   ```
   Metro waiting on exp://192.168.x.x:8081
   › Press a │ open Android
   › Press i │ open iOS simulator
   ```

4. **On your device:**
   - Open the development build app
   - It should automatically connect
   - Or tap "Reload" button if the app is already open

---

### Solution 2: Connect Device via Same Wi-Fi Network

**Make sure both your computer and Android device are on the same Wi-Fi network.**

1. **Check your computer's IP address:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **Check device Wi-Fi:**
   - Settings → Wi-Fi
   - Make sure you're on the **same network** as your computer

3. **Restart Metro with explicit IP:**
   ```powershell
   # Stop Metro (Ctrl+C if running)
   # Then start with your computer's IP
   npx expo start --host tunnel
   ```
   
   Or use LAN:
   ```powershell
   npx expo start --lan
   ```

4. **Connect device:**
   - The development build should auto-connect
   - Or manually enter the IP shown in Metro output

---

### Solution 3: Use USB Connection with Port Forwarding

**If Wi-Fi isn't reliable, use USB with ADB port forwarding:**

1. **Enable USB Debugging on your Android device:**
   - Settings → About Phone
   - Tap "Build Number" 7 times (enables Developer Options)
   - Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect device via USB** to your computer

3. **Install ADB** (Android Debug Bridge):
   - **Option A:** Install Android Studio (includes ADB)
   - **Option B:** Install platform-tools only: [Download](https://developer.android.com/studio/releases/platform-tools)

4. **Set up port forwarding:**
   ```powershell
   # Forward port 8081 (Metro's default port)
   adb reverse tcp:8081 tcp:8081
   ```

5. **Start Metro:**
   ```powershell
   npm start
   ```

6. **Open development build app** - Should connect automatically now

**Note:** You'll need to run `adb reverse tcp:8081 tcp:8081` every time you connect the USB cable.

---

### Solution 4: Use Tunnel Mode (Works Anywhere)

**If you're having network issues, use Expo's tunnel:**

1. **Start Metro in tunnel mode:**
   ```powershell
   npx expo start --tunnel
   ```
   
   ⚠️ **Note:** Tunnel mode requires an Expo account (free) and may be slower.

2. **Connect device:**
   - Development build should auto-connect
   - Or manually enter the URL shown in terminal

---

## 🧪 Step-by-Step Troubleshooting

### Step 1: Check if Metro is Running

**Look at your terminal** - You should see:
```
Metro waiting on exp://...
```

**If you don't see this:**
```powershell
# Start Metro
npm start
```

---

### Step 2: Check Device Connection

**On your development build app:**
- Look for connection status
- Try tapping "Reload" button
- Check if IP address matches your computer's IP

---

### Step 3: Test Connection

**From your device's browser (optional test):**
1. Get your computer's IP (from `ipconfig`)
2. Open browser on device
3. Navigate to: `http://YOUR_IP:8081/status`
4. Should see: `{"status":"ok"}`

**If this doesn't work:**
- Firewall blocking port 8081
- Devices not on same network
- IP address changed

---

### Step 4: Check Firewall

**Windows Firewall might be blocking Metro:**

1. **Open Windows Defender Firewall:**
   - Search "Firewall" in Start menu

2. **Allow Node.js through firewall:**
   - "Allow an app or feature"
   - Find "Node.js" and enable both Private and Public

3. **Or temporarily disable firewall** for testing (not recommended for production)

---

## 🔄 Daily Development Workflow

**Once fixed, here's your normal workflow:**

### Terminal 1: Start Metro
```powershell
npm start
```

### On Your Device:
1. Open the **development build app** (not Expo Go)
2. App should auto-connect to Metro
3. See your app load! ✅

**That's it!** Hot reload will work automatically.

---

## 🐛 Common Issues & Fixes

### Issue: "Metro bundler is not running"

**Fix:**
```powershell
npm start
```

---

### Issue: "Device can't connect even with same Wi-Fi"

**Fix - Use tunnel mode:**
```powershell
npx expo start --tunnel
```

---

### Issue: "Connection works but keeps disconnecting"

**Fix - Use USB with port forwarding:**
```powershell
# One-time setup per USB connection
adb reverse tcp:8081 tcp:8081

# Then start Metro normally
npm start
```

---

### Issue: "Metro shows wrong IP address"

**Fix - Restart with LAN mode:**
```powershell
# Stop Metro (Ctrl+C)
npx expo start --lan
```

---

## ✅ Quick Checklist

Before opening development build app:

- [ ] Metro bundler is running (`npm start`)
- [ ] Device and computer on same Wi-Fi (or USB connected)
- [ ] Port forwarding set up (if using USB: `adb reverse tcp:8081 tcp:8081`)
- [ ] Firewall allows Node.js
- [ ] Development build app installed on device (not Expo Go)

---

## 💡 Pro Tips

1. **Keep Metro running:** Keep the terminal with `npm start` open while developing
2. **Use USB for reliability:** More stable than Wi-Fi for development
3. **Add to PATH:** Add ADB to PATH so you can use `adb` from anywhere
4. **Alias command:** Create a PowerShell alias for quick port forwarding:
   ```powershell
   # Add to PowerShell profile
   function adb-forward { adb reverse tcp:8081 tcp:8081 }
   ```

---

## 📱 Development Build vs Expo Go

**Important:** Make sure you're using the **development build app**, not Expo Go!

- ✅ Development build app: Works with push notifications, needs Metro running
- ❌ Expo Go: Different app, push notifications don't work on Android (SDK 53+)

**How to tell:**
- Development build: Has your app's name/icon
- Expo Go: Has Expo logo, says "Expo Go"

---

## 🚀 Still Not Working?

1. **Check Metro logs** - Look for errors in terminal
2. **Restart everything:**
   - Stop Metro (Ctrl+C)
   - Close development build app
   - Restart Metro: `npm start --clear`
   - Reopen app
3. **Check Expo CLI version:**
   ```powershell
   npx expo --version
   ```
   Update if needed: `npm install -g expo-cli@latest`

---

**Last Updated:** January 2025  
**Related Files:**
- `FIX_EXPO_GO_PUSH_NOTIFICATION_ERROR.md` - Development build setup
- `QUICK_BUILD_REFERENCE.md` - Build commands

