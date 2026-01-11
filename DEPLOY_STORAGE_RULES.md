# 🚀 Deploy Firebase Storage Rules - Quick Guide

## ⚠️ Current Issue

You're getting this error:
```
Firebase Storage: User does not have permission to access 'profilePictures/k1fBBw3Wh7cXQWxv2hR0atge89I2/profile.jpg'. (storage/unauthorized)
```

This means the Storage rules haven't been deployed yet, or there's an authentication issue.

---

## ✅ Solution: Deploy Storage Rules

### Option 1: Firebase Console (Easiest - Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account
   - Select your project (e.g., "Greater Works City Church" or "GWCC-Mobil-App")

2. **Navigate to Storage**
   - Click **Storage** in the left sidebar
   - Click on the **Rules** tab at the top

3. **Copy and Paste Rules**
   - Open the `storage.rules` file from your project root
   - Copy ALL the contents
   - Paste into the Rules editor in Firebase Console

4. **Publish**
   - Click **Publish** button
   - Wait for confirmation: "Rules published successfully"

5. **Verify**
   - Check that the rules show as "Published"
   - Try uploading a profile picture again

---

### Option 2: Firebase CLI (If you prefer command line)

#### Step 1: Initialize Firebase (if not done)

```powershell
firebase login
firebase use --add
```

Select your project from the list when prompted.

#### Step 2: Deploy Storage Rules

```powershell
firebase deploy --only storage
```

This will deploy the `storage.rules` file to your Firebase project.

#### Step 3: Verify

```powershell
firebase storage:rules:get
```

This shows the currently deployed rules.

---

## 🔍 Verify Your Project

If you're not sure which Firebase project your app is using:

1. Check your `.env` file for `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
2. Or check `firebase.config.js` - it uses environment variables
3. Match the project ID with one in the Firebase Console

Common project IDs from your account:
- `greater-works-city-churc-4a673` - "Greater Works City Church"
- `elisha-project-bcca0` - "GWCC-Mobil-App"
- `greater-works-city-churc-8252a` - "Greater-works-city-church"

---

## 🔐 Current Storage Rules

Your `storage.rules` file contains:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - users can upload their own, everyone can read
    match /profilePictures/{userId}/{allPaths=**} {
      allow read: if true;  // Anyone can view profile pictures
      allow write: if request.auth != null && request.auth.uid == userId;  // Users can only upload to their own folder
    }
    
    // Gallery photos - authenticated users can upload, everyone can read
    match /gallery/{albumId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Event images - authenticated users can upload, everyone can read
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Sermons - authenticated users can upload, everyone can read
    match /sermons/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Banner images - authenticated users can upload, everyone can read
    match /banner/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Key Rule for Profile Pictures:**
- ✅ Anyone can **read** (view) profile pictures
- ✅ Users can only **write** (upload) to their own folder (`userId` must match `auth.uid`)

---

## 🧪 Test After Deployment

1. **Try uploading a profile picture again**
2. **Check for errors** - Should work now!
3. **Verify in Firebase Console:**
   - Go to Storage → Files
   - Should see: `profilePictures/{userId}/profile.jpg`

---

## ⚠️ Troubleshooting

### Error: "Rules published but still getting unauthorized"

1. **Check you're logged in** in your app
2. **Verify the user's UID matches** the folder name in Storage
3. **Wait 1-2 minutes** - Rules can take a moment to propagate
4. **Clear app cache** and try again

### Error: "Firebase project not found"

- Make sure you selected the correct project in Firebase Console
- Verify the `EXPO_PUBLIC_FIREBASE_PROJECT_ID` in your `.env` matches

### Error: "Rules syntax error"

- Make sure you copied the ENTIRE `storage.rules` file content
- Check for any typos or missing brackets
- The rules file should start with `rules_version = '2';`

---

## ✅ Success Indicators

After deploying, you should see:
- ✅ No more "storage/unauthorized" errors
- ✅ Profile pictures upload successfully
- ✅ Images appear in Storage → `profilePictures/{userId}/`
- ✅ Download URLs are generated correctly

---

**Next Steps:** Once rules are deployed, try uploading a profile picture again. The error should be resolved! 🎉

