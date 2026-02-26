'use client';

import {
  setDoc,
  collection,
  doc,
  Firestore,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Admission } from './admission-types';
import { generateId } from './id-generator';

export async function createAdmission(db: Firestore, admission: Omit<Admission, 'id' | 'createdAt'>) {
  try {
    const id = await generateId(db, 'admissions', 'AD');
    const admissionWithTimestamp = { ...admission, createdAt: serverTimestamp() };
    await setDoc(doc(db, 'admissions', id), admissionWithTimestamp);
    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/admissions',
      operation: 'create',
      requestResourceData: admission,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // re-throw to be caught by the caller
  }
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
