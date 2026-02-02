# 🔔 Push Notifications Backend Service

Backend service for sending push notifications via Expo Push Notification Service for the Greater Works City Church app.

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `PORT`: Server port (default: 3001)
   - `NODE_ENV`: Environment (development/production)

3. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### Send Notifications
```
POST /api/notifications/send
```
Send push notifications to specified tokens.

**Request Body:**
```json
{
  "tokens": ["ExpoPushToken[xxx]", "ExpoPushToken[yyy]"],
  "title": "Notification Title",
  "body": "Notification Body",
  "data": {
    "type": "announcement",
    "announcementId": "123",
    "screen": "Messages"
  },
  "options": {
    "sound": "default",
    "priority": "default",
    "channelId": "default"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent 2 notification(s)",
  "sent": 2,
  "errors": 0,
  "invalidTokens": [],
  "results": [...]
}
```

### Broadcast Notifications
```
POST /api/notifications/broadcast
```
Same as `/send` but optimized for broadcasting to many devices.

## 🔧 Integration with Mobile App

The mobile app's `notificationHelpers.js` should call this backend service. Update the helpers to make HTTP requests to your backend URL.

**Example:**
```javascript
const BACKEND_URL = 'http://localhost:3001'; // or your production URL

async function sendNotificationToBackend(tokens, title, body, data) {
  const response = await fetch(`${BACKEND_URL}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokens,
      title,
      body,
      data,
    }),
  });
  
  return await response.json();
}
```

## 🚢 Deployment

### Option 1: Deploy to Heroku

1. Create a Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=80
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

### Option 2: Deploy to Railway

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will auto-deploy

### Option 3: Deploy to Vercel/Netlify Functions

For serverless deployment, you may need to adapt the code to work with serverless functions.

### Option 4: Deploy to Your Own Server

1. Clone the repository on your server
2. Install dependencies: `npm install --production`
3. Use PM2 or similar to run the server:
   ```bash
   pm2 start server.js --name push-notifications
   ```

## 🔒 Security Considerations

1. **Add Authentication**: Protect your endpoints with API keys or JWT tokens
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **CORS**: Configure CORS to only allow requests from your app domain
4. **Environment Variables**: Never commit `.env` file to version control

## 📊 Monitoring

- Monitor invalid tokens and remove them from your database
- Track notification delivery rates
- Log errors for debugging

## 🐛 Troubleshooting

### Notifications not sending
- Check that tokens are valid Expo push tokens
- Verify Expo Push Notification Service is accessible
- Check server logs for errors

### Invalid tokens
- Tokens become invalid when:
  - App is uninstalled
  - User logs out
  - Token expires
- Remove invalid tokens from your database

## 📚 Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [expo-server-sdk Documentation](https://github.com/expo/expo-server-sdk-node)

