/**
 * Migration: assign programNumber (P1, P2, ...) to existing programs
 * and set the counter document so future programs continue from the right number.
 *
 * Run: node scripts/number-programs.mjs
 *
 * Uses the Firebase client SDK with the project API key (no service account needed
 * for the default database that has open rules).
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';

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

async function main() {
  // Fetch all programs that don't yet have a programNumber
  const snap = await getDocs(collection(db, 'programs'));

  const unNumbered = snap.docs.filter(d => !d.data().programNumber);
  const alreadyNumbered = snap.docs.filter(d => d.data().programNumber);

  console.log(`Total programs: ${snap.size}`);
  console.log(`Already numbered: ${alreadyNumbered.length}`);
  console.log(`To be numbered: ${unNumbered.length}`);

  if (unNumbered.length === 0) {
    console.log('Nothing to do — all programs already have a programNumber.');
    process.exit(0);
  }

  // Determine the highest existing number so we don't collide
  let maxExisting = 0;
  for (const d of alreadyNumbered) {
    const num = parseInt(d.data().programNumber?.replace('P', '') || '0', 10);
    if (!isNaN(num) && num > maxExisting) maxExisting = num;
  }

  // Sort unnumbered by createdAt ascending so numbering is chronological
  const sorted = [...unNumbered].sort((a, b) => {
    const aTime = a.data().createdAt?.toMillis?.() ?? 0;
    const bTime = b.data().createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });

  let counter = maxExisting + 1;
  const batch = writeBatch(db);

  for (const docSnap of sorted) {
    const programNumber = `P${counter}`;
    batch.update(doc(db, 'programs', docSnap.id), { programNumber });
    console.log(`  ${docSnap.id} → ${programNumber} (${docSnap.data().programName || 'unnamed'})`);
    counter++;
  }

  // Update the counter document so the next addProgram() continues from the right number
  const finalCount = counter - 1;
  batch.set(doc(db, 'counters', 'programs'), { count: finalCount }, { merge: true });
  console.log(`\nSetting counters/programs.count = ${finalCount}`);

  await batch.commit();
  console.log(`\nDone. ${unNumbered.length} programs numbered. Counter set to ${finalCount}.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
