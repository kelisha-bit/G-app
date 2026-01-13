# 🔄 How to Update Web App After Making Changes

This guide shows you how to update your web app after making code changes.

---

## 🚀 Quick Update Steps

### Method 1: Development Server (For Testing)

**Best for:** Testing changes locally before deploying

```bash
# 1. Start the development server
npm start

# 2. Press 'w' to open in web browser
# Or visit: http://localhost:8081
```

**Note:** Changes will hot-reload automatically. This is perfect for testing your ministry screen enhancements!

---

### Method 2: Build & Deploy to Firebase Hosting (Recommended)

**Best for:** Production updates

#### Step 1: Build the Web Version

```bash
# Build the web app
npm run build:web
```

This creates a `web-build` folder with all the static files.

**If build fails:**
```bash
# Clear cache and rebuild
npx expo start --clear
npm run build:web
```

#### Step 2: Deploy to Firebase Hosting

```bash
# Deploy to Firebase
firebase deploy --only hosting
```

**First time?** Make sure you're logged in:
```bash
firebase login
```

**Your app will be live at:** `https://your-project-id.web.app`

---

### Method 3: Build & Deploy to Netlify

**Best for:** Alternative hosting option

#### Step 1: Build the Web Version

```bash
npm run build:web
```

#### Step 2: Deploy to Netlify

**Option A: Via Netlify Dashboard (Easiest)**
1. Go to https://app.netlify.com
2. Drag and drop the `web-build` folder onto the dashboard
3. Your site is deployed!

**Option B: Via Netlify CLI**
```bash
# Install Netlify CLI (first time only)
npm install -g netlify-cli

# Login (first time only)
netlify login

# Deploy
netlify deploy --prod --dir=web-build
```

---

## 📝 Complete Update Workflow

Here's the complete process from making changes to deploying:

### 1. Make Your Changes
```bash
# Edit your files (e.g., src/screens/MinistriesScreen.js)
# Test locally with: npm start (then press 'w')
```

### 2. Test Locally
```bash
# Start dev server
npm start
# Press 'w' for web
# Test your changes at http://localhost:8081
```

### 3. Build for Production
```bash
# Build static files
npm run build:web
```

### 4. Test Build Locally (Optional but Recommended)
```bash
# Serve the build folder
cd web-build
npx serve -p 8080
# Visit http://localhost:8080 to test
```

### 5. Deploy
```bash
# Deploy to Firebase
firebase deploy --only hosting

# OR deploy to Netlify
netlify deploy --prod --dir=web-build
```

---

## 🔧 Troubleshooting

### Build Fails?

```bash
# Clear cache and try again
npx expo start --clear
rm -rf web-build
npm run build:web
```

### Changes Not Showing?

1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Or use Incognito/Private mode

2. **Hard refresh:**
   - Windows: Ctrl+F5
   - Mac: Cmd+Shift+R

3. **Clear service worker:**
   - Open DevTools (F12)
   - Application tab → Service Workers → Unregister
   - Refresh page

### Firebase Deploy Fails?

```bash
# Make sure you're logged in
firebase login

# Check your Firebase project
firebase projects:list

# Set the correct project
firebase use your-project-id
```

---

## 🎯 Quick Command Reference

```bash
# Test locally
npm start                    # Then press 'w'

# Build for production
npm run build:web

# Deploy to Firebase
firebase deploy --only hosting

# Deploy to Netlify
netlify deploy --prod --dir=web-build

# Full workflow
npm start                    # Test
npm run build:web           # Build
firebase deploy --only hosting  # Deploy
```

---

## 📱 After Deployment

1. **Test your live site** - Visit your deployed URL
2. **Check Firebase Console** - Make sure everything is working
3. **Update users** - Changes are live immediately!

---

## 💡 Pro Tips

- **Always test locally first** with `npm start` before deploying
- **Use version control** - Commit your changes before deploying
- **Check build output** - Make sure `web-build` folder was created
- **Monitor Firebase Console** - Check for any errors after deployment
- **Test on multiple devices** - Web, mobile browser, etc.

---

## 🆘 Need Help?

If you encounter issues:

1. Check the build output for errors
2. Verify Firebase/Netlify is configured correctly
3. Make sure all environment variables are set
4. Check browser console for runtime errors

---

**Your ministry screen enhancements are now ready to deploy!** 🎉

