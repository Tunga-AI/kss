/**
 * Delete the cohorts (C1-C8) and learners/users (L1-L52) that were
 * accidentally written to the DEFAULT database instead of kenyasales.
 *
 * Run: node scripts/cleanup-default-db.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  deleteDoc,
  getDocs,
  runTransaction,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:e5f52aa7d526a2fe88b9ae",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // default database

// Delete cohorts C1-C8
console.log('Deleting cohorts C1-C8 from default db...');
for (let i = 1; i <= 8; i++) {
  await deleteDoc(doc(db, 'cohorts', `C${i}`));
  console.log(`  Deleted cohort C${i}`);
}

// Delete learners L1-L52
console.log('\nDeleting learners L1-L52 from default db...');
for (let i = 1; i <= 52; i++) {
  await deleteDoc(doc(db, 'learners', `L${i}`));
  await deleteDoc(doc(db, 'users', `L${i}`));
  console.log(`  Deleted learner/user L${i}`);
}

// Reset counters in default db
console.log('\nResetting counters in default db...');
await runTransaction(db, async (tx) => {
  tx.set(doc(db, 'counters', 'cohorts'), { count: 0 });
  tx.set(doc(db, 'counters', 'learners'), { count: 0 });
});
console.log('  Counters reset to 0');

console.log('\nDone. Default db cleaned up.');
process.exit(0);
