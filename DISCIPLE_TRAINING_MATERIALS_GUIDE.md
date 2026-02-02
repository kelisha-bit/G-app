# 📚 Disciple Training Materials Guide

## How to Populate the Disciple Training Screen with Materials

The Disciple Training screen has a "Materials" tab that displays training materials from Firestore. This guide shows you how to populate it with content.

---

## ✅ Two Ways to Add Materials

### Option 1: Run Seed Script (Recommended - Fastest)

**This script adds 10 sample training materials automatically!**

**Step 1: Run the Seed Script**

```bash
npm run seed:materials
```

**What this does:**
- Creates the `trainingMaterials` collection in Firestore
- Adds 10 sample materials covering:
  - Bible Study materials (Old/New Testament guides)
  - Spiritual Growth resources (Prayer, Fasting, Worship)
  - Leadership materials
  - Evangelism training
  - Marriage and relationships
- Different types: PDFs, Videos, and Audio files

**Step 2: Verify**

1. Open your app
2. Navigate to **Discipleship & Training** screen
3. Click the **"Materials"** tab
4. ✅ You should see all 10 materials!

---

### Option 2: Add Materials Manually via Firebase Console

If you prefer to add materials manually or customize them:

**Step 1: Open Firebase Console**

1. Go to: https://console.firebase.google.com
2. Select: **"greater-works-city-churc-4a673"**
3. Click: **"Firestore Database"** in left menu
4. Click: **"Data"** tab

**Step 2: Create Collection (if it doesn't exist)**

- Click **"Start collection"**
- Collection ID: `trainingMaterials`
- Click **"Next"**

**Step 3: Add First Material Document**

Click **"Add document"** and add these fields:

| Field | Type | Example Value |
|-------|------|---------------|
| `id` | string | `ot-survey-guide` |
| `title` | string | `Old Testament Survey Guide` |
| `type` | string | `pdf` (or `video` or `audio`) |
| `category` | string | `Bible Study` |
| `description` | string | `Comprehensive guide covering all books of the Old Testament` |
| `url` | string | `https://example.com/materials/ot-survey-guide.pdf` |
| `createdAt` | timestamp | (Click "Insert" → "Timestamp" → "Now") |

**Step 4: Add More Materials**

Repeat Step 3 for each material you want to add.

---

## 📊 Material Data Structure

Each material document should have these fields:

```javascript
{
  id: string,              // Unique identifier (e.g., 'ot-survey-guide')
  title: string,           // Display name (e.g., 'Old Testament Survey Guide')
  type: string,            // 'pdf', 'video', or 'audio'
  category: string,        // Category name (e.g., 'Bible Study', 'Leadership')
  description: string,     // Detailed description
  url: string,             // Link to the material (PDF URL, video URL, etc.)
  createdAt: timestamp     // When it was created
}
```

### Material Types

The app supports three types of materials:

1. **PDF** (`type: 'pdf'`) - Documents, guides, manuals
   - Icon: 📄 Document icon
   - Color: Red (#ef4444)

2. **Video** (`type: 'video'`) - Video lessons, teaching series
   - Icon: 🎥 Video camera icon
   - Color: Blue (#6366f1)

3. **Audio** (`type: 'audio'`) - Audio teachings, podcasts
   - Icon: 🎧 Headset icon
   - Color: Purple (#8b5cf6)

### Categories

Suggested categories (you can use any category name):

- `Bible Study`
- `Spiritual Growth`
- `Leadership`
- `Teaching`
- `Outreach`
- `Relationships`
- `Foundations`
- `Prayer`
- `Worship`

---

## 🎯 Sample Materials Included in Seed Script

The seed script adds these 10 materials:

| Title | Type | Category |
|-------|------|----------|
| Old Testament Survey Guide | PDF | Bible Study |
| New Testament Overview | Video | Teaching |
| Prayer and Fasting Guide | PDF | Spiritual Growth |
| Christian Leadership Principles | PDF | Leadership |
| Effective Bible Study Methods | Video | Bible Study |
| Understanding True Worship | Audio | Spiritual Growth |
| Foundations of Faith | PDF | Foundations |
| Spiritual Disciplines for Growth | Video | Spiritual Growth |
| Evangelism Training Manual | PDF | Outreach |
| Biblical Principles for Marriage | Audio | Relationships |

---

## 📝 Adding Your Own Materials

### Method 1: Update Seed Script

1. Open `scripts/seedTrainingMaterials.js`
2. Edit the `trainingMaterials` array
3. Add your materials with the same structure
4. Run: `npm run seed:materials`

### Method 2: Firebase Console

Follow the manual steps above to add materials one by one.

### Method 3: Programmatically (Advanced)

You can write your own script or add materials via your admin dashboard if you have one.

---

## 🔗 Setting Up Material URLs

The `url` field should point to:

### For PDFs:
- Google Drive shareable link (make it publicly accessible)
- Firebase Storage URL (if uploaded to Firebase Storage)
- Any publicly accessible PDF URL

**Example:**
```
https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing
```

### For Videos:
- YouTube URL
- Vimeo URL
- Any video streaming URL
- Firebase Storage URL

**Example:**
```
https://www.youtube.com/watch?v=VIDEO_ID
```

### For Audio:
- SoundCloud URL
- Any audio streaming URL
- Firebase Storage URL
- Podcast URL

**Example:**
```
https://soundcloud.com/user/audio-title
```

---

## 🔧 Troubleshooting

### Materials not showing up?

1. **Check Firestore Collection Name**
   - Collection must be named: `trainingMaterials`
   - (Case-sensitive!)

2. **Check Field Names**
   - All fields should match exactly: `id`, `title`, `type`, `category`, `description`, `url`, `createdAt`

3. **Check Firebase Rules**
   - Make sure rules allow reading from `trainingMaterials` collection
   - Rule should be: `allow read: if true;` (public read)

4. **Refresh the App**
   - Pull down to refresh in the Materials tab
   - Or restart the app

### Seed Script Errors?

**Error: "Permission Denied"**
- Check Firebase security rules
- Ensure `trainingMaterials` collection allows writes for admins

**Error: "Firebase not initialized"**
- Check your `.env` file has Firebase config variables
- See `SECURITY_SETUP_GUIDE.md` for details

**Error: "Collection already exists"**
- Not a problem! The script will skip existing materials
- It will only add new materials that don't exist yet

---

## 🎨 Customizing Material Display

The screen automatically:
- Shows materials in a card layout
- Groups by type (PDF, Video, Audio)
- Displays category badges
- Shows description preview
- Opens URLs when clicked

All materials are sorted by `createdAt` (newest first).

---

## 📚 Best Practices

1. **Use Descriptive Titles**
   - Clear, concise titles help users find materials

2. **Write Good Descriptions**
   - Include what users will learn
   - Mention if it's for individuals or groups

3. **Organize by Category**
   - Use consistent category names
   - This helps users browse similar materials

4. **Keep URLs Updated**
   - Ensure all URLs are accessible
   - Test links periodically

5. **Add Timestamps**
   - Always include `createdAt` for proper sorting

---

## 🚀 Next Steps

After populating materials:

1. ✅ Test the Materials tab in your app
2. ✅ Verify all URLs open correctly
3. ✅ Add your own church materials
4. ✅ Update materials as new resources become available

---

## 📖 Related Documentation

- `src/screens/DiscipleshipTrainingScreen.js` - Screen implementation
- `firestore.rules` - Security rules for `trainingMaterials`
- `scripts/seedTrainingMaterials.js` - Seed script source

---

## 💡 Tips

- **Start with seed script** to get sample data quickly
- **Replace URLs** with your actual material links
- **Add materials gradually** - don't feel you need everything at once
- **Update regularly** - add new materials as they become available
- **Keep descriptions helpful** - users rely on them to find relevant materials

---

**Need Help?** Check the main `README.md` or review other seed scripts like `seedMinistries.js` for reference patterns.

