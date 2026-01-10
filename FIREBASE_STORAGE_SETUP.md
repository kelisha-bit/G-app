# 🔐 Firebase Storage Rules Setup Guide

## ⚠️ Important: Storage Rules Required

The Media Gallery feature requires Firebase Storage rules to be configured. Without these rules, photo uploads will fail with "Permission Denied" errors.

---

## 🚀 Quick Setup

### Step 1: Create Storage Rules File

A `storage.rules` file has been created in your project root with the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Gallery photos - authenticated users can upload, everyone can read
    match /gallery/{albumId}/{allPaths=**} {
      allow read: if true;  // Anyone can view gallery photos
      allow write: if request.auth != null;  // Authenticated users can upload
    }
    
    // Event images - authenticated users can upload, everyone can read
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Profile pictures - users can upload their own, everyone can read
    match /profilePictures/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sermons - authenticated users can upload, everyone can read
    match /sermons/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 2: Deploy Storage Rules

#### Option A: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Storage** in the left menu
4. Click on the **Rules** tab
5. Copy the contents of `storage.rules` file
6. Paste into the rules editor
7. Click **Publish**

#### Option B: Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy storage rules
firebase deploy --only storage
```

### Step 3: Verify Rules Are Active

1. Go to Firebase Console → Storage → Rules
2. Verify the rules match the `storage.rules` file
3. Check that rules show "Published" status

---

## 📁 Storage Structure

Your Firebase Storage will be organized as follows:

```
firebasestorage/
├── gallery/
│   ├── album1/
│   │   ├── 1767948647278_nldm75.jpg
│   │   └── 1767948760136_gehu5.jpg
│   └── album2/
│       └── ...
├── events/
│   └── ...
├── profilePictures/
│   └── ...
└── sermons/
    └── ...
```

---

## 🔒 Security Rules Explained

### Gallery Photos (`/gallery/{albumId}/{allPaths=**}`)
- **Read**: Anyone can view (public gallery)
- **Write**: Only authenticated users can upload
- **Path**: `gallery/{albumId}/{filename}`

### Event Images (`/events/{allPaths=**}`)
- **Read**: Anyone can view
- **Write**: Authenticated users can upload
- **Path**: `events/{filename}`

### Profile Pictures (`/profilePictures/{userId}`)
- **Read**: Anyone can view
- **Write**: Users can only upload their own (userId must match)
- **Path**: `profilePictures/{userId}`

### Sermons (`/sermons/{allPaths=**}`)
- **Read**: Anyone can view
- **Write**: Authenticated users can upload
- **Path**: `sermons/{filename}`

---

## ⚠️ Troubleshooting

### Error: "User does not have permission to access 'gallery/...'"

**Solution**:
1. Verify Storage rules are deployed
2. Check that you're logged in
3. Verify the path matches the rules pattern
4. Check Firebase Console → Storage → Rules

### Error: "Missing or insufficient permissions" for photoAlbums

**Solution**:
1. Deploy Firestore rules (already updated in `firestore.rules`)
2. Verify `photoAlbums` collection rules allow read
3. Check Firebase Console → Firestore → Rules

### Error: ImagePicker deprecation warning

**Fixed**: Updated to use `ImagePicker.MediaType.Images` instead of `ImagePicker.MediaTypeOptions.Images`

---

## ✅ Verification Checklist

After deploying rules:

- [ ] Storage rules deployed in Firebase Console
- [ ] Firestore rules deployed (for photoAlbums)
- [ ] Can view gallery photos (read permission)
- [ ] Can upload photos when logged in (write permission)
- [ ] No "Permission Denied" errors in console
- [ ] Photos appear in gallery after upload

---

## 🔄 Updating Rules

If you need to change rules:

1. Edit `storage.rules` file
2. Copy updated rules
3. Go to Firebase Console → Storage → Rules
4. Paste and publish

Or use Firebase CLI:
```bash
firebase deploy --only storage
```

---

**Note**: Storage rules are separate from Firestore rules. Both need to be configured for the Media Gallery to work properly.

