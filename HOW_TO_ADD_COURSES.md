# 📚 How to Add Courses to Discipleship Training

This guide shows you how to create courses in Firebase Firestore. **You must create courses first before you can add lessons to them.**

---

## 📋 Understanding the Structure

Courses are stored in the `courses` collection in Firestore:

```
courses/
  ├── {courseId1}/
  │   └── lessons/ (subcollection - add this after creating course)
  ├── {courseId2}/
  │   └── lessons/
  └── {courseId3}/
      └── lessons/
```

---

## ✅ Method 1: Add Courses via Firebase Console (Easiest)

### Step 1: Open Firebase Console

1. Go to: https://console.firebase.google.com
2. Select your project: **"greater-works-city-churc-4a673"**
3. Click: **"Firestore Database"** in the left menu
4. Click: **"Data"** tab

### Step 2: Create the Courses Collection

1. Click **"Start collection"** (if no collections exist)
   - OR click **"Add collection"** if you have other collections
2. Collection ID: **`courses`** (exactly this name, case-sensitive)
3. Click **"Next"**

### Step 3: Add Your First Course Document

Click **"Add document"** and add these fields:

| Field | Type | Required | Example Value |
|-------|------|----------|---------------|
| `title` | string | ✅ Yes | `Foundations of Faith` |
| `description` | string | ✅ Yes | `A comprehensive course covering the basics of Christian faith and doctrine.` |
| `instructor` | string | ✅ Yes | `Pastor John Smith` |
| `duration` | string | ✅ Yes | `8 weeks` |
| `lessons` | number | ✅ Yes | `5` (total number of lessons) |
| `category` | string | ✅ Yes | `Foundations` (or `Bible Study`, `Leadership`, `Spiritual Growth`, `Evangelism`) |
| `level` | string | ✅ Yes | `Beginner` (or `Intermediate`, `Advanced`) |
| `image` | string | ❌ No | `null` or image URL (see `COURSE_IMAGE_GUIDELINES.md` for recommended size: 1000x562px, 16:9 ratio, < 500KB) |
| `enrolled` | number | ❌ No | `0` (starts at 0) |
| `createdAt` | timestamp | ✅ Yes | Click "timestamp" and select current date/time |

**Important Notes:**
- **Document ID**: You can use "Auto-ID" (Firebase generates it) or create a custom ID
- **`lessons`** field: Set this to the total number of lessons you plan to add (you can update it later)
- **`category`**: Use one of: `Foundations`, `Bible Study`, `Leadership`, `Spiritual Growth`, `Evangelism`
- **`level`**: Use one of: `Beginner`, `Intermediate`, `Advanced`
- **`enrolled`**: Always start at `0` - this tracks how many users enrolled

### Step 4: Add More Courses

Repeat Step 3 to add more courses. Each course needs its own document.

---

## ✅ Method 2: Use Seed Script (Recommended for Multiple Courses)

Create a seed script to add courses programmatically.

### Step 1: Create Seed Script

Create a new file: `scripts/seedCourses.js`

```javascript
import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define courses to add
const courses = [
  {
    title: 'Foundations of Faith',
    description: 'A comprehensive course covering the basics of Christian faith and doctrine.',
    instructor: 'Pastor John Smith',
    duration: '8 weeks',
    lessons: 5,
    category: 'Foundations',
    level: 'Beginner',
    image: null,
    enrolled: 0,
  },
  {
    title: 'Bible Study Methods',
    description: 'Learn effective methods for studying and interpreting Scripture.',
    instructor: 'Dr. Sarah Johnson',
    duration: '6 weeks',
    lessons: 4,
    category: 'Bible Study',
    level: 'Intermediate',
    image: null,
    enrolled: 0,
  },
  {
    title: 'Christian Leadership',
    description: 'Develop leadership skills based on biblical principles.',
    instructor: 'Pastor Michael Brown',
    duration: '10 weeks',
    lessons: 6,
    category: 'Leadership',
    level: 'Advanced',
    image: null,
    enrolled: 0,
  },
  {
    title: 'Prayer and Fasting',
    description: 'Deepen your prayer life and learn the discipline of fasting.',
    instructor: 'Pastor David Williams',
    duration: '4 weeks',
    lessons: 4,
    category: 'Spiritual Growth',
    level: 'Beginner',
    image: null,
    enrolled: 0,
  },
  {
    title: 'Evangelism Training',
    description: 'Learn how to share your faith effectively with others.',
    instructor: 'Pastor Mary Johnson',
    duration: '6 weeks',
    lessons: 5,
    category: 'Evangelism',
    level: 'Intermediate',
    image: null,
    enrolled: 0,
  },
];

// Initialize Firebase Admin SDK
let db;

try {
  if (admin.apps.length === 0) {
    const possibleKeyFiles = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      join(__dirname, '..', 'serviceAccountKey.json'),
    ].filter(Boolean);
    
    let serviceAccount = null;
    
    for (const path of possibleKeyFiles) {
      try {
        const keyFile = readFileSync(path, 'utf8');
        serviceAccount = JSON.parse(keyFile);
        console.log(`✅ Loaded service account from: ${path}`);
        break;
      } catch (e) {
        // Continue to next file
      }
    }
    
    if (!serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Using application default credentials');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
  
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  console.log('\n💡 Tip: You can also add courses manually via Firebase Console\n');
  process.exit(1);
}

async function seedCourses() {
  try {
    console.log('🌱 Starting to seed courses...\n');
    
    const coursesRef = db.collection('courses');
    
    // Check if courses already exist
    const existingCourses = await coursesRef.get();
    if (!existingCourses.empty) {
      console.log(`⚠️  Warning: ${existingCourses.size} course(s) already exist`);
      console.log('   New courses will be added in addition to existing ones\n');
    }
    
    // Add courses
    for (const course of courses) {
      const docRef = await coursesRef.add({
        ...course,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added course: ${course.title} (ID: ${docRef.id})`);
    }
    
    console.log('\n🎉 Successfully seeded all courses!');
    console.log('\n📱 Next steps:');
    console.log('   1. Open Firebase Console');
    console.log('   2. Go to courses collection');
    console.log('   3. Copy a course ID');
    console.log('   4. Add lessons to that course (see HOW_TO_ADD_COURSE_LESSONS.md)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    console.log('\n💡 Alternative: Add courses manually via Firebase Console\n');
    process.exit(1);
  }
}

seedCourses();
```

### Step 2: Update package.json

Add a script to run the seed:

```json
{
  "scripts": {
    "seed:courses": "node scripts/seedCourses.js"
  }
}
```

### Step 3: Run the Script

```bash
npm run seed:courses
```

---

## 📝 Course Field Details

### Required Fields

- **`title`** (string): Course title displayed to users
- **`description`** (string): Course description
- **`instructor`** (string): Name of the instructor
- **`duration`** (string): Course duration (e.g., "8 weeks", "6 weeks")
- **`lessons`** (number): Total number of lessons (can update later)
- **`category`** (string): One of: `Foundations`, `Bible Study`, `Leadership`, `Spiritual Growth`, `Evangelism`
- **`level`** (string): One of: `Beginner`, `Intermediate`, `Advanced`
- **`createdAt`** (timestamp): When course was created

### Optional Fields

- **`image`** (string): Course image URL (or `null`)
- **`enrolled`** (number): Number of enrolled users (starts at `0`)

---

## 🎯 Example: Complete Course Document

Here's an example of a complete course document:

```javascript
{
  title: "Foundations of Faith",
  description: "A comprehensive course covering the basics of Christian faith and doctrine.",
  instructor: "Pastor John Smith",
  duration: "8 weeks",
  lessons: 5,
  category: "Foundations",
  level: "Beginner",
  image: null,
  enrolled: 0,
  createdAt: Timestamp // Auto-generated
}
```

---

## 🔧 Troubleshooting

### Courses Not Showing Up?

1. **Check Collection Name**
   - Must be exactly: `courses` (case-sensitive)
   - Check spelling in Firebase Console

2. **Check Required Fields**
   - All required fields must be present
   - Field names must match exactly (case-sensitive)

3. **Check Field Types**
   - `lessons` must be a **number**, not a string
   - `enrolled` must be a **number**, not a string
   - `createdAt` must be a **timestamp**

4. **Check Firestore Rules**
   - Ensure rules allow reading from `courses` collection
   - Rule should be: `allow read: if true;` (public read)
   - Check `firestore.rules` file

5. **Refresh the App**
   - Pull down to refresh in the Courses tab
   - Or restart the app

### Category or Level Not Working?

- **Category** must be one of: `Foundations`, `Bible Study`, `Leadership`, `Spiritual Growth`, `Evangelism`
- **Level** must be one of: `Beginner`, `Intermediate`, `Advanced`
- These are used for filtering, so exact spelling matters

### Can't Create Collection?

- Make sure you have proper Firebase permissions
- Check that Firestore is enabled in your project
- Try refreshing the Firebase Console

---

## 💡 Best Practices

1. **Start with Few Courses**
   - Create 2-3 courses first to test
   - Add more once you confirm everything works

2. **Set Realistic Lesson Counts**
   - Set `lessons` field to the number you plan to add
   - You can update this later when you add lessons

3. **Use Consistent Categories**
   - Stick to the predefined categories for better filtering
   - Categories: `Foundations`, `Bible Study`, `Leadership`, `Spiritual Growth`, `Evangelism`

4. **Use Consistent Levels**
   - Stick to the predefined levels
   - Levels: `Beginner`, `Intermediate`, `Advanced`

5. **Add Descriptions**
   - Write clear, concise descriptions
   - Help users understand what the course covers

---

## 🚀 Quick Start

**To quickly add your first course:**

1. Go to Firebase Console → Firestore Database
2. Click "Start collection" or "Add collection"
3. Collection ID: `courses`
4. Click "Add document"
5. Add these fields:
   - `title`: "My First Course"
   - `description`: "Course description here"
   - `instructor`: "Instructor Name"
   - `duration`: "4 weeks"
   - `lessons`: `5` (number)
   - `category`: "Foundations"
   - `level`: "Beginner"
   - `enrolled`: `0` (number)
   - `image`: `null`
   - `createdAt`: (select timestamp, current time)
6. Click "Save"

That's it! Your course is created. Now you can add lessons to it.

---

## 📚 Next Steps

After creating courses:

1. **Add Lessons**: See `HOW_TO_ADD_COURSE_LESSONS.md` for adding lessons to your courses
2. **Test in App**: Open the app and check the Courses tab
3. **Enroll Users**: Users can enroll in courses from the app

---

## 📚 Related Documentation

- **Adding Lessons**: `HOW_TO_ADD_COURSE_LESSONS.md`
- **Training Materials**: `DISCIPLE_TRAINING_MATERIALS_GUIDE.md`
- **Firebase Setup**: `SETUP_GUIDE.md`

---

Need help? Check the code in `DiscipleshipTrainingScreen.js` - the `loadCourses` function shows exactly how courses are loaded!

