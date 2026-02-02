# 🔔 Community Feed Notifications - Troubleshooting Guide

## Why Community Feed Notifications May Not Be Sent

Community feed notifications are implemented and working, but they may not be sent due to several reasons. This guide helps you diagnose and fix the issue.

---

## ✅ What's Already Implemented

1. ✅ **Notification Functions**: `sendCommunityFeedCommentNotification()` and `sendCommunityFeedLikeNotification()` exist in `notificationHelpers.js`
2. ✅ **Integration**: Both functions are called in `CommunityFeedScreen.js` when users comment or like posts
3. ✅ **User Preference Checking**: Notifications respect user preferences (only sent if enabled)

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend Server Not Running

**Symptom**: Notifications fail silently or you see "Network request failed" errors in console.

**Solution**:
1. **Start the backend server**:
   ```powershell
   cd backend
   npm start
   ```

2. **Verify it's running**:
   - Open browser: `http://localhost:3001/api/health`
   - Should see: `{"status":"ok"}`

3. **For physical devices**: If testing on a real device (not emulator), replace `localhost` with your computer's IP address in `.env`:
   ```env
   EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://192.168.1.XXX:3001
   ```

**Check logs**: After adding better logging (see below), you'll see detailed error messages in the console.

---

### Issue 2: User Notification Preferences Disabled

**Symptom**: Notifications are skipped silently. In console, you'll see: `"Skipping notification to user XXX - preference disabled"`

**Solution**:
1. **Check user's notification settings** in Firestore:
   - Go to `users/{userId}` document
   - Check `notificationSettings.pushNotifications` (must be `true`)
   - Check `notificationSettings.messageNotifications` (must be `true`)

2. **Enable in app**:
   - User should go to Settings → Notifications
   - Enable "Push Notifications" (master switch)
   - Enable "Message Notifications" (for community feed)

3. **Default behavior**: If `notificationSettings` doesn't exist, defaults are used (all enabled by default).

---

### Issue 3: No Push Tokens Registered

**Symptom**: Console shows: `"No push tokens found for specified users"`

**Solution**:
1. **User must grant notification permissions**:
   - App should request notification permissions on first launch
   - User must allow notifications

2. **Check if token is registered**:
   - Go to Firestore: `users/{userId}`
   - Check `pushTokens` array - should contain Expo push tokens like `["ExpoPushToken[xxx]"]`

3. **If no tokens**:
   - User should go to Settings → Notifications
   - Toggle "Push Notifications" off and on again
   - This triggers token registration

4. **Physical device required**: Push notifications don't work in simulators/emulators. Must test on a real device.

---

### Issue 4: Network Connectivity Issues

**Symptom**: "Network request failed" or "Cannot connect to backend server"

**Solution**:
1. **For localhost (emulator/simulator)**:
   - Use: `http://localhost:3001`

2. **For physical device**:
   - Cannot use `localhost` (device can't reach your computer's localhost)
   - Use your computer's IP address:
     ```env
     EXPO_PUBLIC_NOTIFICATION_BACKEND_URL=http://192.168.1.XXX:3001
     ```
   - Find your IP: 
     - Windows: `ipconfig` (look for IPv4 Address)
     - Mac/Linux: `ifconfig` or `ip addr`

3. **Firewall**: Ensure firewall allows connections on port 3001

4. **Same network**: Device and computer must be on the same Wi-Fi network

---

### Issue 5: Like Notifications Only Sent for First Like

**This is by design!** Like notifications are only sent when someone likes a post for the first time (when `likesCount === 1`). This prevents notification spam.

**If you want to test**:
- Create a new post
- Have someone else like it (first like)
- You should receive a notification
- Subsequent likes won't trigger notifications

---

## 🔍 How to Debug

### Step 1: Check Console Logs

After the recent update, you'll see detailed logs:

**For Comments**:
```
✅ Comment notification sent successfully: { success: true, sent: 1, ... }
⚠️ Comment notification failed: No users have this notification type enabled
   - 1 user(s) skipped due to preferences
   - No push tokens found for user
```

**For Likes**:
```
✅ Like notification sent successfully: { success: true, sent: 1, ... }
⚠️ Like notification failed: No push tokens found for specified users
ℹ️ Skipping like notification - not first like (count: 2)
```

### Step 2: Check User Preferences

In Firestore, check the post author's user document:
```javascript
users/{postAuthorId}
  - notificationSettings.pushNotifications: true
  - notificationSettings.messageNotifications: true
  - pushTokens: ["ExpoPushToken[xxx]", ...]
```

### Step 3: Test Backend Connection

```powershell
# Test if backend is reachable
curl http://localhost:3001/api/health

# Should return: {"status":"ok"}
```

### Step 4: Verify Notification Flow

1. **User A** creates a post
2. **User B** comments on User A's post
3. **Check console** for notification logs
4. **Check Firestore** - User A's document should have push tokens
5. **Check User A's notification settings** - should be enabled

---

## 📋 Quick Checklist

Before reporting an issue, verify:

- [ ] Backend server is running (`http://localhost:3001/api/health` works)
- [ ] Post author has `pushNotifications: true` in Firestore
- [ ] Post author has `messageNotifications: true` in Firestore
- [ ] Post author has at least one push token in `pushTokens` array
- [ ] Testing on a physical device (not simulator/emulator)
- [ ] If on physical device, using computer's IP address (not localhost)
- [ ] Commenter is NOT the post author (won't notify yourself)
- [ ] For likes, it's the FIRST like (count === 1)
- [ ] Check console logs for detailed error messages

---

## 🛠️ Testing Steps

### Test Comment Notification:

1. **User A** (with notifications enabled):
   - Go to Settings → Notifications
   - Ensure "Push Notifications" and "Message Notifications" are ON
   - Create a post in Community Feed

2. **User B** (different user):
   - Comment on User A's post
   - Check console for logs

3. **User A** should receive notification:
   - "User B commented on your post"

### Test Like Notification:

1. **User A** creates a new post (0 likes)

2. **User B** likes the post (first like)
   - Check console for logs
   - User A should receive: "User B liked your post"

3. **User C** likes the same post (second like)
   - No notification sent (by design)

---

## 🔧 If Still Not Working

1. **Check all console logs** - they now provide detailed information
2. **Verify backend is accessible** from your device
3. **Check Firestore** - ensure user documents have correct settings
4. **Test with a different user** - rule out user-specific issues
5. **Check Expo Push Notification Service status** - service might be down

---

## 📝 Additional Notes

- **Comment notifications**: Sent every time someone comments (except if commenting on own post)
- **Like notifications**: Only sent for the first like to prevent spam
- **Notification type**: Community feed uses `'message'` notification type, so it requires `messageNotifications` to be enabled
- **Master switch**: Even if `messageNotifications` is enabled, if `pushNotifications` (master switch) is off, no notifications will be sent

---

## 🆘 Need More Help?

If notifications still don't work after checking all the above:

1. Share the console logs (with the new detailed logging)
2. Share the user's Firestore document (anonymized)
3. Confirm backend server is running and accessible
4. Confirm you're testing on a physical device

