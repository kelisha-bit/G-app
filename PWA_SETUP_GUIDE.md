# 📱 Progressive Web App (PWA) Setup Guide

Your app is now configured as a Progressive Web App! This allows users to "install" your app on their devices (phone, tablet, desktop) just like a native app.

---

## ✅ What's Already Configured

Your `app.json` has been updated with full PWA configuration:

- ✅ **App Name & Description** - "Greater Works City Church"
- ✅ **App Icons** - Using your existing icon assets
- ✅ **Theme Colors** - Purple (#6366f1) matching your app design
- ✅ **Display Mode** - Standalone (hides browser UI when installed)
- ✅ **Orientation** - Portrait mode
- ✅ **Splash Screen** - Your existing splash screen

---

## 🚀 How PWA Works

When users visit your web app:
1. **On Mobile:** They'll see an "Add to Home Screen" prompt
2. **On Desktop:** They'll see an install button in the browser address bar
3. **After Installation:** The app appears as an icon on their device
4. **When Opened:** It launches fullscreen without browser UI (like a native app)

---

## 🧪 Testing Your PWA Locally

### Step 1: Build Web Version

```bash
npm run build:web
```

This creates a `dist` folder with your PWA-ready app.

### Step 2: Test Locally

**Option A: Using a local server (Recommended)**

```bash
# Install a simple HTTP server (if not installed)
npm install -g http-server

# Serve the dist folder (where the build outputs)
cd dist
http-server -p 8080
```

Then open: `http://localhost:8080` in your browser

**Option B: Using Python (if installed)**

```bash
cd dist
python -m http.server 8080
```

**Option C: Using Node.js**

```bash
cd dist
npx serve -p 8080
```

### Step 3: Test PWA Features

1. **Open in Chrome/Browser:**
   - Navigate to `http://localhost:8080`
   - Open DevTools (F12)
   - Go to "Application" tab → "Manifest"
   - Verify all PWA settings are correct

2. **Test Install Prompt:**
   - On mobile: Look for "Add to Home Screen" banner
   - On desktop: Look for install icon in address bar

3. **Test Offline Support:**
   - Go to DevTools → "Application" → "Service Workers"
   - Enable "Offline" checkbox
   - Refresh page - app should still work!

---

## 🌐 Deploying Your PWA

### Option 1: Deploy to Netlify (Recommended)

**Already configured!** Your `netlify.toml` is ready.

1. **Build the PWA:**
   ```bash
   npm run build:web
   ```

2. **Deploy to Netlify:**
   - Via Netlify Dashboard:
     - Go to https://app.netlify.com
     - Drag and drop the `dist` folder
     - Or connect your Git repository
   
   - Via Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify login
     netlify deploy --prod --dir=dist
     ```

3. **Add Environment Variables:**
   - In Netlify Dashboard → Site settings → Environment variables
   - Add all `EXPO_PUBLIC_*` variables from your `.env` file

4. **Update Firebase Authorized Domains:**
   - Go to Firebase Console → Authentication → Settings
   - Add your Netlify URL to authorized domains
   - Format: `your-site.netlify.app`

**Your PWA will be available at:** `https://your-site.netlify.app`

---

### Option 2: Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Hosting:**
   ```bash
   firebase init hosting
   # Select your Firebase project
   # Public directory: dist
   # Configure as single-page app: Yes
   # Set up automatic builds: No (for now)
   ```

4. **Build and Deploy:**
   ```bash
   npm run build:web
   firebase deploy --only hosting
   ```

**Your PWA will be available at:** `https://your-project.firebaseapp.com`

---

### Option 3: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build and Deploy:**
   ```bash
   npm run build:web
   vercel --prod
   ```

---

## 📱 How Users Install Your PWA

### On Android (Chrome)

1. Visit your deployed PWA URL
2. Look for "Add to Home Screen" banner at bottom
3. Tap "Add" or "Install"
4. App icon appears on home screen
5. Tap icon to launch fullscreen app

### On iPhone/iPad (Safari)

1. Visit your deployed PWA URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize name (optional)
5. Tap "Add"
6. App icon appears on home screen

### On Desktop (Chrome/Edge)

1. Visit your deployed PWA URL
2. Look for install icon in address bar (looks like a computer with a plus)
3. Click "Install"
4. App opens in standalone window
5. Pin to taskbar/desktop for easy access

---

## ✨ PWA Features Enabled

### ✅ Installed App Experience

- **Fullscreen mode** - No browser UI when installed
- **App icon** - Shows on device home screen
- **Splash screen** - Custom loading screen
- **Standalone display** - Looks like a native app

### ✅ Offline Support

- Service worker automatically caches assets
- App works offline for previously visited pages
- Automatic updates when new content is available

### ✅ Fast Loading

- Assets are cached for faster loading
- Optimized bundle size
- Efficient resource loading

---

## 🔧 Advanced PWA Features (Optional)

### Add Push Notifications

Your app already has notification support via `expo-notifications`. On web, you can enable push notifications:

1. **Request notification permission:**
   ```javascript
   if ('Notification' in window && 'serviceWorker' in navigator) {
     Notification.requestPermission();
   }
   ```

2. **Register service worker for push:**
   - This requires backend setup for push notifications
   - See your `PUSH_NOTIFICATIONS_GUIDE.md` for details

### Add Offline Data Sync

For better offline experience, you can cache Firebase data:

```javascript
// Example: Cache Firestore data in IndexedDB
import { openDB } from 'idb';

// Store offline data
// Sync when online
```

---

## 📊 PWA Checklist

After deployment, verify:

- [ ] ✅ PWA manifest is valid (check DevTools → Application → Manifest)
- [ ] ✅ Service worker is registered
- [ ] ✅ Install prompt appears on mobile
- [ ] ✅ Install button appears on desktop
- [ ] ✅ App opens fullscreen when installed
- [ ] ✅ App icon appears correctly on device
- [ ] ✅ Works offline (test with DevTools offline mode)
- [ ] ✅ Firebase authorized domains include your PWA URL
- [ ] ✅ HTTPS is enabled (required for PWA)

---

## 🐛 Troubleshooting

### Install Prompt Not Appearing

**Issue:** Users don't see "Add to Home Screen" prompt

**Solutions:**
- Ensure HTTPS is enabled (required for PWA)
- Check that service worker is registered
- Verify manifest is valid (DevTools → Application → Manifest)
- Make sure user has visited site at least once before

### Service Worker Not Registering

**Issue:** Service worker fails to register

**Solutions:**
- Check browser console for errors
- Ensure HTTPS (or localhost for testing)
- Clear browser cache
- Check that `dist` folder has service worker files

### Offline Not Working

**Issue:** App doesn't work when offline

**Solutions:**
- Verify service worker is active (DevTools → Application → Service Workers)
- Check that assets are being cached
- Ensure Firebase data is accessed through cached service worker

### Firebase Not Working

**Issue:** Firebase features don't work in PWA

**Solutions:**
- Add PWA URL to Firebase authorized domains
- Verify environment variables are set correctly
- Check Firebase security rules allow access
- Ensure HTTPS is enabled

---

## 🎯 Best Practices

1. **Always use HTTPS** - Required for PWA features
2. **Test on multiple devices** - PWA works differently on mobile vs desktop
3. **Monitor service worker updates** - Clear cache if needed
4. **Update manifest regularly** - Keep app info current
5. **Optimize assets** - Smaller files = faster loading

---

## 📚 Resources

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

## ✅ Quick Start Summary

1. **Build:** `npm run build:web`
2. **Test locally:** Serve `dist` folder on localhost
3. **Deploy:** Use Netlify, Firebase Hosting, or Vercel
4. **Share:** Users can install your PWA from the deployed URL

**That's it!** Your church app is now installable as a PWA! 🎉

---

## 🚀 Next Steps

1. Deploy to Netlify or Firebase Hosting
2. Test on your phone (visit the deployed URL)
3. Share the URL with your church members
4. They can install it just like a native app!

Need help? Check your `DEPLOYMENT_GUIDE.md` for more deployment options.

