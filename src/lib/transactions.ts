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
import type { Transaction } from './transactions-types';
import { generateId } from './id-generator';

export async function addTransaction(db: Firestore, transaction: Omit<Transaction, 'id' | 'date'>) {
  try {
    const id = await generateId(db, 'transactions', 'TR');

    // Filter out undefined values to prevent Firestore errors
    const cleanTransaction: any = { date: serverTimestamp() };
    Object.keys(transaction).forEach(key => {
      const value = (transaction as any)[key];
      if (value !== undefined) {
        cleanTransaction[key] = value;
      }
    });

    await setDoc(doc(db, 'transactions', id), cleanTransaction);
    console.log('Transaction saved successfully:', id);
    return id;
  } catch (serverError: any) {
    console.error('Error saving transaction:', serverError);
    const permissionError = new FirestorePermissionError({
      path: '/transactions',
      operation: 'create',
      requestResourceData: transaction,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw to allow caller to handle the error
  }
}
