'use client';

import {
  addDoc,
  collection,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Transaction } from './transactions-types';

export function addTransaction(db: Firestore, transaction: Omit<Transaction, 'id' | 'date'>) {
  const transactionWithTimestamp = { ...transaction, date: serverTimestamp() };
  addDoc(collection(db, 'transactions'), transactionWithTimestamp)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: '/transactions',
        operation: 'create',
        requestResourceData: transactionWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
