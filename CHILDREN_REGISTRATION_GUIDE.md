# Children Registration Guide

## Overview

The app now includes a **Children Profile Registration** feature that allows parents to register their children once and then quickly check them in for services without re-entering information each time.

---

## 🎯 Key Features

### ✅ Permanent Child Profiles
- Register children with their information once
- Edit or delete profiles anytime
- Profiles are saved to your account

### ✅ Quick Check-In
- Select from registered children during check-in
- Pre-filled forms save time
- Still supports manual check-in for guests

### ✅ Smart Suggestions
- After checking in a new child, the app offers to save their profile
- One-tap registration from check-in

---

## 📱 How to Register a Child

### Method 1: From Check-In Tab

1. Navigate to **Family Ministry** → **Check-In** tab
2. Tap the **"Register Child"** button (green button with person icon)
3. Fill out the registration form:
   - **Child's Name** (required)
   - **Child's Age** (required)
   - **Parent/Guardian Name** (optional - auto-filled from your profile)
   - **Phone Number** (optional - auto-filled from your profile)
   - **Special Needs or Allergies** (optional)
4. Tap **"Register"** to save

### Method 2: After Check-In

1. Check in a child using the normal check-in process
2. After successful check-in, you'll see a prompt asking if you want to save the profile
3. Tap **"Save Profile"** to register the child

### Method 3: From Registered Children List

1. Go to **Check-In** tab
2. Tap the **"+"** icon in the "Registered Children" section header
3. Fill out the form and register

---

## 🔄 How to Check In Using Registered Children

### Quick Check-In Process:

1. Go to **Family Ministry** → **Check-In** tab
2. Tap on a registered child card
3. The check-in form opens with information pre-filled
4. Select the **Age Group** for today's service
5. Review and adjust any information if needed
6. Tap **"Check In"**

### Manual Check-In (Still Available):

1. Tap **"Check In Child"** button
2. In the modal, you can:
   - Select a registered child from the horizontal list at the top, OR
   - Fill out the form manually for a guest child

---

## ✏️ Managing Registered Children

### Edit a Child Profile:

1. Find the child in the "Registered Children" section
2. Tap the **pencil icon** (edit button) on the right
3. Update any information
4. Tap **"Update"** to save changes

### Delete a Child Profile:

1. Find the child in the "Registered Children" section
2. Tap the **trash icon** (delete button) on the right
3. Confirm deletion
4. **Note:** This only deletes the profile, not check-in history

---

## 📊 What Gets Saved

### Child Profile Includes:
- Child's name
- Child's age
- Parent/guardian name
- Phone number
- Special needs or allergies
- Registration date
- Last updated date

### Check-In Records Include:
- All profile information
- Age group for that service
- Check-in date and time
- Pickup code
- Service location

---

## 🔒 Privacy & Security

- **Your Data:** Only you can see your registered children
- **Admin Access:** Church administrators can view all profiles for management
- **Secure Storage:** All data is stored securely in Firebase
- **Check-In History:** Separate from profiles - deleting a profile doesn't delete check-in history

---

## 💡 Tips & Best Practices

### For Parents:
- ✅ Register all your children for fastest check-ins
- ✅ Keep special needs information up-to-date
- ✅ Update ages as children grow
- ✅ Use quick check-in for regular attendees
- ✅ Use manual check-in for guests or visitors

### For Administrators:
- ✅ Encourage parents to register children
- ✅ Monitor registered children count
- ✅ Use profiles for better event planning
- ✅ Access all profiles for reporting

---

## ❓ Frequently Asked Questions

### Q: Do I have to register my children?
**A:** No, registration is optional. You can still check in children manually each time.

### Q: Can I register multiple children?
**A:** Yes! Register as many children as you need. Each child gets their own profile.

### Q: What if my child's age changes?
**A:** Simply edit the child's profile and update their age. The change will be saved for future check-ins.

### Q: Can I delete a profile?
**A:** Yes, you can delete a profile anytime. This won't affect past check-in records.

### Q: What if I check in a guest child?
**A:** You can still use manual check-in. The app will ask if you want to save the profile, but you can skip it.

### Q: Can I use registered children for different age groups?
**A:** Yes! When you select a registered child for check-in, you still choose the age group for that specific service.

---

## 🚀 Benefits

### For Parents:
- ⚡ **Faster Check-Ins** - No more typing the same information repeatedly
- 📝 **Consistent Information** - Special needs and allergies always included
- 🎯 **Easy Management** - Update information in one place
- 📱 **Convenient** - Quick access to all your children

### For Church:
- 📊 **Better Data** - More complete child information
- ⏱️ **Faster Service** - Reduced check-in time
- 📈 **Analytics** - Better attendance tracking
- 🎯 **Planning** - Know registered children for events

---

## 🔧 Technical Details

### Firestore Collections:

**childrenProfiles** - Stores registered child profiles
- `parentId` - Links to parent user
- `childName` - Child's name
- `childAge` - Child's age
- `specialNeeds` - Special needs or allergies
- `createdAt` - Registration timestamp
- `updatedAt` - Last update timestamp

**childrenCheckIns** - Stores check-in records (unchanged)
- Contains full check-in information
- Linked to parent via `parentId`
- Includes pickup codes and service details

### Security Rules:
- Parents can only read/write their own children's profiles
- Admins can read all profiles
- Check-in records follow same security model

---

## 📝 Notes

- Registered children are stored separately from check-in records
- You can have multiple profiles with the same name (for different children)
- Age groups are selected per check-in, not stored in profile
- Profiles sync across all your devices automatically

---

## 🆘 Need Help?

If you encounter any issues:
1. Check your internet connection
2. Ensure you're logged in
3. Try refreshing the screen
4. Contact church administration for support

---

**Last Updated:** January 2025

