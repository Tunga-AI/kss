/**
 * Upload historical cohorts and learners from the Excel file:
 *   "Final List_of_ALL_KSS_Participants February 2026.xlsx"
 *
 * Cohorts found in the file:
 *   TOT COHORT 1-5    → Certified Sales Trainer Program (IBrgIwhBaqpd5yBirkPU)
 *   FRONTLINE SALES PROGRAM COHORT 1-3 → Frontline Sales Program - Level 2 (FkNfGbD6mvVDNIFHi3wU)
 *
 * Run:
 *   node scripts/upload-cohorts-and-learners.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import XLSX from 'xlsx';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:e5f52aa7d526a2fe88b9ae",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'kenyasales'); // upload to kenyasales database

// ── Program ID mappings ──────────────────────────────────────────────────────
const PROGRAM_IDS = {
  TOT: 'IBrgIwhBaqpd5yBirkPU',          // Certified Sales Trainer Program
  FRONTLINE: 'FkNfGbD6mvVDNIFHi3wU',   // Frontline Sales Program - Level 2
};

// ── Counter helpers ──────────────────────────────────────────────────────────
async function generateId(counterName, prefix) {
  const counterRef = doc(db, 'counters', counterName);
  const nextCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    let count = 1;
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.count === 'number') count = data.count + 1;
    }
    tx.set(counterRef, { count }, { merge: true });
    return count;
  });
  return `${prefix}${nextCount}`;
}

// ── Parse Excel ──────────────────────────────────────────────────────────────
function parseExcel() {
  const filePath = join(__dirname, '..', 'Final List_of_ALL_KSS_Participants February 2026.xlsx');
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Sheet1'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const cohorts = [];
  let currentCohort = null;

  for (const row of rows) {
    const cell0 = String(row[0] || '').trim();
    const cell1 = String(row[1] || '').trim();
    const cell2 = String(row[2] || '').trim();

    // Detect cohort header rows (all caps, no email in col2 or col2 is empty)
    const isCohortHeader =
      cell0 &&
      cell0 === cell0.toUpperCase() &&
      !cell2.includes('@') &&
      !cell0.toLowerCase().startsWith('first');

    if (isCohortHeader) {
      currentCohort = {
        name: cell0,
        programKey: cell0.startsWith('TOT') ? 'TOT' : 'FRONTLINE',
        learners: [],
      };
      cohorts.push(currentCohort);
    } else if (
      currentCohort &&
      cell0 &&
      cell2.includes('@') &&
      !cell0.toLowerCase().startsWith('first')
    ) {
      // Learner row: firstname, surname, email
      const fullName = [cell0, cell1].filter(Boolean).join(' ').trim();
      currentCohort.learners.push({
        name: fullName,
        email: cell2.trim().toLowerCase(),
      });
    }
  }

  return cohorts;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const cohorts = parseExcel();

  console.log('\n=== Parsed Excel Data ===');
  for (const c of cohorts) {
    console.log(`  ${c.name} (${c.programKey}) → ${c.learners.length} learners`);
  }

  // Check for existing learners (deduplicate by email)
  const existingUsersSnap = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'Learner'))
  );
  const existingEmails = new Set(
    existingUsersSnap.docs.map(d => (d.data().email || '').toLowerCase())
  );
  console.log(`\nExisting learner emails in DB: ${existingEmails.size}`);

  // Check for existing cohorts (deduplicate by name)
  const existingCohortsSnap = await getDocs(collection(db, 'cohorts'));
  const existingCohortNames = new Set(
    existingCohortsSnap.docs.map(d => (d.data().name || '').trim().toUpperCase())
  );
  console.log(`Existing cohorts in DB: ${existingCohortNames.size}`);

  let cohortsCreated = 0;
  let learnersCreated = 0;
  let learnersSkipped = 0;

  console.log('\n=== Processing Cohorts ===');

  for (const cohort of cohorts) {
    const cohortNameNormalized = cohort.name.trim().toUpperCase();
    const programId = PROGRAM_IDS[cohort.programKey];

    // 1. Create cohort if it doesn't exist
    let cohortId;
    if (existingCohortNames.has(cohortNameNormalized)) {
      // Find the existing cohort ID
      const existingDoc = existingCohortsSnap.docs.find(
        d => (d.data().name || '').trim().toUpperCase() === cohortNameNormalized
      );
      cohortId = existingDoc ? existingDoc.id : null;
      console.log(`\n  SKIP cohort "${cohort.name}" (already exists as ${cohortId})`);
    } else {
      cohortId = await generateId('cohorts', 'C');
      await setDoc(doc(db, 'cohorts', cohortId), {
        id: cohortId,
        name: cohort.name,
        status: 'Closed',
        programIds: [programId],
        programId: programId, // legacy
        description: `Historical cohort imported from participant records.`,
      });
      existingCohortNames.add(cohortNameNormalized);
      cohortsCreated++;
      console.log(`\n  CREATED cohort "${cohort.name}" → ${cohortId}`);
    }

    if (!cohortId) {
      console.log(`  ERROR: Could not resolve cohort ID for "${cohort.name}", skipping learners`);
      continue;
    }

    // 2. Add learners for this cohort
    for (const learner of cohort.learners) {
      const emailLower = learner.email.toLowerCase();

      if (existingEmails.has(emailLower)) {
        console.log(`    SKIP  ${learner.name} <${emailLower}> (email already exists)`);
        learnersSkipped++;
        continue;
      }

      // Generate IDs (users and learners share the same L-prefix counter)
      const learnerId = await generateId('learners', 'L');

      const today = new Date().toISOString().split('T')[0];

      // Create user document
      await setDoc(doc(db, 'users', learnerId), {
        id: learnerId,
        name: learner.name,
        email: emailLower,
        role: 'Learner',
        status: 'Active',
        createdAt: new Date(),
      });

      // Create learner profile document (same ID)
      await setDoc(doc(db, 'learners', learnerId), {
        id: learnerId,
        name: learner.name,
        email: emailLower,
        status: 'Active',
        joinedDate: today,
        program: programId,
        cohortId: cohortId,
        cohortName: cohort.name,
      });

      existingEmails.add(emailLower);
      learnersCreated++;
      console.log(`    OK    ${learner.name} <${emailLower}> → ${learnerId} (cohort: ${cohortId})`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Cohorts created:  ${cohortsCreated}`);
  console.log(`Learners created: ${learnersCreated}`);
  console.log(`Learners skipped (duplicate email): ${learnersSkipped}`);
  console.log('\nDone.');
  process.exit(0);
}

main().catch(err => {
  console.error('\nScript failed:', err);
  process.exit(1);
});
