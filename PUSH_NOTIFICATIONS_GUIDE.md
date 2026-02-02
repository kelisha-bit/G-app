# 🔔 Push Notifications Implementation Guide

## Overview

This guide explains the complete push notification system implemented for the Greater Works City Church app.

## ✅ What's Implemented

### 1. **Notification Service** (`src/utils/notificationService.js`)
- Complete notification management system
- Permission handling
- Token registration and storage in Firebase
- Local notification scheduling
- Event reminder scheduling (24h and 1h before events)
- Notification listeners for foreground and background
- Badge management

### 2. **Notification Helpers** (`src/utils/notificationHelpers.js`)
- Functions for sending notifications to all users
- Functions for sending notifications to specific users
- Helper functions for announcements, sermons, events, messages, and prayer requests

### 3. **App Integration** (`App.js`)
- Automatic notification registration on login
- Notification listeners setup
- Navigation integration for notification taps
- Token cleanup on logout

### 4. **Notification Settings Screen** (`src/screens/NotificationScreen.js`)
- User preference management
- Permission request handling
- Visual feedback for permission status

### 5. **Event Reminders** (`src/screens/EventDetailsScreen.js`)
- Automatic reminder scheduling when viewing events
- Respects user notification preferences

## 🚀 How It Works

### For Users

1. **First Time Setup**
   - When user logs in, the app automatically requests notification permissions
   - Device token is registered and saved to Firebase
   - User can manage preferences in Settings → Notifications

2. **Event Reminders**
   - When viewing an event, reminders are automatically scheduled
   - 24-hour reminder: "Don't forget about [Event] tomorrow!"
   - 1-hour reminder: "[Event] starts in 1 hour!"
   - Only scheduled if user has event reminders enabled

3. **Notification Preferences**
   - Users can toggle different notification types:
     - Push Notifications (master switch)
     - Event Reminders
     - Prayer Request Updates
     - Message Notifications
     - Sermon Notifications
     - Announcement Notifications
     - Weekly Digest

### For Developers/Admins

#### Sending Notifications

**To All Users:**
```javascript
import { sendAnnouncementNotification } from '../utils/notificationHelpers';

// When creating a new announcement
await sendAnnouncementNotification({
  id: announcementId,
  title: 'Important Update',
  // ... other announcement data
});
```

**To Specific Users:**
```javascript
import { sendMessageNotification } from '../utils/notificationHelpers';

await sendMessageNotification(
  { id: messageId, subject: 'Hello' },
  recipientUserId
);
```

**Scheduling Local Notifications:**
```javascript
import notificationService from '../utils/notificationService';

// Immediate notification
await notificationService.sendImmediateNotification(
  'Title',
  'Body text',
  { type: 'custom', screen: 'Home' }
);

// Scheduled notification
await notificationService.scheduleLocalNotification(
  'Event Reminder',
  'Don\'t forget!',
  { eventId: '123' },
  new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
);
```

## 📱 Configuration

### app.json
The app is configured with:
- Expo Notifications plugin
- Custom notification icon and color
- Default notification sound

### Firebase
User documents store:
- `pushTokens`: Array of Expo push tokens
- `notificationSettings`: User preferences object
- `lastTokenUpdate`: Timestamp of last token update

## 🔧 Backend Integration

### ✅ Status: COMPLETE

The backend service has been created and notification helpers have been updated to use it.

### Backend Service Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env` (if not already done)
   - Set `PORT` (default: 3001)
   - Set `NODE_ENV` (development/production)

3. **Start the Server**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

4. **Configure Mobile App**
   - Add to your `.env` file:
     ```
     EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://localhost:3001
     ```
   - For production, set to your deployed backend URL (e.g., `https://your-backend.herokuapp.com`)

### Backend API Endpoints

- **POST `/api/notifications/send`**: Send notifications to specified tokens
- **POST `/api/notifications/broadcast`**: Broadcast to multiple devices
- **GET `/api/health`**: Health check endpoint

See `backend/README.md` for complete API documentation.

### How It Works

1. Mobile app calls notification helper functions (e.g., `sendAnnouncementNotification()`)
2. Helper functions collect push tokens from Firebase
3. Helper functions make HTTP request to backend API
4. Backend uses `expo-server-sdk` to send notifications via Expo Push Notification Service
5. Results are returned to the mobile app

### Fallback Behavior

- If backend is unavailable, the app falls back to local notifications in development mode
- This ensures notifications still work during development even without the backend running

## 🧪 Testing

### Local Testing
- **⚠️ IMPORTANT**: Android push notifications require a development build (Expo Go doesn't support them in SDK 53+)
- Local notifications work immediately for local notifications
- Test event reminders by viewing upcoming events
- Check notification settings screen for permission status

### Production Testing
1. **Build a development build** with EAS Build (required for Android push notifications):
   ```bash
   eas build --platform android --profile development
   ```
2. Install on physical device (notifications don't work in simulator)
3. Test notification permissions
4. Test event reminders
5. Test notification taps and navigation

**Note**: See `PUSH_NOTIFICATIONS_NEXT_STEPS.md` for detailed testing instructions with development builds.

## 📋 Notification Types

### 1. Event Reminders
- **When**: Automatically scheduled when viewing events
- **Timing**: 24h and 1h before event
- **Requires**: `eventReminders` and `pushNotifications` enabled

### 2. Announcements
- **When**: Admin creates new announcement
- **How**: Use `sendAnnouncementNotification()`
- **Requires**: `announcementNotifications` enabled

### 3. Sermons
- **When**: Admin uploads new sermon
- **How**: Use `sendSermonNotification()`
- **Requires**: `sermonNotifications` enabled

### 4. Messages
- **When**: User receives new message
- **How**: Use `sendMessageNotification()`
- **Requires**: `messageNotifications` enabled

### 5. Prayer Requests
- **When**: Someone prays for user's request
- **How**: Use `sendPrayerUpdateNotification()`
- **Requires**: `prayerRequestUpdates` enabled

## 🔐 Permissions

### iOS
- Requires user permission
- Configured in app.json
- User can change in iOS Settings

### Android
- Requires user permission
- Notification channels configured:
  - `default`: General notifications
  - `events`: Event reminders
  - `announcements`: Announcements (high priority)

## 🐛 Troubleshooting

### Notifications Not Working

1. **Check Permissions**
   ```javascript
   const hasPermission = await notificationService.checkPermissions();
   ```

2. **Check Token Registration**
   - Token should be saved in Firebase user document
   - Check `pushTokens` array in Firestore

3. **Check User Settings**
   - Verify `notificationSettings.pushNotifications` is true
   - Verify specific notification type is enabled

4. **Physical Device Required**
   - Push notifications don't work in simulators/emulators
   - Must test on physical device

5. **Expo Go Limitation (SDK 53+)**
   - **Android push notifications DO NOT work in Expo Go** starting with SDK 53
   - You **MUST** use a development build or production build for Android
   - iOS: Expo Go still works, but development builds are recommended
   - See `PUSH_NOTIFICATIONS_NEXT_STEPS.md` for development build instructions

6. **Check Expo Project ID**
   - Ensure project ID in `notificationService.js` matches `app.json`

### Event Reminders Not Scheduling

1. Check user has `eventReminders` enabled
2. Check user has `pushNotifications` enabled
3. Verify event date is in the future
4. Check console for errors

## 📚 Next Steps

### To Complete Production Setup:

1. **✅ Backend Service** (COMPLETE)
   - ✅ Node.js/Express server created in `backend/` directory
   - ✅ `expo-server-sdk` installed and configured
   - ✅ Endpoints created for sending notifications
   - ✅ See `backend/README.md` for setup instructions

2. **✅ Notification Helpers Updated** (COMPLETE)
   - ✅ Replaced console.log with API calls to backend
   - ✅ Added error handling and fallback to local notifications
   - ✅ Configured via `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` environment variable

3. **Add Notification Analytics**
   - Track notification delivery
   - Track notification opens
   - Track user engagement

4. **Add Rich Notifications**
   - Images in notifications
   - Action buttons
   - Custom sounds

5. **Add Notification History**
   - Store sent notifications
   - Allow users to view notification history

## 🎯 Best Practices

1. **Respect User Preferences**
   - Always check user settings before sending
   - Provide easy way to manage preferences

2. **Don't Spam**
   - Limit notification frequency
   - Group related notifications
   - Use digest option for less urgent items

3. **Make Notifications Actionable**
   - Include relevant data for navigation
   - Use clear, concise messaging
   - Provide context

4. **Test Thoroughly**
   - Test on both iOS and Android
   - Test with different permission states
   - Test notification taps and navigation

## 📞 Support

For issues or questions:
1. Check console logs for errors
2. Verify Firebase configuration
3. Check Expo documentation: https://docs.expo.dev/push-notifications/overview/
4. Review notification service code in `src/utils/notificationService.js`

---

**Status**: ✅ Complete - Backend service implemented  
**Backend**: See `backend/README.md` for setup and deployment instructions

