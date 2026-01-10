# 🔥 Deploy Firestore Rules - Quick Guide

## ⚠️ Important: Rules Must Be Deployed

The updated `firestore.rules` file needs to be **deployed to Firebase** for the changes to take effect.

---

## 🚀 Deployment Methods

### Method 1: Firebase Console (Easiest)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore**
   - Click "Firestore Database" in left sidebar
   - Click "Rules" tab at the top

3. **Copy Rules**
   - Open `firestore.rules` file in your project
   - Copy all the content

4. **Paste and Deploy**
   - Paste into the rules editor in Firebase Console
   - Click "Publish" button
   - Wait for deployment confirmation

---

### Method 2: Firebase CLI (Recommended for Development)

1. **Install Firebase CLI** (if not installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Use existing `firestore.rules` file

4. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

---

### Method 3: Using Firebase Tools in Project

If you have Firebase tools set up in your project:

```bash
# From project root directory
firebase deploy --only firestore:rules
```

---

## ✅ Verify Deployment

After deploying:

1. **Check Firebase Console**
   - Go to Firestore → Rules
   - Verify the rules match your local file
   - Check the "Last published" timestamp

2. **Test in App**
   - Try loading a devotional
   - Try creating a devotional (as admin)
   - Try bookmarking a devotional (as user)

---

## 🔍 Current Rules Summary

### Devotionals Collection
```javascript
match /devotionals/{devotionalId} {
  allow read: if true;  // Anyone can read
  allow write: if isAdmin();  // Only admins can write
}
```

### Devotional Bookmarks
```javascript
match /devotionalBookmarks/{bookmarkId} {
  allow read: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null && resource != null && resource.data.userId == request.auth.uid;
}
```

### Devotional Notes
```javascript
match /devotionalNotes/{noteId} {
  allow read: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null && resource != null && resource.data.userId == request.auth.uid;
}
```

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"

**Causes**:
1. Rules not deployed yet
2. User not authenticated
3. User document doesn't exist in `users` collection
4. Admin role not set correctly

**Solutions**:

1. **Deploy Rules First**
   - Follow deployment steps above
   - Wait a few seconds for propagation

2. **Check User Authentication**
   - Ensure user is logged in
   - Check Firebase Auth in console

3. **Check User Document**
   - Go to Firestore → `users` collection
   - Find user's document (by UID)
   - Ensure `role` field exists
   - For admin: `role` should be `"admin"`

4. **Verify Admin Role**
   ```javascript
   // In Firebase Console, user document should have:
   {
     role: "admin",  // or "member"
     // ... other fields
   }
   ```

---

## 📝 Quick Checklist

Before testing:
- [ ] Rules file updated locally
- [ ] Rules deployed to Firebase
- [ ] User is logged in
- [ ] User document exists in `users` collection
- [ ] Admin role set correctly (for admin operations)
- [ ] Wait 10-30 seconds after deployment

---

## 🎯 After Deployment

1. **Restart App**
   - Close and reopen the app
   - This ensures fresh connection

2. **Test Features**
   - Load devotional (should work for all users)
   - Create devotional (should work for admins only)
   - Bookmark devotional (should work for logged-in users)
   - Save notes (should work for logged-in users)

---

## 📞 Need Help?

If errors persist after deploying:

1. Check Firebase Console → Firestore → Rules
2. Verify rules syntax is correct
3. Check browser/app console for detailed error messages
4. Verify user authentication status
5. Check user document in `users` collection

---

**Last Updated**: January 8, 2026

