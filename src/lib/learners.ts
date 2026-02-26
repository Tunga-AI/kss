'use client';
import { setDoc, collection, doc, Firestore, deleteDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Learner } from './learners-types';
import { generateId } from './id-generator';

export async function addLearner(db: Firestore, learner: Omit<Learner, 'id' | 'status' | 'joinedDate'>) {
  try {
    const id = await generateId(db, 'learners', 'L');
    const learnerWithDetails = {
      ...learner,
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    await setDoc(doc(db, 'learners', id), learnerWithDetails);
    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/learners',
      operation: 'create',
      requestResourceData: learner,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export async function createLearnerProfile(db: Firestore, user: { name: string, email: string, avatar?: string }, forcedId?: string) {
  try {
    const id = forcedId || await generateId(db, 'learners', 'L');
    const learnerData = {
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      program: '', // Initially no program
    };

    await setDoc(doc(db, 'learners', id), learnerData);
    return id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: '/learners',
      operation: 'create',
      requestResourceData: user,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export function updateLearner(db: Firestore, learnerId: string, learner: Partial<Learner>) {
  const learnerRef = doc(db, 'learners', learnerId);
  updateDoc(learnerRef, learner)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: learnerRef.path,
        operation: 'update',
        requestResourceData: learner,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function deleteLearner(db: Firestore, learnerId: string) {
  const learnerRef = doc(db, 'learners', learnerId);
  deleteDoc(learnerRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: learnerRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
