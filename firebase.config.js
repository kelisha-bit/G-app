import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration loaded from environment variables
// Set these in your .env file (see .env.example for reference)
// Expo automatically loads EXPO_PUBLIC_* variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate that required Firebase config values are present
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  const errorMessage = `❌ Firebase configuration is missing required values!\n\n` +
    `Missing variables: ${missingConfig.map(key => `EXPO_PUBLIC_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`).join(', ')}\n\n` +
    `Please:\n` +
    `1. Create a .env file in your project root\n` +
    `2. Add all required Firebase configuration variables\n` +
    `3. Restart Expo server with: npm start --clear\n\n` +
    `See SECURITY_SETUP_GUIDE.md for detailed instructions.\n`;
  
  console.error(errorMessage);
  throw new Error('Firebase configuration is incomplete. Please check your .env file and ensure all required variables are set.');
}

// Validate API key format (should start with 'AIza' for Google API keys)
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
  console.warn('⚠️  Warning: Firebase API key format appears invalid. API keys typically start with "AIza"');
  console.warn('Please verify your EXPO_PUBLIC_FIREBASE_API_KEY in the .env file');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  if (error.code === 'auth/api-key-not-valid') {
    throw new Error(`❌ Invalid Firebase API Key!\n\n` +
      `The API key in your .env file is not valid.\n` +
      `Please:\n` +
      `1. Check your Firebase Console (https://console.firebase.google.com/)\n` +
      `2. Go to Project Settings > Your apps\n` +
      `3. Copy the correct API key\n` +
      `4. Update EXPO_PUBLIC_FIREBASE_API_KEY in your .env file\n` +
      `5. Restart Expo server with: npm start --clear\n`);
  }
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

