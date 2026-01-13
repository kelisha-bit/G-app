# 🌐 Build Web Version with PWA - Quick Guide

Your app is already configured as a Progressive Web App (PWA)! Here's how to build and deploy it.

---

## ✅ What's Already Set Up

- ✅ PWA configuration in `app.json`
- ✅ Manifest file (`public/manifest.json`)
- ✅ Service worker (`public/service-worker.js`)
- ✅ Build script (`npm run build:web`)
- ✅ Netlify configuration (`netlify.toml`)

---

## ⚠️ Current Build Status

**Note:** The project uses Expo SDK 54. Static export has compatibility issues with both Metro and Webpack bundlers.

**Current Options:**
1. **Development Server** ✅ (Works perfectly) - Use `npm start` then press 'w' for web
2. **Static Export** ⚠️ (Has issues) - `npm run build:web` encounters module resolution errors

**Recommendation:** Use the development server for testing and development. For production deployment, consider using Expo's hosting service or building through EAS Build.

---

## 🚀 Quick Build Steps

### Step 1: Build Web Version

**Option A: Development Server (For Testing)**
```bash
npm start
# Then press 'w' for web, or run:
npx expo start --web
```

**Option B: Static Export (Currently Has Issues)**
```bash
npm run build:web
# Or directly:
npx expo export:web
```

**⚠️ Current Status:** Static export is encountering module resolution errors with both Metro and Webpack bundlers in Expo SDK 54. This is a known compatibility issue.

**Workaround:** For production deployment, you can:
1. Use the development server and deploy the running instance (not ideal for production)
2. Use Expo's hosting service: `npx expo publish`
3. Build through EAS Build for web platform
4. Wait for Expo SDK updates that fix the export issues

**Note:** The development server (`npm start` then press 'w') works perfectly and is recommended for testing and development.

---

### Step 2: Test Locally (Optional but Recommended)

Before deploying, test the build locally:

```bash
# Install a local server (if not installed)
npm install -g http-server

# Serve the build folder
cd dist
http-server -p 8080
```

Or use Python (if installed):
```bash
cd dist
python -m http.server 8080
```

Or use npx (no installation needed):
```bash
cd dist
npx serve -p 8080
```

Then open: **http://localhost:8080**

**Test PWA features:**
1. Open DevTools (F12)
2. Go to **Application** tab → **Manifest** (verify settings)
3. Check **Service Workers** (should be registered)
4. Test install prompt (mobile: "Add to Home Screen", desktop: install icon in address bar)

---

### Step 3: Deploy

Choose one of these deployment options:

---

## 📤 Deployment Options

### Option A: Netlify (Recommended - Easiest)

**Already configured!** Your `netlify.toml` is ready.

#### Method 1: Via Netlify Dashboard (Easiest)

1. **Build the app:**
   ```bash
   npm run build:web
   ```

2. **Go to Netlify:**
   - Visit: https://app.netlify.com
   - Sign up/Login (free)

3. **Deploy:**
   - Drag and drop the `dist` folder onto Netlify dashboard
   - OR: Click "Add new site" → "Import an existing project"
   - Connect your Git repository (GitHub/GitLab/Bitbucket)
   - Build command: `npm run build:web`
   - Publish directory: `dist`
   - Click "Deploy site"

4. **Add Environment Variables:**
   - Go to: Site settings → Environment variables
   - Add all your Firebase variables (must start with `EXPO_PUBLIC_*`):
     - `EXPO_PUBLIC_FIREBASE_API_KEY`
     - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
     - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `EXPO_PUBLIC_FIREBASE_APP_ID`
     - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

5. **Redeploy** after adding environment variables:
   - Go to: Deploys → Trigger deploy → Clear cache and deploy site

**Your PWA will be live at:** `https://your-site-name.netlify.app`

---

#### Method 2: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build first
npm run build:web

# Deploy (first time - sets up site)
netlify deploy --prod

# Future deployments
netlify deploy --prod
```

**Note:** Environment variables should be set via Netlify Dashboard (see Method 1, Step 4)

---

### Option B: Firebase Hosting (You're Already Using Firebase!)

Since you're using Firebase, you can host the PWA there:

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Initialize Hosting (if not done):**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `dist` (or `web-build`)
   - Configure as single-page app: **Yes**
   - Set up automatic builds: No (or Yes if you want)

4. **Build and Deploy:**
   ```bash
   npm run build:web
   firebase deploy --only hosting
   ```

**Your PWA will be live at:** `https://your-project-id.web.app`

**Add Firebase authorized domains:**
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add your hosting domain (if not already added)

---

### Option C: Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Build
npm run build:web

# Deploy
vercel --prod
```

**Add environment variables via Vercel Dashboard:**
- Go to: Project Settings → Environment Variables
- Add all `EXPO_PUBLIC_*` variables

### Option D: Expo Hosting (Recommended for Static Export Issues)

Since static export has issues, Expo's hosting service is a good alternative:

```bash
# Install Expo CLI (if not installed)
npm install -g expo-cli

# Publish to Expo hosting
npx expo publish
```

This will:
- Build and deploy your web app automatically
- Handle all the bundling and optimization
- Provide a URL for your PWA
- Work around the static export issues

**Note:** This requires an Expo account (free tier available).

---

## 📱 How Users Install Your PWA

After deployment, users can install your app:

### On Android (Chrome):
1. Visit your PWA URL
2. Look for "Add to Home Screen" banner at bottom
3. Tap "Add" or "Install"
4. App icon appears on home screen

### On iPhone/iPad (Safari):
1. Visit your PWA URL in Safari
2. Tap Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen

### On Desktop (Chrome/Edge):
1. Visit your PWA URL
2. Look for install icon in address bar (computer with plus)
3. Click "Install"
4. App opens in standalone window

---

## 🔧 Build Output Directory

**Note:** Expo may output to either `dist` or `web-build` depending on version.

To check which directory is created:
```bash
npm run build:web
# Then check which folder was created: dist or web-build
```

If it's `web-build`, update `netlify.toml`:
```toml
[build]
  publish = "web-build"  # Change from "dist" to "web-build"
```

---

## ✅ PWA Checklist

After deployment, verify:

- [ ] ✅ PWA manifest is valid (DevTools → Application → Manifest)
- [ ] ✅ Service worker is registered (DevTools → Application → Service Workers)
- [ ] ✅ Install prompt appears on mobile
- [ ] ✅ Install button appears on desktop browsers
- [ ] ✅ App opens fullscreen when installed
- [ ] ✅ App icon appears correctly on device
- [ ] ✅ HTTPS is enabled (required for PWA)
- [ ] ✅ Firebase authorized domains include your PWA URL
- [ ] ✅ Environment variables are set correctly
- [ ] ✅ All features work (login, Firebase, etc.)

---

## 🐛 Troubleshooting

### Build Fails?

1. **Clear cache and rebuild:**
   ```bash
   npm start -- --clear
   npm run build:web
   ```

2. **Check for errors in terminal**

3. **Verify all dependencies installed:**
   ```bash
   npm install
   ```

### Build Export Errors?

If you see errors like "Platform web is not configured to use the Metro bundler":

**Current Status:** Static export (`npm run build:web`) may have compatibility issues with Expo SDK 54. The development server works perfectly.

**Workaround Options:**

**Option 1: Use Development Server for Testing (Recommended)**
```bash
npm start
# Then press 'w' for web
# Or: npx expo start --web
```
This works immediately and is perfect for testing and development.

**Option 2: Try Alternative Build Method**
If you need a static export, you can try:
```bash
# Clear cache first
npx expo start --clear

# Then try export
npx expo export --platform web --clear
```

**Option 3: Use Expo's Web Build Service**
For production builds, consider using Expo's hosting service or build the web version through EAS Build.

**Note:** The webpack dependencies have been installed, but there may be configuration issues with static exports in Expo SDK 54. The development server is fully functional and can be used for deployment testing.

### Service Worker Not Working?

- Ensure HTTPS (or localhost for testing)
- Check browser console for errors
- Verify service worker file exists in build output

### Install Prompt Not Appearing?

- Must use HTTPS (required for PWA)
- User must visit site at least once
- Check manifest is valid (DevTools → Application → Manifest)
- Verify service worker is registered

### Firebase Not Working?

- Add PWA URL to Firebase authorized domains:
  - Firebase Console → Authentication → Settings → Authorized domains
- Verify environment variables are set correctly
- Check Firebase security rules allow access

---

## 🎯 Quick Command Reference

```bash
# 1. Build web version
npm run build:web

# 2. Test locally
cd dist
npx serve -p 8080

# 3. Deploy to Netlify (CLI)
netlify deploy --prod

# 4. Deploy to Firebase
firebase deploy --only hosting

# 5. Deploy to Vercel
vercel --prod
```

---

## 💡 Tips

- **Test locally first** before deploying
- **Use HTTPS** (required for PWA features)
- **Set environment variables** in hosting platform dashboard
- **Check build output folder** (`dist` vs `web-build`)
- **Update Firebase authorized domains** after deployment
- **Test on multiple devices** (mobile, tablet, desktop)
- **Clear browser cache** if testing updates

---

## 📚 Additional Resources

- Full PWA Guide: `PWA_SETUP_GUIDE.md`
- Netlify Deployment: `NETLIFY_DEPLOYMENT_GUIDE.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`

---

**Need help?** Check the browser DevTools → Application tab for PWA diagnostics!

