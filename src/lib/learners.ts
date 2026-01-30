'use client';
import { addDoc, collection, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Learner } from './learners-types';

export function addLearner(db: Firestore, learner: Omit<Learner, 'id' | 'status' | 'joinedDate'>) {
  const learnerWithDetails = {
      ...learner,
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  };

  addDoc(collection(db, 'learners'), learnerWithDetails)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: '/learners',
          operation: 'create',
          requestResourceData: learnerWithDetails,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}
