'use client';

import {
  setDoc,
  collection,
  doc,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Certificate } from './certificate-types';
import { generateId } from './id-generator';

// Omit id and issuedDate, as they are auto-generated.
export async function issueCertificate(db: Firestore, certificate: Omit<Certificate, 'id' | 'issuedDate'>) {
  try {
    const id = await generateId(db, 'certificates', 'CT');
    const certificateWithTimestamp = { ...certificate, issuedDate: serverTimestamp() };
    await setDoc(doc(db, 'certificates', id), certificateWithTimestamp);
    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/certificates',
      operation: 'create',
      requestResourceData: certificate,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}
