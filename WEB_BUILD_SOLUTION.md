# 🌐 Web/PWA Build Solution

## Issue
The project uses Metro bundler (default for Expo SDK 54), but `expo export:web` only works with Webpack. Additionally, Metro's web export has some limitations.

## Solution Options

### Option 1: Use Development Web Server (Recommended for Now)

For Expo SDK 54 with Metro bundler, the easiest way to deploy web is to use the development server:

```bash
# Start web server
npm start
# Then press 'w' for web, or:
npx expo start --web
```

**For production deployment**, you'll need to use a service that can run Node.js (like Railway, Render, or Fly.io) since it requires the Expo dev server.

---

### Option 2: Switch to Webpack Bundler (For Static Export)

To use `expo export:web` and create static files, you need to switch to Webpack:

1. **Install Webpack support:**
   ```bash
   npm install --save-dev @expo/webpack-config
   ```

2. **Update app.json** - Change the web bundler to webpack:
   ```json
   "web": {
     "bundler": "webpack"
   }
   ```

3. **Build:**
   ```bash
   npx expo export:web
   ```

**Note:** This changes the bundler for web builds, but Metro will still be used for native builds.

---

### Option 3: Use Expo Router (Future Migration)

Expo Router (file-based routing) has better web support, but this requires migrating your navigation structure.

---

## Current Recommendation

For immediate deployment:

1. **Use development server approach** for testing
2. **Deploy to a Node.js hosting service** (Railway, Render, Fly.io) that can run the Expo dev server
3. **Or migrate to Webpack** if you need static file export

---

## Quick Fix for Static Export

If you need static files now, here's the quickest path:

```bash
# 1. Install Webpack config
npm install --save-dev @expo/webpack-config

# 2. Update app.json - add this to web section:
# "bundler": "webpack"

# 3. Build
npx expo export:web
```

This will output static files to the `web-build` or `dist` directory that you can deploy to Netlify, Vercel, or Firebase Hosting.


