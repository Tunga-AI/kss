#!/usr/bin/env node
/**
 * Migration Script: Copy ALL collections from default Firestore → kenyasales DB
 * ────────────────────────────────────────────────────────────────────────────────
 * SAFE TO RE-RUN — uses set() with merge:true (idempotent upsert by doc ID).
 * Original data in the default DB is NOT deleted.
 *
 * Usage:
 *   node scripts/migrate-to-kenyasales.js
 */

const admin = require('firebase-admin');

// ── Credentials ─────────────────────────────────────────────────────────────
const PROJECT_ID = 'msommii';
const CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@msommii.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwGXzvuNXDZHQh
aZEH/Uj/opkWlYx5Xm+IitnhgPnsqmHHBi/PL4V2fSOQ3lK1B6zAadwsRA+t4/g3
UlEvVBbJX/xMPnicAvtOGT9hv9t/NfQ8GC18i8G82yBuNXXL7NbbEtP/glPSw+sf
OX0b9bUMiV39ju6QUWvJFSl5ibOVd6lWWxFXB9xmVeWn+keodw6rLQTWa1Rj95pW
UMaC9ev/Y6V9ANcGoToNOamJ5U33eG//5b+GwT8dvvqR/fvyOunGWq7P9yfYW9id
+kyAyRlJQBcv5GUUPx+vrMKNcR/fqYxIX7w+uz+RDqL3ce4+zIt59omsvUB3ivBb
V2oRV68XAgMBAAECggEAAPjluDBwjwdxyVzFrgzHcjs0a4FViQwCQ0zk9A+cEaLv
2ZiepfRbYR1CwizVZGYk8tutbq8iLlxuWpEr8pNycW0uvZWwtnJ2bxFznfdgX7JC
usbgEBUjc4alhgY/NBTcK3x4oCtY3svcc0vZdXs5+IDqUcPlbErkH0mXH4fTmSp8
HBnbnpNYil+UEQdRlueac6eOB2o/DDiaB70hw4Vqm1fwzTRkc8S6zvQDJ5RiEwS6
1Pwi0pSl3Ur9AZr9kLoBt0plN5ZMOJtokKdnVpJDMWJeMqPELz/qOyZcTC07HxuY
eii+frTnTCbIWTS1qkkfoPfT1YMrbx96RbRKLwzYAQKBgQDph7676LJ++Mbnypsz
Yhf9oqGmA1Eljqv5bY1ZvMc6o8iba4zT0uOicGeRk4lvBiOvACdFAg8rbAQ7Cclv
ktbMw4Alir8vL3yOfH5tzXKY6f5zeDzj/tY80DUD2lg0vynr3+lBCaLmMyucXmlo
3JamTM8QOLhBdtSKxelt7JI3FwKBgQDBCyAgxMq6qfdkQoIinujHRSZNgxO5SsED
1l8TKoVj0dgEqLkAYE2EBtZ/jBaLSmE9uOXhqUVlN6utxyz/qSgiOZtToU1VDos1
zgUh0EZHE/tNZV92da2lZEvqqBxc6fwWf+PM12wRZdk9FYN7mYuuoijpWk+O5D0i
H7QbgVFIAQKBgDk84zvtUeqbES141Edo0JaDCPnGsFnzOSV+e3m2MmKmCCJH3xGA
C/khcdEVh0bmC1L2R6m7UnqDFBpgULX/GJTBiiQpeKiZC/9kdhx1kZP3Lj2hB9Od
/2aSZZwXJS1weVbt357oPLwNaK//1/gysN37z3ibXlX1SSzmS0t9A21rAoGAVFTd
5jLSNZWGw7/iRemR22uz/eyjMzEa/OgrhJ3ww9iqO+7RUv6/Hhw2bGXwe001Cde6
ZUijTkJxt2rpl454P+tWlcRDmkLOQeUMjOcFrItoHzmH6KIkB7q3B34FVfnJ7LJV
++ioBzmtG2hIljhPsyyYHskbNFs08bFT5ygpMAECgYEA6IfnweahRvu2GmRGQMK4
xBaK0c9kyy1G+5+3w/j2f43oVTRlfKmIlo6Ck7OybUQs9XCbmmUWMuw+QITYHSRN
ztWA+RpIJxzgR7NWvWJ0PvyRCbSZwjMkDfhehwXMTgXzoovPvbTZN4kTEPnN6iLs
Ijj45fnXFhqmYPpD9tG0MWc=
-----END PRIVATE KEY-----
`;

// ── ALL collections to copy from default → kenyasales ────────────────────────
// Previously migrated (safe to re-run, idempotent):
//   programs, media
// Newly adding all remaining collections:
const COLLECTIONS_TO_COPY = [
    // Identity & access
    'users',
    'userProfiles',
    'counters',

    // Admissions & enrolment
    'admissions',
    'cohorts',
    'leads',
    'customers',

    // Payments & orders
    'transactions',
    'orders',

    // LMS / learning
    'learningCourses',
    'learningUnits',
    'learnerEnrollments',
    'unitProgress',
    'facilitatorAssignments',

    // Assessments
    'assessments',
    'assessment_attempts',
    'council_reviews',

    // Certificates
    'certificates',

    // Classroom
    'classroom',

    // Content library
    'contentLibrary',

    // Notifications & comms
    'notifications',
    'email_queue',

    // Settings / branding (may already exist)
    'settings',

    // Previously migrated — idempotent, safe to include
    'programs',
    'media',
];

// ── Init two Admin app instances ─────────────────────────────────────────────
const credential = admin.credential.cert({
    projectId: PROJECT_ID,
    clientEmail: CLIENT_EMAIL,
    privateKey: PRIVATE_KEY,
});

const sourceApp = admin.initializeApp({ credential, projectId: PROJECT_ID }, 'source');
const sourceDb = sourceApp.firestore();   // (default) DB

const targetApp = admin.initializeApp({ credential, projectId: PROJECT_ID }, 'target');
const targetDb = targetApp.firestore();
targetDb.settings({ databaseId: 'kenyasales' });

// ── Copy one collection ───────────────────────────────────────────────────────
async function copyCollection(collectionName) {
    process.stdout.write(`\n📦  ${collectionName.padEnd(28)} `);

    const snapshot = await sourceDb.collection(collectionName).get();

    if (snapshot.empty) {
        console.log('(empty — skipped)');
        return 0;
    }

    const BATCH_SIZE = 400;
    const docs = snapshot.docs;
    let total = 0;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = targetDb.batch();
        const chunk = docs.slice(i, i + BATCH_SIZE);

        for (const docSnap of chunk) {
            const ref = targetDb.collection(collectionName).doc(docSnap.id);
            batch.set(ref, docSnap.data(), { merge: true });
            total++;
        }

        await batch.commit();
    }

    console.log(`✅  ${total} docs copied`);
    return total;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  KSS Full Migration: (default) → kenyasales');
    console.log('  Project  :', PROJECT_ID);
    console.log('  Copying  :', COLLECTIONS_TO_COPY.length, 'collections');
    console.log('  Originals: PRESERVED in default DB');
    console.log('═══════════════════════════════════════════════════════════');

    let grand = 0;
    const errors = [];

    for (const col of COLLECTIONS_TO_COPY) {
        try {
            grand += await copyCollection(col);
        } catch (err) {
            errors.push({ col, msg: err.message });
            console.log(`❌  Error — ${err.message}`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  ✅ Total documents copied : ${grand}`);
    if (errors.length) {
        console.log(`  ⚠️  Collections with errors: ${errors.map(e => e.col).join(', ')}`);
        errors.forEach(e => console.log(`     • ${e.col}: ${e.msg}`));
    }
    console.log('  Default DB is unchanged.');
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(0);
}

main().catch(err => {
    console.error('\n💥 Fatal:', err);
    process.exit(1);
});
