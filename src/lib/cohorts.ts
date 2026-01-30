'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Cohort } from './cohort-types';

export function addCohort(db: Firestore, cohort: Omit<Cohort, 'id'>) {
  addDoc(collection(db, 'cohorts'), cohort)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/cohorts',
        operation: 'create',
        requestResourceData: cohort,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function updateCohort(db: Firestore, cohortId: string, cohort: Partial<Cohort>) {
  const cohortRef = doc(db, 'cohorts', cohortId);
  updateDoc(cohortRef, cohort)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: cohortRef.path,
        operation: 'update',
        requestResourceData: cohort,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function deleteCohort(db: Firestore, cohortId: string) {
  const cohortRef = doc(db, 'cohorts', cohortId);
  deleteDoc(cohortRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: cohortRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
