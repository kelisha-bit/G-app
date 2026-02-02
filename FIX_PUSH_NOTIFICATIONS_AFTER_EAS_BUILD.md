# 🔧 Fix: Push Notifications Not Working After EAS Build

## 🔴 Problem

Push notifications work in development (Expo Go or dev build) but **stop working** after building with:
```bash
eas build --platform android --profile preview
```

## ✅ Solution: Configure FCM Credentials

**The issue:** EAS builds require **FCM (Firebase Cloud Messaging) credentials** to be configured in the Expo dashboard. These credentials are **NOT automatically included** from your local Firebase setup.

---

## 🚀 Quick Fix (5 Steps)

### Step 1: Enable Cloud Messaging API

1. Go to: https://console.cloud.google.com/apis/library/fcm.googleapis.com
2. Select your project: `greater-works-city-churc-4a673`
3. Click **"Enable"** if not already enabled

### Step 2: Create Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `greater-works-city-churc-4a673`
3. Click ⚙️ (gear icon) → **Project settings**
4. Go to **"Service accounts"** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** in the dialog
7. **Save the downloaded JSON file** (e.g., `greater-works-city-churc-4a673-firebase-adminsdk-xxxxx.json`)

### Step 3: Verify google-services.json

1. Still in Firebase Console → Project Settings → **General** tab
2. Scroll to **"Your apps"** section
3. Find Android app with package: `com.gwcc.app`
4. If missing, click **"Add app"** → Android → Enter package: `com.gwcc.app`
5. **Download `google-services.json`** if you haven't already
6. Make sure it's in your project root: `./google-services.json`
7. Verify `app.json` has:
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

### Step 4: Upload FCM Credentials to Expo Dashboard

**Option A: Via Expo Dashboard (Easiest)**

1. Go to: https://expo.dev/accounts/elishak/projects/greater-works-city-church/credentials
   - Replace `[your-account]` with your Expo username
2. Find **"Android Push Notifications"** section
3. Click **"Add FCM Server Key"** or **"Configure"**
4. **Upload the Service Account JSON file** you downloaded in Step 2
   - **Important:** Upload the entire JSON file, not just a key
5. Click **"Save"** or **"Update"**

**Option B: Via EAS CLI**

```powershell
# Run credentials manager
eas credentials

# Select:
# 1. Android
# 2. Push Notifications
# 3. Add FCM Server Key
# 4. Upload the Service Account JSON file
```

### Step 5: Rebuild Your App

**⚠️ CRITICAL:** You **MUST rebuild** after adding FCM credentials. The credentials are baked into the app during build time.

```bash
# Rebuild preview build
eas build --platform android --profile preview

# Wait for build to complete (10-20 minutes)
# Download and install the new APK
```

---

## 🔍 Verify FCM Credentials Are Set

### Check Expo Dashboard

1. Go to: https://expo.dev/accounts/[your-account]/projects/greater-works-city-church/credentials
2. Look for **"Android Push Notifications"**
3. Should show: **"FCM Server Key configured"** ✅

### Or Use EAS CLI

```powershell
eas credentials
# Select: Android → View credentials
# Check that FCM Server Key is present
```

---

## 🧪 Test After Rebuild

1. **Install the new APK** on your Android device
2. **Open the app** and log in
3. **Enable push notifications** (if prompted)
4. **Check for errors:**
   - Open app logs (if using development build)
   - Check Firebase Console → Authentication → Users
   - Verify push token is saved in Firestore `users` collection

5. **Send a test notification:**
   - Use Firebase Console → Cloud Messaging → Send test message
   - Or use your backend service
   - **Expected:** Notification should appear on device ✅

---

## 🐛 Common Issues & Solutions

### Issue 1: "FirebaseApp is not initialized" Error

**Cause:** FCM credentials not configured in Expo dashboard

**Solution:**
- Follow Steps 1-4 above to configure FCM credentials
- Rebuild the app (Step 5)

### Issue 2: "FCM credentials not configured" Error

**Cause:** Service Account JSON not uploaded to Expo dashboard

**Solution:**
- Verify you uploaded the **entire Service Account JSON file** (not just a key)
- Check Expo dashboard shows FCM credentials are configured
- Rebuild the app

### Issue 3: Notifications Work in Dev but Not in Production Build

**Cause:** FCM credentials only configured locally, not in Expo dashboard

**Solution:**
- EAS builds run in the cloud and don't have access to your local Firebase config
- You **must** upload FCM credentials to Expo dashboard
- Rebuild after uploading

### Issue 4: "Legacy API is disabled"

**Cause:** Using old FCM Server Key method (deprecated)

**Solution:**
- Use **HTTP v1 API** with Service Account JSON (as shown in this guide)
- Don't use the old "Server Key" method

### Issue 5: google-services.json Missing or Wrong

**Cause:** `google-services.json` not in project or package name mismatch

**Solution:**
1. Download `google-services.json` from Firebase Console
2. Place in project root: `./google-services.json`
3. Verify `app.json` references it: `"googleServicesFile": "./google-services.json"`
4. Check package name in `google-services.json` matches `com.gwcc.app` in `app.json`
5. Rebuild

### Issue 6: Notifications Still Not Working After Rebuild

**Checklist:**
- [ ] FCM credentials uploaded to Expo dashboard
- [ ] `google-services.json` in project root and referenced in `app.json`
- [ ] Rebuilt app after adding credentials
- [ ] Installed new build (not old one)
- [ ] Notification permissions granted on device
- [ ] Testing on physical device (not emulator)
- [ ] Internet connection active
- [ ] Firebase project active and billing enabled (if required)

**Debug Steps:**
1. Check app logs for FCM errors
2. Verify push token is saved in Firestore
3. Test with Firebase Console → Cloud Messaging → Send test message
4. Check Android Settings → Apps → Your App → Notifications (channels should exist)

---

## 📋 Complete Checklist

Before building:
- [ ] Cloud Messaging API enabled in Google Cloud Console
- [ ] Service Account created in Firebase Console
- [ ] Service Account JSON key downloaded
- [ ] `google-services.json` downloaded and in project root
- [ ] `app.json` references `googleServicesFile: "./google-services.json"`
- [ ] FCM credentials uploaded to Expo dashboard
- [ ] Verified credentials in Expo dashboard

After building:
- [ ] Rebuilt app with `eas build --platform android --profile preview`
- [ ] Installed new APK on device
- [ ] Tested push notifications
- [ ] Verified push token saved in Firestore
- [ ] Notifications working ✅

---

## 🔑 Key Points to Remember

1. **FCM credentials are NOT automatically included** in EAS builds
2. **You MUST upload FCM credentials** to Expo dashboard before building
3. **You MUST rebuild** after adding FCM credentials (they're baked in at build time)
4. **Use HTTP v1 API** (Service Account JSON), not Legacy API (Server Key)
5. **Both files needed:**
   - `google-services.json` (in project, referenced in `app.json`)
   - Service Account JSON (uploaded to Expo dashboard)

---

## 📚 Related Documentation

- **FCM Setup Guide:** `FCM_CREDENTIALS_SETUP.md` (detailed instructions)
- **Android Push Issues:** `ANDROID_PUSH_NOTIFICATION_ISSUES_FOUND.md`
- **Push Notifications Guide:** `PUSH_NOTIFICATIONS_GUIDE.md`
- **Expo FCM Docs:** https://docs.expo.dev/push-notifications/fcm-credentials/

---

## 🆘 Still Not Working?

If notifications still don't work after following all steps:

1. **Check build logs:**
   - Go to EAS dashboard → Your build → View logs
   - Look for FCM-related errors

2. **Verify Service Account permissions:**
   - Service Account should have "Firebase Cloud Messaging API Admin" role
   - Check in Google Cloud Console → IAM & Admin → Service Accounts

3. **Test with Expo Push Notification Tool:**
   - https://expo.dev/notifications
   - Enter your Expo push token
   - Send test notification

4. **Check notification channels:**
   - Android Settings → Apps → Your App → Notifications
   - Should see channels: Default, Event Reminders, Announcements

5. **Review error messages:**
   - Check app logs for specific error messages
   - Error messages in `notificationService.js` provide helpful hints

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No FCM errors in app logs
- ✅ Push token successfully saved to Firestore
- ✅ Test notifications appear on device
- ✅ Notifications work when app is in background/terminated
- ✅ Notification channels visible in Android Settings

---

**Most Common Fix:** Upload FCM credentials to Expo dashboard and rebuild! 🚀

