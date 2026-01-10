# Setup Guide - Greater Works City Church App

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher) - [Download](https://nodejs.org/)
- npm (comes with Node.js) or yarn
- Git
- A code editor (VS Code recommended)
- Expo CLI: `npm install -g expo-cli`

For testing:
- **Android**: Android Studio with emulator OR Expo Go app on your phone
- **iOS**: Xcode (Mac only) OR Expo Go app on your iPhone

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "Greater Works City Church"
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click "Create project"

### Step 2: Register Your App

1. In Firebase Console, click the web icon (</>) to add a web app
2. Enter app nickname: "GWCC Mobile App"
3. Click "Register app"
4. Copy the Firebase configuration object

### Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Click on "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### Step 4: Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your region (choose closest to Ghana)
5. Click "Enable"

### Step 5: Enable Storage

1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Click "Done"

### Step 6: Configure Security Rules

#### Firestore Rules
Go to Firestore Database > Rules and paste:

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
    
    // Departments and Ministries - public read, admin write
    match /departments/{deptId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /ministries/{ministryId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Announcements - public read, admin write
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### Storage Rules
Go to Storage > Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /sermons/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## 🚀 App Installation

### Step 1: Clone and Install

```bash
cd G-app
npm install
```

### Step 2: Configure Firebase

1. Open `firebase.config.js`
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 3: Start Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### Step 4: Run on Device/Emulator

**Option A: Physical Device**
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in terminal/browser
3. App will load on your device

**Option B: Android Emulator**
```bash
npm run android
```

**Option C: iOS Simulator (Mac only)**
```bash
npm run ios
```

## 👤 Creating Admin User

After setting up, you'll need to create an admin user:

1. Register a new account through the app
2. Go to Firebase Console > Firestore Database
3. Find the `users` collection
4. Locate your user document
5. Edit the document and change `role` field from `"member"` to `"admin"`
6. Save changes
7. Restart the app

## 📱 Testing the App

### Test User Flow
1. **Register**: Create a new account
2. **Login**: Sign in with your credentials
3. **Home**: Explore the home dashboard
4. **Check-In**: Try checking in to a service
5. **Events**: Browse events
6. **Sermons**: View sermon library
7. **Devotional**: Read daily devotional
8. **Giving**: Test giving interface
9. **Prayer**: Submit a prayer request
10. **Profile**: Access all features from More tab

### Test Admin Flow
1. Login with admin account
2. Go to More > Admin Dashboard
3. View statistics and analytics
4. Test quick actions
5. Review recent activities

## 🎨 Customization

### Update Church Name
Search and replace "Greater Works City Church" with your church name in:
- `App.js`
- `README.md`
- `app.json`
- All screen files

### Update Colors
Main theme colors are in each screen's StyleSheet. Primary colors used:
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Accent: `#ec4899` (Pink)

### Add Church Logo
Replace placeholder icons in:
- `assets/icon.png` (1024x1024)
- `assets/splash.png` (1242x2436)
- `assets/adaptive-icon.png` (1024x1024)
- `assets/favicon.png` (48x48)

## 🔧 Troubleshooting

### Common Issues

**1. Firebase not connecting**
- Verify your Firebase config is correct
- Check internet connection
- Ensure Firebase services are enabled

**2. App won't start**
```bash
# Clear cache and restart
npm start --clear
```

**3. Module not found errors**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**4. iOS build issues (Mac)**
```bash
cd ios
pod install
cd ..
npm run ios
```

## 📊 Initial Data Setup

You can manually add initial data through Firebase Console:

### Sample Event
Collection: `events`
```json
{
  "title": "Sunday Worship Service",
  "date": "2025-01-12",
  "time": "9:00 AM",
  "location": "Main Sanctuary",
  "category": "Worship",
  "description": "Join us for a powerful worship experience",
  "image": "https://via.placeholder.com/400x200"
}
```

### Sample Sermon
Collection: `sermons`
```json
{
  "title": "Walking in Faith",
  "pastor": "Pastor John Mensah",
  "date": "2025-01-05",
  "duration": "45 min",
  "image": "https://via.placeholder.com/400x200",
  "views": "1200"
}
```

## 🚀 Deployment

### Build for Production

**Android APK:**
```bash
expo build:android
```

**iOS IPA:**
```bash
expo build:ios
```

### Publish to Stores
Follow Expo's documentation for publishing:
- [Android Play Store](https://docs.expo.dev/distribution/app-stores/#android)
- [iOS App Store](https://docs.expo.dev/distribution/app-stores/#ios)

## 📞 Support

For technical support or questions:
- Email: support@greaterworskcitychurch.org
- Documentation: See README.md

## ✅ Checklist

- [ ] Node.js installed
- [ ] Expo CLI installed
- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Security rules configured
- [ ] Firebase config updated in app
- [ ] Dependencies installed
- [ ] App runs successfully
- [ ] Admin user created
- [ ] Initial data added
- [ ] Church branding updated

---

🎉 **Congratulations!** Your church app is ready to use!

