# 🔄 How to Deploy an Update

Quick guide to deploy updates to your Greater Works City Church app.

---

## 📋 Before You Start

**Current Version:** 1.0.2 (check `app.json`)

**Choose your deployment method:**
- 🌐 **Web/PWA** - Fastest, FREE, instant updates
- 📱 **Android** - For Google Play Store or direct APK
- 🍎 **iOS** - For App Store

---

## 🌐 Option 1: Update Web App (Fastest - 5 minutes)

**Best for:** Quick updates, no app store approval needed

### Step 1: Update Version (Optional but Recommended)
```bash
# Edit app.json and increment version
# Current: "version": "1.0.2"
# New: "version": "1.0.3"
```

### Step 2: Build Web Version
```bash
npm run build:web
```

### Step 3: Deploy

**To Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**To Netlify:**
```bash
netlify deploy --prod --dir=web-build
```

**✅ Done!** Your web app is updated immediately.

---

## 📱 Option 2: Update Android App

### Step 1: Update Version in app.json
```json
{
  "expo": {
    "version": "1.0.3"  // Increment this
  }
}
```

### Step 2: Verify EAS Secrets (If First Time)
```bash
# Check if secrets are set
eas secret:list

# If missing, set them up
.\setup-eas-secrets.ps1
```

### Step 3: Build New Version

**Preview Build (APK for testing):**
```bash
npm run build:preview
# or
eas build --platform android --profile preview
```

**Production Build (AAB for Play Store):**
```bash
npm run build:android
# or
eas build --platform android --profile production
```

### Step 4: Test the Build
1. Download APK from EAS dashboard
2. Install on Android device
3. Test all features
4. Verify version number in app

### Step 5: Submit to Play Store (If Production Build)
```bash
npm run submit:android
# or
eas submit --platform android
```

**Or manually:**
1. Go to Google Play Console
2. Select your app
3. Go to Production → Create new release
4. Upload the AAB file
5. Add release notes
6. Submit for review

**⏱️ Timeline:** Build takes 10-20 minutes, Play Store review takes 1-3 days

---

## 🍎 Option 3: Update iOS App

### Step 1: Update Version in app.json
```json
{
  "expo": {
    "version": "1.0.3"  // Increment this
  }
}
```

### Step 2: Verify EAS Secrets
```bash
eas secret:list
```

### Step 3: Build New Version
```bash
npm run build:ios
# or
eas build --platform ios --profile production
```

### Step 4: Test with TestFlight (Recommended)
```bash
eas submit --platform ios
```

Then:
1. Go to App Store Connect → TestFlight
2. Add testers
3. Test for 1-2 days before App Store submission

### Step 5: Submit to App Store
```bash
npm run submit:ios
# or
eas submit --platform ios
```

**⏱️ Timeline:** Build takes 15-30 minutes, App Store review takes 1-3 days

---

## 🚀 Quick Update Commands

### Web Update (Fastest)
```bash
npm run build:web && firebase deploy --only hosting
```

### Android Update
```bash
# 1. Update version in app.json
# 2. Build
npm run build:android
# 3. Submit
npm run submit:android
```

### iOS Update
```bash
# 1. Update version in app.json
# 2. Build
npm run build:ios
# 3. Submit
npm run submit:ios
```

---

## ✅ Pre-Update Checklist

Before deploying any update:

- [ ] Test changes locally (`npm start`)
- [ ] Update version number in `app.json`
- [ ] Verify Firebase rules are deployed (if changed)
- [ ] Check that EAS secrets are set (for native builds)
- [ ] Test on multiple devices (if possible)
- [ ] Review changelog/release notes

---

## 🔍 Monitor Your Update

### Check Build Status
- **EAS Dashboard:** https://expo.dev
- View build logs, download builds, check status

### After Deployment
- [ ] Test on production build
- [ ] Monitor crash reports (Firebase Console)
- [ ] Check user feedback
- [ ] Verify all features work correctly

---

## 🐛 Troubleshooting Updates

### Build Fails with "Error: build command failed"?

**This is a generic error. Follow these steps:**

1. **Check EAS Dashboard for detailed logs:**
   - Go to: https://expo.dev
   - Navigate to your project → Builds
   - Click on the failed build to see detailed error logs
   - Look for specific error messages (missing dependencies, build errors, etc.)

2. **Verify EAS Secrets are configured:**
   ```bash
   # Check if secrets are set (new command)
   eas env:list
   
   # If empty or missing, set them up:
   .\setup-eas-secrets.ps1
   ```
   
   **Common issue:** The warning "No environment variables found for the 'preview' environment" indicates missing secrets. Your build needs Firebase configuration as EAS secrets.

3. **Clear cache and retry:**
   ```bash
   # Clear cache and retry
   npx expo start --clear
   eas build --platform android --profile preview --clear-cache
   ```

4. **Check for common build issues:**
   - Missing dependencies in `package.json`
   - Syntax errors in code
   - Version conflicts
   - Node version mismatch (should be 20.19.4 per `eas.json`)

### "Firebase configuration is missing"
```bash
# Set up EAS secrets
.\setup-eas-secrets.ps1
```

**Note:** Even if your `.env` file is correct, EAS builds don't automatically include it. You MUST set secrets using the script above.

### Version Already Exists Error
- **Solution:** Increment version number in `app.json`
- Play Store/App Store require unique version numbers

### Changes Not Showing?
- **Web:** Clear browser cache (Ctrl+Shift+Delete)
- **Native:** Uninstall old app and reinstall new build

---

## 📊 Update Strategy Recommendations

### For Quick Fixes (Hotfixes)
→ Use **Web/PWA** deployment (instant, no approval)

### For Feature Updates
→ Use **Native builds** (better performance, app store visibility)

### For Major Updates
→ Test with **Preview/TestFlight** first, then production

---

## 📝 Version Numbering

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

Current version: **1.0.2**

---

## 🆘 Need Help?

**Resources:**
- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Quick deploy: `QUICK_DEPLOY.md`
- Web updates: `UPDATE_WEB_APP_GUIDE.md`

**EAS Dashboard:** https://expo.dev
**Firebase Console:** https://console.firebase.google.com

---

**💡 Pro Tip:** For fastest updates, deploy to web first, then build native versions for app stores!





