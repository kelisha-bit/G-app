# 🚀 Deployment Checklist

Use this checklist to ensure your Greater Works City Church app is ready for production.

## 📋 Pre-Deployment Checklist

### 1. Firebase Configuration ✅

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created and configured
- [ ] Storage enabled
- [ ] Security rules configured and tested
- [ ] Firebase config updated in `firebase.config.js`
- [ ] Test Firebase connection

**Verify:**
```bash
# Test by running the app and trying to register/login
npm start
```

---

### 2. Church Branding 🎨

- [ ] Church name updated throughout app
- [ ] Church logo added to `assets/icon.png` (1024x1024)
- [ ] Splash screen updated `assets/splash.png` (1242x2436)
- [ ] Adaptive icon updated `assets/adaptive-icon.png` (1024x1024)
- [ ] Favicon updated `assets/favicon.png` (48x48)
- [ ] App name updated in `app.json`
- [ ] Bundle identifier updated in `app.json`

**Files to Update:**
```
✏️ app.json - name, slug, bundleIdentifier, package
✏️ App.js - church name in components
✏️ README.md - church information
✏️ All screen headers - church name
```

---

### 3. Initial Data Setup 📊

- [ ] Create admin user account
- [ ] Set admin role in Firestore
- [ ] Add initial events
- [ ] Add initial sermons
- [ ] Add departments
- [ ] Add ministries
- [ ] Add church leaders to directory
- [ ] Create welcome announcement
- [ ] Test all features with sample data

**Admin Setup:**
1. Register through app
2. Go to Firebase Console > Firestore
3. Find your user in `users` collection
4. Change `role` to `"admin"`
5. Restart app

---

### 4. Testing 🧪

#### Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works (if implemented)
- [ ] Check-in system works
- [ ] Events display correctly
- [ ] Sermons play properly
- [ ] Devotional loads
- [ ] Giving form works
- [ ] Prayer requests submit
- [ ] Messages display
- [ ] Directory search works
- [ ] Admin dashboard loads
- [ ] All navigation works

#### Device Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on tablet (iPad/Android)
- [ ] Test different screen sizes
- [ ] Test in portrait mode
- [ ] Test in landscape mode (if supported)

#### Performance Testing
- [ ] App loads quickly
- [ ] Images load properly
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] No crashes
- [ ] Works on slow network

---

### 5. Security Review 🔒

- [ ] Firebase security rules tested
- [ ] Admin routes protected
- [ ] User data properly secured
- [ ] API keys not exposed in code
- [ ] Input validation implemented
- [ ] SQL injection prevention (N/A for Firebase)
- [ ] XSS prevention measures

**Security Rules Test:**
```javascript
// Try accessing admin features as regular user
// Try modifying other users' data
// Try accessing without authentication
```

---

### 6. Content Review 📝

- [ ] All text proofread
- [ ] No placeholder text remaining
- [ ] Contact information correct
- [ ] Church address correct
- [ ] Phone numbers correct
- [ ] Email addresses correct
- [ ] Social media links correct (if added)
- [ ] Terms of service added (if required)
- [ ] Privacy policy added (if required)

---

### 7. App Store Preparation 📱

#### iOS App Store
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect setup
- [ ] App name reserved
- [ ] App description written
- [ ] Screenshots prepared (5.5", 6.5" displays)
- [ ] App icon ready (1024x1024)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] App category selected
- [ ] Age rating determined
- [ ] Keywords selected

#### Google Play Store
- [ ] Google Play Console account ($25 one-time)
- [ ] App listing created
- [ ] App description written
- [ ] Screenshots prepared (phone & tablet)
- [ ] Feature graphic (1024x500)
- [ ] App icon ready (512x512)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire completed
- [ ] App category selected
- [ ] Target audience defined

---

### 8. Build Configuration ⚙️

- [ ] App version updated in `app.json`
- [ ] Build number incremented
- [ ] Bundle identifier correct
- [ ] App permissions configured
- [ ] Splash screen configured
- [ ] App icon configured
- [ ] Orientation settings correct

**app.json checklist:**
```json
{
  "expo": {
    "name": "Your Church Name",
    "slug": "your-church-slug",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourchurch.app"
    },
    "android": {
      "package": "com.yourchurch.app"
    }
  }
}
```

---

### 9. Documentation 📚

- [ ] README.md updated
- [ ] Setup guide reviewed
- [ ] Features documented
- [ ] Admin guide created
- [ ] User guide created (optional)
- [ ] FAQ prepared
- [ ] Support email configured
- [ ] Changelog started

---

### 10. Analytics & Monitoring 📊

- [ ] Firebase Analytics enabled
- [ ] Crash reporting configured
- [ ] Performance monitoring enabled
- [ ] User engagement tracking setup
- [ ] Custom events defined
- [ ] Admin dashboard metrics verified

---

## 🏗️ Build Process

### Development Build (Testing)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

### Production Build

```bash
# Build for Android (APK/AAB)
eas build --platform android --profile production

# Build for iOS (IPA)
eas build --platform ios --profile production
```

---

## 📱 Deployment Steps

### Android Deployment

1. **Build APK/AAB**
   ```bash
   eas build --platform android --profile production
   ```

2. **Download Build**
   - Wait for build to complete
   - Download from Expo dashboard

3. **Upload to Play Store**
   - Go to Google Play Console
   - Create new release
   - Upload AAB file
   - Fill in release notes
   - Submit for review

4. **Review Process**
   - Usually takes 1-3 days
   - Monitor for any issues
   - Respond to review feedback

### iOS Deployment

1. **Build IPA**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Upload to App Store**
   - Use Transporter app or Xcode
   - Upload IPA file

3. **App Store Connect**
   - Fill in app information
   - Add screenshots
   - Set pricing (Free)
   - Submit for review

4. **Review Process**
   - Usually takes 1-3 days
   - May require additional info
   - Respond promptly to Apple

---

## 🔄 Post-Deployment

### Immediate Actions
- [ ] Monitor crash reports
- [ ] Check user feedback
- [ ] Monitor Firebase usage
- [ ] Test on production
- [ ] Announce launch
- [ ] Train church staff
- [ ] Create user guides
- [ ] Set up support system

### First Week
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Monitor performance
- [ ] Track user adoption
- [ ] Respond to reviews
- [ ] Update documentation

### First Month
- [ ] Analyze usage data
- [ ] Plan improvements
- [ ] Gather feature requests
- [ ] Optimize performance
- [ ] Update content regularly
- [ ] Build user community

---

## 📊 Success Metrics

Track these metrics post-launch:

### User Metrics
- Total downloads
- Active users (daily/weekly/monthly)
- User retention rate
- Session duration
- Feature usage rates

### Engagement Metrics
- Check-ins per week
- Event registrations
- Sermon views
- Prayer requests submitted
- Giving transactions
- Messages read

### Technical Metrics
- App crashes
- Load times
- API response times
- Error rates
- Firebase usage

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache
npm start --clear
rm -rf node_modules
npm install
```

**Firebase Connection Issues**
- Verify config in `firebase.config.js`
- Check Firebase Console for service status
- Verify API keys are correct

**App Store Rejection**
- Read rejection reason carefully
- Fix issues mentioned
- Resubmit with explanation

---

## 📞 Support Resources

### Technical Support
- Expo Documentation: https://docs.expo.dev/
- Firebase Documentation: https://firebase.google.com/docs
- React Native: https://reactnative.dev/

### Community
- Expo Forums: https://forums.expo.dev/
- Stack Overflow: Tag with 'expo', 'react-native'
- GitHub Issues: For specific bugs

### Church Support
- Email: support@greaterworskcitychurch.org
- Phone: +233 XX XXX XXXX
- Documentation: See README.md

---

## ✅ Final Checklist

Before submitting to app stores:

- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] Firebase configured and tested
- [ ] Church branding complete
- [ ] Initial data populated
- [ ] Admin account created
- [ ] Security rules configured
- [ ] Privacy policy added
- [ ] Terms of service added
- [ ] App store assets ready
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Support system in place
- [ ] Documentation complete
- [ ] Team trained on app
- [ ] Launch announcement ready

---

## 🎉 Launch Day!

### Launch Checklist
1. [ ] Final build uploaded
2. [ ] App store listings complete
3. [ ] Submit for review
4. [ ] Prepare announcement
5. [ ] Train church staff
6. [ ] Set up support channels
7. [ ] Monitor closely
8. [ ] Celebrate! 🎊

---

**Good luck with your launch!** 🚀

Your Greater Works City Church app is ready to serve your community!

---

*Last Updated: January 6, 2025*
*Version: 1.0.0*

