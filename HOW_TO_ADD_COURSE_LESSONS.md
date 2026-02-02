# 📚 How to Add Course Lessons

This guide shows you how to add lessons to courses in the Discipleship Training screen.

**⚠️ IMPORTANT: You must create courses first before adding lessons!**
- If you don't have a `courses` collection yet, see: `HOW_TO_ADD_COURSES.md`
- This guide assumes you already have courses in your database

---

## 📋 Understanding the Structure

Course lessons are stored in Firebase Firestore as a **subcollection** under each course:

```
courses/
  └── {courseId}/
      └── lessons/
          ├── {lessonId1}
          ├── {lessonId2}
          └── {lessonId3}
```

---

## ✅ Method 1: Add Lessons via Firebase Console (Easiest)

### Step 1: Open Firebase Console

1. Go to: https://console.firebase.google.com
2. Select your project: **"greater-works-city-churc-4a673"**
3. Click: **"Firestore Database"** in the left menu
4. Click: **"Data"** tab

### Step 2: Navigate to Your Course

1. Find the **`courses`** collection
2. Click on the course you want to add lessons to
3. You'll see the course document fields

### Step 3: Create Lessons Subcollection

1. Scroll down in the course document
2. Click **"Start collection"** button (or look for subcollections section)
3. Collection ID: **`lessons`** (exactly this name, case-sensitive)
4. Click **"Next"**

### Step 4: Add First Lesson Document

Click **"Add document"** and add these fields:

| Field | Type | Required | Example Value |
|-------|------|----------|---------------|
| `title` | string | ✅ Yes | `Introduction to Faith` |
| `description` | string | ❌ No | `Learn the foundational principles of Christian faith` |
| `duration` | string | ❌ No | `15 min` or `30 minutes` |
| `order` | number | ✅ Yes | `1` (for first lesson) |
| `content` | string | ❌ No | `Full lesson content or video URL` |
| `videoUrl` | string | ❌ No | `https://youtube.com/watch?v=...` |
| `audioUrl` | string | ❌ No | `https://example.com/audio.mp3` |
| `pdfUrl` | string | ❌ No | `https://example.com/lesson.pdf` |
| `createdAt` | timestamp | ❌ No | (Auto-generated) |

**Important Notes:**
- **`order`** field determines the sequence of lessons (1, 2, 3, etc.)
- **`title`** is required and will be displayed
- **`description`** is optional but recommended
- You can add media URLs (`videoUrl`, `audioUrl`, `pdfUrl`) for lesson content

### Step 5: Add More Lessons

1. Click **"Add document"** again
2. Repeat Step 4 with different `order` numbers
3. Continue until all lessons are added

**Example Lesson Sequence:**
- Lesson 1: `order: 1`, `title: "Introduction to Faith"`
- Lesson 2: `order: 2`, `title: "Understanding the Bible"`
- Lesson 3: `order: 3`, `title: "Prayer and Worship"`
- etc.

---

## ✅ Method 2: Use Seed Script (Recommended for Multiple Lessons)

Create a seed script to add lessons programmatically.

### Step 1: Create Seed Script

Create a new file: `scripts/seedCourseLessons.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../path-to-your-service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Define your course ID (get this from Firebase Console)
const COURSE_ID = 'your-course-id-here';

// Define lessons for the course
const lessons = [
  {
    title: 'Introduction to Faith',
    description: 'Learn the foundational principles of Christian faith',
    duration: '15 min',
    order: 1,
    content: 'This lesson covers the basics of Christian faith...',
  },
  {
    title: 'Understanding the Bible',
    description: 'Learn how to read and interpret Scripture',
    duration: '20 min',
    order: 2,
    content: 'This lesson teaches Bible study methods...',
  },
  {
    title: 'Prayer and Worship',
    description: 'Discover the power of prayer and worship',
    duration: '25 min',
    order: 3,
    content: 'This lesson explores different forms of prayer...',
  },
  {
    title: 'The Holy Spirit',
    description: 'Understanding the role of the Holy Spirit',
    duration: '30 min',
    order: 4,
    content: 'This lesson covers the work of the Holy Spirit...',
  },
  {
    title: 'Christian Living',
    description: 'Practical application of faith in daily life',
    duration: '20 min',
    order: 5,
    content: 'This lesson provides practical guidance...',
  },
];

async function seedLessons() {
  try {
    console.log('🌱 Starting to seed course lessons...');
    
    const lessonsRef = db.collection('courses').doc(COURSE_ID).collection('lessons');
    
    for (const lesson of lessons) {
      await lessonsRef.add({
        ...lesson,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added lesson: ${lesson.title}`);
    }
    
    console.log('🎉 Successfully seeded all lessons!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding lessons:', error);
    process.exit(1);
  }
}

seedLessons();
```

### Step 2: Update package.json

Add a script to run the seed:

```json
{
  "scripts": {
    "seed:lessons": "node scripts/seedCourseLessons.js"
  }
}
```

### Step 3: Run the Script

```bash
npm run seed:lessons
```

---

## ✅ Method 3: Add Lessons via Admin Screen (If Available)

If you have an admin screen for managing courses, you can add lessons there. Check if there's a `ManageCoursesScreen` or similar.

---

## 📝 Lesson Field Details

### Required Fields

- **`title`** (string): The lesson title displayed to users
- **`order`** (number): Lesson sequence (1, 2, 3, etc.)

### Optional Fields

- **`description`** (string): Brief description of the lesson
- **`duration`** (string): Estimated time to complete (e.g., "15 min", "30 minutes")
- **`content`** (string): Full lesson text content
- **`videoUrl`** (string): URL to video lesson (YouTube, Vimeo, etc.)
- **`audioUrl`** (string): URL to audio lesson
- **`pdfUrl`** (string): URL to PDF lesson material
- **`createdAt`** (timestamp): When lesson was created (auto-set if using serverTimestamp)

---

## 🎯 Example: Complete Course with Lessons

Here's an example of a complete course structure:

### Course Document (`courses/{courseId}`)
```javascript
{
  title: "Foundations of Faith",
  description: "A comprehensive course covering the basics of Christian faith",
  instructor: "Pastor John Smith",
  duration: "8 weeks",
  lessons: 5,  // Total number of lessons
  category: "Foundations",
  level: "Beginner",
  enrolled: 0,
  image: null,
  createdAt: Timestamp
}
```

### Lessons Subcollection (`courses/{courseId}/lessons/{lessonId}`)

**Lesson 1:**
```javascript
{
  title: "Introduction to Faith",
  description: "Learn the foundational principles of Christian faith",
  duration: "15 min",
  order: 1,
  content: "Full lesson content here...",
  createdAt: Timestamp
}
```

**Lesson 2:**
```javascript
{
  title: "Understanding the Bible",
  description: "Learn how to read and interpret Scripture",
  duration: "20 min",
  order: 2,
  videoUrl: "https://youtube.com/watch?v=...",
  createdAt: Timestamp
}
```

---

## 🔧 Troubleshooting

### Lessons Not Showing Up?

1. **Check Subcollection Name**
   - Must be exactly: `lessons` (case-sensitive)
   - Must be a subcollection under the course document

2. **Check Order Field**
   - Must be a number (1, 2, 3, etc.)
   - Lessons are sorted by `order` field

3. **Check User Enrollment**
   - Lessons only show if user is enrolled in the course
   - Verify enrollment in `users/{userId}/enrolledCourses` array

4. **Check Firestore Rules**
   - Ensure rules allow reading from `courses/{courseId}/lessons`
   - Example rule:
     ```javascript
     match /courses/{courseId}/lessons/{lessonId} {
       allow read: if request.auth != null;
     }
     ```

5. **Refresh the App**
   - Pull down to refresh in the course detail modal
   - Or restart the app

### Order Not Working?

- Make sure `order` is a **number**, not a string
- Use sequential numbers: 1, 2, 3, 4, etc.
- The app uses `orderBy('order', 'asc')` to sort lessons

### Can't See Lessons in Course Modal?

- User must be **enrolled** in the course first
- Check: `userEnrolledCourses` array contains the course ID
- Lessons only appear for enrolled users

---

## 💡 Best Practices

1. **Use Sequential Order Numbers**
   - Start with 1, increment by 1
   - Don't skip numbers (1, 2, 3, not 1, 5, 10)

2. **Add Descriptions**
   - Help users understand what each lesson covers
   - Keep descriptions concise (1-2 sentences)

3. **Include Duration**
   - Helps users plan their study time
   - Format: "15 min", "30 minutes", "1 hour"

4. **Update Course `lessons` Count**
   - When adding lessons, update the course document's `lessons` field
   - This shows the total lesson count in the course card

5. **Use Media URLs When Available**
   - Add `videoUrl` for video lessons
   - Add `audioUrl` for audio lessons
   - Add `pdfUrl` for downloadable materials

---

## 🚀 Quick Start Example

**To quickly add 5 lessons to a course:**

1. Go to Firebase Console
2. Navigate to: `courses` → `{your-course-id}` → `lessons` subcollection
3. Add 5 documents with:
   - `title`: "Lesson 1", "Lesson 2", etc.
   - `order`: 1, 2, 3, 4, 5
   - `description`: Brief description
   - `duration`: "15 min"

That's it! The lessons will appear when users enroll in the course.

---

## 📚 Related Documentation

- **Adding Courses**: See how to add courses first
- **Training Materials Guide**: `DISCIPLE_TRAINING_MATERIALS_GUIDE.md`
- **Firebase Setup**: `SETUP_GUIDE.md`

---

Need help? Check the code in `DiscipleshipTrainingScreen.js` - the `loadCourseLessons` function shows exactly how lessons are loaded!

