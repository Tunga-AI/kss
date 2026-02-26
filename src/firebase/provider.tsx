'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  usersFirestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  auth: null,
  firestore: null,
  usersFirestore: null,
  storage: null,
});

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  value: { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; usersFirestore: Firestore; storage: FirebaseStorage };
}> = ({ children, value }) => {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useAuth = () => useContext(FirebaseContext).auth;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useUsersFirestore = () => useContext(FirebaseContext).usersFirestore;
export const useStorage = () => useContext(FirebaseContext).storage;
