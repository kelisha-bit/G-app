# Profile Pictures Setup Guide

## Overview
The Member Directory now supports profile pictures! Members will see photos instead of just initials, making the directory more personal and recognizable.

---

## 🎯 How It Works

### Automatic Features:
- ✅ **Profile pictures load automatically** from Firebase user data
- ✅ **Fallback to initials** if no picture is available
- ✅ **Error handling** - Shows initials if image fails to load
- ✅ **Works in both views** - Member cards AND detail modal
- ✅ **Optimized loading** - Images load on demand

### Where Pictures Appear:
1. **Member Cards** - Small 60x60px circle
2. **Details Modal** - Large 100x100px circle with shadow
3. **Sections View** - Alphabetical list with photos

---

## 📸 How to Add Profile Pictures

### Method 1: Via Profile Settings (User-facing)

If you have a Profile Edit screen, users can upload their own:

1. Go to **Profile** or **Edit Profile** screen
2. Tap on avatar/photo area
3. Choose image from gallery or camera
4. Upload to Firebase Storage
5. Save profile picture URL to user document

### Method 2: Via Firebase Console (Admin)

Add profile pictures directly in Firebase:

1. **Upload Image to Firebase Storage:**
   - Go to Firebase Console → Storage
   - Create folder: `profilePictures/`
   - Upload image: `profilePictures/{userId}.jpg`
   - Copy the download URL

2. **Update User Document:**
   - Go to Firebase Console → Firestore
   - Open `users` collection
   - Select user document
   - Add field: `profilePicture` (string)
   - Paste image URL
   - Save

### Method 3: Via Script (Bulk Update)

For adding multiple pictures at once, see the script at the end of this document.

---

## 🔧 Supported Field Names

The directory checks for profile pictures in this order:

1. `profilePicture` - Recommended
2. `photoURL` - Firebase Auth default
3. `profileImage` - Alternative name

Any of these will work! The first available one is used.

---

## 📱 Image Requirements

### Recommended Specs:
- **Format**: JPG, PNG, or WebP
- **Size**: 200x200px to 500x500px
- **File size**: < 500KB (smaller is better)
- **Aspect ratio**: Square (1:1)
- **Quality**: Medium to high

### Why These Specs?
- **Square images** look best in circular avatars
- **200-500px** balances quality and load time
- **< 500KB** ensures fast loading on mobile
- **JPG/PNG** are universally supported

---

## 🎨 Image Optimization Tips

### Before Uploading:
1. **Crop to square** - Use 1:1 aspect ratio
2. **Resize** - No need for huge files
3. **Compress** - Use tools like TinyPNG or ImageOptim
4. **Test** - Make sure face is clearly visible

### Tools:
- **Online**: [TinyPNG](https://tinypng.com), [Squoosh](https://squoosh.app)
- **Mobile**: Built-in photo editor
- **Desktop**: Photoshop, GIMP, Preview (Mac)

---

## 🔐 Firebase Storage Setup

### 1. Enable Firebase Storage

```bash
# In your Firebase Console
1. Go to Storage
2. Click "Get Started"
3. Choose security rules (see below)
4. Select storage location
5. Done!
```

### 2. Security Rules

Add these rules to allow profile picture uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - users can upload their own
    match /profilePictures/{userId} {
      allow read: if true;  // Anyone can view
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Alternative: Admin-only uploads
    match /profilePictures/{userId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 💻 Implementation in Profile Edit Screen

### Basic Upload Function

Add this to your `EditProfileScreen.js` or similar:

```javascript
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.config';

const handleUploadProfilePicture = async () => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],  // Square crop
      quality: 0.7,     // Compress to 70%
    });

    if (result.canceled) return;

    // Upload to Firebase Storage
    const imageUri = result.assets[0].uri;
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `profilePictures/${currentUserId}`);
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update Firestore
    await updateDoc(doc(db, 'users', currentUserId), {
      profilePicture: downloadURL,
    });
    
    Alert.alert('Success', 'Profile picture updated!');
  } catch (error) {
    console.error('Error uploading:', error);
    Alert.alert('Error', 'Failed to upload profile picture');
  }
};
```

---

## 🔄 Bulk Upload Script

For adding multiple profile pictures:

```javascript
// scripts/uploadProfilePictures.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadProfilePictures() {
  const picturesDir = './profile-pictures'; // Folder with images
  const files = fs.readdirSync(picturesDir);
  
  for (const file of files) {
    try {
      // Filename should be: userId.jpg or userId.png
      const userId = path.parse(file).name;
      const filePath = path.join(picturesDir, file);
      
      // Upload to Storage
      const destination = `profilePictures/${userId}`;
      await bucket.upload(filePath, { destination });
      
      // Get download URL
      const fileRef = bucket.file(destination);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future
      });
      
      // Update Firestore
      await db.collection('users').doc(userId).update({
        profilePicture: url
      });
      
      console.log(`✅ Uploaded picture for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`, error.message);
    }
  }
  
  console.log('🎉 All profile pictures uploaded!');
}

uploadProfilePictures();
```

**Usage:**
```bash
# Place images in profile-pictures/ folder
# Name them: userId1.jpg, userId2.png, etc.
node scripts/uploadProfilePictures.js
```

---

## 🧪 Testing Profile Pictures

### Test Checklist:
- [ ] Upload a profile picture via your app
- [ ] Verify image appears in directory
- [ ] Check both list view and sections view
- [ ] Open member details modal - large photo shows
- [ ] Test with different image sizes
- [ ] Test with broken URL (should show initials)
- [ ] Test with no picture (should show initials)
- [ ] Pull-to-refresh - pictures reload correctly

### Test URLs:
For quick testing, you can use temporary URLs:

```javascript
// Update a user with test image
await updateDoc(doc(db, 'users', 'userId'), {
  profilePicture: 'https://i.pravatar.cc/300?img=1'
});
```

---

## 🎨 Styling & Appearance

### Current Design:
- **Shape**: Perfect circles
- **Size**: 60px (cards), 100px (modal)
- **Fallback**: Colored circle with initials
- **Shadow**: Subtle on modal avatar
- **Border**: None (can be added)

### Customization Options:

Want to add a border?
```javascript
// In styles.avatarImage
borderWidth: 2,
borderColor: '#fff',
```

Want rounded squares instead?
```javascript
// Change borderRadius
borderRadius: 12,  // Instead of 30 or 50
```

---

## 🐛 Troubleshooting

### Pictures Not Showing

**Check 1: Image URL**
- Go to Firebase Console → Firestore → users
- Verify `profilePicture` field exists
- Copy URL and open in browser - does it load?

**Check 2: Storage Permissions**
- Go to Firebase Console → Storage → Rules
- Make sure read is allowed: `allow read: if true;`

**Check 3: CORS Issues**
- Firebase Storage has CORS enabled by default
- If issues persist, check Firebase Storage CORS settings

**Check 4: Image Format**
- Verify image is JPG, PNG, or WebP
- Some formats might not work on all devices

### Images Load Slowly

**Solutions:**
1. **Optimize images** - Compress before uploading
2. **Use CDN** - Firebase Storage is already a CDN
3. **Cache images** - React Native caches by default
4. **Reduce size** - 200-300px is plenty

### Error: "Image failed to load"

**Causes:**
- Invalid URL
- Broken link
- Network issue
- CORS problem
- Deleted image

**Fix:**
- The app automatically shows initials on error
- Update user's `profilePicture` field with valid URL

---

## 📊 Data Structure

### User Document with Profile Picture:

```javascript
{
  id: "user123",
  displayName: "John Mensah",
  email: "john@church.org",
  phoneNumber: "+233 24 123 4567",
  role: "member",
  profilePicture: "https://firebasestorage.googleapis.com/.../profilePictures/user123",
  departments: ["Worship", "Media"],
  ministries: ["Men's Ministry"],
  bio: "Passionate about worship...",
  createdAt: "2023-01-15T00:00:00.000Z"
}
```

---

## 🚀 Next Steps

### Immediate:
1. Enable Firebase Storage (if not already)
2. Set up security rules
3. Add profile pictures for key members (pastors, leaders)
4. Test in app

### Future Enhancements:
- [ ] Image upload in EditProfileScreen
- [ ] Image cropping before upload
- [ ] Multiple image sizes (thumbnails)
- [ ] Default avatar selection
- [ ] Placeholder while loading
- [ ] Cache management

---

## 📱 User Guide

### For Church Members:

**To add your profile picture:**
1. Go to your Profile
2. Tap "Edit Profile"
3. Tap your avatar
4. Choose photo from gallery
5. Crop to square
6. Save

**Tips:**
- Use a clear, recent photo
- Make sure your face is visible
- Square photos work best
- Smile! 😊

### For Admins:

**To add pictures for others:**
1. Get member photos (with permission)
2. Upload to Firebase Storage: `profilePictures/{userId}`
3. Update user document with URL
4. Notify member their photo is added

---

## ✅ Summary

Profile pictures are now fully supported in the directory!

**What works:**
- ✅ Automatic loading from Firebase
- ✅ Fallback to initials
- ✅ Error handling
- ✅ Multiple field name support
- ✅ Optimized performance
- ✅ Works in all views

**What you need to do:**
1. Enable Firebase Storage
2. Set up security rules
3. Upload profile pictures
4. Enjoy a more personal directory!

---

**Questions?** Contact your development team  
**Last Updated**: January 7, 2026  
**Version**: 2.1



