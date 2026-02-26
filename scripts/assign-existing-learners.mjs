/**
 * Assign cohort C6 ("April 2025") to the pre-existing learners L4-L11
 * who have no cohort assignment.
 *
 * Run: node scripts/assign-existing-learners.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:e5f52aa7d526a2fe88b9ae",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'kenyasales');

const COHORT_ID = 'C6';
const COHORT_NAME = 'April 2025';
const LEARNER_IDS = ['L4', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11'];

async function main() {
  // Verify the cohort exists
  const cohortSnap = await getDoc(doc(db, 'cohorts', COHORT_ID));
  if (!cohortSnap.exists()) {
    console.error('Cohort', COHORT_ID, 'not found!');
    process.exit(1);
  }
  const cohortData = cohortSnap.data();
  const programId = cohortData.programIds?.[0] || cohortData.programId || '';
  console.log('Assigning cohort:', COHORT_ID, '-', cohortData.name, '| program:', programId);
  console.log('');

  for (const id of LEARNER_IDS) {
    const learnerRef = doc(db, 'learners', id);
    const snap = await getDoc(learnerRef);

    if (!snap.exists()) {
      console.log(id, '- learner doc not found, skipping');
      continue;
    }

    const data = snap.data();
    if (data.cohortId) {
      console.log(id, '-', data.name, '- already has cohort:', data.cohortId, ', skipping');
      continue;
    }

    await updateDoc(learnerRef, {
      cohortId: COHORT_ID,
      cohortName: COHORT_NAME,
      program: programId,
    });
    console.log(id, '-', data.name || data.email, '-> assigned to', COHORT_ID, '(' + COHORT_NAME + ')');
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
