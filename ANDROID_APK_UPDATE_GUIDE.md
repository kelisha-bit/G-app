# 📱 Android APK Update Guide

This guide explains how to build and update your Android APK after making changes to your app.

---

## 🚀 Quick Start

After making changes to your app, follow these steps:

### Step 1: Update Version Number

**Important:** Always increment the version number before building a new APK.

1. Open `app.json`
2. Update the `version` field:
   ```json
   {
     "expo": {
       "version": "1.0.2",  // Increment from 1.0.1
       ...
     }
   }
   ```

**Version Format:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes (1.0.0 → 2.0.0)
- **MINOR:** New features (1.0.1 → 1.1.0)
- **PATCH:** Bug fixes (1.0.1 → 1.0.2)

---

### Step 2: Build the APK

You have two options depending on your needs:

#### Option A: Preview Build (APK - for testing/distribution)

**Use this for:**
- Testing on devices
- Sharing with users directly (side-loading)
- Quick updates without Play Store

```bash
npm run build:preview
```

Or directly:
```bash
eas build --platform android --profile preview
```

**What happens:**
- Builds an APK file (installable directly on Android)
- Takes 10-20 minutes
- Provides download link when complete
- Can be installed without Google Play Store

#### Option B: Production Build (AAB - for Play Store)

**Use this for:**
- Submitting to Google Play Store
- Official app updates

```bash
npm run build:android
```

Or directly:
```bash
eas build --platform android --profile production
```

**What happens:**
- Builds an AAB file (Android App Bundle)
- Takes 10-20 minutes
- Must be uploaded to Play Store (cannot install directly)
- Optimized for Play Store distribution

---

### Step 3: Monitor Build Progress

**Check build status:**
```bash
eas build:list
```

**View in browser:**
- Visit: https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/builds
- Or check the link provided in terminal after starting build

**Build stages:**
1. ✅ Queued
2. ⏳ Installing dependencies
3. 🔨 Building app
4. 📦 Generating APK/AAB
5. ✅ Complete!

---

### Step 4: Download and Distribute

#### For Preview Builds (APK):

1. **Download APK:**
   - Click download link from EAS dashboard
   - Or use: `eas build:list` to see download URLs

2. **Install on Device:**
   - Transfer APK to Android device
   - Enable "Install from Unknown Sources" in Settings → Security
   - Tap APK file to install
   - Open app and test!

3. **Share with Users:**
   - Upload to your website
   - Share via email/WhatsApp
   - Use Google Drive/Dropbox
   - Host on your server

#### For Production Builds (AAB):

1. **Download AAB:**
   - Download from EAS dashboard
   - File will be named: `app-release.aab`

2. **Upload to Play Store:**
   ```bash
   npm run submit:android
   ```
   Or manually:
   - Go to Google Play Console
   - Select your app
   - Go to "Production" → "Create new release"
   - Upload the AAB file
   - Fill in release notes
   - Submit for review

---

## 📋 Complete Update Workflow

Here's the complete process from making changes to distributing:

```bash
# 1. Make your code changes
# ... edit your files ...

# 2. Update version in app.json
# (Edit app.json manually - increment version number)

# 3. Build APK for testing
npm run build:preview

# 4. Wait for build to complete (10-20 min)
# Check status: eas build:list

# 5. Download APK from EAS dashboard
# 6. Test on device
# 7. If everything works, build production version
npm run build:android

# 8. Submit to Play Store (if needed)
npm run submit:android
```

---

## 🔄 Updating Existing APK

When updating an existing APK that users already have installed:

### Important Considerations:

1. **Version Number:**
   - Must be higher than previous version
   - Users will see update notification if version increases

2. **Package Name:**
   - Must stay the same (`com.gwcc.app`)
   - Changing package name creates a new app (users can't update)

3. **Keystore:**
   - Must use the same keystore as previous build
   - EAS manages this automatically if you let it handle credentials
   - **Never lose your keystore!** You can't update the app without it

4. **Permissions:**
   - Can add new permissions (users will be prompted)
   - Removing permissions may break existing functionality

---

## 🛠️ Troubleshooting

### Build Fails

**Check:**
```bash
# View detailed build logs
eas build:list
# Click on failed build to see logs
```

**Common issues:**
- Version number not incremented → Increment in `app.json`
- Missing dependencies → Run `npm install`
- EAS not logged in → Run `eas login`
- Credentials issue → Run `eas credentials`

### APK Won't Install

**Solutions:**
- Enable "Install from Unknown Sources" in Android settings
- Uninstall old version first (if package name changed)
- Check Android version compatibility (minimum SDK)
- Try downloading APK again (may be corrupted)

### Version Conflicts

**If users can't update:**
- Ensure version number is higher than previous
- Ensure package name matches exactly
- Ensure using same keystore (EAS handles this automatically)

---

## 📝 Version Management Best Practices

1. **Always increment version before building**
2. **Use semantic versioning:** `MAJOR.MINOR.PATCH`
3. **Document changes in release notes**
4. **Test preview build before production**
5. **Keep track of versions in a changelog**

**Example version progression:**
```
1.0.0 → Initial release
1.0.1 → Bug fixes
1.0.2 → More bug fixes
1.1.0 → New features
1.1.1 → Bug fixes for new features
2.0.0 → Major update/breaking changes
```

---

## 🎯 Quick Reference Commands

```bash
# Build APK for testing
npm run build:preview

# Build AAB for Play Store
npm run build:android

# Check build status
eas build:list

# View credentials
eas credentials

# Submit to Play Store
npm run submit:android

# Login to EAS
eas login

# Configure build settings
eas build:configure
```

---

## 📚 Additional Resources

- **EAS Build Dashboard:** https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/builds
- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Android App Bundle Guide:** https://developer.android.com/guide/app-bundle
- **Google Play Console:** https://play.google.com/console

---

## ⚠️ Important Notes

1. **Keystore Security:**
   - EAS manages your keystore automatically (recommended)
   - If you manage your own, **back it up securely**
   - Losing keystore = cannot update app in Play Store

2. **Build Time:**
   - First build: 15-25 minutes
   - Subsequent builds: 10-20 minutes
   - Depends on EAS server load

3. **Build Limits:**
   - Free EAS plan: Limited builds per month
   - Paid plans: More builds available
   - Check your plan at: https://expo.dev/accounts/[your-account]/settings/billing

4. **Testing:**
   - Always test preview build before production
   - Test on multiple Android versions if possible
   - Check all features work correctly

---

## ✅ Update Checklist

Before building a new APK:

- [ ] Code changes completed and tested locally
- [ ] Version number incremented in `app.json`
- [ ] All dependencies installed (`npm install`)
- [ ] No linter errors
- [ ] Tested in development mode
- [ ] Release notes prepared (if needed)
- [ ] EAS CLI installed and logged in (`eas login`)
- [ ] Ready to build!

---

**Need help?** Check the main `DEPLOYMENT_GUIDE.md` for more detailed information.

