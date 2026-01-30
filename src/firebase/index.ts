'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from './config';

// Note: firebaseApp, auth, and firestore are not exported directly to ensure they are accessed through the provider.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;
const databaseId = 'kenyasales';

function initializeFirebase() {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp, databaseId);
    storage = getStorage(firebaseApp);
    if (typeof window !== 'undefined') {
      getAnalytics(firebaseApp);
    }
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp, databaseId);
    storage = getStorage(firebaseApp);
  }
  return { firebaseApp, auth, firestore, storage };
}

export { initializeFirebase };
export * from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
