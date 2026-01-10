# 🙏 Ministries Feature - Complete Setup Guide

## Overview
The Ministries feature allows church members to discover, join, and engage with various ministry groups in your church. This guide will help you set up and manage the ministries feature.

---

## ✅ What's Included

### Features
- ✨ **Live Data from Firebase** - Real-time ministry information
- 🔄 **Pull to Refresh** - Easy data updates
- 📱 **Join/Leave Ministries** - Members can manage their memberships
- 🎯 **Member Tracking** - Track who belongs to each ministry
- 🏷️ **Member Badges** - Visual indicators for joined ministries
- 📊 **Member Count** - Live member statistics
- 💫 **Beautiful UI** - Modern, engaging design
- 🔍 **Detailed Information** - Contact details, schedules, age ranges
- ⚡ **Loading States** - Smooth loading experience
- 🎨 **Empty States** - Helpful messages when no data exists

---

## 🚀 Quick Setup (10 Minutes)

### Step 1: Update Firebase Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **greater-works-city-churc-4a673**
3. Click **Firestore Database** → **Rules**
4. Add the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... other rules ...
    
    // Ministries - public read, users can update membership
    match /ministries/{ministryId} {
      allow read: if true;  // Anyone can view ministries
      allow create, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null;  // Authenticated users can join/leave
    }
    
    // Users collection - allow users to update their ministry memberships
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

5. Click **Publish**

### Step 2: Seed Ministry Data

Run this command to populate your database:

```bash
npm run seed:ministries
```

Or directly:

```bash
node scripts/seedMinistries.js
```

You should see:

```
🌱 Starting to seed ministries...

✅ Added: Youth Ministry
✅ Added: Women's Ministry
✅ Added: Men's Ministry
✅ Added: Singles Ministry
✅ Added: Marriage Ministry
✅ Added: Children's Ministry
✅ Added: Seniors Ministry

✨ Successfully seeded all ministries!
📊 Total ministries added: 7

🎉 Your Firebase Firestore is now populated with ministry data.
```

### Step 3: Verify in Firebase Console

1. Go to **Firestore Database** → **Data**
2. You should see a `ministries` collection
3. Click on it to see all 7 ministries

### Step 4: Test the Feature

1. Start your app: `npm start`
2. Navigate to **More** → **Ministries**
3. Try these actions:
   - View all ministries
   - Pull down to refresh
   - Tap "Join Ministry" on any ministry
   - See the "Member" badge appear
   - Tap "Leave Ministry" to remove yourself

---

## 📋 Default Ministries Included

| Ministry | Leader | Schedule | Target |
|----------|--------|----------|--------|
| 🎸 Youth Ministry | Pastor Emmanuel Osei | Saturdays, 5:00 PM | Ages 13-35 |
| 👩 Women's Ministry | Sister Grace Addo | First Saturday, 3:00 PM | All women |
| 👨 Men's Ministry | Brother Kwame Boateng | Second Saturday, 6:00 AM | Men 18+ |
| 💑 Singles Ministry | Pastor Ama Asante | Sundays, 2:00 PM | Singles 18-45 |
| 💍 Marriage Ministry | Pastor & Mrs. Mensah | Third Friday, 7:00 PM | Married couples |
| 🧒 Children's Ministry | Sister Abena Owusu | Sundays, 9:00 & 11:00 AM | Ages 0-12 |
| 👴 Seniors Ministry | Elder Joseph Appiah | Last Thursday, 10:00 AM | Ages 60+ |

---

## 🎨 Customizing Ministries

### Adding a New Ministry

#### Option 1: Via Firebase Console

1. Go to **Firestore Database** → **ministries** collection
2. Click **Add document**
3. Set Document ID (e.g., `college`)
4. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `name` | string | College & Career Ministry |
| `leader` | string | Pastor David |
| `schedule` | string | Fridays, 6:00 PM |
| `memberCount` | number | 0 |
| `members` | array | (empty) |
| `image` | string | https://images.unsplash.com/... |
| `description` | string | Short description |
| `fullDescription` | string | Detailed description |
| `ageRange` | string | 18-25 years |
| `contact` | string | +233 20 XXX XXXX |
| `email` | string | college@church.org |
| `activities` | array | List of activities |
| `vision` | string | Ministry vision |
| `requirements` | string | Membership requirements |
| `createdAt` | timestamp | (click Insert → Timestamp → Now) |
| `updatedAt` | timestamp | (click Insert → Timestamp → Now) |

#### Option 2: Via Script

1. Open `scripts/seedMinistries.js`
2. Add your ministry to the `ministries` array:

```javascript
{
  id: 'college',
  name: 'College & Career Ministry',
  leader: 'Pastor David',
  schedule: 'Fridays, 6:00 PM',
  memberCount: 0,
  members: [],
  image: 'https://images.unsplash.com/photo-...',
  description: 'Navigating faith in college and career',
  fullDescription: 'Detailed description here...',
  ageRange: '18-25 years',
  contact: '+233 20 XXX XXXX',
  email: 'college@church.org',
  activities: [
    'Weekly fellowship meetings',
    'Career mentorship program',
    // ... more activities
  ],
  vision: 'Ministry vision statement',
  requirements: 'Open to college students and young professionals',
}
```

3. Run: `npm run seed:ministries`

### Updating Ministry Information

1. Go to Firebase Console → **Firestore Database**
2. Navigate to `ministries` collection
3. Click on the ministry document
4. Edit any field
5. Changes appear instantly in the app

### Deleting a Ministry

1. Go to Firebase Console → **Firestore Database**
2. Navigate to `ministries` collection
3. Click the three dots next to the ministry
4. Select **Delete document**
5. Confirm deletion

---

## 👥 Managing Ministry Members

### How Members Join

When a user taps "Join Ministry":
1. User's ID is added to ministry's `members` array
2. Ministry's `memberCount` is incremented
3. Ministry ID is added to user's `ministries` array
4. "Member" badge appears on the card
5. Button changes to "Leave Ministry"

### How Members Leave

When a user taps "Leave Ministry":
1. User's ID is removed from ministry's `members` array
2. Ministry's `memberCount` is decremented
3. Ministry ID is removed from user's `ministries` array
4. "Member" badge disappears
5. Button changes back to "Join Ministry"

### Viewing Ministry Members (Admin)

You can view all members of a ministry in Firebase Console:

1. Go to **Firestore Database** → `ministries`
2. Click on a ministry document
3. Look at the `members` array
4. Each entry is a user ID
5. Cross-reference with `users` collection to get member details

---

## 🔧 Troubleshooting

### Ministries Not Loading

**Problem**: App shows "Loading ministries..." forever

**Solutions**:
1. Check internet connection
2. Verify Firebase configuration in `firebase.config.js`
3. Check Firebase Console → Firestore → Rules (make sure read is allowed)
4. Check browser console for errors
5. Try pulling down to refresh

### Can't Join/Leave Ministries

**Problem**: Join/Leave buttons don't work

**Solutions**:
1. Make sure you're logged in
2. Check Firestore rules allow updates
3. Verify `users` collection has your user document
4. Check Firebase Console → Authentication (user should exist)

### Seed Script Fails

**Problem**: `npm run seed:ministries` throws an error

**Solutions**:
1. Check your Firebase configuration in the script
2. Ensure Firestore is enabled
3. Update Firebase security rules
4. Check internet connection
5. Try running with `node scripts/seedMinistries.js` directly

### Images Not Showing

**Problem**: Ministry images show broken/placeholder

**Solutions**:
1. Images use Unsplash URLs (requires internet)
2. Replace with your own image URLs
3. Upload images to Firebase Storage and use those URLs

---

## 🎯 Advanced Customization

### Adding Custom Fields

Want to add more information to ministries? Edit the data structure:

```javascript
{
  // ... existing fields ...
  location: 'Room 203, Main Building',
  meetingLink: 'https://zoom.us/j/...',
  coordinator: 'Jane Doe',
  socialMedia: {
    facebook: 'https://facebook.com/...',
    instagram: '@youthministry',
  },
  // ... etc
}
```

Then update `MinistriesScreen.js` to display these fields.

### Styling Changes

Edit `src/screens/MinistriesScreen.js`:

**Change colors**:
```javascript
// Header gradient
<LinearGradient colors={['#6366f1', '#8b5cf6']} ...>

// Join button color
joinButton: {
  backgroundColor: '#6366f1',  // Change this
}

// Member badge color
memberBadge: {
  backgroundColor: '#10b981',  // Change this
}
```

**Change fonts**:
```javascript
ministryName: {
  fontSize: 20,  // Adjust size
  fontWeight: 'bold',
}
```

### Adding Search/Filter

To add search functionality, check the `EventsScreen.js` implementation which has search and filter features you can adapt.

---

## 📊 Data Structure Reference

### Ministry Document Structure

```javascript
{
  id: 'youth',                    // Unique identifier
  name: 'Youth Ministry',         // Display name
  leader: 'Pastor Emmanuel',      // Ministry leader name
  schedule: 'Saturdays, 5:00 PM', // Meeting schedule
  memberCount: 0,                 // Number of members
  members: [],                    // Array of user IDs
  image: 'https://...',           // Ministry image URL
  description: '...',             // Short description
  fullDescription: '...',         // Detailed description
  ageRange: '13-35 years',        // Target age range
  contact: '+233...',             // Contact phone
  email: 'youth@...',             // Contact email
  activities: [],                 // Array of activities
  vision: '...',                  // Ministry vision
  requirements: '...',            // Membership requirements
  createdAt: Timestamp,           // Creation timestamp
  updatedAt: Timestamp,           // Last update timestamp
}
```

### User's Ministry Field

In the `users` collection, each user has:

```javascript
{
  // ... other user fields ...
  ministries: ['youth', 'singles'],  // Array of ministry IDs
}
```

---

## 🎓 Best Practices

### For Church Admins

1. **Keep Information Updated**: Regularly update schedules and leaders
2. **Use Quality Images**: Upload clear, relevant images for each ministry
3. **Write Clear Descriptions**: Help people understand what each ministry offers
4. **Monitor Membership**: Check Firebase Console regularly
5. **Respond to Contacts**: Monitor the contact information provided

### For Developers

1. **Test Thoroughly**: Test join/leave functionality
2. **Handle Errors Gracefully**: Ensure good error messages
3. **Optimize Images**: Use appropriately sized images
4. **Monitor Performance**: Watch Firestore read/write counts
5. **Backup Data**: Regular backups of your Firestore data

---

## 🚀 Next Steps

Now that ministries are set up:

1. ✅ Test all functionality
2. ✅ Customize ministry data for your church
3. ✅ Add real images
4. ✅ Update contact information
5. ✅ Train church staff on managing ministries
6. ✅ Announce the feature to your congregation

---

## 📞 Need Help?

If you encounter issues:

1. Check the console for error messages
2. Review Firebase Console → Firestore → Rules
3. Verify data structure matches the expected format
4. Check user authentication status
5. Review this guide's troubleshooting section

---

## 🎉 You're All Set!

Your ministries feature is now fully functional with:
- ✅ Live data from Firebase
- ✅ Join/leave functionality
- ✅ Beautiful UI
- ✅ Member tracking
- ✅ Pull to refresh
- ✅ Loading states
- ✅ Error handling

Enjoy connecting your church members with the right ministries! 🙏

