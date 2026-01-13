// firebase.config.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB3mkl2j1ce9YBZg_NptLSZHnqb-_N_Qr8",
  authDomain: "greater-works-city-churc-4a673.firebaseapp.com",
  projectId: "greater-works-city-churc-4a673",
  storageBucket: "greater-works-city-churc-4a673.firebasestorage.app",
  messagingSenderId: "660034620094",
  appId: "1:660034620094:web:8d6aa5b0993c51e2696cef",
  measurementId: "G-W76BM8J293"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
