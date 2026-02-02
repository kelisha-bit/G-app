# 🌐 Web Build Guide - Greater Works City Church App

This guide covers building and deploying the web version of the church app.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- All dependencies installed (`npm install`)

---

## 🚀 Quick Start

### Build for Web

```bash
npm run build:web
```

This will create a `web-build` directory with the optimized web version of your app.

### Test Web Build Locally

```bash
# Build first
npm run build:web

# Serve the build
npm run serve:web
```

Or use the development server:

```bash
npm run web
```

---

## 📦 Build Output

After running `npm run build:web`, you'll get:

```
web-build/
├── index.html
├── assets/
│   ├── js/
│   ├── css/
│   └── images/
└── ... (other static files)
```

---

## 🌍 Deployment Options

### Option 1: Netlify (Recommended - Free)

**Already configured!** Your `netlify.toml` is set up.

1. **Build the web version:**
   ```bash
   npm run build:web
   ```

2. **Deploy via Netlify Dashboard:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Build command: `npm run build:web`
   - Publish directory: `web-build`
   - Add environment variables (see below)

3. **Deploy via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

### Option 2: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run build:web
   vercel
   ```

3. **Configure in Vercel Dashboard:**
   - Build command: `npm run build:web`
   - Output directory: `web-build`
   - Add environment variables

### Option 3: Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase:**
   ```bash
   firebase init hosting
   ```

3. **Configure:**
   - Public directory: `web-build`
   - Single-page app: Yes
   - Automatic builds: No (or configure if using GitHub)

4. **Deploy:**
   ```bash
   npm run build:web
   firebase deploy --only hosting
   ```

### Option 4: GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   {
     "scripts": {
       "deploy:gh-pages": "npm run build:web && gh-pages -d web-build"
     }
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy:gh-pages
   ```

---

## 🔐 Environment Variables

For web deployment, you need to set these environment variables in your hosting platform:

### Firebase Variables
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### Payment API Variables (Optional)
```
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY
```

### Setting Environment Variables

**Netlify:**
- Site settings → Environment variables → Add variable

**Vercel:**
- Project settings → Environment Variables → Add

**Firebase:**
- Use `.env` file or Firebase Functions config

---

## 🎨 Web-Specific Features

### ✅ What Works on Web

- ✅ All core app features
- ✅ Firebase Authentication
- ✅ Firebase Firestore
- ✅ Firebase Storage
- ✅ Mobile Money payments (opens in new tab)
- ✅ Events, Sermons, Directory
- ✅ Admin dashboard
- ✅ User profiles
- ✅ Responsive design

### ⚠️ Web Limitations

- ⚠️ Push notifications (uses web notifications API)
- ⚠️ Image picker (uses browser file input)
- ⚠️ Some native features may have alternatives
- ⚠️ Payment links open in new tab (better UX on web)

---

## 🔧 Web Build Configuration

### Webpack Configuration

The `webpack.config.js` file includes:
- Polyfills for Node.js modules (crypto, stream, buffer)
- Environment variable injection
- Optimized build settings

### App Configuration

The `app.json` includes web-specific settings:
- PWA manifest
- Theme colors
- Splash screen
- Favicon

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** Build command fails

**Solutions:**
- Clear cache: `npx expo export:web --clear`
- Delete `web-build` folder and rebuild
- Check Node.js version (needs 18+)
- Verify all dependencies installed

### Environment Variables Not Working

**Problem:** Variables not available in web build

**Solutions:**
- Check `.env` file exists in project root
- Verify variable names start with `EXPO_PUBLIC_`
- Restart development server after adding variables
- Check webpack.config.js includes the variable

### Payment Links Not Opening

**Problem:** Payment links don't work on web

**Solution:**
- On web, links open in new tab automatically
- Check browser popup blocker settings
- Verify payment API keys are configured

### Routing Issues

**Problem:** Direct URLs return 404

**Solution:**
- Ensure hosting platform redirects all routes to `index.html`
- Check `netlify.toml` or hosting config has redirect rules
- Verify single-page app (SPA) mode is enabled

---

## 📱 Progressive Web App (PWA)

Your app is configured as a PWA! Users can:

1. **Install on device:**
   - Visit the web app
   - Browser will show "Add to Home Screen" option
   - App will work like a native app

2. **Offline support:**
   - Service workers cache assets
   - App works offline (with cached data)

3. **App-like experience:**
   - Standalone display mode
   - Custom splash screen
   - App icon on home screen

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Test all features on web
- [ ] Verify environment variables are set
- [ ] Test payment flow (if configured)
- [ ] Check responsive design on different screen sizes
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify Firebase rules allow web access
- [ ] Test authentication flow
- [ ] Check image uploads/downloads
- [ ] Verify admin features work
- [ ] Test mobile view (responsive design)
- [ ] Set up custom domain (optional)
- [ ] Configure SSL/HTTPS (automatic on most platforms)
- [ ] Set up analytics (if needed)
- [ ] Test PWA installation

---

## 📊 Performance Optimization

### Build Optimizations

The web build automatically includes:
- Code splitting
- Asset optimization
- Tree shaking
- Minification

### Further Optimizations

1. **Image Optimization:**
   - Use WebP format where possible
   - Compress images before upload
   - Use responsive images

2. **Lazy Loading:**
   - Images load on demand
   - Components load when needed

3. **Caching:**
   - Service workers cache assets
   - Browser caching configured

---

## 🔄 Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:web
      - uses: netlify/actions/cli@master
        with:
          args: deploy --dir=web-build --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📞 Support

For issues with web build:

1. Check Expo documentation: [docs.expo.dev](https://docs.expo.dev)
2. Check React Native Web: [github.com/necolas/react-native-web](https://github.com/necolas/react-native-web)
3. Review build logs for errors
4. Clear cache and rebuild

---

## 🎉 You're Ready!

Your web build is configured and ready to deploy. Choose your hosting platform and follow the deployment steps above.

Happy deploying! 🚀

