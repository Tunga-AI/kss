'use client';
import {
  addDoc, collection, doc, Firestore, getDocs,
  limit, query, serverTimestamp, updateDoc, where
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SaleLead } from './sales-types';

export function addSaleLead(db: Firestore, lead: Omit<SaleLead, 'id' | 'createdAt' | 'status'>) {
  const leadWithTimestamp = { ...lead, status: 'Lead', createdAt: serverTimestamp() };
  
  return addDoc(collection(db, 'sales'), leadWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/sales',
        operation: 'create',
        requestResourceData: leadWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

export async function convertLeadToAdmitted(db: Firestore, learnerEmail: string, programTitle: string) {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, where('email', '==', learnerEmail), where('program', '==', programTitle), limit(1));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const leadDoc = querySnapshot.docs[0];
            const leadRef = doc(db, 'sales', leadDoc.id);
            updateDoc(leadRef, { status: 'Admitted' })
                .catch(async (serverError) => {
                  const permissionError = new FirestorePermissionError({
                    path: leadRef.path,
                    operation: 'update',
                    requestResourceData: { status: 'Admitted' },
                  });
                  errorEmitter.emit('permission-error', permissionError);
                });
        }
    } catch (error) {
        // This is a read operation, so we should handle permission errors here too if needed,
        // but for now, we'll focus on the write operation's error handling.
        console.error("Error finding sale lead to update:", error);
    }
}
