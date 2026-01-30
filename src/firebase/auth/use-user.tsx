'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as AuthUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import type { User as FirestoreUser } from '@/lib/user-types';

export type CombinedUser = AuthUser & FirestoreUser;

export function useUser() {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // User is signed in, now fetch the firestore profile.
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', authUser.email), limit(1));
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const firestoreUser = { id: userDoc.id, ...userDoc.data() } as FirestoreUser;
            setUser({ ...authUser, ...firestoreUser });
        } else {
            // Auth user exists but no firestore profile.
            // Treat as not fully logged in for this app's purpose.
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
  }, [auth, firestore]);

  return { user, loading };
}
