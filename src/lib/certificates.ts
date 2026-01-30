'use client';

import {
  addDoc,
  collection,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Certificate } from './certificate-types';

// Omit id and issuedDate, as they are auto-generated.
export function issueCertificate(db: Firestore, certificate: Omit<Certificate, 'id' | 'issuedDate'>) {
  const certificateWithTimestamp = { ...certificate, issuedDate: serverTimestamp() };
  addDoc(collection(db, 'certificates'), certificateWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/certificates',
        operation: 'create',
        requestResourceData: certificateWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
