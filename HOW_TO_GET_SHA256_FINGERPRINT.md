# 🔑 How to Get SHA-256 Certificate Fingerprint

## What is SHA-256 Certificate Fingerprint?

A **SHA-256 certificate fingerprint** is a unique identifier for your Android app's signing certificate. It's used by Google services (Firebase, Google Sign-In, OAuth) to verify your app's identity.

**Why you need it:**
- Firebase Android app configuration
- Google Sign-In setup
- OAuth authentication
- Google Maps API (if using)
- Other Google services integration

---

## 📱 Method 1: Get SHA-256 from Debug Keystore (Development)

### For Windows (PowerShell):

```powershell
# Navigate to Java bin directory (adjust path if needed)
cd "C:\Program Files\Java\jdk-*\bin"

# Get SHA-256 fingerprint from debug keystore
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**Or if keytool is in your PATH:**

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### For macOS/Linux:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**What to look for:**
- Look for the line: `SHA256: XX:XX:XX:XX:...`
- Copy the entire SHA-256 value (including colons)

---

## 🏭 Method 2: Get SHA-256 from Release/Production Keystore

If you're using a custom keystore (for production builds):

### Windows (PowerShell):

```powershell
keytool -list -v -keystore "path\to\your\keystore.jks" -alias your-key-alias
```

**You'll be prompted for:**
- Keystore password
- Key password (if different)

### macOS/Linux:

```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
```

**Note:** Replace:
- `path/to/your/keystore.jks` with your actual keystore path
- `your-key-alias` with your actual key alias

---

## 🚀 Method 3: Get SHA-256 from EAS Build (Recommended for Expo)

If you're using **Expo Application Services (EAS)** and let EAS manage your keystore:

### Step 1: Build your app with EAS

```bash
eas build --platform android --profile preview
```

### Step 2: After build completes, get the fingerprint

```bash
# View credentials
eas credentials

# Select: Android → Keystore
# The SHA-256 fingerprint will be displayed
```

### Step 3: Alternative - Extract from Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Release** → **Setup** → **App signing**
4. Find **"App signing key certificate"** section
5. Copy the **SHA-256 certificate fingerprint**

---

## 🔍 Method 4: Get SHA-256 from APK/AAB File

If you already have a built APK or AAB:

### Using keytool with APK:

```bash
# Extract certificate from APK
keytool -printcert -jarfile your-app.apk
```

### Using Java keytool with AAB:

```bash
# First, extract the certificate (AABs need to be extracted first)
# Use bundletool or extract manually, then:
keytool -printcert -file CERT.RSA
```

---

## 📋 Method 5: Get SHA-256 from Running App (Android)

If you have the app installed on a device:

### Using ADB:

```bash
# Connect device via USB
adb shell pm list packages | grep com.gwcc.app

# Get certificate fingerprint
adb shell pm dump com.gwcc.app | grep -A 5 "Signatures"
```

### Using Android Studio:

1. Open Android Studio
2. Connect your device
3. Go to **View** → **Tool Windows** → **Device File Explorer**
4. Navigate to `/data/data/com.gwcc.app/`
5. Check certificate files

---

## ✅ Where to Add SHA-256 Fingerprint

### For Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `greater-works-city-churc-4a673`
3. Click ⚙️ (gear icon) → **Project settings**
4. Scroll to **"Your apps"** section
5. Find your Android app (package: `com.gwcc.app`)
6. Click **"Add fingerprint"**
7. Paste your SHA-256 fingerprint
8. Click **"Save"**

### For Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click **Edit**
6. Add SHA-256 fingerprint under **"SHA certificate fingerprints"**
7. Click **Save**

---

## 🎯 Quick Reference: Common Locations

### Debug Keystore Location:

- **Windows:** `C:\Users\YourUsername\.android\debug.keystore`
- **macOS:** `~/.android/debug.keystore`
- **Linux:** `~/.android/debug.keystore`

### Default Debug Credentials:

- **Keystore password:** `android`
- **Key alias:** `androiddebugkey`
- **Key password:** `android`

---

## 🔧 Troubleshooting

### Error: "keytool: command not found"

**Solution:**
- Add Java JDK to your PATH
- Or use full path: `"C:\Program Files\Java\jdk-*\bin\keytool.exe"`

### Error: "Keystore was tampered with, or password was incorrect"

**Solution:**
- Make sure you're using the correct password
- For debug keystore, password is always `android`
- For production keystore, use the password you set when creating it

### Error: "Alias does not exist"

**Solution:**
- For debug keystore, alias is always `androiddebugkey`
- For production keystore, use the alias you set when creating it
- List aliases: `keytool -list -keystore your-keystore.jks`

### Can't find the SHA-256 line?

**Solution:**
- Make sure you use `-v` (verbose) flag: `keytool -list -v ...`
- Look for the line that starts with `SHA256:`
- It might be listed as `SHA-256` in some outputs

---

## 📝 Example Output

When you run the keytool command, you'll see something like:

```
Alias name: androiddebugkey
Creation date: Jan 1, 2024
Entry type: PrivateKeyEntry
Certificate chain length: 1
Certificate[1]:
Owner: CN=Android Debug, O=Android, C=US
Issuer: CN=Android Debug, O=Android, C=US
Serial number: 1234567890abcdef
Valid from: Mon Jan 01 00:00:00 UTC 2024 until: Mon Jan 01 00:00:00 UTC 2054
Certificate fingerprints:
     SHA1: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
     SHA256: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00
Signature algorithm name: SHA256withRSA
Subject Public Key Algorithm: 2048-bit RSA key
Version: 3
```

**Copy the SHA256 line** (the long string with colons).

---

## 🎓 Pro Tips

1. **Different fingerprints for debug vs production:**
   - Debug builds use the debug keystore
   - Production builds use your release keystore
   - You need to add **both** to Firebase if you test with both

2. **Multiple fingerprints:**
   - You can add multiple SHA-256 fingerprints to Firebase
   - Useful if you have multiple developers or build environments

3. **Keep your keystore safe:**
   - Production keystore is critical - lose it and you can't update your app
   - Back it up securely
   - Never commit it to git

4. **EAS managed keystores:**
   - If EAS manages your keystore, get the fingerprint from EAS credentials
   - Don't try to extract it manually

---

## 🔗 Related Documentation

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Google Sign-In Android Setup](https://developers.google.com/identity/sign-in/android/start)
- [EAS Credentials Documentation](https://docs.expo.dev/app-signing/managed-credentials/)

---

**Need Help?** If you're still having trouble, check:
- Your Java JDK installation
- Your keystore location and passwords
- Firebase Console for any error messages

