# 🚀 Deployment Guide - Greater Works City Church App

Complete step-by-step guide to deploy your app to Android and iOS app stores.

---

## ⚠️ Important Notes Before Starting

**CRITICAL:** Before building your app, you **MUST** set up EAS secrets (Step 5). 

Environment variables from your local `.env` file are **NOT automatically included** in EAS builds. Without EAS secrets, your builds will fail with "Firebase configuration is missing" errors.

**Quick Solution:** Use the provided PowerShell script `.\setup-eas-secrets.ps1` after setting up your `.env` file.

**💡 Want to deploy FAST and FREE?** Consider deploying as a **PWA (Progressive Web App)** first! See Step 9.3 for details. PWA deployment is:
- ✅ FREE (no app store fees)
- ✅ Instant (no approval wait)
- ✅ Works on all devices (iOS, Android, Desktop)
- ✅ Users can install it like a native app
- ✅ Takes only 10-15 minutes to deploy

**For fastest deployment:** See `QUICK_DEPLOY.md` for a condensed 5-step guide, or deploy as PWA for instant access!

---

## 📋 Prerequisites Checklist

Before deploying, ensure you have:

- [x] ✅ Firebase configuration in `.env` file
- [ ] ⚠️ Expo account (create at https://expo.dev/signup)
- [ ] ⚠️ Logged into Expo (`eas login`)
- [ ] ⚠️ **EAS secrets configured** (use `.\setup-eas-secrets.ps1` - **CRITICAL!**)
- [ ] ⚠️ Google Play Console account (for Android - $25 one-time fee)
- [ ] ⚠️ Apple Developer account (for iOS - $99/year)
- [ ] ⚠️ EAS CLI installed (`npm install -g eas-cli`)
- [ ] ⚠️ Firebase security rules deployed

---

## 🔧 Step 1: Install EAS CLI

**Option A: Global Installation (Recommended)**
```bash
npm install -g eas-cli
```

**Option B: Use npx (if global install fails)**
```bash
npx eas-cli login
# Then use: npx eas-cli build ...
```

**Verify Installation:**
```bash
eas --version
```

---

## 🔐 Step 2: Login to Expo

```bash
eas login
```

You'll be prompted to:
1. Open a browser and log in to your Expo account
2. Authorize the CLI

**If you don't have an Expo account:**
- Visit: https://expo.dev/signup
- Create a free account
- Then run `eas login` again

---

## ⚙️ Step 3: Configure Project

The `eas.json` file is already configured! You have these build profiles:

- **development** - For internal testing
- **preview** - APK for Android testing
- **production** - For app store releases

**Verify your app.json settings:**
- ✅ App name: "Greater Works City Church"
- ✅ Bundle ID (iOS): com.gwcc.app
- ✅ Package (Android): com.gwcc.app
- ✅ Version: 1.0.0

---

## 🔥 Step 4: Verify Firebase Configuration

**IMPORTANT:** Make sure your `.env` file is properly configured:

1. Check `.env` file exists:
   ```bash
   Test-Path .env
   # Should return: True
   ```

2. Verify all Firebase variables are set:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

3. Test Firebase connection locally:
   ```bash
   npm start
   # Try to register/login in the app
   ```

---

## 🔑 Step 5: Set Up EAS Secrets (CRITICAL!)

**⚠️ IMPORTANT:** Environment variables from `.env` are **NOT automatically included** in EAS builds. You **MUST** set them as EAS secrets before building.

**Why?** EAS builds run in the cloud and don't have access to your local `.env` file. You need to configure secrets in EAS.

### Option A: Use Setup Script (Recommended - Windows PowerShell)

**✅ Already configured!** Use the provided PowerShell script:

```powershell
.\setup-eas-secrets.ps1
```

**What the script does:**
- ✅ Checks if `.env` file exists
- ✅ Verifies all Firebase variables are present
- ✅ Installs EAS CLI if needed
- ✅ Checks EAS login status
- ✅ Creates all EAS secrets automatically
- ✅ Handles errors and updates existing secrets

**Requirements:**
- Must be logged into EAS (`eas login`)
- `.env` file must exist and be configured

### Option B: Manual Setup

If the script doesn't work, set secrets manually:

```bash
# Create each secret individually
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-auth-domain"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-storage-bucket"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "your-measurement-id"
```

### Verify Secrets Are Set

```bash
eas secret:list
```

**Expected output:** Should show all 7 Firebase variables listed above.

**⚠️ Common Error:** If you build without setting EAS secrets, you'll get "Firebase configuration is missing" error in your build. **Always set secrets before building!**

---

## 🔒 Step 6: Deploy Firebase Security Rules

**CRITICAL:** Deploy Firestore security rules before production:

1. **Method 1: Using Firebase CLI**
   ```bash
   # Install Firebase CLI (if not installed)
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Deploy rules
   firebase deploy --only firestore:rules
   ```

2. **Method 2: Manual Deployment (Easier)**
   - Go to: https://console.firebase.google.com/
   - Select your project: `greater-works-city-churc-4a673`
   - Navigate to: Firestore Database → Rules
   - Copy content from `firestore.rules` file
   - Paste into Firebase Console
   - Click "Publish"

**Verify Rules:**
- Check that rules allow authenticated users to read/write their own data
- Admin users should have full access
- Public collections (sermons, events) should be readable by all

---

## 📱 Step 7: Build for Android

### 7.1: Preview Build (APK - for testing)

```bash
eas build --platform android --profile preview
```

This creates an APK file you can:
- Download and install directly on Android devices
- Share with testers
- Test before submitting to Play Store
- Install without Google Play Store (side-load)

**What to expect:**
1. EAS will ask: "Do you want to set up credentials now?" → Answer **"yes"** (first time only)
2. For credentials setup, you have two options:
   - **Option 1: Let EAS manage credentials** (Recommended)
     - EAS will create and manage your Android keystore automatically
     - EAS stores credentials securely in their cloud
     - No manual certificate management needed
     - Choose this if you're unsure
   - **Option 2: Provide your own keystore** (Advanced)
     - Upload your existing keystore file
     - Provide keystore password and key alias
     - Only use if you already have a keystore

3. **Build starts** - You'll see progress updates:
   ```
   Build started
   → Queued
   → Installing dependencies
   → Building app
   → Generating APK
   → Complete!
   ```

4. **Build time:** Usually 10-20 minutes (first build may take longer)

5. **Download link:** Provided in terminal and EAS dashboard

**Installation Instructions (for testers):**
- Download APK to Android device
- Go to Settings → Security → Enable "Install from Unknown Sources"
- Open downloaded APK file
- Tap "Install"
- Open app and test!

### 7.2: Production Build (AAB - for Play Store)

```bash
eas build --platform android --profile production
```

**What happens:**
1. EAS uploads your code
2. Builds the app in the cloud (takes 10-20 minutes)
3. Creates an Android App Bundle (AAB) file
4. Returns a download link when complete

**Build process:**
- You'll be asked if you want to set up credentials (first time only)
- Answer "yes" if this is your first build
- EAS will guide you through credential setup

**Important Notes:**
- **AAB vs APK:** Production builds create AAB (Android App Bundle) files, not APK files
  - AAB files are optimized for Play Store distribution
  - AAB files cannot be installed directly on devices (must upload to Play Store)
  - Use preview builds (APK) for direct installation and testing
- **Keystore:** EAS manages your keystore automatically (if you chose that option)
  - **IMPORTANT:** If EAS manages credentials, you won't have the keystore file locally
  - EAS securely stores it in the cloud
  - You can download it later if needed (see credentials management below)

### 7.3: Credential Management

**View your credentials:**
```bash
eas credentials
```

**Download keystore (if EAS managed):**
1. Run: `eas credentials`
2. Select your project
3. Choose Android platform
4. Select "Production" or "Preview"
5. Option to download keystore file

**Update credentials:**
```bash
eas build:configure
```
This will reconfigure your build settings and credentials.

**⚠️ IMPORTANT:** 
- **Never lose your keystore password!** If EAS manages it, you're safe
- **Always keep backups** if you manage your own keystore
- **Same keystore must be used** for app updates in Play Store
- If you lose the keystore, you'll need to create a new app listing in Play Store

### 7.4: Build Status & Monitoring

**Check build status:**
```bash
eas build:list
```

**View build in browser:**
- Terminal provides a build URL after starting
- Or visit: https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/builds

**What you can do:**
- View build logs (very helpful for debugging)
- Download completed builds
- Cancel running builds
- Retry failed builds
- View build details (size, version, etc.)

### 7.5: Common Build Issues & Solutions

**Issue: "Build failed - Install dependencies phase"**
- **Solution:** See troubleshooting section (Step 12) - usually related to package-lock.json
- **Quick fix:** Run `.\fix-build-dependencies.ps1` script

**Issue: "Firebase configuration is missing"**
- **Solution:** Make sure EAS secrets are set (Step 5)
- **Quick fix:** Run `.\setup-eas-secrets.ps1`

**Issue: "Invalid credentials"**
- **Solution:** Run `eas build:configure` again
- Or manually set up credentials in EAS dashboard

**Issue: "Bundle identifier already exists"**
- **Solution:** 
  - If it's your app: This is normal, continue
  - If it's another app: Change bundle ID in `app.json`
  - Format: `com.yourcompany.appname` (must be unique)

**Issue: Build takes too long (>30 minutes)**
- **Normal:** First build often takes 20-30 minutes
- **Check:** EAS dashboard for stuck builds
- **Action:** Wait, or cancel and retry if stuck

**Issue: "Out of memory" or "Build timeout"**
- **Solution:** Usually resolves on retry
- If persistent: Check for large files in project
- Ensure `.easignore` or `.gitignore` excludes unnecessary files

**Issue: "Failed to upload the project tarball to EAS Build" / "write ECONNRESET"**
- **Cause:** Network connection reset during upload phase
- **Solutions (try in order):**
  1. **Retry the build** (most common fix):
     ```bash
     eas build --platform android --profile preview
     ```
     Network issues are often temporary - retry usually works
  
  2. **Check your internet connection:**
     - Ensure stable internet connection (prefer wired over WiFi if possible)
     - Test connection: `ping google.com`
     - Try from a different network if available
  
  3. **Disable VPN/Proxy** (if using):
     - VPNs can interfere with uploads to Google Cloud Storage
     - Temporarily disable VPN and retry
  
  4. **Check firewall/antivirus:**
     - Temporarily disable firewall/antivirus
     - Add exception for Node.js/EAS CLI
     - Windows Firewall: Allow Node.js through firewall
  
  5. **Use a different network:**
     - Switch from WiFi to mobile hotspot (or vice versa)
     - Try from a different location
     - Corporate networks often block uploads
  
  6. **Reduce project size** (if retries fail):
     - Check `.easignore` file exists and excludes unnecessary files
     - Remove `node_modules` if accidentally included
     - Remove large media files from project
     - Run: `eas build --platform android --profile preview --clear-cache`
  
  7. **Increase timeout** (advanced):
     - Network uploads have timeouts
     - Try building during off-peak hours
     - Use EAS Build API directly if needed
  
  8. **Check EAS service status:**
     - Visit: https://status.expo.dev/
     - Check for known issues with EAS Build service
  
  **Most likely solution:** Simply retry the build command - network issues are usually temporary!

### 7.6: Optimizing Builds

**Faster builds:**
- EAS Build caching automatically speeds up subsequent builds
- Only changed files are re-uploaded
- Dependencies are cached

**Smaller build size:**
- Remove unused assets
- Optimize images (compress before adding)
- Remove development dependencies from production builds

**Build configuration:**
- Check `eas.json` for build settings
- Can customize Node version, build environment, etc.

### 7.7: Testing Your Build

**Before submitting to Play Store:**
1. ✅ Download the AAB file (production build)
2. ✅ Test the APK version first (preview build is easier to test)
3. ✅ Install on multiple Android devices/versions
4. ✅ Test all features:
   - Login/Registration
   - Firebase connection
   - Events loading
   - Sermons playing
   - All main features
5. ✅ Check for crashes
6. ✅ Verify app version in settings
7. ✅ Test on different screen sizes

**Only submit to Play Store after successful testing!**

---

## 🍎 Step 8: Build for iOS

### 8.1: Prerequisites

**Required for App Store submission:**
- Apple Developer account ($99/year) - [Sign up here](https://developer.apple.com/programs/)
- Xcode installed (for credential management)
- Bundle identifier registered in Apple Developer

**⚠️ Don't have an Apple Developer account yet?**

If you don't have an Apple Developer account ($99/year), you have these options:

1. **Build for Android first** (Recommended to start)
   - Android only requires a Google Play Console account ($25 one-time fee)
   - You can build and test immediately
   - See Step 6 above for Android builds

2. **Test on iOS devices using Expo Go** (Free)
   ```bash
   npm start
   # Then scan QR code with Expo Go app on iPhone
   ```
   - Works great for development and testing
   - No Apple Developer account needed
   - Limited features (some native modules may not work)

3. **Development builds for iOS** (Free for testing, but requires Apple Developer account)
   - You still need Apple Developer account for even development builds
   - Not an option without the account

4. **Wait until you have Apple Developer account**
   - You can proceed with Android deployment now
   - Set up iOS when you're ready to enroll

### 8.2: Production Build

```bash
eas build --platform ios --profile production
```

**First time setup:**
1. EAS will ask about credentials
2. You'll be prompted: "Do you want to log in to your Apple account?"
   - Choose `yes` if you want EAS to manage certificates automatically (recommended)
   - Choose `no` if you want to provide certificates manually
3. If you chose `yes`, enter your **Apple ID** (the email associated with your Apple Developer account)
4. You'll be prompted for your **Apple ID password**
5. If you have 2FA enabled (recommended), you'll need to provide a verification code

**What EAS needs:**
- Your Apple ID (email address)
- Password for your Apple Developer account
- Two-factor authentication code (if enabled)

**Build process:**
- Takes 15-30 minutes (first build may take longer)
- Creates an IPA file for App Store submission
- EAS will automatically generate and manage:
  - Distribution certificates
  - Provisioning profiles
  - App Store Connect API key (if needed)

**What to expect during build:**
1. **Build starts** - EAS uploads your code
2. **Queued** - Build waits for available builder
3. **Installing dependencies** - npm packages installed
4. **Building app** - Xcode build process
5. **Generating IPA** - Creating installable file
6. **Complete!** - Download link provided

### 8.3: Credential Management (iOS)

**View your credentials:**
```bash
eas credentials
```

**What EAS manages:**
- **Distribution Certificate:** Used to sign your app for App Store
- **Provisioning Profile:** Links your app to your Apple Developer account
- **App Store Connect API Key:** For automated submissions (optional)

**Manual credential management (advanced):**
If you prefer to manage credentials manually:
1. Generate certificates in Apple Developer portal
2. Download certificates to your Mac
3. Upload to EAS when prompted
4. Manage profiles manually in Apple Developer

**⚠️ IMPORTANT:** 
- **EAS-managed credentials are recommended** for most users
- **Manual management requires Mac with Xcode**
- **Certificates expire** - EAS handles renewal automatically
- **Keep Apple Developer account active** ($99/year required)

### 8.4: Bundle Identifier Setup

**Before building, ensure bundle ID is registered:**

1. **Check bundle ID in `app.json`:**
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.gwcc.app"
       }
     }
   }
   ```

2. **Register in Apple Developer Portal:**
   - Go to: https://developer.apple.com/account/resources/identifiers/list
   - Click "+" to add new identifier
   - Select "App IDs"
   - Enter bundle identifier: `com.gwcc.app`
   - Select capabilities (Push Notifications, if needed)
   - Register

3. **EAS can auto-register** (if you have proper permissions)
   - EAS will attempt to register bundle ID automatically
   - May require manual registration in Apple Developer portal

### 8.5: Common iOS Build Issues & Solutions

**Issue: "Invalid Apple ID or password"**
- **Solution:** Verify your Apple ID credentials
- **Note:** Use the email associated with your Apple Developer account
- **2FA:** Have your trusted device ready for verification code

**Issue: "Bundle identifier already exists"**
- **Solution:** 
  - If it's your app: This is normal, continue
  - If it's another developer's: Change bundle ID in `app.json`
  - Format: `com.yourcompany.appname` (must be unique)

**Issue: "Apple Developer account not enrolled"**
- **Solution:** You must enroll in Apple Developer Program ($99/year)
- **Sign up:** https://developer.apple.com/programs/
- **Enrollment:** Takes 24-48 hours for approval
- **Cannot build for App Store** without enrolled account

**Issue: "Provisioning profile not found"**
- **Solution:** EAS will auto-generate, but may need manual setup
- **Fix:** Run `eas build:configure` to reconfigure credentials
- **Or:** Create provisioning profile in Apple Developer portal

**Issue: "Certificate expired"**
- **Solution:** EAS usually handles renewal automatically
- **Manual:** Generate new certificate in Apple Developer portal
- **Update:** Run `eas credentials` to update certificates

**Issue: "Build failed - Code signing"**
- **Solution:** Usually certificate or provisioning profile issue
- **Fix:** Let EAS regenerate credentials by running `eas build:configure`
- **Check:** Ensure bundle ID matches in `app.json` and Apple Developer

**Issue: "Xcode version mismatch"**
- **Solution:** EAS uses latest stable Xcode version
- **Check:** Build logs will show Xcode version used
- **Update:** If needed, EAS will automatically use newer version

**Issue: "Build timeout"**
- **Normal:** iOS builds can take 20-30 minutes
- **Check:** EAS dashboard for stuck builds
- **Action:** Wait, or cancel and retry if stuck >45 minutes

### 8.6: TestFlight Distribution (Recommended Before App Store)

**TestFlight allows testing before App Store submission:**
- ✅ Up to 100 internal testers (immediate)
- ✅ Up to 10,000 external testers (requires beta review)
- ✅ Feedback collection
- ✅ Crash reports
- ✅ 90-day expiration (auto-renewal)

**Submit to TestFlight:**
```bash
eas submit --platform ios
```

**Or manually:**
1. Download IPA from EAS build
2. Use Transporter app (Mac) to upload
3. Or use Xcode → Window → Organizer
4. Upload to App Store Connect

**After upload:**
1. Go to App Store Connect → TestFlight
2. Select your build
3. Add testers (internal or external)
4. Send invitations
5. Testers install TestFlight app and your app

**Beta review (for external testers):**
- Apple reviews beta versions (usually 24-48 hours)
- Faster than App Store review
- Required for external testing

### 8.7: Testing Your iOS Build

**Before submitting to App Store:**
1. ✅ Test using TestFlight (recommended)
2. ✅ Install on multiple iOS devices/versions
3. ✅ Test all features:
   - Login/Registration
   - Firebase connection
   - Events loading
   - Sermons playing
   - All main features
4. ✅ Test on different screen sizes (iPhone SE, iPhone Pro Max, iPad)
5. ✅ Check for crashes
6. ✅ Verify app version in settings
7. ✅ Test with different iOS versions (if possible)

**Only submit to App Store after successful TestFlight testing!**

### 8.8: iOS Build Optimization

**Faster builds:**
- EAS Build caching speeds up subsequent builds
- Only changed files are re-uploaded
- Dependencies are cached

**Smaller build size:**
- Remove unused assets
- Optimize images (use WebP where possible)
- Remove development dependencies
- Enable code splitting (automatic with React Native)

**App Store Connect setup:**
- Complete App Store Connect listing before submission
- Upload screenshots (required for App Store)
- Add app description and metadata
- Configure pricing and availability

---

## 🌐 Step 9: Alternative Deployment Methods

Don't want to use app stores? Here are other ways to deploy your app:

### 9.1: Web Deployment (Free & Easy!)

Deploy your app as a website that works on any device. Your project already has web support configured! ✅

#### Option A: Deploy to Netlify (Recommended)

**Already configured!** You have `netlify.toml` and `build:web` script ready.

1. **Build web version:**
   ```bash
   npm run build:web
   ```

2. **Deploy to Netlify:**
   - Option 1: Via Netlify Dashboard
     - Go to https://app.netlify.com
     - Click "Add new site" → "Import an existing project"
     - Connect your Git repository
     - Build command: `npm run build:web`
     - Publish directory: `dist`
     - Add environment variables (all `EXPO_PUBLIC_*` variables)
   
   - Option 2: Via Netlify CLI
     ```bash
     npm install -g netlify-cli
     netlify login
     netlify deploy --prod
     ```

**Cost:** FREE for basic hosting  
**Benefits:** 
- Works on any device with a browser
- No app store approval needed
- Easy to update
- Can be shared via URL

See `NETLIFY_DEPLOYMENT_GUIDE.md` for detailed instructions.

#### Option B: Deploy to Vercel (Alternative to Netlify)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run build:web
   vercel
   ```

**Cost:** FREE for basic hosting

#### Option C: Deploy to Firebase Hosting (Since you're already using Firebase!)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize hosting:**
   ```bash
   firebase init hosting
   # Select your Firebase project
   # Public directory: dist
   # Configure as single-page app: Yes
   ```

3. **Build and deploy:**
   ```bash
   npm run build:web
   firebase deploy --only hosting
   ```

**Cost:** FREE for basic hosting  
**Benefits:** Uses same Firebase project, easy to manage

---

### 9.2: Direct APK Distribution (Android - No Play Store)

Distribute your Android app directly without Play Store approval.

1. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Download APK** from EAS build dashboard

3. **Share with users:**
   - Upload to your website
   - Share via email
   - Use a file sharing service (Google Drive, Dropbox)
   - Host on your own server

4. **Users install APK:**
   - Enable "Install from Unknown Sources" on Android
   - Download and install APK

**Pros:**
- ✅ No Google Play Console fee ($25 saved)
- ✅ No app store review process
- ✅ Full control over distribution
- ✅ Can update anytime

**Cons:**
- ⚠️ Users must enable unknown sources
- ⚠️ No automatic updates
- ⚠️ Less trust from users
- ⚠️ Not discoverable in app stores

**Best for:** Internal church use, beta testing, limited distribution

---

### 9.3: Progressive Web App (PWA) - **FREE & INSTANT!**

**✅ Already Configured!** Your app is fully set up as a PWA. This is the **easiest and fastest** way to get your app to users without app store approval!

**What's included:**
- ✅ Full PWA configuration in `app.json`
- ✅ Installable on phones, tablets, and desktops
- ✅ Works offline (service worker enabled)
- ✅ App-like experience (fullscreen, no browser UI)
- ✅ Custom app icon and splash screen
- ✅ Service worker for caching and offline support

#### **How PWA Works:**

Users visit your web URL and can "install" the app on their device:
- **Android:** "Add to Home Screen" banner appears automatically
- **iPhone/iPad:** Users tap Share → "Add to Home Screen"
- **Desktop:** Install button appears in browser address bar

After installation, the app:
- Appears as an icon on the home screen
- Opens fullscreen without browser UI (like a native app)
- Works offline for previously visited pages
- Updates automatically when you redeploy

#### **Quick Deployment (3 Steps):**

**Step 1: Build Web Version**
```bash
npm run build:web
```
This creates a `dist` folder with your PWA-ready app.

**Step 2: Test Locally (Optional but Recommended)**
```bash
# Install a simple server (if needed)
npm install -g http-server

# Serve the dist folder
cd dist
http-server -p 8080
```
Visit `http://localhost:8080` and test:
- Install prompt appears
- App works offline (enable offline mode in DevTools)
- All features work correctly

**Step 3: Deploy**

**Option A: Netlify (Recommended - Easiest)**
```bash
# Already configured! Just deploy:
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

**Or via Netlify Dashboard:**
1. Go to https://app.netlify.com
2. Drag and drop the `dist` folder
3. Add environment variables (all `EXPO_PUBLIC_*` from `.env`)
4. Your PWA is live!

**Option B: Firebase Hosting (Since you're already using Firebase)**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select: dist as public directory
# Configure as SPA: Yes
npm run build:web
firebase deploy --only hosting
```

**Option C: Vercel**
```bash
npm install -g vercel
npm run build:web
vercel --prod
```

#### **After Deployment:**

1. **Update Firebase Authorized Domains:**
   - Go to: Firebase Console → Authentication → Settings → Authorized domains
   - Add your deployed URL (e.g., `your-site.netlify.app`)

2. **Share with Users:**
   - Share the deployed URL
   - Users visit the URL on their device
   - They can install it like a native app!

#### **Benefits:**
- ✅ **FREE** - No app store fees
- ✅ **Instant** - Deploy immediately, no approval wait
- ✅ **Works everywhere** - Phones, tablets, desktops
- ✅ **Easy updates** - Just redeploy, users get updates automatically
- ✅ **No installation hassle** - Users visit URL and install
- ✅ **App-like experience** - Fullscreen, offline support
- ✅ **SEO friendly** - Search engines can index your app

#### **Limitations:**
- ⚠️ Some native features may have reduced functionality
- ⚠️ Users must manually install (not automatic like app stores)
- ⚠️ Requires internet connection for initial install
- ⚠️ iOS users must use Safari (Chrome on iOS doesn't support full PWA features)

#### **Testing Checklist:**
After deployment, verify:
- [ ] Visit deployed URL on mobile device
- [ ] Install prompt appears (or can be accessed via browser menu)
- [ ] App installs successfully
- [ ] App icon appears on home screen
- [ ] App opens fullscreen (no browser UI)
- [ ] Works offline (test by enabling airplane mode)
- [ ] Firebase features work (login, data loading)

**📚 For complete PWA setup and troubleshooting:** See `PWA_SETUP_GUIDE.md`

---

### 9.4: Internal Distribution (Enterprise/Organization)

For internal church use only.

#### Android Internal Distribution:

1. **Build APK** (as above)
2. **Distribute via:**
   - Google Play Private Channel (requires Google Workspace)
   - Internal file server
   - Email distribution
   - Church management system

#### iOS Internal Distribution (Requires Apple Developer account):

1. **Build for internal testing:**
   ```bash
   eas build --platform ios --profile development
   ```

2. **Distribute via:**
   - TestFlight (free, up to 100 testers)
   - Ad-hoc distribution (limited to 100 devices)
   - Enterprise distribution (requires Enterprise account - $299/year)

---

### 9.5: Alternative App Stores

#### For Android:

1. **Amazon Appstore:**
   - Free to submit
   - Used by Fire tablets and some Android devices
   - Same APK/AAB format

2. **Samsung Galaxy Store:**
   - Free to submit
   - Pre-installed on Samsung devices
   - Popular in certain regions

3. **F-Droid (Open Source):**
   - Free and open source
   - Your app must be open source

#### For iOS:

- Only App Store available (no alternatives on iOS)

---

### 9.6: Summary Comparison

| Method | Cost | iOS Support | Android Support | Approval Required | Update Speed | Best For |
|--------|------|-------------|-----------------|-------------------|--------------|----------|
| **PWA (Progressive Web App)** ⭐ | **FREE** | ✅ Installable | ✅ Installable | ❌ None | **Instant** | **Fastest deployment** |
| **Web (Netlify/Vercel)** | FREE | ✅ Browser | ✅ Browser | ❌ None | Instant | Quick web access |
| **Firebase Hosting** | FREE | ✅ Browser | ✅ Browser | ❌ None | Instant | If using Firebase |
| **Direct APK** | FREE | ❌ | ✅ | ❌ None | Instant | Android direct install |
| **Google Play Store** | $25 one-time | ❌ | ✅ | ✅ Review (1-3 days) | Slow | Wide Android reach |
| **Apple App Store** | $99/year | ✅ | ❌ | ✅ Review (1-3 days) | Slow | Wide iOS reach |
| **TestFlight (iOS)** | $99/year | ✅ | ❌ | ✅ Beta Review | Medium | iOS beta testing |

---

### 9.7: Recommended Strategy for Church App

**Phase 1: Deploy PWA First (FREE & FASTEST!) - Recommended ⭐**
1. ✅ **Deploy PWA to Netlify/Firebase** (FREE, instant, no approval needed)
   - Works on all devices (iOS, Android, Desktop)
   - Users can install like a native app
   - Full offline support
   - Update instantly anytime
   - **Time:** 10-15 minutes
   - **Cost:** FREE
   - **Best for:** Getting your app to users immediately!

2. ✅ **Share PWA URL with church members**
   - They visit URL and install
   - Works on any device with a browser
   - No app store needed

**Phase 2: Add Native App Distribution (Optional)**
1. 📱 **Build Android APK** for direct distribution (FREE, no store)
   - For users who prefer APK installation
   - Share via your website or email
   
2. 📱 **Submit to Google Play Store** ($25 one-time, wider reach)
   - Better discoverability
   - Automatic updates via Play Store
   - More trusted by users

3. 🍎 **Submit to Apple App Store** ($99/year, iOS users)
   - Required for iOS users who want native app
   - Better iOS experience than PWA
   - App Store visibility

**Phase 3: Optimize & Enhance**
1. 🌐 **Enhance PWA features** for better offline support
2. 📊 **Add analytics** to track usage and engagement
3. 🔔 **Implement push notifications** (works on PWA too!)
4. 🎨 **Improve UI/UX** based on user feedback

**💡 Pro Tip:** Start with PWA (Phase 1) to get your app live immediately, then add native apps (Phase 2) if needed for broader reach. PWA alone might be enough for many churches!

---

## ✅ Step 10: Verify Build Before Submission

**IMPORTANT:** Always test your build before submitting to app stores!

### Verify Android Build (APK/AAB)

1. **Download build from EAS dashboard:**
   - Go to: https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/builds
   - Find your build and click "Download"

2. **Test APK (Preview build):**
   - Install APK on Android device
   - Test all features:
     - ✅ User registration/login
     - ✅ Firebase connection works
     - ✅ Events load correctly
     - ✅ Sermons play
     - ✅ All features functional

3. **Only submit to store after successful testing!**

### Verify iOS Build (IPA)

1. **Test using TestFlight (Recommended):**
   ```bash
   eas submit --platform ios
   # This uploads to TestFlight
   ```
   - TestFlight allows up to 100 testers
   - Test for 1-2 days before App Store submission
   - Fix any issues found

2. **Or test with Ad-hoc distribution:**
   - Build with development profile
   - Install on registered devices

**⚠️ Never submit to App Store without testing first!**

---

## 📤 Step 11: Submit to App Stores

### Android (Google Play Store)

1. **Download the AAB file** from EAS build dashboard

2. **Go to Google Play Console:**
   - https://play.google.com/console

3. **Create a new app:**
   - App name: "Greater Works City Church"
   - Default language: English
   - App or game: App
   - Free or paid: Free

4. **Fill in store listing:**
   - App description
   - Screenshots (required)
   - Feature graphic (1024x500)
   - App icon (512x512)

5. **Upload AAB:**
   - Go to: Production → Create new release
   - Upload the AAB file
   - Add release notes
   - Review and rollout

6. **Complete store setup:**
   - Privacy policy (required)
   - Content rating
   - Target audience
   - Pricing and distribution

7. **Submit for review:**
   - Usually takes 1-3 days
   - Monitor for any issues

### iOS (App Store)

1. **Download the IPA file** from EAS build dashboard

2. **Submit using EAS (Recommended):**
   ```bash
   eas submit --platform ios
   ```

3. **Or upload manually:**
   - Use Transporter app (Mac)
   - Or Xcode → Window → Organizer
   - Upload IPA file

4. **Complete App Store Connect:**
   - App information
   - Screenshots (various sizes)
   - Description
   - Keywords
   - Support URL
   - Privacy policy URL

5. **Submit for review:**
   - Usually takes 1-3 days
   - May require additional information
   - Respond promptly to Apple

---

## 🔍 Step 12: Post-Build Verification

After building, verify everything works:

### Checklist:
- [ ] Download build from EAS dashboard
- [ ] Install on test device
- [ ] Test login/registration (verify Firebase works)
- [ ] Test all main features:
  - [ ] Events display correctly
  - [ ] Sermons play
  - [ ] Directory loads
  - [ ] Check-in works
  - [ ] Admin features work (if admin user)
  - [ ] Offline mode works
- [ ] Check for crashes or errors
- [ ] Verify app version is correct
- [ ] Test on multiple devices if possible

**Only proceed to store submission after successful verification!**

---

## 🎯 Quick Deployment Commands

**Build Android (Preview APK):**
```bash
npm run build:preview
# or
eas build --platform android --profile preview
```

**Build Android (Production AAB):**
```bash
npm run build:android
# or
eas build --platform android --profile production
```

**Build iOS (Production IPA):**
```bash
npm run build:ios
# or
eas build --platform ios --profile production
```

**Submit Android to Play Store:**
```bash
npm run submit:android
# or
eas submit --platform android
```

**Submit iOS to App Store:**
```bash
npm run submit:ios
# or
eas submit --platform ios
```

---

## 📊 Monitor Builds

View all your builds at:
- **EAS Dashboard:** https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/builds

You can:
- View build status
- Download builds
- View build logs
- Retry failed builds

---

## 🐛 Troubleshooting

### Build Fails

**Check:**
- ✅ All dependencies are installed: `npm install`
- ✅ `.env` file has valid Firebase credentials
- ✅ `app.json` has correct bundle identifiers
- ✅ Node version is compatible (20.19.4 or later for React Native 0.81.5)
- ✅ `package-lock.json` is in sync with `package.json` (run `npm ci` locally to verify)

**Common Errors:**

1. **"Firebase configuration is missing"**
   - Solution: Check `.env` file has all required variables
   - Restart: `npm start --clear`

2. **"Invalid credentials"**
   - Solution: Run `eas build:configure` again
   - Or manually set up credentials in EAS dashboard

3. **"Bundle identifier already exists"**
   - Solution: Use a different bundle ID in `app.json`
   - Or register it in Apple Developer / Google Play Console

4. **"Build failed - Install dependencies phase" or "Unknown error during dependency installation"**
   
   **🚀 Quick Fix: Use Diagnostic Script (Recommended - Windows PowerShell)**
   
   **✅ Already configured!** Use the provided PowerShell script to diagnose and fix automatically:
   ```powershell
   .\fix-build-dependencies.ps1
   ```
   
   **What the script does:**
   - ✅ Checks Node and npm versions
   - ✅ Verifies package-lock.json integrity
   - ✅ Tests `npm ci` locally (same as EAS uses)
   - ✅ Checks for Expo SDK version conflicts
   - ✅ Automatically regenerates package-lock.json if needed
   - ✅ Provides step-by-step fix instructions
   
   **Common causes and manual solutions:**
   
   - **Node version mismatch:** React Native 0.81.5 requires Node >= 20.19.4
     - **Solution:** Update `eas.json` to use Node `20.19.4` (already configured ✅)
   - **package-lock.json out of sync:** EAS uses `npm ci` which requires exact lock file match
     - **Solution (PowerShell):**
       ```powershell
       Remove-Item package-lock.json
       npm install
       git add package-lock.json
       git commit -m "Fix: Regenerate package-lock.json for EAS build"
       ```
     - **Or use the diagnostic script above** which does this automatically
   - **Missing packages in lock file:**
     - **Solution:** Run `npm ci` locally to verify all dependencies resolve correctly
     - The diagnostic script does this automatically
   - **Version conflicts:**
     - **Solution:** Use `npx expo install --check` to verify all Expo packages match SDK versions
     - The diagnostic script checks this too
   
   **Check build logs:** Visit the build URL shown in terminal for detailed error messages
   
   **Verify locally:** Always test `npm ci` locally before pushing to ensure lock file is valid
   
   **⚠️ Most common fix:** Regenerate package-lock.json using the diagnostic script above!

### Environment Variables Not Loading

**⚠️ CRITICAL:** This is the most common deployment issue!

**For EAS builds:**
- Environment variables from `.env` are **NOT automatically included**
- You **MUST** set them as EAS secrets before building
- See **Step 5** above for complete instructions

**Quick Fix:**
1. **Use the setup script (Recommended):**
   ```powershell
   .\setup-eas-secrets.ps1
   ```

2. **Or set manually:**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value your-key
   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value your-project-id
   # ... repeat for all 7 Firebase variables (see Step 5)
   ```

**Verify secrets are set:**
```bash
eas secret:list
```

**After setting secrets, rebuild your app.**

---

## 🔄 Updating the App

After making changes:

1. **Update version in `app.json`:**
   ```json
   {
     "expo": {
       "version": "1.0.1"  // Increment this
     }
   }
   ```

2. **Build new version:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit to stores:**
   ```bash
   eas submit --platform android
   ```

---

## 📝 Post-Deployment Checklist

After deployment:

- [ ] Monitor crash reports in Firebase Console
- [ ] Check app analytics
- [ ] Monitor user feedback
- [ ] Test on production build
- [ ] Announce app launch
- [ ] Train church staff on app usage
- [ ] Create user guide

---

## 🆘 Need Help?

**Resources:**
- Expo EAS Docs: https://docs.expo.dev/build/introduction/
- Firebase Console: https://console.firebase.google.com/
- EAS Support: https://forums.expo.dev/

**Quick Links:**
- EAS Dashboard: https://expo.dev
- Firebase Console: https://console.firebase.google.com/project/greater-works-city-churc-4a673
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

---

## 📚 Related Documentation

**For faster deployment:**
- 📄 `QUICK_DEPLOY.md` - Fast-track deployment guide (5 steps)
- 📄 `DEPLOYMENT_CHECKLIST.md` - Complete pre-deployment checklist
- 📄 `DEPLOYMENT_READINESS_ASSESSMENT.md` - Verify your app is ready

**For alternative deployment methods:**
- 📄 `NETLIFY_DEPLOYMENT_GUIDE.md` - Deploy as web app to Netlify (FREE)
- 📄 `PWA_SETUP_GUIDE.md` - Progressive Web App setup
- 📄 `DEPLOY_FIRESTORE_RULES.md` - Detailed Firebase rules deployment

**For setup and configuration:**
- 📄 `SETUP_GUIDE.md` - Initial project setup
- 📄 `SECURITY_SETUP_GUIDE.md` - Security configuration
- 📄 `VERIFY_ENV_SETUP.md` - Verify environment variables

---

## ✅ Deployment Status

Track your deployment progress:

- [ ] EAS CLI installed
- [ ] Logged into Expo (`eas login`)
- [ ] `.env` file configured with Firebase values
- [ ] **EAS secrets configured** (`.\setup-eas-secrets.ps1` or manually)
- [ ] Firebase rules deployed
- [ ] Android preview build created (APK)
- [ ] Android preview build tested and verified
- [ ] Android production build created (AAB)
- [ ] Android production build tested and verified
- [ ] Submitted to Google Play Store
- [ ] Google Play Store approval received
- [ ] iOS production build created (IPA)
- [ ] iOS production build tested (TestFlight or ad-hoc)
- [ ] Submitted to App Store
- [ ] App Store approval received
- [ ] App live on both stores

---

🎉 **Congratulations!** Your church app is ready to serve your community!

