# 🔑 FCM Credentials Setup for Android Push Notifications

## ⚠️ Error You're Seeing

```
Default FirebaseApp is not initialized in this process com.gwcc.app. 
Make sure to call FirebaseApp.initializeApp(Context) first.
```

This error occurs because **FCM (Firebase Cloud Messaging) credentials are not configured** in your Expo project for Android push notifications.

---

## ✅ Solution: Configure FCM Credentials (HTTP v1 API)

**⚠️ Important:** The Legacy API is deprecated. You must use the **HTTP v1 API** with a Service Account key.

### Step 1: Enable Cloud Messaging API (HTTP v1)

1. **Enable the API:**
   - Go to: https://console.cloud.google.com/apis/library/fcm.googleapis.com
   - Select your project: `greater-works-city-churc-4a673`
   - Click **"Enable"** if it's not already enabled

### Step 2: Create a Service Account

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: `greater-works-city-churc-4a673`

2. **Navigate to Project Settings:**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

3. **Go to Service Accounts Tab:**
   - Click on the "Service accounts" tab
   - You should see a section for "Firebase Admin SDK"

4. **Generate New Private Key:**
   - Click **"Generate new private key"** button
   - A dialog will appear warning about keeping the key secure
   - Click **"Generate key"**
   - A JSON file will download automatically (e.g., `greater-works-city-churc-4a673-firebase-adminsdk-xxxxx.json`)

5. **Save the JSON file securely:**
   - This file contains your Service Account credentials
   - **Keep it secure** - don't commit it to git
   - You'll need this file for the next step

### Step 3: Download google-services.json

1. **Still in Firebase Console → Project Settings:**
   - Click on the "General" tab (if not already there)
   - Scroll down to "Your apps" section

2. **Find or Create Android App:**
   - Look for an Android app with package name: `com.gwcc.app`
   - **If it doesn't exist**, click "Add app" → Select Android icon
   - Enter package name: `com.gwcc.app`
   - Register the app

3. **Download google-services.json:**
   - Click the "Download google-services.json" button
   - Save this file in your project root directory
   - You'll reference it in `app.json` in the next step

---

### Step 4: Add google-services.json to Your Project

1. **Place the file in your project:**
   - Copy the downloaded `google-services.json` to your project root directory
   - It should be at: `./google-services.json`

2. **Update app.json:**
   - Open `app.json`
   - Add the `googleServicesFile` reference in the Android section:

```json
{
  "expo": {
    "android": {
      "package": "com.gwcc.app",
      "googleServicesFile": "./google-services.json",
      // ... rest of your android config
    }
  }
}
```

### Step 5: Upload Service Account Key to Expo Dashboard

1. **Go to Expo Dashboard:**
   - Visit: https://expo.dev/accounts/elishak/projects/greater-works-city-church/credentials
   - Or navigate: https://expo.dev → Your Account → Projects → greater-works-city-church → Credentials

2. **Find Android Push Notifications Section:**
   - Look for "Android Push Notifications" or "FCM Credentials"
   - Click "Add FCM Server Key" or "Configure"

3. **Upload Service Account JSON:**
   - **For HTTP v1 API:** Upload the entire Service Account JSON file (not just a server key)
   - Click "Upload" or "Choose File"
   - Select the JSON file you downloaded (e.g., `greater-works-city-churc-4a673-firebase-adminsdk-xxxxx.json`)
   - Click "Save" or "Update"

**Alternative Method (Using EAS CLI):**

```powershell
# Set FCM credentials using EAS CLI
eas credentials
# Select: Android → Push Notifications → Add FCM Server Key
# When prompted, upload the Service Account JSON file
```

---

### Step 6: Rebuild Your App

After adding FCM credentials, you **must rebuild** your app for the changes to take effect:

```powershell
# Rebuild development build
eas build --platform android --profile development

# OR rebuild preview build
eas build --platform android --profile preview
```

**Important:** The FCM credentials are baked into the app during build time, so you need a new build after adding them.

---

## 🔍 Verify FCM Credentials Are Set

1. **Check Expo Dashboard:**
   - Go to: https://expo.dev/accounts/elishak/projects/greater-works-city-church/credentials
   - Verify "Android Push Notifications" shows your FCM server key is configured

2. **Or use EAS CLI:**
   ```powershell
   eas credentials
   # Select: Android → View credentials
   # Check that FCM Server Key is present
   ```

---

## 📱 After Rebuilding

1. **Install the new build** on your Android device
2. **Open the app** and log in
3. **Enable push notifications** in Settings
4. **The error should be gone!** ✅

---

## 🆘 Troubleshooting

### "I can't find the Service Account section"

**Solution:**
1. Make sure you're in the correct Firebase project
2. Navigate to: Project Settings → Service accounts tab
3. If you don't see "Generate new private key":
   - Make sure you have the correct permissions in Firebase
   - Try refreshing the page

### "Error persists after adding credentials"

**Possible causes:**
1. **Didn't rebuild:** You MUST rebuild after adding credentials
2. **Wrong file:** Make sure you uploaded the entire Service Account JSON file (not just a key)
3. **Wrong project:** Verify the Service Account is from the same Firebase project as your app
4. **Missing google-services.json:** Make sure `google-services.json` is in your project root and referenced in `app.json`
5. **Package name mismatch:** Verify the package name in `google-services.json` matches `com.gwcc.app` in your `app.json`

### "Legacy API is disabled - what do I do?"

**You're seeing this message because:**
- The Legacy API was deprecated on June 20, 2024
- You must use HTTP v1 API with Service Account credentials

**Solution:**
- Follow this guide - it uses HTTP v1 API (Service Account) instead of Legacy (Server Key)
- The Service Account JSON file is what you need, not a server key

---

## 📚 Additional Resources

- **Expo FCM Setup Guide:** https://docs.expo.dev/push-notifications/fcm-credentials/
- **Firebase Console:** https://console.firebase.google.com/project/greater-works-city-churc-4a673
- **Expo Dashboard:** https://expo.dev/accounts/elishak/projects/greater-works-city-church

---

## ✅ Quick Checklist

- [ ] Enabled Cloud Messaging API (HTTP v1) in Google Cloud Console
- [ ] Created Service Account in Firebase Console → Project Settings → Service accounts
- [ ] Downloaded Service Account JSON key file
- [ ] Downloaded `google-services.json` from Firebase Console
- [ ] Added `google-services.json` to project root
- [ ] Updated `app.json` to reference `googleServicesFile: "./google-services.json"`
- [ ] Uploaded Service Account JSON to Expo Dashboard → Credentials → Android Push Notifications
- [ ] Rebuilt the app (`eas build --platform android --profile development`)
- [ ] Installed new build on device
- [ ] Tested push notifications - error should be gone!

---

**Need help?** The error message will disappear once FCM credentials are properly configured and you've rebuilt the app.

