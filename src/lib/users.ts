'use client';

import {
  addDoc,
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

export function addUser(db: Firestore, user: Omit<User, 'id' | 'createdAt'>) {
  const userWithTimestamp = { ...user, createdAt: serverTimestamp() };
  return addDoc(collection(db, 'users'), userWithTimestamp)
    .then((docRef) => {
      if ((user.role === 'Learner' || user.role === 'BusinessLearner') && user.name && user.email) {
        createLearnerProfile(db, { name: user.name, email: user.email, avatar: user.avatar });
      }
      return docRef;
    })
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/users',
        operation: 'create',
        requestResourceData: userWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
      // Re-throw the error so the form can catch it
      throw serverError;
    });
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
