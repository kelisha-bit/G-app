# 🤖 Android SDK Setup (Optional)

## ⚠️ Important: Expo Go Limitation (SDK 53+)

**Android push notifications DO NOT work in Expo Go** starting with Expo SDK 53. You **MUST** use a development build or production build to test Android push notifications.

---

## Option 1: Development Build (Recommended for Testing)

**No Android SDK needed!** This is the recommended method for testing push notifications.

1. **Install EAS CLI** (if not already installed):
   ```powershell
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```powershell
   eas login
   ```
   (Create a free account at https://expo.dev/signup if needed)

3. **Build a development build**:
   ```powershell
   eas build --platform android --profile development
   ```

4. **Wait for build to complete** (10-20 minutes) and install the APK on your device

5. **Start Expo server**:
   ```powershell
   npm start
   ```

6. **Open the development build app** on your device and scan the QR code

7. **Test push notifications** - They work in development builds!

---

## Option 2: Build with EAS (For Production)

**No Android SDK needed on your computer!**

1. **Build APK with EAS**:
   ```powershell
   eas build --platform android --profile preview
   ```

2. **Install APK** on your device

3. **Test push notifications**

---

## Option 3: Set Up Android SDK (If You Want Local Development)

### Step 1: Install Android Studio

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional, for emulator)

### Step 2: Set Environment Variables

**Windows PowerShell (Run as Administrator):**

```powershell
# Find your Android SDK path (usually):
# C:\Users\YourName\AppData\Local\Android\Sdk

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\Amasco DE-General\AppData\Local\Android\Sdk', 'User')

# Add to PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$sdkPath = 'C:\Users\Amasco DE-General\AppData\Local\Android\Sdk'
$platformTools = Join-Path $sdkPath 'platform-tools'
$tools = Join-Path $sdkPath 'tools'
$toolsBin = Join-Path $sdkPath 'tools\bin'

$newPath = $currentPath
if ($newPath -notlike "*$platformTools*") {
    $newPath += ";$platformTools"
}
if ($newPath -notlike "*$tools*") {
    $newPath += ";$tools"
}
if ($newPath -notlike "*$toolsBin*") {
    $newPath += ";$toolsBin"
}

[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
```

**After setting environment variables:**
1. **Close and reopen** your terminal/PowerShell
2. **Restart your computer** (recommended to ensure variables load)

### Step 3: Verify Installation

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME

# Check adb
adb version
```

### Step 4: Accept Android Licenses

```powershell
cd $env:ANDROID_HOME
.\cmdline-tools\latest\bin\sdkmanager --licenses
# Type 'y' to accept all licenses
```

---

## ✅ Quick Test Without Android SDK

**For push notification testing, use a development build:**

1. **Build development build** (one-time setup):
   ```powershell
   eas build --platform android --profile development
   ```

2. **Install the APK** on your device

3. **Start backend server** (in one terminal):
   ```powershell
   cd backend
   npm start
   ```

4. **Start Expo** (in another terminal):
   ```powershell
   npm start
   ```

5. **Open the development build app** on your phone and scan QR code

6. **Test push notifications** - They work perfectly in development builds!

---

## 🎯 Recommendation

**For push notification testing**: Use **Development Build** - required for Android push notifications in SDK 53+

**For production builds**: Use **EAS Build** - it builds in the cloud, no local SDK needed.

**For local Android development**: Set up Android SDK (Option 3 above).

**Note**: iOS push notifications still work in Expo Go, but development builds are recommended for production-like testing.

