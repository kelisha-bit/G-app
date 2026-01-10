# Greater Works City Church - Mobile App

A comprehensive church management mobile application built with React Native (Expo) and Firebase for Greater Works City Church in Ghana.

## 🌟 Features

### Member Features
- **Home Dashboard** - Overview of church activities and quick access to features
- **Check-In System** - Digital attendance tracking for services
- **Events** - Browse and register for church events
- **Sermons** - Watch and listen to recorded sermons
- **Daily Devotional** - Daily scripture readings and reflections (✨ Recently updated with Firebase integration)
- **Giving** - Secure online giving with Mobile Money integration
- **Departments** - View and join church departments
- **Ministries** - Connect with life-stage specific ministries
- **Volunteer** - Sign up for volunteer opportunities
- **Directory** - Contact information for pastors and church leaders
- **Prayer Requests** - Submit and pray for community prayer requests
- **Messages** - Receive announcements and communications (✨ Recently updated with Firebase integration)
- **Edit Profile** - Update profile information and upload profile photo

### Admin Features
- **Admin Dashboard** - Overview of church statistics and analytics
- **Member Management** - Manage church members and roles
- **Event Management** - Create and manage church events
- **Sermon Management** - Upload and organize sermons
- **Announcement System** - Send messages to members
- **Reports & Analytics** - View attendance, giving, and engagement metrics

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd G-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure Environment Variables:
   - Copy the example environment file:
     ```bash
     # Windows (PowerShell):
     Copy-Item .env.example .env
     # Or run: .\setup-env.ps1
     
     # Mac/Linux:
     cp .env.example .env
     ```
   - Open `.env` and add your Firebase configuration:
     - Get your Firebase config from [Firebase Console](https://console.firebase.google.com/)
     - Project Settings > General > Your apps > Web app config
     - Copy all `EXPO_PUBLIC_FIREBASE_*` values to your `.env` file
   - (Optional) Add API keys for OpenAI and Weather features
   - See `SECURITY_SETUP_GUIDE.md` for detailed instructions

4. Start the development server:
```bash
npm start --clear
```
**Note:** Use `--clear` flag to ensure environment variables are loaded properly.

5. Run on your device:
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal
   - Or run on emulator:
     - Android: `npm run android`
     - iOS: `npm run ios` (macOS only)

## 📱 App Structure

```
G-app/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── admin/
│   │   │   └── AdminDashboardScreen.js
│   │   ├── HomeScreen.js
│   │   ├── CheckInScreen.js
│   │   ├── EventsScreen.js
│   │   ├── SermonsScreen.js
│   │   ├── DevotionalScreen.js
│   │   ├── GivingScreen.js
│   │   ├── DepartmentsScreen.js
│   │   ├── MinistriesScreen.js
│   │   ├── VolunteerScreen.js
│   │   ├── DirectoryScreen.js
│   │   ├── PrayerScreen.js
│   │   ├── MessagesScreen.js
│   │   ├── ProfileScreen.js
│   │   └── EditProfileScreen.js
├── firebase.config.js
├── App.js
└── package.json
```

## 🎨 Design Features

- Modern, professional UI with gradient designs
- Intuitive navigation with bottom tabs
- Responsive layouts for all screen sizes
- Beautiful color scheme with purple/indigo theme
- Smooth animations and transitions
- Card-based layouts for better content organization

## 🔐 Security

- Firebase Authentication for secure user management
- Role-based access control (Member/Admin)
- Secure data storage with Firestore
- Protected admin routes

## 📊 Firebase Collections

The app uses the following Firestore collections:
- `users` - User profiles and roles
- `events` - Church events
- `sermons` - Sermon recordings
- `checkIns` - Attendance records
- `prayerRequests` - Community prayer requests
- `departments` - Church departments
- `ministries` - Church ministries
- `announcements` - Church announcements
- `devotionals` - Daily devotionals
- `devotionalBookmarks` - User bookmarked devotionals
- `devotionalNotes` - User notes on devotionals

## 🛠️ Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **Firebase** - Backend services
  - Authentication
  - Firestore Database
  - Cloud Storage
- **React Navigation** - Navigation library
- **Expo Linear Gradient** - Gradient backgrounds
- **Expo Vector Icons** - Icon library

## 📝 Recent Updates

### January 2026 - Feature Updates

#### Announcements Feature
- ✅ **Firebase Integration**: Announcements now load from Firebase in real-time
- ✅ **Priority System**: High/Medium/Low priority color-coding
- ✅ **Categories**: Organized by General, Event, Urgent, Update, Prayer, Reminder
- ✅ **Detail View**: Full announcement modal with complete content
- ✅ **Pull-to-Refresh**: Easy refresh for latest updates
- ✅ **Smart Dates**: Intelligent date formatting (Today, Yesterday, etc.)
- 📚 **Documentation**: See `ANNOUNCEMENTS_INDEX.md` for complete guide

#### Devotional Feature
- ✅ **Firebase Integration**: Devotionals now load from Firebase by date
- ✅ **Date-Based Loading**: Automatically loads today's devotional
- ✅ **Week Selector**: Browse devotionals by day of week
- ✅ **Bookmark Feature**: Save favorite devotionals
- ✅ **Personal Notes**: Add reflections per devotional
- ✅ **Share Functionality**: Share devotionals with others
- ✅ **Admin Management**: Complete admin screen for creating/managing devotionals
- 📚 **Documentation**: See `DEVOTIONAL_COMPLETE_SUMMARY.md` for complete guide

## 📝 Future Enhancements

- Push notifications for events and announcements
- Live streaming integration
- Bible reading plans
- Small group management
- Event check-in with QR codes
- Payment gateway integration for giving
- Multi-language support
- Offline mode support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed for use by Greater Works City Church.

## 📧 Support

For support, please contact the church administration at info@greaterworskcitychurch.org

---

Built with ❤️ for Greater Works City Church, Ghana

