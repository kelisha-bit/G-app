# 📱 How to Access the App

Complete guide to accessing and using the Greater Works City Church mobile app.

---

## 🚀 Getting Started

### Prerequisites
Before accessing the app, ensure you have:
- ✅ Completed the setup in `SETUP_GUIDE.md`
- ✅ Firebase configured properly
- ✅ App running on development server

---

## 📲 Accessing the App

### Method 1: Using Your Phone (Recommended)

#### For Android & iOS Devices

1. **Install Expo Go**
   - **Android**: Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: Download from [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the Development Server**
   ```bash
   cd C:\Users\user\Desktop\G-app
   npm start
   ```

3. **Scan the QR Code**
   - **Android**: Open Expo Go app → Scan QR Code → Scan the QR from terminal
   - **iOS**: Open Camera app → Point at QR code → Tap notification to open in Expo Go

4. **Wait for App to Load**
   - First load may take 1-2 minutes
   - App will bundle JavaScript and load on your device
   - You'll see the login screen once loaded

### Method 2: Using Android Emulator

1. **Install Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Set up an Android Virtual Device (AVD)

2. **Start Emulator**
   - Open Android Studio → AVD Manager → Start emulator

3. **Run App**
   ```bash
   cd C:\Users\user\Desktop\G-app
   npm run android
   ```

4. **App Opens Automatically**
   - App will install and launch on emulator
   - Wait for build to complete

### Method 3: Using iOS Simulator (Mac Only)

1. **Install Xcode**
   - Download from Mac App Store
   - Install iOS Simulator components

2. **Run App**
   ```bash
   cd C:\Users\user\Desktop\G-app
   npm run ios
   ```

3. **App Opens Automatically**
   - Simulator will launch
   - App will install and open

---

## 🔐 First Time Access

### Creating Your Account

1. **Launch the App**
   - You'll see the login screen with gradient background

2. **Click "Sign Up"**
   - Located at the bottom of the login screen

3. **Fill in Registration Form**
   - **Full Name**: Your full name
   - **Email**: Valid email address
   - **Password**: Minimum 6 characters
   - **Phone** (optional): Your phone number
   - **Role**: Automatically set to "member"

4. **Submit Registration**
   - Click "Sign Up" button
   - Wait for account creation
   - You'll be logged in automatically

5. **Complete Profile** (Optional)
   - Go to More tab → Profile
   - Add profile picture
   - Update additional information

---

## 🔑 Logging In

### For Existing Users

1. **Open the App**
   - Launch from Expo Go or emulator

2. **Enter Credentials**
   - Email address
   - Password

3. **Click "Sign In"**
   - Wait for authentication
   - Home screen will load

### Forgot Password?
- Currently requires Firebase Console access
- Go to Firebase Console → Authentication
- Reset password manually
- Future update will include in-app password reset

---

## 🧭 Navigating the App

### Bottom Navigation Tabs

The app has 4 main tabs:

1. **🏠 Home**
   - Welcome message with user name
   - Quick stats (Check-ins, Events, Prayers)
   - Quick action buttons
   - Upcoming events preview

2. **📅 Events**
   - Browse all church events
   - View event details
   - Register for events
   - See date, time, location

3. **💬 Messages**
   - Church announcements
   - Important notifications
   - Admin messages
   - Read receipts

4. **👤 More**
   - Access all features
   - Profile management
   - Settings
   - Admin dashboard (if admin)

---

## ✨ Accessing Features

### Member Features

#### Check-In System
1. Go to **More** → **Check-In**
2. Select service type (Sunday, Midweek, etc.)
3. Click "Check In Now"
4. View your check-in history

#### Sermons Library
1. Go to **More** → **Sermons**
2. Browse sermon cards
3. Tap a sermon to view details
4. Play video/audio (if available)

#### Daily Devotional
1. Go to **More** → **Devotional**
2. Read today's devotional
3. Swipe to previous days
4. Reflect on scripture

#### Online Giving
1. Go to **More** → **Giving**
2. Select giving type
3. Enter amount
4. Choose payment method
5. Complete transaction

#### Prayer Requests
1. Go to **More** → **Prayer**
2. Submit new prayer request
3. View community requests
4. Pray for others

#### Departments & Ministries
1. Go to **More** → **Departments** or **Ministries**
2. Browse available options
3. Join departments/ministries
4. View details and leaders

#### Volunteer Opportunities
1. Go to **More** → **Volunteer**
2. Browse opportunities
3. Sign up for activities
4. Track your volunteer hours

#### Church Directory
1. Go to **More** → **Directory**
2. View pastoral staff
3. See contact information
4. Call or email directly

---

## 👨‍💼 Admin Access

### Making Yourself Admin

1. **Register in the App First**
   - Create account as normal

2. **Open Firebase Console**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Select your project

3. **Navigate to Firestore**
   - Click "Firestore Database" in sidebar
   - Find "users" collection

4. **Locate Your User**
   - Find document with your email/UID
   - Click to open

5. **Change Role**
   - Find `role` field
   - Change value from `"member"` to `"admin"`
   - Click "Update"

6. **Restart App**
   - Close and reopen the app
   - Admin features now available

### Accessing Admin Dashboard

1. **Login as Admin**
   - Use your admin account credentials

2. **Navigate to Admin**
   - Go to **More** tab
   - Tap **Admin Dashboard** (new option visible)

3. **Admin Features Available**
   - Member statistics
   - Recent check-ins
   - Event attendance
   - Giving reports
   - Quick actions
   - Member management
   - Content management

---

## 🎯 Quick Actions Guide

### From Home Screen

**Quick Action Buttons:**
- **📅 View Events** → Opens Events screen
- **✅ Check In** → Opens Check-In screen
- **🎥 Sermons** → Opens Sermons library
- **🙏 Prayer** → Opens Prayer requests

### From More Tab

All features accessible via icon cards:
- Tap any card to access that feature
- Admin card only visible to admins
- Profile at top for quick access

---

## 🔄 Switching Accounts

### Logout Current User

1. Go to **More** tab
2. Tap **Profile**
3. Scroll to bottom
4. Tap **"Logout"** button
5. Confirm logout

### Login Different Account

1. After logout, login screen appears
2. Enter different credentials
3. Sign in
4. Access features for that account

---

## 📱 Using on Multiple Devices

### Same Account, Multiple Devices

1. **Install Expo Go** on each device
2. **Scan QR code** or use link
3. **Login** with same credentials
4. **Data syncs** via Firebase
5. **Access anywhere** you're logged in

### Testing Different Roles

1. **Device 1**: Login as member
2. **Device 2**: Login as admin
3. Test features on each
4. Compare experiences

---

## 🛠️ Troubleshooting Access

### Can't Connect to App

**Issue**: QR code scan doesn't work
**Solution**: 
- Ensure phone and computer on same WiFi
- Try typing the URL manually in Expo Go
- Restart development server: `npm start --clear`

**Issue**: App shows error screen
**Solution**:
- Check Firebase config in `firebase.config.js`
- Verify internet connection
- Check Firebase Console for service status

### Login Issues

**Issue**: "Invalid credentials"
**Solution**:
- Verify email and password correct
- Check Firebase Console → Authentication
- Ensure account exists

**Issue**: "Network error"
**Solution**:
- Check internet connection
- Verify Firebase project active
- Check authentication enabled

### Features Not Loading

**Issue**: Events/Sermons empty
**Solution**:
- Add sample data in Firebase Console
- Check Firestore security rules
- Verify collections exist

**Issue**: Admin features not showing
**Solution**:
- Verify role set to "admin" in Firestore
- Restart app completely
- Check user document structure

---

## 💡 Pro Tips

### For Best Experience

1. **Use Real Device**
   - Better performance than emulator
   - Test actual user experience
   - Access device features (camera, etc.)

2. **Keep App Running**
   - Development server must stay active
   - Don't close terminal
   - App updates automatically on save

3. **Use Fast Refresh**
   - Make code changes
   - Save file
   - App updates instantly
   - No need to reload

4. **Test Both Roles**
   - Create member account
   - Create admin account
   - Test all features
   - Verify permissions work

5. **Stay on Same Network**
   - Phone and computer same WiFi
   - Better connection stability
   - Faster reload times

---

## 🌐 Accessing from Anywhere

### Using Tunnel Mode

For accessing outside local network:

1. **Start with Tunnel**
   ```bash
   npm start --tunnel
   ```

2. **Wait for Tunnel URL**
   - Takes 30-60 seconds
   - Shows in terminal

3. **Access from Anywhere**
   - Use Expo Go app
   - Scan QR code
   - Works on any network

⚠️ **Note**: Tunnel mode is slower than LAN

---

## 📊 Testing Checklist

### After First Access

- [ ] Successfully registered account
- [ ] Logged in successfully
- [ ] Home screen loads with data
- [ ] Can navigate between tabs
- [ ] Events screen shows events
- [ ] Messages screen accessible
- [ ] More tab shows all features
- [ ] Profile screen opens
- [ ] Check-in system works
- [ ] Sermons library loads
- [ ] Devotional displays
- [ ] Giving page accessible
- [ ] Prayer requests work
- [ ] Can logout successfully

### After Admin Setup

- [ ] Role changed to admin in Firestore
- [ ] Admin Dashboard visible in More tab
- [ ] Admin Dashboard opens
- [ ] Statistics display correctly
- [ ] Quick actions work
- [ ] Can access admin features
- [ ] Member list accessible
- [ ] Can manage content

---

## 🔐 Security Reminders

### Account Security

1. **Use Strong Passwords**
   - Minimum 8 characters
   - Mix letters, numbers, symbols
   - Don't share credentials

2. **Admin Access**
   - Limit admin accounts
   - Only trusted staff
   - Monitor admin actions

3. **Firebase Security**
   - Keep config file private
   - Don't commit to public repos
   - Review security rules regularly

---

## 📞 Need Help?

### Resources

- **Quick Start**: `QUICKSTART.md`
- **Full Setup**: `SETUP_GUIDE.md`
- **Features List**: `FEATURES.md`
- **README**: `README.md`

### Support Contacts

- **Technical Support**: support@greaterworskcitychurch.org
- **Firebase Help**: [Firebase Support](https://firebase.google.com/support)
- **Expo Help**: [Expo Forums](https://forums.expo.dev/)

---

## 🎉 You're All Set!

You now know how to:
- ✅ Access the app on any device
- ✅ Create and manage accounts
- ✅ Navigate all features
- ✅ Access admin dashboard
- ✅ Troubleshoot common issues

**Enjoy using the Greater Works City Church app!**

---

## 🚀 Next Steps

1. **Customize the App**
   - Update church branding
   - Add your logo
   - Change colors

2. **Add Content**
   - Upload sermons
   - Create events
   - Post announcements

3. **Invite Members**
   - Share app link
   - Provide login instructions
   - Offer support

4. **Monitor Usage**
   - Check Firebase Analytics
   - Review user engagement
   - Gather feedback

---

*Built with ❤️ for Greater Works City Church, Ghana*
*Last Updated: January 6, 2025*
