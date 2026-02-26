/**
 * Upload legacy certificate images to Firebase Storage + Firestore.
 *
 * Each PNG in the certficates/ folder is uploaded to:
 *   Firebase Storage:  certificates/legacy/{filename}
 *   Firestore (kenyasales db):  certificates/{CT-NNN}
 *
 * Learner details are intentionally left blank so an admin can
 * assign them later via the admin panel.
 *
 * Run:
 *   node scripts/upload-legacy-certificates.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  runTransaction,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { readFileSync, readdirSync } from 'fs';
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
const db = getFirestore(app, 'kenyasales');   // certificates live in kenyasales db
const storage = getStorage(app);

// ── helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate the next CT-NNN id using the same counter mechanism as the app.
 * Counter document lives in the DEFAULT firestore (not kenyasales).
 */
async function generateCertificateId() {
  const defaultDb = getFirestore(app);          // default database for counters
  const counterRef = doc(defaultDb, 'counters', 'certificates');

  const nextCount = await runTransaction(defaultDb, async (tx) => {
    const snap = await tx.get(counterRef);
    let count = 1;
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.count === 'number') count = data.count + 1;
    }
    tx.set(counterRef, { count }, { merge: true });
    return count;
  });

  return `CT${nextCount}`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const certDir = join(__dirname, '..', 'certficates');   // note: typo in folder name preserved
  const files = readdirSync(certDir)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .sort((a, b) => {
      // sort numerically by filename number  (1.png, 2.png … 34.png)
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      return na - nb;
    });

  console.log(`Found ${files.length} certificate images in certficates/\n`);

  // Check which ones are already uploaded (avoid duplicates on re-run)
  const existingSnap = await getDocs(
    query(collection(db, 'certificates'), where('isLegacy', '==', true))
  );
  const uploadedFilenames = new Set(
    existingSnap.docs.map(d => d.data().sourceFilename).filter(Boolean)
  );
  console.log(`Already uploaded: ${uploadedFilenames.size} legacy certificates\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const filename of files) {
    if (uploadedFilenames.has(filename)) {
      console.log(`  SKIP  ${filename}  (already exists)`);
      skipped++;
      continue;
    }

    // 1. Read file
    const filePath = join(certDir, filename);
    const fileBuffer = readFileSync(filePath);

    // 2. Upload to Firebase Storage
    const storageRef = ref(storage, `certificates/legacy/${filename}`);
    await uploadBytes(storageRef, fileBuffer, { contentType: 'image/png' });
    const downloadURL = await getDownloadURL(storageRef);

    // 3. Generate Firestore ID
    const id = await generateCertificateId();

    // 4. Write Firestore document (no learner details — to be assigned later)
    await setDoc(doc(db, 'certificates', id), {
      id,
      // Learner fields left blank for admin to fill in later
      learnerName: 'Unassigned',
      learnerEmail: '',

      // Program info — admin can update these too
      programTitle: 'Legacy Certificate',
      programType: 'Core',

      // Storage URL of the original scanned certificate image
      certificateUrl: downloadURL,

      // Metadata
      isLegacy: true,
      isSystemGenerated: false,
      sourceFilename: filename,

      // Timestamps
      issuedDate: new Date(),
      uploadedAt: new Date(),
    });

    console.log(`  OK    ${filename}  →  ${id}  (${downloadURL.slice(0, 60)}...)`);
    uploaded++;
  }

  console.log(`\nDone.  Uploaded: ${uploaded}  |  Skipped (already existed): ${skipped}`);
  process.exit(0);
}

main().catch(err => {
  console.error('\nScript failed:', err);
  process.exit(1);
});
