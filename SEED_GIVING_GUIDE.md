# 🌱 Seed Giving Data - Quick Guide

## Problem Solved
Your admin dashboard shows the error because the `giving` collection doesn't exist yet. This guide will help you create it with sample data.

---

## ✅ Two Ways to Fix This

### Option 1: Run Seed Script (Recommended)

**Step 1: Update Firebase Rules**

In Firebase Console → Firestore → Rules, temporarily use this:

```javascript
match /giving/{givingId} {
  allow read, write: if true;  // Temporary - allows seeding
}
```

Click **Publish**

**Step 2: Run the Seed Script**

```bash
npm run seed:giving
```

**What this does:**
- Creates the `giving` collection
- Adds 5 sample donation records
- Total: GH₵2,150 in sample data
- Different types: tithe, offering, special
- Different methods: cash, mobile money, bank transfer

**Step 3: Secure the Rules**

After seeding, update rules back to secure version:

```javascript
match /giving/{givingId} {
  allow read: if request.auth != null && (
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
    (resource != null && 'userId' in resource.data && resource.data.userId == request.auth.uid)
  );
  allow create: if request.auth != null && 
                  request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

Click **Publish**

**Step 4: Test**
- Restart your app
- Go to Admin Dashboard
- ✅ No more errors!
- ✅ See giving statistics!

---

### Option 2: Create Manually in Firebase

**Step 1: Create Collection**
1. Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `giving`
4. Click "Next"

**Step 2: Add First Document**
- Document ID: Auto-ID
- Add fields:
  ```
  userId: (string) "test-user"
  amount: (number) 500
  type: (string) "tithe"
  method: (string) "cash"
  date: (string) "2026-01-07"
  createdAt: (timestamp) [current time]
  reference: (string) "CASH001"
  notes: (string) "Test donation"
  ```
- Click "Save"

**Step 3: Test**
- Refresh your app
- Go to Admin Dashboard
- Error should be gone!

---

## 📊 Sample Data Included in Seed Script

The seed script creates 5 donations:

| Date | Amount | Type | Method | User |
|------|--------|------|--------|------|
| Jan 1 | GH₵500 | Tithe | Mobile Money | User 1 |
| Jan 3 | GH₵200 | Offering | Cash | User 2 |
| Jan 5 | GH₵1000 | Special | Bank Transfer | User 1 |
| Jan 7 | GH₵300 | Tithe | Mobile Money | User 3 |
| Jan 7 | GH₵150 | Offering | Cash | User 2 |

**Total: GH₵2,150**

---

## 🎯 What You'll See After Seeding

### Admin Dashboard:
- ✅ **Total Giving**: GH₵2,150.00
- ✅ **This Week Giving**: GH₵450.00 (Jan 7 donations)
- ✅ **Trend**: Shows percentage change
- ✅ **Recent Activity**: "GH₵450.00 received this week"

---

## 🔧 Troubleshooting

### Error: "Permission Denied" when seeding

**Cause:** Firebase rules don't allow writing yet

**Fix:** Use the temporary permissive rule during seeding:
```javascript
match /giving/{givingId} {
  allow read, write: if true;
}
```

### Error: "Collection already exists"

**Not a problem!** The script will add more sample data to existing collection.

### Error: "Firebase not initialized"

**Fix:** Make sure `firebase.config.js` has correct credentials

---

## 🧹 Clean Up Sample Data Later

To remove test data:

1. Firebase Console → Firestore → `giving` collection
2. Delete documents with `userId: "sample-user-1"`, etc.
3. Or keep them as examples!

---

## 🚀 Next Steps

After seeding:

1. ✅ Test admin dashboard (no errors!)
2. ✅ Test giving screen (if you have one)
3. ✅ Update rules to production version (secure)
4. ✅ Users can start submitting real donations
5. ✅ Delete sample data if desired

---

## 💡 Customize Sample Data

Edit `scripts/seedGiving.js` to add more or different data:

```javascript
const givingData = [
  {
    userId: "your-real-user-id",  // Change this
    amount: 1000,
    type: "tithe",
    method: "mobile_money",
    date: "2026-01-07",
    // ... add more
  },
];
```

Then run `npm run seed:giving` again.

---

## 🎉 Summary

**Quick Fix (5 minutes):**
1. Update rules to permissive (temporary)
2. Run `npm run seed:giving`
3. Update rules to secure version
4. Restart app
5. ✅ Done!

**Result:**
- ✅ `giving` collection created
- ✅ Sample data added
- ✅ Dashboard works
- ✅ No more errors
- ✅ See real statistics!

---

**Need help?** Check `DEBUG_GIVING_PERMISSIONS.md` for detailed troubleshooting.

**Last Updated**: January 7, 2026



