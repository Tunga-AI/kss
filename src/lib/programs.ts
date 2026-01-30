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
import type { Program } from './program-types';

export function addProgram(db: Firestore, program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) {
  const programWithTimestamp = { ...program, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  addDoc(collection(db, 'programs'), programWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/programs',
        operation: 'create',
        requestResourceData: programWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function updateProgram(db: Firestore, programId: string, program: Partial<Program>) {
  const programRef = doc(db, 'programs', programId);
  const programWithTimestamp = { ...program, updatedAt: serverTimestamp() };
  updateDoc(programRef, programWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: programRef.path,
        operation: 'update',
        requestResourceData: programWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function deleteProgram(db: Firestore, programId: string) {
  const programRef = doc(db, 'programs', programId);
  deleteDoc(programRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: programRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
