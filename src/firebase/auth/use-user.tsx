'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as AuthUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
      setError(null);

      if (authUser) {
        // Fetch Firestore profile from 'kenyasales' database
        const usersRef = collection(usersFirestore, 'users');
        const q = query(usersRef, where('email', '==', authUser.email), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // ── Happy path: profile found ──────────────────────────────
          const userDoc = querySnapshot.docs[0];
          const firestoreUser = { id: userDoc.id, ...userDoc.data() } as FirestoreUser;
          setUser({ ...authUser, ...firestoreUser });
          // Record last login (fire-and-forget)
          updateDoc(doc(usersFirestore, 'users', userDoc.id), { lastLogin: serverTimestamp() }).catch(() => { });
        } else {
          // ── Self-heal: Auth user exists but Firestore doc is missing ─
          // This happens when a user is created in Firebase Auth Console
          // but the Firestore write didn't complete (race condition, network
          // error, or manual console creation).
          console.warn(`[useUser] ${authUser.email} has no Firestore profile — attempting self-heal.`);
          try {
            const healId = `U${Date.now()}`;
            await setDoc(doc(usersFirestore, 'users', healId), {
              name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
              email: authUser.email,
              role: 'Learner',      // Conservative default — Admin can update in portal
              status: 'Active',
              createdAt: serverTimestamp(),
              _autoHealed: true,   // Flag for admins to notice and update role/details
            });
            // Re-fetch so we have the full doc
            const healedSnap = await getDocs(
              query(collection(usersFirestore, 'users'), where('email', '==', authUser.email), limit(1))
            );
            if (!healedSnap.empty) {
              const healedDoc = healedSnap.docs[0];
              const healedUser = { id: healedDoc.id, ...healedDoc.data() } as FirestoreUser;
              setUser({ ...authUser, ...healedUser });
              setLoading(false);
              return;
            }
          } catch (healErr) {
            console.error('[useUser] Self-heal failed:', healErr);
          }
          // If self-heal also failed, block access
          setError('User account not found in system. Please contact support.');
          setUser(null);
        }
      } else {
        // Signed out
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, usersFirestore]);

  return { user, loading, error };
}
