'use client';

import React from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';

export const FirebaseClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const firebase = initializeFirebase();

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
};
