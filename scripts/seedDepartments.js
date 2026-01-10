/**
 * Department Data Seeder
 * 
 * This script populates the Firebase Firestore with sample department data.
 * Uses Firebase Admin SDK to bypass security rules.
 * 
 * Usage: node scripts/seedDepartments.js
 * 
 * Setup Instructions:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate New Private Key"
 * 3. Save the JSON file as "serviceAccountKey.json" in project root
 * 4. OR set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to the key file
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
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                               join(__dirname, '..', 'serviceAccountKey.json');
    
    try {
      const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountFile);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized with service account key');
    } catch (fileError) {
      // If file doesn't exist, try using project ID from env with Application Default Credentials
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      
      if (!projectId) {
        throw new Error('Service account key file not found and PROJECT_ID not set');
      }
      
      admin.initializeApp({
        projectId: projectId,
      });
      console.log('✅ Firebase Admin SDK initialized with Application Default Credentials');
    }
  }
  
  db = admin.firestore();
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  console.error('\n📝 Setup Instructions:');
  console.error('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.error('2. Select your project');
  console.error('3. Go to Project Settings > Service Accounts');
  console.error('4. Click "Generate New Private Key"');
  console.error('5. Save the JSON file as "serviceAccountKey.json" in your project root');
  console.error('6. Run the script again\n');
  console.error('Alternative: Add department manually via Firebase Console');
  console.error('See MANUAL_DEPARTMENT_SETUP.md for manual setup instructions\n');
  process.exit(1);
}

// Department data
const departments = [
  {
    id: 'worship',
    name: 'Worship & Music',
    icon: 'musical-notes',
    color: '#ec4899',
    description: 'Leading the congregation in worship',
    fullDescription: 'The Worship & Music department is dedicated to leading the congregation into the presence of God through music, song, and worship. We believe that worship is more than just music—it\'s a lifestyle of honoring God in everything we do.',
    memberCount: 45,
    members: [],
    meetings: 'Weekly',
    leaders: [
      {
        name: 'Michael Johnson',
        role: 'Worship Director',
        phone: '+233 20 123 4567',
      },
      {
        name: 'Sarah Williams',
        role: 'Music Coordinator',
        phone: '+233 20 234 5678',
      },
    ],
    activities: [
      'Lead Sunday worship services',
      'Organize choir practice and rehearsals',
      'Coordinate with guest worship leaders',
      'Maintain musical instruments and equipment',
      'Develop new worship songs and arrangements',
    ],
    schedule: {
      frequency: 'Every Sunday and Wednesday',
      day: 'Wednesday',
      time: '6:00 PM',
      location: 'Main Sanctuary',
    },
    requirements: [
      'Love for worship and music',
      'Ability to sing or play an instrument',
      'Commitment to weekly rehearsals',
      'Team player mentality',
    ],
    contact: {
      name: 'Michael Johnson',
      phone: '+233 20 123 4567',
      email: 'worship@greatworkscity.org',
    },
  },
  {
    id: 'media',
    name: 'Media & Tech',
    icon: 'videocam',
    color: '#6366f1',
    description: 'Audio, video, and technical support',
    fullDescription: 'The Media & Tech department ensures that all technical aspects of church services run smoothly. From sound engineering to video production and live streaming, we use technology to enhance worship and reach people beyond the church walls.',
    memberCount: 28,
    members: [],
    meetings: 'Weekly',
    leaders: [
      {
        name: 'David Chen',
        role: 'Media Director',
        phone: '+233 20 345 6789',
      },
    ],
    activities: [
      'Operate sound and lighting systems',
      'Record and edit sermon videos',
      'Manage live streaming services',
      'Maintain technical equipment',
      'Create multimedia presentations',
      'Train new volunteers',
    ],
    schedule: {
      frequency: 'Every Sunday',
      day: 'Saturday',
      time: '4:00 PM',
      location: 'Media Room',
    },
    requirements: [
      'Basic technical knowledge',
      'Willingness to learn new systems',
      'Reliability and punctuality',
      'Attention to detail',
    ],
    contact: {
      name: 'David Chen',
      phone: '+233 20 345 6789',
      email: 'media@greatworkscity.org',
    },
  },
  {
    id: 'ushering',
    name: 'Ushering',
    icon: 'people',
    color: '#10b981',
    description: 'Welcoming and guiding members',
    fullDescription: 'The Ushering department serves as the first point of contact for church members and visitors. We create a warm, welcoming atmosphere and ensure everyone feels valued and comfortable from the moment they arrive.',
    memberCount: 60,
    members: [],
    meetings: 'Bi-weekly',
    leaders: [
      {
        name: 'Grace Mensah',
        role: 'Head Usher',
        phone: '+233 20 456 7890',
      },
    ],
    activities: [
      'Welcome members and visitors',
      'Guide people to available seats',
      'Distribute bulletins and programs',
      'Assist with offerings',
      'Handle crowd management',
      'Provide information and directions',
    ],
    schedule: {
      frequency: 'Every Sunday',
      day: 'Sunday',
      time: '7:30 AM',
      location: 'Church Entrance',
    },
    requirements: [
      'Friendly and welcoming personality',
      'Good communication skills',
      'Ability to serve with a smile',
      'Punctuality',
    ],
    contact: {
      name: 'Grace Mensah',
      phone: '+233 20 456 7890',
      email: 'ushering@greatworkscity.org',
    },
  },
  {
    id: 'children',
    name: 'Children Ministry',
    icon: 'happy',
    color: '#f59e0b',
    description: 'Teaching and caring for children',
    fullDescription: 'The Children Ministry is committed to teaching children about God\'s love in age-appropriate, fun, and engaging ways. We partner with parents to help children develop a strong faith foundation.',
    memberCount: 35,
    members: [],
    meetings: 'Weekly',
    leaders: [
      {
        name: 'Rebecca Osei',
        role: 'Children\'s Ministry Director',
        phone: '+233 20 567 8901',
      },
    ],
    activities: [
      'Teach Sunday School classes',
      'Lead children\'s worship',
      'Organize fun activities and games',
      'Prepare age-appropriate lessons',
      'Plan special children\'s events',
      'Ensure child safety and security',
    ],
    schedule: {
      frequency: 'Every Sunday',
      day: 'Sunday',
      time: '9:00 AM',
      location: 'Children\'s Wing',
    },
    requirements: [
      'Love for children',
      'Patience and creativity',
      'Background check required',
      'Teaching or childcare experience (preferred)',
    ],
    contact: {
      name: 'Rebecca Osei',
      phone: '+233 20 567 8901',
      email: 'children@greatworkscity.org',
    },
  },
  {
    id: 'prayer',
    name: 'Prayer Team',
    icon: 'hand-left',
    color: '#8b5cf6',
    description: 'Intercession and prayer ministry',
    fullDescription: 'The Prayer Team is the spiritual backbone of our church. We believe in the power of prayer and dedicate ourselves to interceding for church members, leadership, and our community.',
    memberCount: 52,
    members: [],
    meetings: 'Weekly',
    leaders: [
      {
        name: 'Elder Samuel Owusu',
        role: 'Prayer Coordinator',
        phone: '+233 20 678 9012',
      },
    ],
    activities: [
      'Lead prayer meetings',
      'Pray for individual prayer requests',
      'Organize prayer vigils',
      'Provide pastoral prayer support',
      'Coordinate prayer chains',
      'Train others in prayer ministry',
    ],
    schedule: {
      frequency: 'Every Tuesday and Friday',
      day: 'Tuesday',
      time: '6:00 AM',
      location: 'Prayer Chapel',
    },
    requirements: [
      'Strong prayer life',
      'Commitment to confidentiality',
      'Heart for intercession',
      'Maturity in faith',
    ],
    contact: {
      name: 'Elder Samuel Owusu',
      phone: '+233 20 678 9012',
      email: 'prayer@greatworkscity.org',
    },
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    icon: 'restaurant',
    color: '#14b8a6',
    description: 'Food and refreshment services',
    fullDescription: 'The Hospitality department ensures that everyone is well-fed and refreshed during church events. We believe that sharing meals together builds community and fellowship.',
    memberCount: 40,
    members: [],
    meetings: 'Monthly',
    leaders: [
      {
        name: 'Mrs. Mary Appiah',
        role: 'Hospitality Coordinator',
        phone: '+233 20 789 0123',
      },
    ],
    activities: [
      'Prepare refreshments for services',
      'Coordinate food for special events',
      'Manage kitchen facilities',
      'Plan fellowship meals',
      'Organize catering volunteers',
    ],
    schedule: {
      frequency: 'As needed for events',
      day: 'First Sunday',
      time: '2:00 PM',
      location: 'Fellowship Hall',
    },
    requirements: [
      'Love for serving others',
      'Cooking skills (helpful)',
      'Food safety awareness',
      'Teamwork ability',
    ],
    contact: {
      name: 'Mrs. Mary Appiah',
      phone: '+233 20 789 0123',
      email: 'hospitality@greatworkscity.org',
    },
  },
  {
    id: 'evangelism',
    name: 'Evangelism',
    icon: 'megaphone',
    color: '#ef4444',
    description: 'Outreach and soul winning',
    fullDescription: 'The Evangelism department is passionate about sharing the Gospel and reaching the lost. We organize outreach programs, community events, and personal evangelism training to fulfill the Great Commission.',
    memberCount: 38,
    members: [],
    meetings: 'Weekly',
    leaders: [
      {
        name: 'Pastor Emmanuel Boateng',
        role: 'Evangelism Director',
        phone: '+233 20 890 1234',
      },
    ],
    activities: [
      'Organize community outreach events',
      'Lead street evangelism',
      'Visit new members and visitors',
      'Distribute tracts and literature',
      'Train members in witnessing',
      'Plan evangelistic campaigns',
    ],
    schedule: {
      frequency: 'Every Saturday',
      day: 'Saturday',
      time: '9:00 AM',
      location: 'Meeting Point TBD',
    },
    requirements: [
      'Passion for soul winning',
      'Bold in sharing faith',
      'Good interpersonal skills',
      'Willingness to go out',
    ],
    contact: {
      name: 'Pastor Emmanuel Boateng',
      phone: '+233 20 890 1234',
      email: 'evangelism@greatworkscity.org',
    },
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: 'briefcase',
    color: '#3b82f6',
    description: 'Church operations and management',
    fullDescription: 'The Administration department handles the behind-the-scenes operations that keep the church running smoothly. From facility management to event coordination, we ensure everything is organized and efficient.',
    memberCount: 15,
    members: [],
    meetings: 'Bi-weekly',
    leaders: [
      {
        name: 'James Asante',
        role: 'Admin Manager',
        phone: '+233 20 901 2345',
      },
    ],
    activities: [
      'Manage church facilities',
      'Coordinate event logistics',
      'Handle administrative tasks',
      'Maintain church records',
      'Assist with registration processes',
      'Support other departments',
    ],
    schedule: {
      frequency: 'Bi-weekly meetings',
      day: 'Second Tuesday',
      time: '7:00 PM',
      location: 'Admin Office',
    },
    requirements: [
      'Organizational skills',
      'Attention to detail',
      'Computer literacy',
      'Professional demeanor',
    ],
    contact: {
      name: 'James Asante',
      phone: '+233 20 901 2345',
      email: 'admin@greatworkscity.org',
    },
  },
  {
    id: 'workers',
    name: 'Workers',
    icon: 'construct',
    color: '#f97316',
    description: 'Maintenance and facility management',
    fullDescription: 'The Workers department is responsible for maintaining and caring for the church facilities. From repairs and maintenance to cleaning and setup, we ensure the church building is well-maintained and ready for all services and events.',
    memberCount: 30,
    members: [],
    meetings: 'Monthly',
    leaders: [
      {
        name: 'Frank Kofi',
        role: 'Workers Coordinator',
        phone: '+233 20 012 3456',
      },
    ],
    activities: [
      'Maintain church facilities and equipment',
      'Handle repairs and renovations',
      'Set up for services and events',
      'Clean and sanitize facilities',
      'Maintain landscaping and grounds',
      'Manage supplies and inventory',
    ],
    schedule: {
      frequency: 'Every first Saturday',
      day: 'First Saturday',
      time: '8:00 AM',
      location: 'Church Grounds',
    },
    requirements: [
      'Willingness to work with hands',
      'Basic maintenance skills (helpful)',
      'Teamwork and reliability',
      'Physical capability for manual work',
    ],
    contact: {
      name: 'Frank Kofi',
      phone: '+233 20 012 3456',
      email: 'workers@greatworkscity.org',
    },
  },
];

async function seedDepartments() {
  console.log('🌱 Starting to seed departments...\n');

  try {
    for (const dept of departments) {
      const deptRef = db.collection('departments').doc(dept.id);
      await deptRef.set({
        ...dept,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added: ${dept.name}`);
    }

    console.log('\n✨ Successfully seeded all departments!');
    console.log(`📊 Total departments added: ${departments.length}`);
    console.log('\n🎉 Your Firebase Firestore is now populated with department data.');
    
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
    console.error('\n💡 Tip: If you see permission errors, make sure:');
    console.error('   1. Service account key is properly configured');
    console.error('   2. Service account has "Cloud Datastore User" role in Firebase');
    console.error('   3. Or add departments manually via Firebase Console');
  }

  process.exit(0);
}

// Run the seeder
seedDepartments();



