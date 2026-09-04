import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  runTransaction, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBTPfi5xyWgaFuE4C4PNmFOXLYIzCRxBmk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "undhi-lms.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "undhi-lms",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "undhi-lms.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "53086687466",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:53086687466:web:74f7e78fa9200f34054793",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z97KV246F7"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization warning:", error);
  // @ts-ignore
  app = {} as FirebaseApp;
  // @ts-ignore
  auth = {} as Auth;
  // @ts-ignore
  db = {} as Firestore;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
};
export type { FirebaseUser };
