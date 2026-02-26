'use client';

import {
  setDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { User } from './user-types';
import { createLearnerProfile } from './learners';
import { generateId } from './id-generator';

export async function addUser(db: Firestore, user: Omit<User, 'id' | 'createdAt'>) {
  try {
    let prefix = 'U';
    let counterName = 'users';

    if (user.role === 'Facilitator') {
      prefix = 'F';
      counterName = 'facilitators'; // Use separate counter for facilitators? Yes, requested.
    } else if (user.role === 'Learner' || user.role === 'BusinessLearner') {
      prefix = 'L';
      counterName = 'learners';
    }

    const id = await generateId(db, counterName, prefix);
    const userWithTimestamp = { ...user, createdAt: serverTimestamp() };

    await setDoc(doc(db, 'users', id), userWithTimestamp);

    if ((user.role === 'Learner' || user.role === 'BusinessLearner') && user.name && user.email) {
      // Pass the same ID so users/L-1 matches learners/L-1
      await createLearnerProfile(db, { name: user.name, email: user.email, avatar: user.avatar }, id);
    }

    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/users',
      operation: 'create',
      requestResourceData: user,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the error so the form can catch it
    throw serverError;
  }
}

export function updateUser(db: Firestore, userId: string, user: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  return updateDoc(userRef, user)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: user,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

export function deleteUser(db: Firestore, userId: string) {
  const userRef = doc(db, 'users', userId);
  return deleteDoc(userRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}
