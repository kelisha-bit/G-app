# 📱 How to Update APK with New Changes

This guide walks you through updating your Android APK app with all the latest changes (including Firestore rules updates).

---

## 🎯 Quick Steps Summary

1. **Deploy Firestore Rules** (if you made changes)
2. **Update Version Number** (recommended)
3. **Build New APK**
4. **Download & Install**

---

## 📋 Step-by-Step Instructions

### Step 1: Deploy Firestore Rules

Since you've been working on `firestore.rules`, deploy them to Firebase first:

**Option A: Using Firebase CLI (Recommended)**
```bash
firebase deploy --only firestore:rules
```

**Option B: Manual Deployment**
1. Go to: https://console.firebase.google.com/
2. Select your project: `greater-works-city-churc-4a673`
3. Navigate to: **Firestore Database** → **Rules**
4. Copy content from `firestore.rules` file
5. Paste into Firebase Console
6. Click **"Publish"**

---

### Step 2: Update Version Number (Recommended)

For app updates, it's good practice to increment the version number in `app.json`:

**Current version:** `1.0.0`

**Suggested updates:**
- **Patch update** (bug fixes, small changes): `1.0.1`
- **Minor update** (new features): `1.1.0`
- **Major update** (breaking changes): `2.0.0`

**To update:**
1. Open `app.json`
2. Change `"version": "1.0.0"` to the new version (e.g., `"1.0.1"`)
3. Save the file

---

### Step 3: Build New APK

Choose the build type based on your needs:

#### Option A: Preview Build (APK - for direct installation)

Creates an **APK file** that can be installed directly on Android devices:

```bash
npm run build:preview
```

Or directly:
```bash
eas build --platform android --profile preview
```

**Use this if:**
- ✅ You want to test the app directly
- ✅ You want to distribute APK files directly (not via Play Store)
- ✅ You want to share with testers quickly
- ✅ You want to install on devices without Play Store

**Build time:** 10-20 minutes

**What happens:**
1. EAS uploads your code
2. Builds the app in the cloud
3. Creates an APK file
4. Provides a download link

---

#### Option B: Production Build (AAB - for Play Store)

Creates an **AAB (Android App Bundle)** file for Google Play Store:

```bash
npm run build:android
```

Or directly:
```bash
eas build --platform android --profile production
```

**Use this if:**
- ✅ You're publishing to Google Play Store
- ✅ You want the optimized app bundle format
- ✅ You're doing an official release

**Important:** AAB files cannot be installed directly on devices - they must be uploaded to Play Store.

---

### Step 4: Monitor Build Progress

**Check build status:**
```bash
eas build:list
```

**View builds in browser:**
- Go to: https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/builds

**What to expect:**
- Build status updates in terminal
- Build queue (usually immediate)
- Installation of dependencies
- Building app (10-20 minutes)
- Completion notification with download link

---

### Step 5: Download & Install APK

**After build completes:**

1. **Download APK:**
   - Click the download link in terminal, OR
   - Go to EAS dashboard and download the APK file

2. **Install on Android Device:**
   - Transfer APK to Android device (email, cloud storage, USB)
   - On device: **Settings** → **Security** → Enable **"Install from Unknown Sources"**
   - Open the APK file
   - Tap **"Install"**
   - Open the app and test!

---

## 🔄 Updating Existing Installed App

If users already have the app installed:

### For Preview Builds (APK):
- **Same package name:** The new APK will replace the old app
- **Users install the new APK** (same as installing initially)
- **Data is preserved** (user accounts, settings, etc.)

### For Production Builds (Play Store):
- Upload AAB to Google Play Console
- Users get automatic updates via Play Store
- Or manual update if they have auto-update disabled

---

## ⚙️ Prerequisites

Before building, make sure you have:

1. **EAS CLI installed:**
   ```bash
   npm install -g eas-cli
   ```

2. **Logged into Expo:**
   ```bash
   eas login
   ```

3. **EAS Build configured:**
   ```bash
   eas build:configure
   ```
   (Usually only needed once)

---

## 🚨 Troubleshooting

### Build Fails?

1. **Check for errors in terminal**
2. **Verify all dependencies are installed:**
   ```bash
   npm install
   ```

3. **Check Firebase configuration:**
   - Ensure `firebase.config.js` is correct
   - Verify environment variables are set

4. **Clear cache and rebuild:**
   ```bash
   npm start -- --clear
   ```

### Credentials Issues?

If you get credential errors:

```bash
eas credentials
```

This lets you:
- View current credentials
- Set up new credentials
- Download keystore (if EAS-managed)

---

## 📝 Important Notes

1. **Version Numbers:**
   - Increment version for each update
   - Helps track app versions
   - Required for Play Store updates

2. **Firestore Rules:**
   - Must be deployed before building (rules are server-side)
   - App code doesn't include rules, but app uses them

3. **Build Time:**
   - First build: 15-25 minutes
   - Subsequent builds: 10-20 minutes
   - Depends on EAS server load

4. **Keystore:**
   - EAS manages keystore automatically (recommended)
   - Same keystore must be used for updates
   - Download backup if needed: `eas credentials`

5. **APK vs AAB:**
   - **APK (Preview):** Direct installation, testing
   - **AAB (Production):** Play Store distribution only

---

## 🎉 Quick Command Reference

```bash
# 1. Deploy Firestore Rules
firebase deploy --only firestore:rules

# 2. Build Preview APK (for direct installation)
eas build --platform android --profile preview

# 3. Build Production AAB (for Play Store)
eas build --platform android --profile production

# 4. Check build status
eas build:list

# 5. View credentials
eas credentials
```

---

## 💡 Tips

- **Test with preview build first** before doing production build
- **Keep version numbers sequential** (1.0.0 → 1.0.1 → 1.0.2)
- **Deploy Firestore rules before building** to ensure app works correctly
- **Download and test APK** on a real device before distributing
- **Keep build credentials safe** - EAS manages them automatically

---

Need help? Check:
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- Expo Docs: https://docs.expo.dev/build/introduction/

