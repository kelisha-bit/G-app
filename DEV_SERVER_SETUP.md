# 🚀 Development Server Setup Guide

This guide shows you how to run and deploy your app using Expo's development server for web.

---

## ✅ Quick Start - Run Locally

### Step 1: Start the Development Server

```bash
npm start
```

Then press **`w`** to open in web browser, or run:

```bash
npx expo start --web
```

### Step 2: Access Your App

The server will start and open automatically at:
- **Local:** `http://localhost:8081` (or the port shown)
- **Network:** Accessible on your local network

---

## 🔧 Development Server Features

✅ **Hot Reload** - Changes appear instantly  
✅ **Full PWA Support** - All PWA features work  
✅ **Firebase Integration** - Full Firebase support  
✅ **All Features** - Complete app functionality  
✅ **Easy Testing** - Test on any device on your network  

---

## 📱 Testing on Mobile Devices

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Find your local IP:**
   - Windows: `ipconfig` (look for IPv4 address)
   - Mac/Linux: `ifconfig` (look for inet address)

3. **On your phone:**
   - Connect to the same Wi-Fi network
   - Open browser and go to: `http://YOUR_IP:8081`
   - Example: `http://192.168.1.100:8081`

4. **Install as PWA:**
   - Android: "Add to Home Screen" prompt will appear
   - iOS: Share → "Add to Home Screen"

---

## 🌐 Production Deployment Options

For production, you need a Node.js hosting service since the dev server requires Node.js to run.

### Option 1: Railway (Recommended - Easiest) ⭐

**Free tier available, very easy setup**

1. **Sign up:** https://railway.app
2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login:**
   ```bash
   railway login
   ```

4. **Initialize project:**
   ```bash
   railway init
   ```

5. **Set environment variables:**
   ```bash
   railway variables set EXPO_PUBLIC_FIREBASE_API_KEY=your_key
   railway variables set EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   # ... add all EXPO_PUBLIC_* variables
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

**Your app will be live at:** `https://your-project.railway.app`

---

### Option 2: Render

**Free tier available**

1. **Sign up:** https://render.com
2. **Create new Web Service**
3. **Connect your Git repository**
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start -- --web`
   - Environment: Node
5. **Add environment variables** (all `EXPO_PUBLIC_*` variables)
6. **Deploy**

**Your app will be live at:** `https://your-project.onrender.com`

---

### Option 3: Fly.io

**Free tier available**

1. **Sign up:** https://fly.io
2. **Install Fly CLI:**
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

3. **Login:**
   ```bash
   fly auth login
   ```

4. **Create app:**
   ```bash
   fly launch
   ```

5. **Create `fly.toml`** (example):
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 8081
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

6. **Set environment variables:**
   ```bash
   fly secrets set EXPO_PUBLIC_FIREBASE_API_KEY=your_key
   # ... add all variables
   ```

7. **Deploy:**
   ```bash
   fly deploy
   ```

---

### Option 4: Vercel (with custom setup)

Vercel can run Node.js servers, but requires more configuration:

1. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/"
       }
     ]
   }
   ```

2. **Deploy via Vercel CLI or Dashboard**

---

## 🔐 Environment Variables Setup

You need to set all your Firebase environment variables on your hosting platform.

**Required variables:**
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (if using Analytics)

**How to add:**
- Railway: Dashboard → Variables tab, or `railway variables set KEY=value`
- Render: Dashboard → Environment → Environment Variables
- Fly.io: `fly secrets set KEY=value`

---

## 📝 Production Configuration

### Update Firebase Authorized Domains

After deployment, add your production URL to Firebase:

1. Go to: https://console.firebase.google.com
2. Select your project
3. Authentication → Settings → Authorized domains
4. Add your production domain (e.g., `your-app.railway.app`)

---

## 🔄 Deployment Workflow

1. **Make changes to your code**
2. **Test locally:**
   ```bash
   npm start
   # Press 'w' for web
   ```
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
4. **Hosting service auto-deploys** (if connected to Git)
   - Or manually deploy: `railway up` / `fly deploy` / etc.

---

## ⚡ Performance Tips

- **Enable caching** on your hosting service
- **Use CDN** if available (Railway/Render have built-in CDN)
- **Optimize images** before uploading
- **Monitor usage** on free tiers

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Use a different port
npx expo start --web --port 3000
```

### Environment Variables Not Loading

- Check variable names (must start with `EXPO_PUBLIC_*`)
- Restart server after adding variables
- Verify on hosting platform dashboard

### Firebase Not Working

- Add production URL to Firebase authorized domains
- Check environment variables are set correctly
- Verify Firebase security rules allow access

### Network Access Issues

- Check firewall settings
- Ensure devices are on same network
- Try using `--tunnel` flag:
  ```bash
  npx expo start --tunnel
  ```

---

## 💡 Recommended Setup

**For Development:**
- Use `npm start` locally
- Test on mobile via local network IP

**For Production:**
- Use Railway (easiest) or Render (good free tier)
- Connect to Git for auto-deploy
- Set up environment variables
- Add domain to Firebase authorized domains

---

## 🎯 Quick Reference

```bash
# Start dev server
npm start
# Then press 'w'

# Start with web automatically
npx expo start --web

# Start on specific port
npx expo start --web --port 3000

# Start with tunnel (for external access)
npx expo start --tunnel

# Production deploy (Railway)
railway up

# Production deploy (Fly.io)
fly deploy
```

---

Need help? Check:
- Expo Docs: https://docs.expo.dev/workflow/web/
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs


