'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from './config';

// Note: firebaseApp, auth, and firestore are not exported directly to ensure they are accessed through the provider.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
const databaseId = 'kenyasales';

function initializeFirebase() {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp, databaseId);
    if (typeof window !== 'undefined') {
      getAnalytics(firebaseApp);
    }
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp, databaseId);
  }
  return { firebaseApp, auth, firestore };
}

export { initializeFirebase };
export * from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
