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
import type { ClassroomSession } from './classroom-types';
import { generateId } from './id-generator';

// Omit id, as it's auto-generated.
export async function addClassroomSession(db: Firestore, session: Omit<ClassroomSession, 'id'>) {
  try {
    const id = await generateId(db, 'classroom', 'S');
    await setDoc(doc(db, 'classroom', id), session);
    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/classroom',
      operation: 'create',
      requestResourceData: session,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export function updateClassroomSession(db: Firestore, sessionId: string, session: Partial<ClassroomSession>) {
  const sessionRef = doc(db, 'classroom', sessionId);
  updateDoc(sessionRef, session)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: sessionRef.path,
        operation: 'update',
        requestResourceData: session,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function deleteClassroomSession(db: Firestore, sessionId: string) {
  const sessionRef = doc(db, 'classroom', sessionId);
  deleteDoc(sessionRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: sessionRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
