/**
 * Training Materials Data Seeder
 * 
 * This script populates the Firebase Firestore with sample training materials
 * for the Discipleship & Training screen.
 * Uses Firebase Admin SDK to bypass security rules.
 * 
 * Usage: node scripts/seedTrainingMaterials.js
 * 
 * Setup Instructions (if using Admin SDK):
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate New Private Key"
 * 3. Save the JSON file as "serviceAccountKey.json" in project root
 * 4. OR set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to the key file
 * 
 * Alternative: Use manual setup via Firebase Console (see DISCIPLE_TRAINING_MATERIALS_GUIDE.md)
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let db;

try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    // Try to load service account key from file
    // Check for common service account key file names
    const possibleKeyFiles = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      join(__dirname, '..', 'serviceAccountKey.json'),
      join(__dirname, '..', 'greater-works-city-churc-4a673-firebase-adminsdk-fbsvc-729f959649.json'),
    ].filter(Boolean);
    
    let serviceAccountPath = null;
    let serviceAccountFile = null;
    
    for (const path of possibleKeyFiles) {
      try {
        serviceAccountFile = readFileSync(path, 'utf8');
        serviceAccountPath = path;
        break;
      } catch (e) {
        // Try next file
      }
    }
    
    if (serviceAccountFile && serviceAccountPath) {
      try {
        const serviceAccount = JSON.parse(serviceAccountFile);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`✅ Firebase Admin SDK initialized with service account key: ${serviceAccountPath.split(/[/\\]/).pop()}\n`);
      } catch (parseError) {
        throw new Error(`Failed to parse service account key: ${parseError.message}`);
      }
    } else {
      // If file doesn't exist, try using project ID from env with Application Default Credentials
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      
      if (!projectId) {
        throw new Error('Service account key file not found and PROJECT_ID not set');
      }
      
      admin.initializeApp({
        projectId: projectId,
      });
      console.log('✅ Firebase Admin SDK initialized with Application Default Credentials\n');
    }
  }
  
  db = admin.firestore();
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  console.error('\n📝 Setup Instructions:');
  console.error('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.error('2. Select your project: greater-works-city-churc-4a673');
  console.error('3. Go to Project Settings > Service Accounts');
  console.error('4. Click "Generate New Private Key"');
  console.error('5. Save the JSON file as "serviceAccountKey.json" in your project root');
  console.error('6. Run the script again\n');
  console.error('Alternative: Add materials manually via Firebase Console');
  console.error('See DISCIPLE_TRAINING_MATERIALS_GUIDE.md for manual setup instructions\n');
  process.exit(1);
}

// Training materials data
const trainingMaterials = [
  {
    id: 'ot-survey-guide',
    title: 'Old Testament Survey Guide',
    type: 'pdf',
    category: 'Bible Study',
    description: 'Comprehensive guide covering all books of the Old Testament with historical context, key themes, and study questions. Perfect for individual or group study.',
    url: 'https://example.com/materials/ot-survey-guide.pdf',
  },
  {
    id: 'nt-overview',
    title: 'New Testament Overview',
    type: 'video',
    category: 'Teaching',
    description: 'Video series exploring the themes and structure of the New Testament. Includes in-depth analysis of each book and practical applications for modern believers.',
    url: 'https://example.com/materials/nt-overview',
  },
  {
    id: 'prayer-fasting-guide',
    title: 'Prayer and Fasting Guide',
    type: 'pdf',
    category: 'Spiritual Growth',
    description: 'Practical guide to prayer and fasting practices based on biblical principles. Includes prayer templates, fasting schedules, and spiritual insights.',
    url: 'https://example.com/materials/prayer-fasting-guide.pdf',
  },
  {
    id: 'christian-leadership-principles',
    title: 'Christian Leadership Principles',
    type: 'pdf',
    category: 'Leadership',
    description: 'Biblical principles of leadership based on the life and teachings of Jesus. Learn servant leadership, integrity, and how to lead with purpose and passion.',
    url: 'https://example.com/materials/christian-leadership-principles.pdf',
  },
  {
    id: 'bible-study-methods',
    title: 'Effective Bible Study Methods',
    type: 'video',
    category: 'Bible Study',
    description: 'Learn proven methods for studying the Bible effectively. Includes observation, interpretation, and application techniques that will deepen your understanding of Scripture.',
    url: 'https://example.com/materials/bible-study-methods',
  },
  {
    id: 'worship-teaching-series',
    title: 'Understanding True Worship',
    type: 'audio',
    category: 'Spiritual Growth',
    description: 'Audio teaching series on what true worship means according to Scripture. Explore worship in spirit and truth, the heart of worship, and practical ways to grow in worship.',
    url: 'https://example.com/materials/worship-teaching-series',
  },
  {
    id: 'foundations-of-faith',
    title: 'Foundations of Faith',
    type: 'pdf',
    category: 'Foundations',
    description: 'A comprehensive study on the core doctrines of Christianity. Covers salvation, baptism, the Trinity, and essential beliefs every believer should understand.',
    url: 'https://example.com/materials/foundations-of-faith.pdf',
  },
  {
    id: 'spiritual-disciplines',
    title: 'Spiritual Disciplines for Growth',
    type: 'video',
    category: 'Spiritual Growth',
    description: 'Learn essential spiritual disciplines including prayer, meditation, Scripture reading, and fasting. Practical guidance on developing a consistent devotional life.',
    url: 'https://example.com/materials/spiritual-disciplines',
  },
  {
    id: 'evangelism-training',
    title: 'Evangelism Training Manual',
    type: 'pdf',
    category: 'Outreach',
    description: 'Practical guide to sharing your faith effectively. Includes techniques, scriptural foundations, and real-world examples to help you confidently share the gospel.',
    url: 'https://example.com/materials/evangelism-training.pdf',
  },
  {
    id: 'marriage-biblical-principles',
    title: 'Biblical Principles for Marriage',
    type: 'audio',
    category: 'Relationships',
    description: 'Audio teaching on building a strong marriage based on biblical principles. Covers communication, conflict resolution, roles, and maintaining intimacy in marriage.',
    url: 'https://example.com/materials/marriage-biblical-principles',
  },
];

async function seedTrainingMaterials() {
  console.log('🌱 Starting to seed training materials...\n');

  try {
    // Check if materials already exist
    const existingMaterialsSnapshot = await db.collection('trainingMaterials').get();
    const existingMaterials = existingMaterialsSnapshot.docs;
    if (existingMaterials.length > 0) {
      console.log(`⚠️  Training materials collection already has ${existingMaterials.length} records.`);
      console.log('📝 Adding new materials...\n');
    }

    let successCount = 0;
    let skipCount = 0;

    for (const material of trainingMaterials) {
      try {
        const materialRef = db.collection('trainingMaterials').doc(material.id);
        
        // Check if document already exists
        const existingDoc = existingMaterials.find(doc => doc.id === material.id);
        if (existingDoc) {
          console.log(`⏭️  Skipped: ${material.title} (already exists)`);
          skipCount++;
          continue;
        }

        await materialRef.set({
          ...material,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Added: ${material.title} (${material.type.toUpperCase()})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${material.title}:`, error.message);
      }
    }

    console.log('\n✨ Successfully seeded training materials!');
    console.log(`📊 Total materials added: ${successCount}`);
    if (skipCount > 0) {
      console.log(`⏭️  Materials skipped (already exist): ${skipCount}`);
    }
    console.log(`📚 Total materials in collection: ${successCount + skipCount}`);
    
    console.log('\n🎉 Your Disciple Training screen is now populated with materials!');
    console.log('\n📋 Materials added:');
    trainingMaterials.forEach(m => {
      if (successCount > 0 || !existingMaterials.find(d => d.id === m.id)) {
        console.log(`   - ${m.title} (${m.category})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error seeding training materials:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your Firebase configuration in this file');
    console.log('   2. Ensure Firestore is enabled in your Firebase console');
    console.log('   3. Verify you have a service account key file');
    console.log('   4. Make sure you have internet connection');
    console.log('\n📝 You can also add materials manually via Firebase Console');
    console.log('   See DISCIPLE_TRAINING_MATERIALS_GUIDE.md for instructions');
  }

  process.exit(0);
}

// Run the seeder
seedTrainingMaterials();
