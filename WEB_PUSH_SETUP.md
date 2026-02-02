# 🌐 Web Push Notifications Setup Guide

## Overview

This guide outlines how to implement push notifications for **web builds** using the **Web Push API**. This is separate from the native iOS/Android push notifications already implemented.

---

## 📋 Current Status

- ✅ **Native Push Notifications**: Working on iOS & Android (expo-notifications)
- ❌ **Web Push Notifications**: Not implemented (requires different API)
- ✅ **Web Notification API**: Can be used for in-browser notifications (simpler, no push)

---

## 🎯 Two Approaches for Web Notifications

### Option 1: Web Push API (Full Push Notifications)
- **Requires**: Service Worker + Push API + Backend service
- **Works**: Even when browser tab is closed
- **Complexity**: High (requires server-side push service)
- **Best for**: Production apps needing true push notifications

### Option 2: Browser Notification API (Simple Notifications)
- **Requires**: Just browser Notification API
- **Works**: Only when browser tab is open/active
- **Complexity**: Low (client-side only)
- **Best for**: In-app notifications, reminders while user is active

---

## 🚀 Implementation Outline: Web Push API (Option 1)

### Step 1: Service Worker Setup

1. **Create Service Worker file:**
   - Location: `public/service-worker.js` (or `web-build/service-worker.js`)
   - Purpose: Handle push events and display notifications

2. **Register Service Worker:**
   - Add registration code to `App.js` or a web-specific entry point
   - Must use HTTPS (or localhost for development)

3. **Service Worker Features:**
   - Listen for `push` events
   - Display notifications using `showNotification()`
   - Handle notification clicks
   - Manage notification badges

### Step 2: Web Push Credentials Setup

1. **Generate VAPID Keys:**
   - Use Web Push protocol (not FCM)
   - Can reuse existing VAPID keys from Firebase/Expo
   - Or generate new ones: `npx web-push generate-vapid-keys`

2. **Backend Service Configuration:**
   - Configure backend to send Web Push notifications
   - Use `web-push` library (Node.js) or equivalent
   - Store subscription endpoints in database

### Step 3: Subscription Management

1. **Request Notification Permission:**
   ```javascript
   if ('Notification' in window) {
     const permission = await Notification.requestPermission();
   }
   ```

2. **Subscribe to Push Service:**
   ```javascript
   const registration = await navigator.serviceWorker.ready;
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: VAPID_PUBLIC_KEY
   });
   ```

3. **Send Subscription to Backend:**
   - Save subscription object (endpoint + keys) to Firebase/backend
   - Associate with user account
   - Store alongside Expo push tokens

### Step 4: Backend Integration

1. **Send Web Push from Backend:**
   - Use `web-push` library (Node.js)
   - Send to subscription endpoint with VAPID credentials
   - Format notification payload

2. **Unified Push Service:**
   - Check platform (iOS/Android vs Web)
   - Route to Expo Push API (native) or Web Push API (web)
   - Maintain same notification content for all platforms

### Step 5: Update Notification Service

1. **Extend `notificationService.js`:**
   - Add web platform detection
   - Implement Web Push subscription for web
   - Maintain compatibility with native implementation

2. **Unified API:**
   - Same methods (`registerForPushNotifications()`, etc.)
   - Different implementation based on `Platform.OS`

---

## 📝 Implementation Outline: Browser Notification API (Option 2 - Simpler)

### Step 1: Update Notification Service

1. **Add Web Notification Support:**
   ```javascript
   // In notificationService.js
   async registerForPushNotifications() {
     if (Platform.OS === 'web') {
       // Use Browser Notification API
       const permission = await Notification.requestPermission();
       // Store permission status
       return { success: permission === 'granted', ... };
     }
     // Existing native implementation...
   }
   ```

2. **Show Local Notifications:**
   ```javascript
   // For web, show notifications directly
   if (Platform.OS === 'web' && Notification.permission === 'granted') {
     new Notification(title, { body, icon, data });
   }
   ```

### Step 2: Limitations

- ❌ **No background push**: Only works when tab is open
- ❌ **No server-to-device**: Can't send notifications from backend
- ✅ **Simple**: Easy to implement, no backend changes needed
- ✅ **Instant**: Works immediately for in-app notifications

---

## 🔧 Recommended Approach: Hybrid Solution

### Phase 1: Browser Notification API (Quick Win)
- Implement simple browser notifications for web
- Works immediately, no backend changes
- Good for in-app notifications, reminders

### Phase 2: Full Web Push API (Later)
- Add Service Worker for background push
- Implement backend Web Push service
- Full push notification support

---

## 📁 Files to Create/Modify

### Files to Create:
- `public/service-worker.js` - Service Worker for push events
- `src/utils/webPushService.js` - Web Push-specific utilities (if separate)
- `.env` additions - VAPID public key

### Files to Modify:
- `src/utils/notificationService.js` - Add web platform support
- `App.js` - Service Worker registration (web only)
- `public/index.html` - Service Worker registration script
- Backend service - Add Web Push sending capability

---

## 🔑 Key Differences: Native vs Web Push

| Feature | Native (iOS/Android) | Web Push |
|---------|---------------------|----------|
| **API** | expo-notifications | Web Push API |
| **Credentials** | FCM (Android), APNS (iOS) | VAPID keys |
| **Service Worker** | Not needed | Required |
| **Background** | ✅ Works when app closed | ✅ Works when tab closed |
| **Setup** | Expo/FCM configuration | Service Worker + VAPID |
| **Backend** | Expo Push API | Web Push API or web-push library |

---

## 🚦 Implementation Checklist

### For Browser Notification API (Simple):
- [ ] Update `notificationService.js` to handle web platform
- [ ] Add `Notification.requestPermission()` for web
- [ ] Implement `showNotification()` for web
- [ ] Test in browser
- [ ] Handle notification clicks (optional)

### For Full Web Push API (Advanced):
- [ ] Create `service-worker.js`
- [ ] Register Service Worker in `App.js` (web only)
- [ ] Generate VAPID keys
- [ ] Implement push subscription in `notificationService.js`
- [ ] Update backend to send Web Push notifications
- [ ] Test subscription flow
- [ ] Test push from backend
- [ ] Handle notification clicks and navigation

---

## 📚 Resources

- **Web Push API Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- **Service Worker Guide**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **web-push Library**: https://github.com/web-push-libs/web-push
- **Expo Web Config**: https://docs.expo.dev/workflow/web/

---

## ⚠️ Important Notes

1. **HTTPS Required**: Web Push API requires HTTPS (except localhost)
2. **Service Worker Scope**: Service Worker must be in root or subdirectory
3. **Browser Support**: Modern browsers only (Chrome, Firefox, Edge, Safari 16+)
4. **User Permission**: Must request notification permission from user interaction
5. **VAPID Keys**: Generate once, use same keys for all users

---

## 🎯 Next Steps

**To implement Browser Notification API (simple):**
1. Start with modifying `notificationService.js`
2. Add web platform checks
3. Implement basic notification display

**To implement Full Web Push API:**
1. Start with Service Worker setup
2. Generate VAPID keys
3. Implement subscription flow
4. Update backend service

Would you like me to start implementing one of these approaches?

