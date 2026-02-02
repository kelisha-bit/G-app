# 🌐 How to Get YOUR_BACKEND_URL

Complete guide to getting a backend URL for push notifications - from local testing to production deployment.

---

## 🎯 Two Main Options

### Option 1: Local Network IP (For Testing Only)
**Best for:** Quick testing on your local network  
**URL Format:** `http://YOUR_COMPUTER_IP:3001`  
**Example:** `http://172.20.10.3:3001`

### Option 2: Deployed Cloud Service (For Production)
**Best for:** Production apps, sharing with others, reliability  
**URL Format:** `https://your-app.herokuapp.com` (or similar)  
**Example:** `https://gwcc-push-notifications.herokuapp.com`

---

## 🏠 Option 1: Local Network IP (Quick Testing)

### Step 1: Find Your Computer's IP Address

**On Windows:**
```powershell
ipconfig
```

**Look for:**
```
IPv4 Address. . . . . . . . . . . : 172.20.10.3
```

**Your backend URL will be:** `http://172.20.10.3:3001`

### Step 2: Start Your Backend Server

```powershell
cd backend
npm install  # if not already done
npm start
```

You should see:
```
Server running on port 3001
```

### Step 3: Test the URL

**From your computer's browser:**
```
http://localhost:3001/api/health
```

Should return:
```json
{"status":"ok"}
```

**From your device's browser (on same Wi-Fi):**
```
http://172.20.10.3:3001/api/health
```

Should return:
```json
{"status":"ok"}
```

### Step 4: Use This URL

```powershell
# Set as EAS secret (if using preview builds)
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "http://172.20.10.3:3001"
```

**⚠️ Limitations:**
- Only works on same Wi-Fi network
- IP might change when you reconnect
- Backend must be running on your computer
- Not accessible from outside your network

---

## ☁️ Option 2: Deploy to Cloud Service (Recommended for Production)

Choose one of these services to deploy your backend:

---

### 🚂 Option A: Deploy to Railway (Easiest - Recommended!)

**✅ Pros:** Free tier available, very easy setup, auto-deploys  
**❌ Cons:** Free tier has limitations

#### Step 1: Create Railway Account

1. Go to: https://railway.app
2. Sign up with GitHub (recommended) or email
3. New Project → Deploy from GitHub repo

#### Step 2: Connect Your Repository

1. **Option A: Connect GitHub repo**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will detect it's a Node.js project

2. **Option B: Deploy manually**
   - Click "New Project" → "Empty Project"
   - Add "Nixpacks" service
   - Connect to your Git repo

#### Step 3: Configure Railway

**Set Root Directory:**
- In Railway dashboard → Settings → Root Directory
- Set to: `backend`

**Set Start Command:**
- In Railway dashboard → Settings → Start Command
- Set to: `npm start`

**Add Environment Variables:**
- Railway dashboard → Variables tab
- Add: `NODE_ENV=production`
- Add: `PORT` (Railway sets this automatically)

#### Step 4: Deploy

Railway will automatically:
- Detect Node.js
- Install dependencies (`npm install`)
- Start server (`npm start`)
- Assign a URL

#### Step 5: Get Your Backend URL

**After deployment:**
1. Railway dashboard → Your service → Settings
2. Look for "Domains" or "Deployments"
3. Copy the URL (e.g., `https://your-app.up.railway.app`)

**Your backend URL will be:** `https://your-app.up.railway.app`

**Test it:**
```
https://your-app.up.railway.app/api/health
```

Should return: `{"status":"ok"}`

---

### 🚢 Option B: Deploy to Heroku

**✅ Pros:** Very popular, well-documented, free tier (limited)  
**❌ Cons:** Free tier no longer available (paid plans start at $5/month)

#### Step 1: Install Heroku CLI

**On Windows (PowerShell as Admin):**
```powershell
# Using winget (Windows Package Manager)
winget install Heroku.HerokuCLI

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

**Verify installation:**
```powershell
heroku --version
```

#### Step 2: Login to Heroku

```powershell
heroku login
```

Opens browser to login.

#### Step 3: Create Heroku App

```powershell
cd backend
heroku create gwcc-push-notifications
```

**Replace `gwcc-push-notifications` with your desired app name.**

You'll see:
```
Creating app... done, ⬢ gwcc-push-notifications
https://gwcc-push-notifications.herokuapp.com/ | https://git.heroku.com/gwcc-push-notifications.git
```

**Your backend URL:** `https://gwcc-push-notifications.herokuapp.com`

#### Step 4: Set Environment Variables

```powershell
heroku config:set NODE_ENV=production
```

#### Step 5: Deploy

**Option A: Deploy via Git (Recommended)**

First, initialize git in backend folder (if not already):
```powershell
cd backend
git init
git add .
git commit -m "Initial commit"
```

Then deploy:
```powershell
heroku git:remote -a gwcc-push-notifications
git push heroku main
```

**Option B: Deploy from root directory**

Create `Procfile` in `backend/` folder:
```
web: npm start
```

Then from root directory:
```powershell
git subtree push --prefix backend heroku main
```

#### Step 6: Verify Deployment

```powershell
heroku open
```

Or test manually:
```
https://gwcc-push-notifications.herokuapp.com/api/health
```

---

### 🎨 Option C: Deploy to Render

**✅ Pros:** Free tier available, easy setup, good documentation  
**❌ Cons:** Free tier spins down after inactivity (takes ~30s to wake up)

#### Step 1: Create Render Account

1. Go to: https://render.com
2. Sign up (GitHub recommended)

#### Step 2: Create New Web Service

1. Dashboard → "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository

#### Step 3: Configure Service

**Settings:**
- **Name:** `gwcc-push-notifications` (or your choice)
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment Variables:**
- Add: `NODE_ENV` = `production`

#### Step 4: Deploy

1. Click "Create Web Service"
2. Render will build and deploy automatically
3. Wait for deployment to complete (2-5 minutes)

#### Step 5: Get Your Backend URL

**After deployment:**
- Dashboard → Your service → Settings
- Copy the URL (e.g., `https://gwcc-push-notifications.onrender.com`)

**Your backend URL:** `https://gwcc-push-notifications.onrender.com`

**Test it:**
```
https://gwcc-push-notifications.onrender.com/api/health
```

---

### 🌐 Option D: Deploy to Fly.io

**✅ Pros:** Free tier, global deployment, fast  
**❌ Cons:** Slightly more complex setup

#### Step 1: Install Fly CLI

```powershell
# Using winget
winget install fly.io

# Or from: https://fly.io/docs/hands-on/install-flyctl/
```

#### Step 2: Login

```powershell
fly auth login
```

#### Step 3: Initialize App

```powershell
cd backend
fly launch
```

Follow prompts:
- App name: `gwcc-push-notifications` (or auto-generated)
- Region: Choose closest to you
- Postgres? No
- Redis? No
- Deploy now? Yes

#### Step 4: Get Your Backend URL

After deployment:
```
https://gwcc-push-notifications.fly.dev
```

---

## 📋 Quick Comparison Table

| Service | Free Tier | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Railway** | ✅ Yes | ⭐ Easy | Beginners |
| **Render** | ✅ Yes* | ⭐ Easy | Quick deploys |
| **Heroku** | ❌ No | ⭐⭐ Medium | Established projects |
| **Fly.io** | ✅ Yes | ⭐⭐⭐ Advanced | Global apps |

*Render free tier spins down after inactivity

---

## 🎯 Recommended: Railway (Easiest)

**Why Railway?**
- ✅ Free tier available
- ✅ Easiest setup (just connect GitHub)
- ✅ Auto-deploys on git push
- ✅ Good documentation
- ✅ No credit card required for free tier

**Quick Start:**
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo → Set root directory to `backend`
5. Deploy!
6. Copy the URL → Use as `YOUR_BACKEND_URL`

---

## ✅ After Getting Your Backend URL

### For Local Testing:

```powershell
# Use your local IP
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "http://172.20.10.3:3001"
```

### For Production Preview Builds:

```powershell
# Use your deployed backend URL
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-app.railway.app"
```

### Or Add to eas.json:

```json
"preview": {
  "env": {
    "EXPO_PUBLIC_NOTIFICATION_BACKEND_URL": "https://your-app.railway.app"
  }
}
```

---

## 🧪 Test Your Backend URL

**Health Check Endpoint:**
```
https://your-backend-url.com/api/health
```

**Should return:**
```json
{"status":"ok"}
```

**Test from Your App:**
1. Set the URL as EAS secret
2. Rebuild your preview build
3. Try sending a push notification
4. Check logs - should see successful connection ✅

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"

**Check:**
1. ✅ Backend is deployed and running
2. ✅ URL is correct (https://, not http://)
3. ✅ `/api/health` endpoint works in browser
4. ✅ CORS is enabled (your backend has `app.use(cors())` ✅)

### Issue: "Backend URL not working in preview build"

**Fix:**
1. ✅ Rebuild after setting EAS secret (secrets are baked in at build time)
2. ✅ Verify secret is set: `eas secret:list`
3. ✅ Check secret name is exactly: `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL`

### Issue: "Render free tier takes too long to respond"

**Why:** Free tier spins down after 15 minutes of inactivity  
**Fix:** First request takes ~30 seconds to wake up, then it's fast  
**Better:** Use Railway (no spin-down) or upgrade Render plan

---

## 📝 Summary

**For Testing:**
- Use local IP: `http://172.20.10.3:3001`
- Quick and easy
- Only works on same network

**For Production:**
- Deploy to Railway (recommended)
- Get URL: `https://your-app.railway.app`
- Works everywhere, always online

**After Getting URL:**
```powershell
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "YOUR_URL_HERE"
eas build --platform android --profile preview
```

---

**Last Updated:** January 2025  
**Related Files:**
- `backend/server.js` - Backend code
- `backend/README.md` - Backend documentation
- `FIX_PREVIEW_BUILD_PUSH_NOTIFICATIONS.md` - Using backend URL in preview builds

