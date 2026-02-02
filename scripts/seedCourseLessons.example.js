/**
 * Course Lessons Seeder - Example Script
 * 
 * This is an EXAMPLE script showing how to seed course lessons.
 * 
 * To use this:
 * 1. Copy this file to seedCourseLessons.js
 * 2. Update COURSE_ID with your actual course ID from Firebase
 * 3. Update the lessons array with your lesson data
 * 4. Set up Firebase Admin SDK (see instructions below)
 * 5. Run: node scripts/seedCourseLessons.js
 * 
 * Setup Instructions:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate New Private Key"
 * 3. Save the JSON file as "serviceAccountKey.json" in project root
 * 4. OR set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 
 * Alternative: Use Firebase Console (see HOW_TO_ADD_COURSE_LESSONS.md)
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ⚠️ IMPORTANT: Replace with your actual course ID from Firebase Console
const COURSE_ID = 'your-course-id-here';

// Define lessons for the course
const lessons = [
  {
    title: 'Introduction to Faith',
    description: 'Learn the foundational principles of Christian faith and what it means to be a believer',
    duration: '15 min',
    order: 1,
    content: 'This lesson covers the basics of Christian faith, including salvation, grace, and the importance of faith in daily life.',
  },
  {
    title: 'Understanding the Bible',
    description: 'Learn how to read, study, and interpret Scripture effectively',
    duration: '20 min',
    order: 2,
    content: 'This lesson teaches Bible study methods, understanding context, and applying Scripture to your life.',
  },
  {
    title: 'Prayer and Worship',
    description: 'Discover the power of prayer and different forms of worship',
    duration: '25 min',
    order: 3,
    content: 'This lesson explores different types of prayer, how to develop a prayer life, and the importance of worship.',
  },
  {
    title: 'The Holy Spirit',
    description: 'Understanding the role and work of the Holy Spirit in the believer\'s life',
    duration: '30 min',
    order: 4,
    content: 'This lesson covers the person of the Holy Spirit, His gifts, and how to walk in the Spirit.',
  },
  {
    title: 'Christian Living',
    description: 'Practical application of faith in daily life and relationships',
    duration: '20 min',
    order: 5,
    content: 'This lesson provides practical guidance on living out your faith in everyday situations.',
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
      // Try using application default credentials
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
  console.log('\n💡 Tip: You can also add lessons manually via Firebase Console');
  console.log('   See: HOW_TO_ADD_COURSE_LESSONS.md\n');
  process.exit(1);
}

async function seedLessons() {
  try {
    if (COURSE_ID === 'your-course-id-here') {
      console.error('❌ Error: Please update COURSE_ID with your actual course ID');
      console.log('\n📝 Steps:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Find your course in the "courses" collection');
      console.log('3. Copy the document ID');
      console.log('4. Update COURSE_ID in this script\n');
      process.exit(1);
    }
    
    console.log(`🌱 Starting to seed lessons for course: ${COURSE_ID}...\n`);
    
    // Verify course exists
    const courseRef = db.collection('courses').doc(COURSE_ID);
    const courseDoc = await courseRef.get();
    
    if (!courseDoc.exists) {
      console.error(`❌ Error: Course with ID "${COURSE_ID}" not found`);
      console.log('\n💡 Make sure:');
      console.log('   - The course exists in Firestore');
      console.log('   - You have the correct course ID');
      console.log('   - You have proper Firebase Admin permissions\n');
      process.exit(1);
    }
    
    console.log(`✅ Found course: ${courseDoc.data().title || COURSE_ID}\n`);
    
    const lessonsRef = courseRef.collection('lessons');
    
    // Check if lessons already exist
    const existingLessons = await lessonsRef.get();
    if (!existingLessons.empty) {
      console.log(`⚠️  Warning: Course already has ${existingLessons.size} lesson(s)`);
      console.log('   New lessons will be added in addition to existing ones\n');
    }
    
    // Add lessons
    for (const lesson of lessons) {
      await lessonsRef.add({
        ...lesson,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added lesson ${lesson.order}: ${lesson.title}`);
    }
    
    // Update course lessons count
    const totalLessons = existingLessons.size + lessons.length;
    await courseRef.update({
      lessons: totalLessons,
    });
    console.log(`\n✅ Updated course lessons count to: ${totalLessons}`);
    
    console.log('\n🎉 Successfully seeded all lessons!');
    console.log('\n📱 Next steps:');
    console.log('   1. Open your app');
    console.log('   2. Navigate to Discipleship & Training');
    console.log('   3. Enroll in the course');
    console.log('   4. Open course details to see the lessons\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding lessons:', error);
    console.log('\n💡 Alternative: Add lessons manually via Firebase Console');
    console.log('   See: HOW_TO_ADD_COURSE_LESSONS.md\n');
    process.exit(1);
  }
}

seedLessons();

