# 🚀 Backend Server Deployment Guide

## ❌ Problem: Railway CLI Not Installed

If you see: `railway : The term 'railway' is not recognized`

You need to install the Railway CLI first.

---

## ✅ Solution 1: Install Railway CLI (Windows)

### Option A: Using PowerShell (Recommended)

```powershell
# Install Railway CLI
iwr https://railway.app/install.sh | iex

# Verify installation
railway --version
```

### Option B: Using npm (Alternative)

```powershell
# Install Railway CLI globally
npm install -g @railway/cli

# Verify installation
railway --version
```

### Option C: Using Scoop (If you have Scoop)

```powershell
scoop install railway
```

---

## 🚀 Deploy to Railway (After Installing CLI)

### Step 1: Install Railway CLI
```powershell
iwr https://railway.app/install.sh | iex
```

### Step 2: Login to Railway
```powershell
railway login
```
This will open your browser to authenticate.

### Step 3: Initialize Project
```powershell
cd backend
railway init
```

### Step 4: Deploy
```powershell
railway up
```

### Step 5: Get Your URL
```powershell
railway domain
```
Or check Railway dashboard: https://railway.app/dashboard

**Your backend URL will be:** `https://your-project.railway.app`

---

## 🚀 Alternative: Deploy to Render (Easier - No CLI Needed)

### Step 1: Create Account
1. Go to https://render.com
2. Sign up (free tier available)

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository

### Step 3: Configure Service
- **Name:** `push-notifications-backend` (or any name)
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 4: Set Environment Variables
In Render dashboard, go to "Environment" tab and add:
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render uses port 10000)

### Step 5: Deploy
Click "Create Web Service" - Render will auto-deploy!

**Your backend URL will be:** `https://your-project.onrender.com`

---

## 🚀 Alternative: Deploy to Fly.io (Free Tier)

### Step 1: Install Fly CLI
```powershell
# Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Verify
fly version
```

### Step 2: Login
```powershell
fly auth login
```

### Step 3: Initialize
```powershell
cd backend
fly launch
```

### Step 4: Deploy
```powershell
fly deploy
```

**Your backend URL will be:** `https://your-project.fly.dev`

---

## 🚀 Alternative: Deploy to Heroku (Classic)

### Step 1: Install Heroku CLI
Download from: https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Login
```powershell
heroku login
```

### Step 3: Create App
```powershell
cd backend
heroku create your-app-name
```

### Step 4: Deploy
```powershell
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

**Your backend URL will be:** `https://your-app-name.herokuapp.com`

---

## 🚀 Alternative: Deploy to Vercel (Serverless)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Login
```powershell
vercel login
```

### Step 3: Deploy
```powershell
cd backend
vercel
```

**Note:** You may need to adapt `server.js` for serverless functions.

---

## 📋 Quick Comparison

| Service | CLI Required | Free Tier | Ease of Use | Best For |
|---------|-------------|-----------|-------------|----------|
| **Render** | ❌ No | ✅ Yes | ⭐⭐⭐⭐⭐ | Easiest |
| **Railway** | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐ | Good balance |
| **Fly.io** | ✅ Yes | ✅ Yes | ⭐⭐⭐ | Modern |
| **Heroku** | ✅ Yes | ⚠️ Limited | ⭐⭐⭐ | Classic |
| **Vercel** | ✅ Yes | ✅ Yes | ⭐⭐ | Serverless |

---

## ✅ Recommended: Use Render (Easiest)

**Why Render?**
- ✅ No CLI installation needed
- ✅ Free tier available
- ✅ Easy web interface
- ✅ Auto-deploys from GitHub
- ✅ Simple configuration

### Quick Render Setup:

1. **Go to:** https://render.com
2. **Sign up** (free)
3. **New +** → **Web Service**
4. **Connect GitHub** → Select your repo
5. **Configure:**
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
6. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
7. **Create** → Wait for deployment
8. **Get URL:** `https://your-project.onrender.com`

---

## 🔧 After Deployment

### 1. Test Your Backend

Open in browser:
```
https://your-backend-url.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Push Notifications Backend is running"
}
```

### 2. Set EAS Secret

```powershell
# Replace with your actual backend URL
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-backend.onrender.com"
```

### 3. Verify Secret

```powershell
eas secret:list
```

### 4. Rebuild App

```powershell
eas build --platform android --profile production
```

---

## 🐛 Troubleshooting

### Railway CLI Installation Issues

**If PowerShell script doesn't work:**
```powershell
# Try with npm instead
npm install -g @railway/cli
```

**If npm install fails:**
```powershell
# Run PowerShell as Administrator
# Then try again
```

### Render Deployment Issues

**Port Error:**
- Render uses port 10000, not 3001
- Set `PORT=10000` in environment variables
- Or update `server.js` to use `process.env.PORT || 3001`

**Build Fails:**
- Make sure `package.json` has `"start": "node server.js"`
- Check that all dependencies are in `package.json`

### Backend Not Responding

**Check:**
1. Backend is deployed and running
2. Health endpoint works: `https://your-backend.com/api/health`
3. CORS is configured (should be in `server.js`)
4. Environment variables are set

---

## 📝 Next Steps

1. ✅ Choose deployment service (Render recommended)
2. ✅ Deploy backend server
3. ✅ Get backend URL
4. ✅ Set EAS secret: `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL`
5. ✅ Rebuild app
6. ✅ Test notifications

---

## 🆘 Need Help?

**Render Support:** https://render.com/docs
**Railway Support:** https://docs.railway.app
**Fly.io Support:** https://fly.io/docs

