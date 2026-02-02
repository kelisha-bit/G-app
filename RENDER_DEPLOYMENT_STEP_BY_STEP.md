# 🚀 Render Deployment - Step-by-Step Guide

**Deploy your push notifications backend to Render in 10 minutes!**

---

## 📋 Prerequisites

- ✅ GitHub account (free)
- ✅ Your code pushed to GitHub
- ✅ 10 minutes of time

---

## 🎯 Step 1: Prepare Your Repository

### Make sure your backend code is on GitHub

If you haven't pushed to GitHub yet:

```powershell
# Navigate to your project root
cd "C:\Users\Amasco DE-General\Desktop\G-pp3\G-app"

# Check if git is initialized
git status

# If not initialized, initialize it:
git init
git add .
git commit -m "Initial commit with backend"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

**✅ Check:** Your `backend/` folder should be in your GitHub repository.

---

## 🎯 Step 2: Sign Up for Render

1. **Go to:** https://render.com
2. **Click:** "Get Started for Free"
3. **Sign up** with:
   - GitHub (recommended - easiest)
   - Or email

4. **Verify your email** if needed

---

## 🎯 Step 3: Create New Web Service

1. **In Render Dashboard:**
   - Click the **"New +"** button (top right)
   - Select **"Web Service"**

2. **Connect Repository:**
   - If using GitHub: Click **"Connect GitHub"**
   - Authorize Render to access your repositories
   - Select your repository from the list

---

## 🎯 Step 4: Configure Your Service

Fill in these settings:

### Basic Settings:

- **Name:** `push-notifications-backend` (or any name you like)
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main` (or `master` if that's your default branch)
- **Root Directory:** `backend` ⚠️ **IMPORTANT!
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Environment Variables:

Click **"Add Environment Variable"** and add:

1. **First Variable:**
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - Click **"Add"**

2. **Second Variable:**
   - **Key:** `PORT`
   - **Value:** `10000`
   - Click **"Add"**

**⚠️ Important:** Render uses port 10000, but your server.js already handles this with `process.env.PORT || 3001`, so it will automatically use 10000.

---

## 🎯 Step 5: Deploy!

1. **Scroll down** and click **"Create Web Service"**

2. **Wait for deployment:**
   - Render will start building your service
   - This takes 2-5 minutes
   - You'll see build logs in real-time

3. **Watch the logs:**
   - Build logs will show `npm install` running
   - Then `npm start` will start your server
   - Look for: `Server running on port 10000` or similar

---

## 🎯 Step 6: Get Your Backend URL

After deployment completes:

1. **Your service will be live!**
2. **Find your URL** at the top of the service page
3. **Format:** `https://your-service-name.onrender.com`

**Example:** `https://push-notifications-backend.onrender.com`

---

## 🎯 Step 7: Test Your Backend

1. **Open your browser**
2. **Go to:** `https://your-service-name.onrender.com/api/health`
3. **You should see:**
   ```json
   {
     "status": "ok",
     "service": "push-notifications",
     "timestamp": "2025-01-XX..."
   }
   ```

**✅ If you see this, your backend is working!**

---

## 🎯 Step 8: Set EAS Secret

Now configure your mobile app to use this backend:

```powershell
# Replace with your actual Render URL
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-service-name.onrender.com"
```

**Example:**
```powershell
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://push-notifications-backend.onrender.com"
```

---

## 🎯 Step 9: Verify EAS Secret

```powershell
eas secret:list
```

**Look for:** `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` in the list

---

## 🎯 Step 10: Rebuild Your App

```powershell
eas build --platform android --profile production
```

**Or for preview:**
```powershell
eas build --platform android --profile preview
```

---

## ✅ Deployment Complete!

Your backend is now:
- ✅ Deployed and running
- ✅ Accessible from anywhere
- ✅ Ready to send push notifications

---

## 🔍 Troubleshooting

### Issue: Build Fails

**Check:**
1. Root Directory is set to `backend` (not empty)
2. Build Command is `npm install`
3. Start Command is `npm start`
4. Your `backend/package.json` exists

### Issue: Service Won't Start

**Check logs:**
1. Go to your service in Render
2. Click "Logs" tab
3. Look for error messages

**Common fixes:**
- Make sure `server.js` exists in `backend/` folder
- Check that `package.json` has `"start": "node server.js"`
- Verify PORT environment variable is set

### Issue: Health Check Fails

**Test manually:**
1. Go to: `https://your-service.onrender.com/api/health`
2. Should return JSON with status

**If 404:**
- Check that `server.js` has the `/api/health` route
- Check Render logs for errors

### Issue: Service Goes to Sleep (Free Tier)

**Render free tier:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- This is normal for free tier

**Solution:**
- Upgrade to paid plan for always-on
- Or use a service like UptimeRobot to ping your service every 10 minutes

---

## 📊 Monitoring Your Backend

### View Logs:
1. Go to your service in Render
2. Click **"Logs"** tab
3. See real-time logs

### View Metrics:
1. Click **"Metrics"** tab
2. See CPU, Memory, Request count

### View Events:
1. Click **"Events"** tab
2. See deployment history

---

## 🔄 Updating Your Backend

When you make changes:

1. **Push to GitHub:**
   ```powershell
   git add .
   git commit -m "Update backend"
   git push
   ```

2. **Render auto-deploys:**
   - Render detects the push
   - Automatically rebuilds and redeploys
   - Takes 2-5 minutes

**No manual deployment needed!** 🎉

---

## 💰 Free Tier Limits

**Render Free Tier:**
- ✅ 750 hours/month (enough for always-on)
- ✅ 100GB bandwidth/month
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ Wake-up time ~30 seconds

**For production:** Consider upgrading to paid plan ($7/month) for:
- Always-on service
- Faster wake-up
- More resources

---

## 🎉 Next Steps

1. ✅ Backend deployed
2. ✅ EAS secret set
3. ✅ Rebuild app
4. ✅ Test notifications!

**Your push notifications should now work in production builds!**

---

## 📝 Quick Reference

**Your Backend URL:** `https://your-service-name.onrender.com`

**Health Check:** `https://your-service-name.onrender.com/api/health`

**EAS Secret:** `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL`

**Render Dashboard:** https://dashboard.render.com

---

## 🆘 Need Help?

**Render Support:** https://render.com/docs
**Render Status:** https://status.render.com
**Community:** https://community.render.com

