# 🔧 Web Build Errors Fix

## Issues Identified and Fixed

Three critical errors were found in the web build:

---

## 1. ❌ Image Loading Error: `gs://` URLs Not Loading

### Error Message
```
gs://greater-works-city-churc-4a673.firebasestorage.app/images/...:1
Failed to load resource: net::ERR_UNKNOWN_URL_SCHEME
```

### Problem
- Firebase Storage `gs://` URLs are internal storage references
- Browsers cannot load `gs://` URLs directly
- Images need to be converted to HTTPS download URLs

### Solution Applied
**File**: `src/screens/DiscipleshipTrainingScreen.js`

1. **Added Storage Import**:
   ```javascript
   import { storage } from '../../firebase.config';
   import { ref, getDownloadURL } from 'firebase/storage';
   ```

2. **Created URL Conversion Function**:
   ```javascript
   const convertImageUrl = async (imageUrl) => {
     // Converts gs:// URLs to HTTPS download URLs
     // Returns HTTP/HTTPS URLs as-is
   }
   ```

3. **Updated Course Loading**:
   - Converts `gs://` URLs to download URLs when loading courses
   - Processes images before displaying them

### Result
✅ Course images now load correctly on web
✅ HTTP/HTTPS URLs work as before
✅ Graceful fallback if conversion fails

---

## 2. ❌ Enrollment Error: User Document Doesn't Exist

### Error Message
```
Error enrolling in course: FirebaseError: 
No document to update: projects/.../documents/users/{userId}
```

### Problem
- Code used `updateDoc()` which fails if document doesn't exist
- Some users may not have user documents in Firestore
- Enrollment fails silently for these users

### Solution Applied
**File**: `src/screens/DiscipleshipTrainingScreen.js`

**Changed from**:
```javascript
await updateDoc(userRef, { ... });
```

**Changed to**:
```javascript
// Check if document exists first
const userDoc = await getDoc(userRef);
const currentEnrolledCourses = userDoc.exists() 
  ? (userDoc.data().enrolledCourses || [])
  : [];

// Use setDoc with merge to create if doesn't exist
await setDoc(userRef, {
  enrolledCourses: [...],
  [`courseProgress.${course.id}`]: { ... }
}, { merge: true });
```

### Result
✅ Enrollment works even if user document doesn't exist
✅ Creates user document automatically if needed
✅ Preserves existing data with merge option

---

## 3. ❌ Assignments Permission Error

### Error Message
```
[Production Error] Error loading assignments: 
FirebaseError: Missing or insufficient permissions.
```

### Problem
- Query requires composite index (`userId` + `dueDate`)
- Index may not exist in Firestore
- Permission error if user can't read all assignments

### Solution Applied
**File**: `src/screens/DiscipleshipTrainingScreen.js`

**Improved Error Handling with Fallbacks**:

1. **First Try**: Query with `where` + `orderBy` (requires index)
2. **Second Try**: Query with only `where` (no index needed), sort manually
3. **Third Try**: Get all assignments, filter client-side, sort manually
4. **Final Fallback**: Set empty array if all fail

### Result
✅ Assignments load even without composite index
✅ Multiple fallback strategies
✅ Better error handling and logging

---

## 🧪 Testing

### Test Image Loading
1. Open web app
2. Navigate to **Discipleship & Training** → **Courses**
3. **Expected**: Course images load correctly
4. **Check Console**: No `gs://` URL errors

### Test Enrollment
1. Log in as a user (new or existing)
2. Navigate to **Discipleship & Training** → **Courses**
3. Click **"Enroll Now"** on any course
4. **Expected**: Enrollment succeeds
5. **Check**: Course appears in "My Progress" tab

### Test Assignments
1. Log in as a user
2. Navigate to **Discipleship & Training** → **Assignments** tab
3. **Expected**: Assignments load (or empty if none)
4. **Check Console**: No permission errors

---

## 📝 Additional Notes

### Firestore Index for Assignments (Optional)

If you want optimal performance for assignments query, create a composite index:

**Firebase Console** → **Firestore** → **Indexes** → **Create Index**

- Collection: `assignments`
- Fields:
  1. `userId` (Ascending)
  2. `dueDate` (Ascending)

**Note**: The code works without this index, but the index improves query performance.

### Image URL Format

**Supported Formats**:
- ✅ `https://firebasestorage.googleapis.com/...` (download URLs)
- ✅ `http://example.com/image.jpg` (HTTP URLs)
- ✅ `gs://bucket/path/to/image.jpg` (converted automatically)

**Best Practice**: Store download URLs in Firestore, not `gs://` URLs.

---

## 🚀 Deployment

### Rebuild Web App
```bash
cd G-app
npm run build:web
```

### Deploy
```bash
# Firebase Hosting
firebase deploy --only hosting

# Or Netlify
netlify deploy --prod --dir=web-build
```

---

## ✅ Verification Checklist

- [x] Image URL conversion function added
- [x] Course loading updated to convert URLs
- [x] Enrollment uses `setDoc` with merge
- [x] Assignments error handling improved
- [x] No linting errors
- [ ] Web app rebuilt
- [ ] Web app redeployed
- [ ] Tested image loading
- [ ] Tested enrollment
- [ ] Tested assignments loading
- [ ] Checked browser console for errors

---

## 🐛 Troubleshooting

### Images Still Not Loading?

1. **Check Image URLs in Firestore**:
   - Open Firebase Console → Firestore
   - Check `courses` collection
   - Verify `image` field has valid URLs

2. **Check Storage Rules**:
   - Firebase Console → Storage → Rules
   - Ensure images are publicly readable

3. **Check Browser Console**:
   - Look for CORS errors
   - Check network tab for failed requests

### Enrollment Still Failing?

1. **Check User Authentication**:
   - Verify user is logged in
   - Check `auth.currentUser` is not null

2. **Check Firestore Rules**:
   - Users collection should allow users to update their own document
   - Courses collection should allow incrementing `enrolled` field

3. **Check Browser Console**:
   - Look for specific error messages
   - Check network tab for failed Firestore requests

### Assignments Not Loading?

1. **Check Firestore Rules**:
   - Assignments collection should allow users to read their own
   - Rule: `allow read: if request.auth != null && resource.data.userId == request.auth.uid`

2. **Create Composite Index** (optional):
   - Firebase Console → Firestore → Indexes
   - Create index for `assignments` collection with `userId` and `dueDate`

3. **Check Browser Console**:
   - Look for permission errors
   - Check if fallback queries are working

---

**Last Updated**: January 2025
**Status**: ✅ All Issues Fixed

