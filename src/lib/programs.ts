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
import type { Program } from './program-types';
import { generateId } from './id-generator';

export async function addProgram(db: Firestore, program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const id = await generateId(db, 'programs', 'P');
    const programWithTimestamp = { ...program, programNumber: id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

    await setDoc(doc(db, 'programs', id), programWithTimestamp);
    return id; // Return ID for caller usage if needed
  } catch (serverError: any) {
    console.error("Error in addProgram:", serverError);
    // If it's a permission error from generateId (accessing counters), it will be caught here.
    // We should probably check the path in the error if possible, but Firestore errors are opaque.

    // For now, allow the UI to see the permissions error but log the real cause.
    const permissionError = new FirestorePermissionError({
      path: '/programs',
      operation: 'create',
      requestResourceData: program, // Passed data is close enough for error log
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
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
