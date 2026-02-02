# ⚡ Render Quick Start - 5 Minute Setup

**Fastest way to deploy your backend!**

---

## 🚀 Quick Steps

### 1. Go to Render
👉 https://render.com → Sign up (free)

### 2. Create Web Service
- Click **"New +"** → **"Web Service"**
- Connect GitHub → Select your repo

### 3. Configure
```
Name: push-notifications-backend
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### 4. Add Environment Variables
```
NODE_ENV = production
PORT = 10000
```

### 5. Deploy
- Click **"Create Web Service"**
- Wait 2-5 minutes
- Get your URL: `https://your-service.onrender.com`

### 6. Test
Open: `https://your-service.onrender.com/api/health`

### 7. Set EAS Secret
```powershell
eas secret:create --scope project --name EXPO_PUBLIC_NOTIFICATION_BACKEND_URL --value "https://your-service.onrender.com"
```

### 8. Rebuild App
```powershell
eas build --platform android --profile production
```

---

## ✅ Done!

Your backend is live and ready! 🎉

**For detailed instructions, see:** `RENDER_DEPLOYMENT_STEP_BY_STEP.md`

