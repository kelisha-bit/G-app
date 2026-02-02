# 🚀 Backend Service Setup - Push Notifications

## ✅ What Was Created

A complete Node.js/Express backend service for sending push notifications via Expo Push Notification Service.

### Files Created

1. **`backend/package.json`** - Backend dependencies and scripts
2. **`backend/server.js`** - Express server with notification endpoints
3. **`backend/.env.example`** - Environment variable template
4. **`backend/README.md`** - Complete setup and deployment guide

### Files Updated

1. **`src/utils/notificationHelpers.js`** - Updated to call backend API
2. **`PUSH_NOTIFICATIONS_GUIDE.md`** - Updated with backend integration info

---

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:

```env
PORT=3001
NODE_ENV=development
```

### 3. Start the Backend Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 4. Configure Mobile App

Add to your root `.env` file:

```env
EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://localhost:3001
```

For production, use your deployed backend URL:
```env
EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=https://your-backend.herokuapp.com
```

### 5. Restart Expo Server

After adding the environment variable, restart your Expo server:

```bash
npm start --clear
```

---

## 📡 API Endpoints

### Send Notifications
```
POST /api/notifications/send
```

**Request:**
```json
{
  "tokens": ["ExpoPushToken[xxx]", "ExpoPushToken[yyy]"],
  "title": "Notification Title",
  "body": "Notification Body",
  "data": {
    "type": "announcement",
    "announcementId": "123"
  }
}
```

### Broadcast Notifications
```
POST /api/notifications/broadcast
```
Same as `/send` but optimized for broadcasting.

### Health Check
```
GET /api/health
```

---

## 🔧 How It Works

1. **Mobile App** calls notification helper (e.g., `sendAnnouncementNotification()`)
2. **Helper Function** collects push tokens from Firebase
3. **Helper Function** makes HTTP request to backend API
4. **Backend Server** uses `expo-server-sdk` to send via Expo Push API
5. **Results** are returned to the mobile app

---

## 🚢 Deployment Options

### Option 1: Heroku

```bash
cd backend
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

### Option 2: Railway

1. Connect your repository to Railway
2. Set environment variables
3. Auto-deploys on push

### Option 3: Your Own Server

```bash
npm install --production
pm2 start server.js --name push-notifications
```

See `backend/README.md` for detailed deployment instructions.

---

## 🧪 Testing

1. Start the backend server: `cd backend && npm start`
2. Start your Expo app: `npm start`
3. Create an announcement or trigger a notification
4. Check backend logs for notification sending status

---

## 🔒 Security Notes

- Add authentication to protect endpoints in production
- Use HTTPS for production deployments
- Consider rate limiting to prevent abuse
- Never commit `.env` files to version control

---

## 📚 Documentation

- **Backend Setup**: See `backend/README.md`
- **Push Notifications Guide**: See `PUSH_NOTIFICATIONS_GUIDE.md`
- **Expo Docs**: https://docs.expo.dev/push-notifications/overview/

---

## ✅ Status

**Backend Service**: ✅ Complete  
**Mobile Integration**: ✅ Complete  
**Ready for**: Development and Production

