/**
 * Ministry Data Seeder
 * 
 * This script populates the Firebase Firestore with sample ministry data.
 * Run this script once to initialize your ministries collection.
 * 
 * Usage: node scripts/seedMinistries.js
 */

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Firebase configuration loaded from environment variables
// Set these in your .env file (see .env.example for reference)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase config values
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  console.error('❌ Firebase configuration is missing required values!');
  console.error(`Missing variables: ${missingConfig.join(', ')}`);
  console.error('\nPlease ensure your .env file contains all required Firebase configuration variables.');
  console.error('See .env.example or SECURITY_SETUP_GUIDE.md for details.\n');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Ministry data
const ministries = [
  {
    id: 'youth',
    name: 'Youth Ministry',
    leader: 'Pastor Emmanuel Osei',
    schedule: 'Saturdays, 5:00 PM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=400&h=200&fit=crop',
    description: 'Empowering young people to live for Christ',
    fullDescription: 'The Youth Ministry is dedicated to helping teenagers and young adults discover their purpose in Christ, develop their gifts, and make a lasting impact in their generation. We provide a safe space for spiritual growth, mentorship, and fellowship through engaging worship, relevant teaching, and fun activities.',
    ageRange: '13-35 years',
    contact: '+233 20 123 4567',
    email: 'youth@greatworkscity.org',
    activities: [
      'Weekly youth services with dynamic worship',
      'Bible study and discipleship programs',
      'Youth camps and conferences',
      'Community service projects',
      'Talent shows and creative arts',
      'Sports and recreational activities',
    ],
    vision: 'To raise a generation of young people who are passionate about God, equipped for service, and making a difference in their communities.',
    requirements: 'Age 13-35, willingness to grow spiritually, and commitment to regular attendance',
  },
  {
    id: 'women',
    name: "Women's Ministry",
    leader: 'Sister Grace Addo',
    schedule: 'First Saturday, 3:00 PM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=200&fit=crop',
    description: 'Building strong women of faith',
    fullDescription: 'The Women\'s Ministry exists to empower women of all ages to grow in their relationship with Christ, discover their God-given purpose, and support one another through the various seasons of life. We create a nurturing environment where women can share, learn, and grow together.',
    ageRange: 'All ages',
    contact: '+233 20 234 5678',
    email: 'women@greatworkscity.org',
    activities: [
      'Monthly women\'s fellowship meetings',
      'Bible study and prayer groups',
      'Women\'s conferences and retreats',
      'Mentorship and discipleship programs',
      'Skills development workshops',
      'Outreach and charity initiatives',
    ],
    vision: 'To build a community of women who are spiritually mature, emotionally healthy, and making a positive impact in their families and communities.',
    requirements: 'Open to all women in the church',
  },
  {
    id: 'men',
    name: "Men's Ministry",
    leader: 'Brother Kwame Boateng',
    schedule: 'Second Saturday, 6:00 AM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=200&fit=crop',
    description: 'Raising godly men and leaders',
    fullDescription: 'The Men\'s Ministry is committed to developing men of character, integrity, and purpose who will be strong spiritual leaders in their homes, workplace, and community. Through fellowship, accountability, and biblical teaching, we equip men to fulfill their God-given responsibilities.',
    ageRange: '18+ years',
    contact: '+233 20 345 6789',
    email: 'men@greatworkscity.org',
    activities: [
      'Early morning prayer and fellowship',
      'Men\'s Bible study sessions',
      'Leadership development workshops',
      'Accountability and mentorship groups',
      'Men\'s conferences and retreats',
      'Community service and outreach',
    ],
    vision: 'To raise godly men who are strong in faith, exemplary in character, and influential in their spheres of influence.',
    requirements: 'Open to all men 18 years and above',
  },
  {
    id: 'singles',
    name: 'Singles Ministry',
    leader: 'Pastor Ama Asante',
    schedule: 'Sundays, 2:00 PM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=200&fit=crop',
    description: 'Fellowship and growth for singles',
    fullDescription: 'The Singles Ministry provides a vibrant community for unmarried adults to grow spiritually, build meaningful relationships, and prepare for their future. We address relevant topics including purpose, relationships, career, and preparation for marriage while enjoying fellowship and fun activities.',
    ageRange: '18-45 years',
    contact: '+233 20 456 7890',
    email: 'singles@greatworkscity.org',
    activities: [
      'Weekly singles fellowship meetings',
      'Relationship and marriage preparation seminars',
      'Career and professional development workshops',
      'Social events and outings',
      'Prayer and Bible study groups',
      'Service projects and mission trips',
    ],
    vision: 'To help singles discover and fulfill their God-given purpose while building healthy relationships and preparing for their future.',
    requirements: 'Single (never married, divorced, or widowed), age 18-45',
  },
  {
    id: 'marriage',
    name: 'Marriage Ministry',
    leader: 'Pastor & Mrs. Mensah',
    schedule: 'Third Friday, 7:00 PM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1529634597172-638090bf8995?w=400&h=200&fit=crop',
    description: 'Strengthening marriages and families',
    fullDescription: 'The Marriage Ministry is dedicated to helping couples build strong, healthy, Christ-centered marriages that last a lifetime. We provide support, resources, and biblical teaching to help couples navigate the joys and challenges of married life, while creating opportunities for fellowship with other couples.',
    ageRange: 'Married couples',
    contact: '+233 20 567 8901',
    email: 'marriage@greatworkscity.org',
    activities: [
      'Monthly marriage enrichment meetings',
      'Couple\'s Bible study and prayer',
      'Marriage seminars and workshops',
      'Annual marriage retreat',
      'Date night events and couple\'s activities',
      'Marriage mentorship program',
      'Pre-marital counseling support',
    ],
    vision: 'To build marriages that reflect God\'s design and become a testimony of His love and faithfulness.',
    requirements: 'Open to all married couples in the church',
  },
  {
    id: 'children',
    name: "Children's Ministry",
    leader: 'Sister Abena Owusu',
    schedule: 'Sundays, 9:00 AM & 11:00 AM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=200&fit=crop',
    description: 'Nurturing the next generation',
    fullDescription: 'The Children\'s Ministry is committed to teaching children about God\'s love and helping them develop a genuine relationship with Jesus Christ. Through age-appropriate lessons, worship, and activities, we create a safe and fun environment where children can learn, grow, and discover their value in God.',
    ageRange: '0-12 years',
    contact: '+233 20 678 9012',
    email: 'children@greatworkscity.org',
    activities: [
      'Sunday School classes',
      'Children\'s Church services',
      'Vacation Bible School (VBS)',
      'Children\'s choir and drama',
      'Special events and celebrations',
      'Parent-child activities',
    ],
    vision: 'To raise a generation of children who know, love, and serve God from an early age.',
    requirements: 'Parents must register children before participation. Volunteers needed!',
  },
  {
    id: 'seniors',
    name: 'Seniors Ministry',
    leader: 'Elder Joseph Appiah',
    schedule: 'Last Thursday, 10:00 AM',
    memberCount: 0,
    members: [],
    image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400&h=200&fit=crop',
    description: 'Honoring and serving our elders',
    fullDescription: 'The Seniors Ministry provides fellowship, care, and meaningful engagement for our beloved senior members. We honor their wisdom and experience while ensuring they remain connected, valued, and active in the life of the church through various activities tailored to their needs and interests.',
    ageRange: '60+ years',
    contact: '+233 20 789 0123',
    email: 'seniors@greatworkscity.org',
    activities: [
      'Monthly fellowship meetings',
      'Bible study and prayer sessions',
      'Health and wellness programs',
      'Social outings and day trips',
      'Intergenerational activities',
      'Home visits and care support',
    ],
    vision: 'To honor our seniors, celebrate their contributions, and ensure they continue to experience love, care, and meaningful fellowship.',
    requirements: 'Open to all church members 60 years and above',
  },
];

async function seedMinistries() {
  console.log('🌱 Starting to seed ministries...\n');

  try {
    for (const ministry of ministries) {
      const ministryRef = doc(db, 'ministries', ministry.id);
      await setDoc(ministryRef, {
        ...ministry,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Added: ${ministry.name}`);
    }

    console.log('\n✨ Successfully seeded all ministries!');
    console.log(`📊 Total ministries added: ${ministries.length}`);
    console.log('\n🎉 Your Firebase Firestore is now populated with ministry data.');
    console.log('\n📋 Ministries added:');
    ministries.forEach(m => console.log(`   - ${m.name}`));
    
  } catch (error) {
    console.error('❌ Error seeding ministries:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your Firebase configuration in this file');
    console.log('   2. Ensure Firestore is enabled in your Firebase console');
    console.log('   3. Verify your Firebase security rules allow write access');
    console.log('   4. Make sure you have internet connection');
  }

  process.exit(0);
}

// Run the seeder
seedMinistries();



