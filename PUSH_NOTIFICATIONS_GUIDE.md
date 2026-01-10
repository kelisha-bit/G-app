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

## 🔧 Backend Integration (Required for Production)

### Current Status
The notification helpers prepare notification data but require a backend service to actually send push notifications via Expo Push Notification Service.

### What You Need

1. **Backend Service** (Node.js/Express recommended)
   - Endpoint to receive notification requests
   - Use Expo Push API to send notifications
   - Handle token validation and cleanup

2. **Expo Push API Integration**
   ```javascript
   // Example backend endpoint
   const { Expo } = require('expo-server-sdk');
   const expo = new Expo();

   async function sendPushNotification(tokens, title, body, data) {
     const messages = tokens.map(token => ({
       to: token,
       sound: 'default',
       title,
       body,
       data,
     }));

     const chunks = expo.chunkPushNotifications(messages);
     for (let chunk of chunks) {
       await expo.sendPushNotificationsAsync(chunk);
     }
   }
   ```

3. **Update Notification Helpers**
   - Replace console.log statements with actual API calls to your backend
   - Backend will handle sending via Expo Push API

## 🧪 Testing

### Local Testing
- Notifications work immediately for local notifications
- Test event reminders by viewing upcoming events
- Check notification settings screen for permission status

### Production Testing
1. Build the app with EAS Build
2. Install on physical device (notifications don't work in simulator)
3. Test notification permissions
4. Test event reminders
5. Test notification taps and navigation

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

5. **Check Expo Project ID**
   - Ensure project ID in `notificationService.js` matches `app.json`

### Event Reminders Not Scheduling

1. Check user has `eventReminders` enabled
2. Check user has `pushNotifications` enabled
3. Verify event date is in the future
4. Check console for errors

## 📚 Next Steps

### To Complete Production Setup:

1. **Create Backend Service**
   - Set up Node.js/Express server
   - Install `expo-server-sdk`
   - Create endpoints for sending notifications

2. **Update Notification Helpers**
   - Replace console.log with API calls
   - Add error handling
   - Add retry logic

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

**Status**: ✅ Core implementation complete  
**Next**: Backend service for production push notifications

