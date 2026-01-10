# 🔧 Fix Firebase Permissions - Step by Step

## The Problem
You're getting this error when running the seeder:
```
7 PERMISSION_DENIED: Missing or insufficient permissions
```

This means your Firebase security rules don't allow writing to the `departments` collection yet.

---

## ✅ Solution: Update Firebase Security Rules

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Login with your Google account
3. Select your project: **"greater-works-city-churc-4a673"**

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click **"Firestore Database"**
2. Click on the **"Rules"** tab at the top
3. You'll see your current security rules

### Step 3: Add Department Rules
Find the section with your rules (it looks like this):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your existing rules...
  }
}
```

Add this new rule inside the `match /databases/{database}/documents { }` block:

```javascript
// Departments - public read, authenticated write
match /departments/{deptId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

### Complete Example
Your rules should look something like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Events - public read, admin write
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sermons - public read, admin write
    match /sermons/{sermonId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Check-ins - authenticated users can write their own
    match /checkIns/{checkInId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Prayer requests - authenticated users
    match /prayerRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // ***** ADD THIS NEW RULE FOR DEPARTMENTS *****
    // Departments - public read, authenticated write
    match /departments/{deptId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // ***** END NEW RULE *****
    
    // Ministries - public read, authenticated users can join/leave
    match /ministries/{ministryId} {
      allow read: if true;
      allow create, delete: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null;  // Users can join/leave
    }
    
    // Announcements - public read, admin write
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Event Registrations
    match /eventRegistrations/{registrationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### Step 4: Publish the Rules
1. Click the **"Publish"** button at the top right
2. Wait for confirmation (should say "Rules published successfully")
3. Your rules are now live!

---

## 🔐 Alternative: Temporary Rule for Seeding Only

If you want to seed quickly and then make it more secure:

**For Seeding (Temporary)**:
```javascript
match /departments/{deptId} {
  allow read, write: if true;  // Anyone can read/write
}
```

**After Seeding (Production)**:
```javascript
match /departments/{deptId} {
  allow read: if true;
  allow write: if request.auth != null;  // Only authenticated users
}
```

⚠️ **Important**: Remember to change it back after seeding!

---

## 🧪 Test After Updating Rules

Once you've published the rules, run the seeder again:

```bash
node scripts/seedDepartments.js
```

You should see:
```
🌱 Starting to seed departments...

✅ Added: Worship & Music
✅ Added: Media & Tech
✅ Added: Ushering
✅ Added: Children Ministry
✅ Added: Prayer Team
✅ Added: Hospitality
✅ Added: Evangelism
✅ Added: Administration

✨ Successfully seeded all departments!
📊 Total departments added: 8
```

---

## 🆘 Still Not Working?

### Check 1: Are You Logged In?
The seeder script needs you to be authenticated. Try:
1. Open your app
2. Login as a user
3. Then run the seeder script

### Check 2: Rules Published Correctly?
1. Go back to Firebase Console → Firestore → Rules
2. Verify the department rule is there
3. Check for any syntax errors (red underlines)
4. Re-publish if needed

### Check 3: Firebase Config Correct?
Check that `firebase.config.js` has the right credentials for your project.

### Check 4: Internet Connection
Make sure you're connected to the internet and can reach Firebase.

---

## 📝 Alternative: Add Departments Manually

If the seeder still doesn't work, you can add departments manually in Firebase Console:

1. Go to Firestore Database
2. Click "Start collection" (if no departments yet) or click on "departments" collection
3. Add a new document with ID: `worship`
4. Add these fields:
   - `name` (string): "Worship & Music"
   - `icon` (string): "musical-notes"
   - `color` (string): "#ec4899"
   - `description` (string): "Leading the congregation in worship"
   - `memberCount` (number): 0
   - `members` (array): [] (empty array)
   - Continue with other fields from the seeder script...

5. Repeat for other departments

---

## ✅ After Successful Seeding

1. ✅ Verify in Firebase Console that departments were created
2. ✅ Open your app
3. ✅ Navigate to More → Departments
4. ✅ You should see all 8 departments!
5. ✅ Try joining/leaving departments

---

## 🔒 Production Security Rule (Recommended)

After seeding and testing, update to this more secure rule:

```javascript
match /departments/{deptId} {
  // Anyone can read departments
  allow read: if true;
  
  // Only admins can create/delete departments
  allow create, delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // Authenticated users can update (for joining/leaving)
  allow update: if request.auth != null;
}
```

This ensures:
- ✅ Everyone can view departments
- ✅ Users can join/leave (update members array)
- ✅ Only admins can create/delete departments

---

## 📞 Need More Help?

- Check Firebase Console for error messages
- Look at the Rules tab for syntax errors
- Try the "Rules Playground" in Firebase to test
- Check your internet connection
- Verify your Firebase project is active

---

**Good luck! You're almost there!** 🚀

