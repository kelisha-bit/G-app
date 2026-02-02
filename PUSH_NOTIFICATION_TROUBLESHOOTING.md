# 🔔 Push Notification Troubleshooting Guide

## Quick Diagnostic Tool

**In Development Mode**: Open Settings → Notifications and tap **"Run Push Notification Diagnostics"** to automatically check for common issues.

Or run this in your code:
```javascript
import { runPushNotificationDiagnostics, printDiagnosticsReport } from './src/utils/pushNotificationDiagnostics';

const diagnostics = await runPushNotificationDiagnostics();
printDiagnosticsReport(diagnostics);
```

---

## Common Issues & Solutions

### ❌ Issue 1: "Android push notifications do not work in Expo Go"

**Symptoms:**
- Error message: "Android push notifications do not work in Expo Go"
- Token registration fails on Android
- No notifications received on Android device

**Solution:**
1. **Build a development build** (required for Android SDK 53+):
   ```bash
   eas build --platform android --profile development
   ```
2. Install the generated APK on your device
3. Test push notifications again

**Why:** Starting with Expo SDK 53, Android push notifications no longer work in Expo Go. You must use a development or production build.

---

### ❌ Issue 2: "FCM credentials not configured"

**Symptoms:**
- Error when getting push token: "FirebaseApp is not initialized" or "FCM credentials"
- Token registration fails on Android
- Error mentions FCM or Firebase credentials

**Solution:**
1. **Get FCM Service Account JSON**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Upload to Expo**:
   - Go to: https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/credentials
   - Click "Add FCM Credentials" or "Android" credentials
   - Upload the downloaded JSON file

3. **Rebuild the app**:
   ```bash
   eas build --platform android --profile preview
   # or for production
   eas build --platform android --profile production
   ```

**Why:** Android requires Firebase Cloud Messaging (FCM) credentials to send push notifications. These must be uploaded to Expo and included in the build.

---

### ❌ Issue 3: "Notification permission not granted"

**Symptoms:**
- No notification permission dialog appears
- Notifications don't show up
- Permission status shows "denied" or "undetermined"

**Solution:**
1. **On Device**:
   - Go to Settings → Apps → Greater Works City Church → Notifications
   - Enable "Allow notifications"
   - Enable all notification categories you want

2. **In App**:
   - Go to Settings → Notifications
   - Toggle "Push Notifications" ON
   - Grant permission when prompted

**Why:** Users must explicitly grant notification permissions. On Android 13+, this is a runtime permission.

---

### ❌ Issue 4: Token not saved to Firebase

**Symptoms:**
- Token registration seems to succeed
- But no token found in Firebase user document
- Notifications don't reach the user

**Solution:**
1. **Check Firebase permissions**:
   - Ensure user is logged in
   - Check Firestore rules allow writing to `users/{userId}`

2. **Check console logs**:
   - Look for "Failed to save token to Firebase" errors
   - Check network connectivity

3. **Manually trigger registration**:
   - Go to Settings → Notifications
   - Toggle "Push Notifications" OFF then ON again
   - This will re-register the token

---

### ❌ Issue 5: "Backend not available"

**Symptoms:**
- Console shows: "Backend not available, falling back to local notification"
- Notifications only work locally, not from backend
- Other users don't receive notifications

**Solution:**
1. **Check Backend Service**:
   ```bash
   cd backend
   npm start
   ```
   - Backend should run on port 3001 (or your configured port)

2. **Check Environment Variable**:
   ```env
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://your-backend-url.com
   ```
   - For local development: `http://localhost:3001` (or your local IP)
   - For production: Your deployed backend URL

3. **Test Backend Health**:
   ```bash
   curl http://localhost:3001/api/health
   ```

**Why:** Push notifications are sent via a backend service. If the backend is down or unreachable, notifications won't be sent to other users.

---

### ❌ Issue 6: Notifications received but not showing

**Symptoms:**
- Console shows notifications being sent successfully
- But no notification appears on device
- Token registration works

**Solution:**
1. **Check Device Settings**:
   - Ensure app is not in battery saver mode
   - Check "Do Not Disturb" is off
   - Verify notification channels are enabled (Android)

2. **Check Notification Channels (Android)**:
   - Settings → Apps → Greater Works City Church → Notifications
   - Enable all channels: "Default", "Events", "Announcements"

3. **Check App State**:
   - Notifications work in background and foreground
   - But may be suppressed if app is in battery saver

4. **Test Local Notification**:
   ```javascript
   await notificationService.sendImmediateNotification(
     'Test',
     'This is a test notification',
     { type: 'test' }
   );
   ```
   - If this works, the issue is with backend/push tokens, not device settings

---

### ❌ Issue 7: Token registration works but notifications don't send

**Symptoms:**
- Token is registered successfully
- Token is saved in Firebase
- But sending notifications fails or doesn't reach device

**Solution:**
1. **Check User Notification Preferences**:
   - User must have `pushNotifications: true` in `notificationSettings`
   - Specific notification type must be enabled (e.g., `announcementNotifications`)

2. **Check Backend Service Logs**:
   - Look for errors in backend console
   - Check if tokens are being received
   - Verify Expo Push API is responding

3. **Verify Token Format**:
   - Token should start with `ExponentPushToken[`
   - Invalid tokens are automatically filtered

4. **Test with Manual Notification**:
   - Use Expo's push notification tool: https://expo.dev/notifications
   - Enter your token and send a test notification
   - If this works, issue is with backend configuration

---

## Step-by-Step Diagnostic Checklist

### ✅ Pre-Flight Checks

- [ ] **Physical Device**: App is installed on a real Android/iOS device (not simulator/emulator)
- [ ] **Development/Production Build**: Not using Expo Go on Android (use development build)
- [ ] **User Logged In**: User is authenticated in the app
- [ ] **Network Connection**: Device has internet connectivity

### ✅ Configuration Checks

- [ ] **Expo Project ID**: Matches in `app.json` and `notificationService.js` (`518717a0-b81e-4a06-a54e-b599f4155c88`)
- [ ] **FCM Credentials** (Android): Uploaded to Expo dashboard
- [ ] **Backend Service**: Running and accessible
- [ ] **Environment Variables**: `EXPO_PUBLIC_NOTIFICATION_BACKEND_URL` set correctly

### ✅ Permission Checks

- [ ] **Device Permissions**: Notifications enabled in device settings
- [ ] **App Permissions**: Permission granted when prompted
- [ ] **User Settings**: `pushNotifications` enabled in app settings
- [ ] **Notification Channels** (Android): All channels enabled

### ✅ Registration Checks

- [ ] **Token Retrieved**: Expo push token retrieved successfully
- [ ] **Token Saved**: Token saved to Firebase `users/{userId}.pushTokens`
- [ ] **Token Valid**: Token format is correct (`ExponentPushToken[...]`)

### ✅ Sending Checks

- [ ] **Backend Reachable**: Backend service responds to requests
- [ ] **User Preferences**: User has notification type enabled
- [ ] **Notification Sent**: Backend successfully sends via Expo API
- [ ] **Device Receives**: Notification appears on device

---

## Testing Commands

### Test Permission Status
```javascript
const hasPermission = await notificationService.checkPermissions();
console.log('Has permission:', hasPermission);
```

### Test Token Registration
```javascript
const result = await notificationService.registerForPushNotifications();
console.log('Registration result:', result);
```

### Test Local Notification
```javascript
await notificationService.sendImmediateNotification(
  'Test Notification',
  'This is a test',
  { type: 'test' }
);
```

### Run Full Diagnostics
```javascript
import { runPushNotificationDiagnostics, printDiagnosticsReport } from './src/utils/pushNotificationDiagnostics';

const diagnostics = await runPushNotificationDiagnostics();
printDiagnosticsReport(diagnostics);
```

---

## Platform-Specific Notes

### Android
- **Requires**: Development/production build (not Expo Go)
- **Requires**: FCM credentials uploaded to Expo
- **Requires**: Android 13+ runtime permission
- **Requires**: Notification channels configured

### iOS
- **Requires**: Physical device (simulator notifications are limited)
- **Requires**: Apple Developer account for production
- **Requires**: APNs certificates configured (via Expo)

---

## Getting Help

If you've tried all the above and notifications still don't work:

1. **Run Diagnostics**: Use the diagnostic tool in Settings → Notifications (dev mode)
2. **Check Console Logs**: Look for error messages in React Native debugger
3. **Check Backend Logs**: Look for errors in backend service console
4. **Verify Token**: Check if token is valid using Expo's notification tool
5. **Test with Expo Tool**: Use https://expo.dev/notifications to send a test notification

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Expo Go (Android) | Build development build: `eas build --platform android --profile development` |
| FCM Credentials | Upload FCM JSON to Expo dashboard, then rebuild |
| No Permission | Enable in device settings + app settings |
| Backend Down | Start backend service: `cd backend && npm start` |
| Token Not Saved | Re-enable notifications in app settings |
| Notifications Disabled | Enable in Settings → Notifications |

---

**Last Updated**: January 2025  
**For detailed backend setup**: See `PUSH_NOTIFICATIONS_GUIDE.md`








