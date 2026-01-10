# Departments Feature - Quick Setup Guide

## Overview
This guide helps you get the Departments feature up and running in your church app.

---

## ✅ Prerequisites

Before starting, ensure you have:
- Firebase project configured
- Firebase Firestore enabled
- React Native/Expo app installed
- User authentication working

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Files Are in Place

Check that these files exist:
- ✅ `src/screens/DepartmentsScreen.js`
- ✅ `src/screens/DepartmentDetailsScreen.js`
- ✅ `App.js` (with DepartmentDetails route)
- ✅ `scripts/seedDepartments.js`

### Step 2: Seed Department Data

Run this command to populate your database with sample departments:

```bash
createdAt
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

### Step 3: Update Firebase Security Rules

Add these rules to your Firestore:

```javascript
// Departments - public read, users can update membership
match /departments/{deptId} {
  allow read: if true;
  allow create, delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow update: if request.auth != null;
}
```

### Step 4: Test the Feature

1. Start your app:
   ```bash
   npm start
   ```

2. Navigate to More → Departments

3. Try these actions:
   - View all departments
   - Tap on a department
   - Join a department
   - Leave a department

---

## 📝 Customizing Departments

### Adding a New Department

Add to Firestore manually or via script:

```javascript
{
  id: 'youth',
  name: 'Youth Ministry',
  icon: 'flame', // Ionicon name
  color: '#f97316', // Hex color
  description: 'Empowering young people',
  fullDescription: 'Detailed description...',
  memberCount: 0,
  members: [],
  meetings: 'Weekly',
  leaders: [
    {
      name: 'John Doe',
      role: 'Youth Pastor',
      phone: '+233 XX XXX XXXX',
    }
  ],
  activities: [
    'Youth worship nights',
    'Bible study',
  ],
  schedule: {
    frequency: 'Every Friday',
    day: 'Friday',
    time: '7:00 PM',
    location: 'Youth Hall',
  },
  requirements: [
    'Ages 13-25',
    'Active church member',
  ],
  contact: {
    name: 'John Doe',
    phone: '+233 XX XXX XXXX',
    email: 'youth@church.org',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

### Modifying Existing Departments

Update via Firebase Console or admin panel:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find `departments` collection
4. Edit any department document
5. Changes reflect immediately in app

---

## 🎨 Customizing Colors & Icons

### Department Colors
Edit the color property in Firestore (hex format):
- `#ec4899` - Pink
- `#6366f1` - Indigo
- `#10b981` - Green
- `#f59e0b` - Orange
- etc.

### Department Icons
Use any Ionicon name (see [Ionicons](https://ionic.io/ionicons)):
- `musical-notes`
- `videocam`
- `people`
- `happy`
- `hand-left`
- `restaurant`
- `megaphone`
- `briefcase`

---

## 🔧 Advanced Configuration

### Hiding the Departments Feature

If you want to disable departments temporarily:

**Option 1: Hide from navigation**
In `ProfileScreen.js` or wherever you have the Departments button, comment it out:

```javascript
// {
//   icon: 'briefcase',
//   title: 'Departments',
//   onPress: () => navigation.navigate('Departments'),
// },
```

**Option 2: Show "Coming Soon"**
Replace the navigation with an alert:

```javascript
{
  icon: 'briefcase',
  title: 'Departments',
  onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
},
```

### Requiring Admin Approval to Join

To add approval workflow:

1. Change `handleJoinLeave` to create a pending request
2. Add `pendingMembers` array to department schema
3. Create admin interface to approve/reject requests
4. Move approved users from `pendingMembers` to `members`

---

## 📊 Monitoring & Analytics

### Tracking Department Growth

Query Firestore to see department stats:

```javascript
// Get all departments sorted by member count
const departmentsRef = collection(db, 'departments');
const q = query(departmentsRef, orderBy('memberCount', 'desc'));
const snapshot = await getDocs(q);
```

### Viewing Member Lists

```javascript
// Get specific department with members
const deptRef = doc(db, 'departments', 'worship');
const deptSnap = await getDoc(deptRef);
const memberIds = deptSnap.data().members;

// Fetch member details
const memberPromises = memberIds.map(id => getDoc(doc(db, 'users', id)));
const memberDocs = await Promise.all(memberPromises);
const members = memberDocs.map(doc => ({ id: doc.id, ...doc.data() }));
```

---

## 🐛 Troubleshooting

### "Department not found" error
- Check if department ID is correct
- Verify department exists in Firestore
- Ensure navigation parameters are passed correctly

### Member count not updating
- Check Firebase rules allow updates
- Verify user is authenticated
- Check for JavaScript errors in console

### Icons not displaying
- Ensure icon name is valid Ionicon name
- Check spelling of icon name
- Use Ionicons browser to find correct names

### Join button not working
- Verify user is logged in
- Check Firebase security rules
- Look for errors in console
- Ensure department document has `members` array

---

## 💡 Tips for Church Admins

1. **Keep descriptions clear and concise**
   - Short description: 5-7 words
   - Full description: 2-3 sentences

2. **Update meeting schedules regularly**
   - Change schedule when needed
   - Notify members of changes

3. **Add contact information for all leaders**
   - Makes it easy for members to reach out
   - Improves communication

4. **List specific activities**
   - Helps members understand commitment
   - Sets clear expectations

5. **Define requirements clearly**
   - Prevents mismatched volunteers
   - Ensures right fit

---

## 📱 Testing Checklist

Before launching to your congregation:

- [ ] All departments display correctly
- [ ] Icons and colors look good
- [ ] Department details load properly
- [ ] Join button works
- [ ] Leave button works
- [ ] Member count updates
- [ ] Leader contact info is correct
- [ ] Meeting schedules are accurate
- [ ] No console errors
- [ ] Works on both iOS and Android

---

## 🎉 Launch Checklist

Ready to go live?

- [ ] Seed data populated
- [ ] Security rules updated
- [ ] All departments reviewed
- [ ] Contact info verified
- [ ] Meeting times confirmed
- [ ] Leaders notified about the feature
- [ ] Members trained on how to use it
- [ ] Announcement prepared
- [ ] Support plan in place

---

## 📞 Support

Need help?
- Check `DEPARTMENTS_FEATURES_GUIDE.md` for detailed info
- Review Firebase Console for data issues
- Check browser/app console for errors
- Contact your tech team

---

**Last Updated**: January 7, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

