'use client';
import {
  setDoc, collection, doc, Firestore, getDocs,
  limit, query, serverTimestamp, updateDoc, where
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SaleLead } from './sales-types';
import { generateId } from './id-generator';

export async function allocateLeadToSalesStaff(db: Firestore): Promise<string | null> {
  const staffRef = collection(db, 'staff');
  const q = query(staffRef, where('role', '==', 'Sales'), where('status', '==', 'Active'), limit(10));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docs = snapshot.docs;
  return docs[Math.floor(Math.random() * docs.length)].id;
}

export async function addSaleLead(db: Firestore, lead: Omit<SaleLead, 'id' | 'createdAt' | 'status'>) {
  try {
    const assignedStaffId = await allocateLeadToSalesStaff(db);
    const id = await generateId(db, 'sales', 'LD');
    const leadWithTimestamp = {
      ...lead,
      status: 'Lead',
      createdAt: serverTimestamp(),
      assignedTo: assignedStaffId || null
    };

    await setDoc(doc(db, 'sales', id), leadWithTimestamp);
    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/sales',
      operation: 'create',
      requestResourceData: lead,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
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
