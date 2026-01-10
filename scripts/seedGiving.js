// Seed script for giving/donations data
// Run with: node scripts/seedGiving.js

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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

// Sample giving data
const givingData = [
  {
    userId: "sample-user-1",
    amount: 500,
    type: "tithe",
    method: "mobile_money",
    reference: "MM20260101001",
    notes: "January tithe",
    date: "2026-01-01",
    createdAt: new Date("2026-01-01").toISOString(),
  },
  {
    userId: "sample-user-2",
    amount: 200,
    type: "offering",
    method: "cash",
    reference: "CASH20260103001",
    notes: "Sunday offering",
    date: "2026-01-03",
    createdAt: new Date("2026-01-03").toISOString(),
  },
  {
    userId: "sample-user-1",
    amount: 1000,
    type: "special",
    method: "bank_transfer",
    reference: "BT20260105001",
    notes: "Building fund",
    date: "2026-01-05",
    createdAt: new Date("2026-01-05").toISOString(),
  },
  {
    userId: "sample-user-3",
    amount: 300,
    type: "tithe",
    method: "mobile_money",
    reference: "MM20260107001",
    notes: "Weekly tithe",
    date: "2026-01-07",
    createdAt: new Date("2026-01-07").toISOString(),
  },
  {
    userId: "sample-user-2",
    amount: 150,
    type: "offering",
    method: "cash",
    reference: "CASH20260107002",
    notes: "Sunday offering",
    date: "2026-01-07",
    createdAt: new Date("2026-01-07").toISOString(),
  },
];

async function seedGiving() {
  try {
    console.log('🌱 Starting to seed giving data...\n');

    // Check if giving collection already has data
    const existingGiving = await getDocs(collection(db, 'giving'));
    if (existingGiving.size > 0) {
      console.log(`⚠️  Giving collection already has ${existingGiving.size} records.`);
      console.log('❓ Do you want to add more sample data? (This script will add sample data anyway)\n');
    }

    // Add each giving record
    let successCount = 0;
    for (const giving of givingData) {
      try {
        await addDoc(collection(db, 'giving'), giving);
        console.log(`✅ Added: GH₵${giving.amount} - ${giving.type} (${giving.date})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add giving record:`, error.message);
      }
    }

    console.log('\n✨ Successfully seeded giving data!');
    console.log(`📊 Total giving records added: ${successCount}`);
    console.log(`💰 Total amount: GH₵${givingData.reduce((sum, g) => sum + g.amount, 0)}\n`);
    
    console.log('🎉 You can now:');
    console.log('   1. Open your app');
    console.log('   2. Go to Admin Dashboard');
    console.log('   3. See real giving statistics!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding giving data:', error);
    console.error('\n📝 Make sure:');
    console.error('   1. Firebase rules allow writing to "giving" collection');
    console.error('   2. You have internet connection');
    console.error('   3. Firebase config is correct\n');
    process.exit(1);
  }
}

// Run the seeder
seedGiving();



