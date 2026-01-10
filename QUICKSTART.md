# 🚀 Quick Start Guide

Get your Greater Works City Church app running in 5 minutes!

## ⚡ Fast Setup

### 1️⃣ Install Dependencies (2 minutes)
```bash
npm install
```

### 2️⃣ Configure Firebase (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Copy your config to `firebase.config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3️⃣ Start the App (1 minute)
```bash
npm start
```

Then:
- **Phone**: Scan QR code with Expo Go app
- **Android Emulator**: Press `a`
- **iOS Simulator**: Press `i` (Mac only)

## 🎯 First Steps

### Create Your Account
1. Open the app
2. Click "Sign Up"
3. Fill in your details
4. Click "Sign Up"

### Make Yourself Admin
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project
3. Go to Firestore Database
4. Find `users` collection
5. Open your user document
6. Change `role` from `"member"` to `"admin"`
7. Save and restart app

### Explore Features
- ✅ Check in to a service
- 📅 Browse events
- 🎥 Watch sermons
- 📖 Read devotional
- 💝 Test giving
- 🙏 Submit prayer request
- 🛡️ Access admin dashboard (if admin)

## 📱 Test Accounts

Create these test accounts for different roles:

**Admin Account**:
- Email: admin@gwcc.org
- Password: Admin123!
- Role: admin (set in Firestore)

**Member Account**:
- Email: member@gwcc.org
- Password: Member123!
- Role: member (default)

## 🎨 Customize

### Change Church Name
Find and replace "Greater Works City Church" in:
- `App.js`
- `app.json`
- `README.md`

### Update Colors
Edit the color values in each screen's StyleSheet:
- Primary: `#6366f1`
- Secondary: `#8b5cf6`

### Add Logo
Replace these files:
- `assets/icon.png`
- `assets/splash.png`

## 🔧 Common Commands

```bash
# Start development server
npm start

# Clear cache and restart
npm start --clear

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Install new package
npm install package-name
```

## ❓ Troubleshooting

### App won't start?
```bash
npm start --clear
```

### Firebase not working?
- Check your config in `firebase.config.js`
- Verify services are enabled in Firebase Console
- Check internet connection

### Module errors?
```bash
rm -rf node_modules
npm install
```

## 📚 Documentation

- **Full Setup**: See `SETUP_GUIDE.md`
- **Features**: See `FEATURES.md`
- **README**: See `README.md`

## 🎉 You're Ready!

Your church app is now running! Start exploring and customizing it for your church.

**Need Help?**
- Check `SETUP_GUIDE.md` for detailed instructions
- Review `FEATURES.md` for feature documentation
- Contact: support@greaterworskcitychurch.org

---

Built with ❤️ for Greater Works City Church

