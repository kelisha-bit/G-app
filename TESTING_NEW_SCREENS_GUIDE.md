# 🧪 Testing Guide for New Screens

## Overview
This guide will help you test the three new screens that were just implemented:
1. **Bible Reading & Study Screen**
2. **Small Groups / Life Groups Screen**
3. **Sermon Notes Screen**

---

## ✅ Pre-Testing Checklist

### 1. Update Firebase Rules
The Firebase security rules have been updated. You need to deploy them:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Copy the updated rules from `firestore.rules`
5. Paste and click **Publish**

**Important**: Without these rules, the new features won't work!

### 2. Verify App is Running
```bash
npm start
```

### 3. Login to the App
Make sure you're logged in as a regular user (not admin) to test member features.

---

## 📖 Testing: Bible Reading & Study Screen

### Test 1: Access the Screen
1. ✅ Open the app
2. ✅ Go to **Home** screen
3. ✅ Tap **Bible** in Quick Actions
4. ✅ Verify the Bible screen opens

### Test 2: Verse of the Day
1. ✅ Check that "Verse of the Day" is displayed
2. ✅ Verify verse text appears
3. ✅ Check verse reference is shown
4. ✅ Tap "Tap to read more" on Home screen verse widget
5. ✅ Verify it navigates to Bible screen

### Test 3: Search Functionality
1. ✅ Go to **Search** tab
2. ✅ Enter "John 3:16" in search box
3. ✅ Tap search button
4. ✅ Verify verse appears
5. ✅ Try invalid format (e.g., "John3:16")
6. ✅ Verify error message appears
7. ✅ Try another verse: "Psalm 23:1-3"
8. ✅ Verify verse range works

### Test 4: Bookmarks
1. ✅ Search for a verse (e.g., "John 3:16")
2. ✅ Tap **Bookmark** button
3. ✅ Verify success message
4. ✅ Go to **Saved** tab
5. ✅ Verify bookmarked verse appears
6. ✅ Tap bookmark again to remove
7. ✅ Verify it's removed from Saved tab

### Test 5: Share Functionality
1. ✅ Search for a verse
2. ✅ Tap **Share** button
3. ✅ Verify share dialog appears
4. ✅ Test sharing (cancel is fine)

### Test 6: Reading Plans
1. ✅ Go to **Plans** tab
2. ✅ Verify reading plans are listed
3. ✅ Tap on a plan
4. ✅ Verify plan details appear
5. ✅ Note: Full tracking coming soon (expected)

### Test 7: Quick Access
1. ✅ From Verse tab, verify quick access cards:
   - Search Verse
   - Bookmarks
   - Reading Plans
   - Browse Bible

---

## 👥 Testing: Small Groups Screen

### Test 1: Access the Screen
1. ✅ Go to **Home** screen
2. ✅ Tap **Small Groups** in Quick Actions
3. ✅ Verify Small Groups screen opens

### Test 2: View Groups
1. ✅ Verify groups are displayed
2. ✅ Check group cards show:
   - Group name
   - Leader name
   - Schedule
   - Member count
   - Topic (if available)

### Test 3: Search Groups
1. ✅ Enter search query (e.g., "Young Adults")
2. ✅ Verify filtered results appear
3. ✅ Clear search
4. ✅ Verify all groups return

### Test 4: Filter Groups
1. ✅ Tap **All Groups** filter
2. ✅ Verify all groups shown
3. ✅ Tap **My Groups** filter
4. ✅ Verify only joined groups shown (empty if none)
5. ✅ Tap **Available** filter
6. ✅ Verify only groups with space shown

### Test 5: Join a Group
1. ✅ Find a group with available space
2. ✅ Tap **Join** button
3. ✅ Confirm in alert
4. ✅ Verify success message
5. ✅ Check "Member" badge appears
6. ✅ Verify button changes to "Leave"
7. ✅ Check member count increased

### Test 6: Leave a Group
1. ✅ Find a group you're a member of
2. ✅ Tap **Leave** button
3. ✅ Confirm in alert
4. ✅ Verify success message
5. ✅ Check "Member" badge disappears
6. ✅ Verify button changes to "Join"
7. ✅ Check member count decreased

### Test 7: Group Details
1. ✅ Tap on a group card
2. ✅ Verify modal opens with:
   - Group name
   - Description
   - Leader info
   - Schedule
   - Location
   - Member count
   - Contact info
3. ✅ Test Join/Leave from modal
4. ✅ Close modal

### Test 8: Full Groups
1. ✅ Find or create a full group (memberCount >= capacity)
2. ✅ Verify "Full" badge appears
3. ✅ Verify Join button is disabled
4. ✅ Verify button shows "Full"

### Test 9: Pull to Refresh
1. ✅ Pull down on groups list
2. ✅ Verify refresh indicator appears
3. ✅ Verify data reloads

---

## 📝 Testing: Sermon Notes Screen

### Test 1: Access the Screen
1. ✅ Go to **Sermons** screen
2. ✅ Find a sermon
3. ✅ Tap **Notes** button on sermon card
4. ✅ Verify Sermon Notes screen opens with sermon pre-selected
5. ✅ OR go to **Home** → **Profile** → find Notes option (if added)

### Test 2: Create a Note
1. ✅ Tap **+** button (top right)
2. ✅ Enter note title (e.g., "Key Points from Sunday")
3. ✅ Verify sermon is already linked (if came from Sermons screen)
4. ✅ Enter note content
5. ✅ Tap **Save**
6. ✅ Verify success message
7. ✅ Verify note appears in list

### Test 3: Create Note Without Sermon
1. ✅ Tap **+** button
2. ✅ Enter title and content
3. ✅ Don't link to sermon (or remove link)
4. ✅ Save
5. ✅ Verify note saves without sermon link

### Test 4: Link Note to Sermon
1. ✅ Create new note
2. ✅ Tap **Select** under "Linked Sermon"
3. ✅ Choose a sermon from list
4. ✅ Verify sermon name appears
5. ✅ Save note
6. ✅ Verify sermon name shows on note card

### Test 5: Edit a Note
1. ✅ Tap on an existing note
2. ✅ Verify edit modal opens with current data
3. ✅ Modify title or content
4. ✅ Tap **Update**
5. ✅ Verify changes saved
6. ✅ Verify updated note in list

### Test 6: Delete a Note
1. ✅ Find a note
2. ✅ Tap **Delete** icon (trash)
3. ✅ Confirm deletion
4. ✅ Verify success message
5. ✅ Verify note removed from list

### Test 7: Share a Note
1. ✅ Find a note
2. ✅ Tap **Share** icon
3. ✅ Verify share dialog appears
4. ✅ Test sharing (cancel is fine)

### Test 8: Search Notes
1. ✅ Enter search query in search box
2. ✅ Verify filtered results
3. ✅ Try searching by:
   - Note title
   - Note content
   - Sermon name
4. ✅ Clear search
5. ✅ Verify all notes return

### Test 9: Empty States
1. ✅ Delete all notes (if any)
2. ✅ Verify empty state message appears
3. ✅ Verify "Create Note" button
4. ✅ Tap button
5. ✅ Verify create modal opens

### Test 10: Character Count
1. ✅ Create/edit note
2. ✅ Type in content field
3. ✅ Verify character count updates
4. ✅ Verify it's displayed correctly

### Test 11: Pull to Refresh
1. ✅ Pull down on notes list
2. ✅ Verify refresh indicator
3. ✅ Verify notes reload

---

## 🔍 Common Issues & Solutions

### Issue: "Permission Denied" Error
**Solution**: 
- Check Firebase rules are deployed
- Verify you're logged in
- Check console for specific error

### Issue: Bible Verse Not Loading
**Solution**:
- Check internet connection
- Verify verse format (e.g., "John 3:16" not "John3:16")
- Check console for API errors

### Issue: Can't Join Small Group
**Solution**:
- Verify group has capacity
- Check you're not already a member
- Verify Firebase rules allow updates

### Issue: Notes Not Saving
**Solution**:
- Verify you're logged in
- Check title and content are filled
- Verify Firebase rules for sermonNotes collection
- Check console for errors

### Issue: Search Not Working
**Solution**:
- Verify search query is entered
- Check for typos
- Try different search terms
- Verify data exists in Firebase

---

## 📊 Firebase Collections to Verify

### Check These Collections Exist:
1. ✅ `sermonNotes` - Should be created automatically when first note is saved
2. ✅ `smallGroups` - Should have fallback data or admin-created groups
3. ✅ `users` - Should have `bibleBookmarks` and `smallGroups` arrays

### Verify Data Structure:

**sermonNotes/{noteId}**:
```javascript
{
  title: "string",
  content: "string",
  sermonId: "string" (optional),
  sermonTitle: "string" (optional),
  userId: "string",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

**smallGroups/{groupId}**:
```javascript
{
  name: "string",
  leader: "string",
  schedule: "string",
  location: "string",
  memberCount: number,
  capacity: number (optional),
  members: ["userId1", "userId2"],
  topic: "string" (optional),
  description: "string",
  image: "string" (optional),
  contact: "string" (optional)
}
```

**users/{userId}**:
```javascript
{
  // ... existing fields ...
  bibleBookmarks: [{ reference: "John 3:16", text: "...", ... }],
  smallGroups: ["groupId1", "groupId2"]
}
```

---

## ✅ Success Criteria

### Bible Screen:
- ✅ Verse of the day loads
- ✅ Search works for valid verses
- ✅ Bookmarks save and retrieve
- ✅ Share functionality works
- ✅ Reading plans display

### Small Groups Screen:
- ✅ Groups list displays
- ✅ Search and filters work
- ✅ Join/Leave functionality works
- ✅ Member count updates
- ✅ Group details modal works
- ✅ Full groups show correctly

### Sermon Notes Screen:
- ✅ Create note works
- ✅ Edit note works
- ✅ Delete note works
- ✅ Link to sermon works
- ✅ Search works
- ✅ Share works
- ✅ Notes persist after app restart

---

## 🚀 Next Steps After Testing

1. **Report Issues**: Note any bugs or issues found
2. **Test on Physical Device**: Test on real device (not just simulator)
3. **Test Different Users**: Test with multiple user accounts
4. **Performance Check**: Verify loading times are acceptable
5. **UI/UX Feedback**: Note any UI improvements needed

---

## 📝 Testing Checklist Summary

Print this checklist and check off as you test:

### Bible Screen
- [ ] Screen opens from Home
- [ ] Verse of the day displays
- [ ] Search works
- [ ] Bookmarks work
- [ ] Share works
- [ ] Reading plans display

### Small Groups Screen
- [ ] Screen opens from Home
- [ ] Groups list displays
- [ ] Search works
- [ ] Filters work
- [ ] Join group works
- [ ] Leave group works
- [ ] Group details modal works

### Sermon Notes Screen
- [ ] Screen opens from Sermons
- [ ] Create note works
- [ ] Edit note works
- [ ] Delete note works
- [ ] Link to sermon works
- [ ] Search works
- [ ] Share works

---

**Happy Testing!** 🎉

If you encounter any issues, check the console logs and Firebase rules first.

