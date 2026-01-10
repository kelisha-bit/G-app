# ⚡ QUICK FIX: Donations Permissions (5 Minutes)

## 🎯 The Problem
```
ERROR  Error loading giving stats: [FirebaseError: Missing or insufficient permissions.]
ERROR  Error processing donation: [FirebaseError: Missing or insufficient permissions.]
```

---

## ✅ 3-Step Solution

### Step 1: Update Firebase Rules (2 min)

1. **Open**: https://console.firebase.google.com/project/greater-works-city-churc-4a673/firestore/rules

2. **Copy** the entire contents from: `FIREBASE_RULES_COMPLETE.txt` (in your project folder)

3. **Paste** into Firebase Console

4. **Click** "Publish" button

5. **Wait** for "Rules published successfully" message

---

### Step 2: Create Index (1 min)

**Method A: Use Error Link (Easiest)**
1. Look in your terminal for the error with the long URL
2. Copy this URL: `https://console.firebase.google.com/v1/r/project/greater-works-city-churc-4a673/firestore/indexes?create_composite=...`
3. Paste in browser and press Enter
4. Click "Create" button
5. Wait 1-2 minutes for index to build

**Method B: Manual Creation**
1. Go to: https://console.firebase.google.com/project/greater-works-city-churc-4a673/firestore/indexes
2. Click "Add Index"
3. Collection ID: `donations`
4. Field 1: `userId` (Ascending)
5. Field 2: `createdAt` (Descending)
6. Click "Create"
7. Wait for status to show "Enabled"

---

### Step 3: Restart App (2 min)

1. **Stop** Expo server (Ctrl+C in terminal)

2. **Clear cache and restart**:
   ```bash
   npx expo start --clear
   ```

3. **Wait** for app to rebuild

4. **Test** the giving screen

---

## ✅ Test It Works

1. Open app
2. Go to **Giving** screen
3. Enter an amount (e.g., 100)
4. Select category and payment method
5. Tap **"Give Now"**
6. Confirm

**Expected**: ✅ Success message with transaction ID

**No More**: ❌ Permission errors in terminal

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Still getting permission error | Wait 30 seconds, restart app again |
| Still says "requires index" | Wait for index status to be "Enabled" in Firebase |
| App won't load | Check you're logged in, try logout/login |
| Rules won't publish | Check for red underlines (syntax errors) |

---

## 🎉 Success = No More Errors!

After fix, terminal should be quiet (no red ERROR messages about permissions).

---

**Need more details?** → See `FIX_DONATIONS_PERMISSIONS_COMPLETE.md`

**Updated**: Jan 7, 2026

