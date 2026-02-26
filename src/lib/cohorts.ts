'use client';

import {
  setDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
} from 'firebase/firestore';
import type { Cohort } from './cohort-types';
import { generateId } from './id-generator';

export async function addCohort(db: Firestore, cohort: Omit<Cohort, 'id'>) {
  const id = await generateId(db, 'cohorts', 'C');
  await setDoc(doc(db, 'cohorts', id), cohort);
  return id;
}

export async function updateCohort(db: Firestore, cohortId: string, cohort: Partial<Cohort>) {
  const cohortRef = doc(db, 'cohorts', cohortId);
  return updateDoc(cohortRef, cohort);
}

export async function deleteCohort(db: Firestore, cohortId: string) {
  const cohortRef = doc(db, 'cohorts', cohortId);
  return deleteDoc(cohortRef);
}
