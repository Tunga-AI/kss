'use client';

import {
  addDoc,
  collection,
  doc,
  Firestore,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Admission } from './admission-types';

export function createAdmission(db: Firestore, admission: Omit<Admission, 'id' | 'createdAt'>) {
  const admissionWithTimestamp = { ...admission, createdAt: serverTimestamp() };
  return addDoc(collection(db, 'admissions'), admissionWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/admissions',
        operation: 'create',
        requestResourceData: admissionWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError; // re-throw to be caught by the caller
    });
}

export function updateAdmission(db: Firestore, admissionId: string, data: Partial<Omit<Admission, 'id'>>) {
  const admissionRef = doc(db, 'admissions', admissionId);
  return updateDoc(admissionRef, data)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: admissionRef.path,
        operation: 'update',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError; // re-throw to be caught by the caller
    });
}
