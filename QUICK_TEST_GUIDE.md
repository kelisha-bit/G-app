# 🚀 Quick Test Guide - Edit Profile Feature

## ⚡ Quick Start (2 Minutes)

### 1. Start the App
```bash
cd G-app
npm start
```

### 2. Test New Features

#### Test Edit Profile (Main Feature)
1. **Login** to the app
2. Tap **"More"** tab (bottom right)
3. Scroll down to **"Settings"** section
4. Tap **"Edit Profile"** (first item)
5. ✅ You should see the Edit Profile screen

#### Test Photo Upload
1. In Edit Profile screen, tap **"Change Photo"**
2. Grant permission when asked
3. Select any photo from your gallery
4. ✅ Photo should upload and display immediately

#### Test Profile Editing
1. Change your **Display Name**
2. Add a **Phone Number** (e.g., +233 24 123 4567)
3. Add your **Date of Birth** (e.g., 15/05/1990)
4. Add your **Address**
5. Write a short **Bio**
6. Tap **"Save Changes"**
7. ✅ Success message should appear
8. ✅ You'll return to Profile screen

#### Test Profile Display
1. Go back to **More** tab
2. ✅ Your new photo should display at the top
3. ✅ Your updated name should show

#### Test Admin Detection (If Admin)
1. Go to More tab
2. ✅ "Admin Dashboard" button should appear (if you're admin)
3. ✅ Regular users won't see this button

---

## 🧪 Complete Testing Checklist

### ✅ Basic Functionality
- [ ] App starts without errors
- [ ] Can navigate to Profile screen
- [ ] Edit Profile button is clickable
- [ ] Edit Profile screen loads
- [ ] Can return to Profile screen

### ✅ Photo Upload
- [ ] "Change Photo" button works
- [ ] Permission request appears
- [ ] Can select photo from gallery
- [ ] Photo uploads successfully
- [ ] Progress indicator shows during upload
- [ ] Uploaded photo displays correctly

### ✅ Form Functionality
- [ ] All input fields are editable
- [ ] Email field is disabled (security)
- [ ] Can type in all fields
- [ ] Placeholder text is visible
- [ ] Icons display correctly

### ✅ Save Functionality
- [ ] Save button is clickable
- [ ] Loading indicator shows when saving
- [ ] Success message appears after save
- [ ] Returns to Profile screen after save
- [ ] Updated data persists

### ✅ Data Persistence
- [ ] Close and reopen app
- [ ] Profile photo still shows
- [ ] Updated name displays
- [ ] All data is retained

### ✅ Error Handling
- [ ] Try saving with empty name
- [ ] Should show error message
- [ ] App doesn't crash on errors
- [ ] Can recover from errors

### ✅ Navigation
- [ ] Back button works
- [ ] Can navigate between screens
- [ ] Bottom tabs work correctly
- [ ] No navigation issues

---

## 🐛 Common Issues & Solutions

### Issue: Photo Won't Upload
**Solution:**
1. Check device permissions: Settings → App → Permissions → Photos
2. Ensure you have internet connection
3. Try a different photo (smaller size)
4. Restart the app

### Issue: Changes Not Saving
**Solution:**
1. Check internet connection
2. Ensure display name is not empty
3. Look for error messages
4. Try logging out and back in

### Issue: Admin Button Not Showing
**This is normal!** Only users with admin role see this button.

**To make a user admin:**
1. Go to Firebase Console
2. Open Firestore Database
3. Find `users` collection
4. Locate your user document
5. Change `role` field from `"member"` to `"admin"`
6. Save and restart app

---

## 📱 Test on Multiple Devices

### Android Testing
```bash
npm run android
# Or scan QR with Expo Go app
```

### iOS Testing (Mac only)
```bash
npm run ios
# Or scan QR with Expo Go app
```

---

## ✨ What to Look For

### Good Signs ✅
- Smooth animations
- Fast loading times
- Clear error messages
- Professional appearance
- Intuitive navigation
- Responsive interface

### Red Flags ❌
- App crashes
- Errors in console
- Slow performance
- Missing features
- Navigation broken
- Data not saving

---

## 🎯 Feature Verification

### Edit Profile Screen Should Have:
- [x] Gradient header (purple/indigo)
- [x] Back button (top left)
- [x] "Edit Profile" title
- [x] Profile photo display (circle)
- [x] "Change Photo" button
- [x] Display Name field (with person icon)
- [x] Email field (disabled, with mail icon)
- [x] Phone Number field (with phone icon)
- [x] Date of Birth field (with calendar icon)
- [x] Address field (with location icon)
- [x] Bio text area (multi-line)
- [x] "Save Changes" button (gradient)
- [x] Loading indicators when needed

### Profile Screen Should Have:
- [x] Profile photo or initials
- [x] User name from database
- [x] User email
- [x] Quick Access menu (9 items)
- [x] Settings section (5 items)
- [x] Edit Profile item (clickable)
- [x] Admin Dashboard (if admin)
- [x] Logout button

---

## 🔍 Quick Debug Commands

### Check for Errors
```bash
# In terminal where npm start is running
# Look for red error messages
```

### Clear Cache (if issues)
```bash
npm start --clear
```

### Reinstall Dependencies (if needed)
```bash
rm -rf node_modules
npm install
npm start
```

---

## 📊 Performance Check

### Should Be Fast ⚡
- Screen transitions: < 0.5 seconds
- Photo upload: < 5 seconds (normal connection)
- Data save: < 2 seconds
- Screen load: < 1 second

### If Slow 🐌
- Check internet connection
- Try smaller photos
- Clear app cache
- Restart development server

---

## 🎓 Testing Tips

### Best Practices
1. **Test with real data** - Use actual photos and information
2. **Test offline** - See how app handles no connection
3. **Test permissions** - Deny first, then allow
4. **Test edge cases** - Very long names, special characters
5. **Test multiple times** - Edit profile several times
6. **Test as different users** - Admin and regular member
7. **Test on different devices** - Various screen sizes

### What to Document
- Any errors or crashes
- Slow performance areas
- Confusing UI elements
- Missing features
- Suggestions for improvement

---

## 🆘 Need Help?

### Documentation
- **WHATS_NEW.md** - User guide
- **UPDATE_LOG.md** - Technical details
- **IMPLEMENTATION_SUMMARY.md** - Overview
- **SETUP_GUIDE.md** - Initial setup

### Support
- Review console logs for errors
- Check Firebase Console for data
- Verify Firebase security rules
- Contact: support@greaterworskcitychurch.org

---

## ✅ Success Criteria

### Feature is Working If:
1. ✅ Can upload profile photo
2. ✅ Can edit all profile fields
3. ✅ Data saves to Firebase
4. ✅ Updates appear immediately
5. ✅ No errors in console
6. ✅ App doesn't crash
7. ✅ Navigation works smoothly
8. ✅ Admin detection works

---

## 🎉 Congratulations!

If all tests pass, your Edit Profile feature is working perfectly! 

**The app is ready for users! 🚀**

---

**Testing Time**: ~5 minutes  
**Difficulty**: Easy  
**Priority**: High  

**Happy Testing! 🎊**




