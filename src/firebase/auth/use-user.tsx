'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as AuthUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useUsersFirestore } from '@/firebase';
import type { User as FirestoreUser } from '@/lib/user-types';

export type CombinedUser = AuthUser & FirestoreUser;

export function useUser() {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const usersFirestore = useUsersFirestore();

  useEffect(() => {
    if (!auth || !usersFirestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setError(null); // Reset error on auth change
      if (authUser) {
        // User is signed in, now fetch the firestore profile from usersFirestore.
        const usersRef = collection(usersFirestore, 'users');
        const q = query(usersRef, where('email', '==', authUser.email), limit(1));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const firestoreUser = { id: userDoc.id, ...userDoc.data() } as FirestoreUser;
          setUser({ ...authUser, ...firestoreUser });
          // Record last login timestamp
          updateDoc(doc(usersFirestore, 'users', userDoc.id), { lastLogin: serverTimestamp() }).catch(() => {});
        } else {
          // Auth user exists but no firestore profile.
          // Treat as not fully logged in for this app's purpose.
          console.error(`User ${authUser.email} authenticated but no Firestore profile found in 'kenyasales' database.`);
          setError('User account not found in system.');
          setUser(null);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, usersFirestore]);

  return { user, loading, error };
}
