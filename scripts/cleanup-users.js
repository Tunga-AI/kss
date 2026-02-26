#!/usr/bin/env node
/**
 * Cleanup Script: Delete users from kenyasales DB whose IDs are NOT
 * the generated numbered format (e.g. U1, U2, U3, U10, ...).
 *
 * Only users with IDs matching /^U\d+$/ are kept.
 *
 * Usage:
 *   node scripts/cleanup-users.js          # dry-run (safe — no deletions)
 *   node scripts/cleanup-users.js --delete  # actually deletes
 */

const admin = require('firebase-admin');

// ── Credentials (same as migrate script) ────────────────────────────────────
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

const KENYASALES_DB = 'kenyasales';

// ── Init ─────────────────────────────────────────────────────────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();
db.settings({ databaseId: KENYASALES_DB });

// ── Config ───────────────────────────────────────────────────────────────────
// Only keep IDs that are our generated numbered IDs: U1, U2, U10, U123, ...
const VALID_ID_PATTERN = /^U\d+$/;

const isDryRun = !process.argv.includes('--delete');

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🗄️  Target database : kenyasales`);
    console.log(`📋 Collection      : users`);
    console.log(`✅ Keep pattern    : /^U\\d+$/ (e.g. U1, U2, U10)`);
    console.log(`🔒 Mode            : ${isDryRun ? 'DRY-RUN (pass --delete to actually delete)' : 'LIVE DELETE'}\n`);

    const snapshot = await db.collection('users').get();
    console.log(`📦 Total users found: ${snapshot.size}\n`);

    const toKeep = [];
    const toDelete = [];

    snapshot.forEach(doc => {
        if (VALID_ID_PATTERN.test(doc.id)) {
            toKeep.push({ id: doc.id, name: doc.data().name || '—', email: doc.data().email || '—' });
        } else {
            toDelete.push({ id: doc.id, name: doc.data().name || '—', email: doc.data().email || '—' });
        }
    });

    console.log(`✅ Users to KEEP (${toKeep.length}):`);
    toKeep.forEach(u => console.log(`   [${u.id}]  ${u.name}  <${u.email}>`));

    console.log(`\n🗑️  Users to DELETE (${toDelete.length}):`);
    toDelete.forEach(u => console.log(`   [${u.id}]  ${u.name}  <${u.email}>`));

    if (toDelete.length === 0) {
        console.log('\n✨ Nothing to delete. Database is already clean.');
        return;
    }

    if (isDryRun) {
        console.log('\n⚠️  DRY-RUN — no changes made.');
        console.log('   To delete, run:  node scripts/cleanup-users.js --delete\n');
        return;
    }

    // Batch delete (Firestore batch limit = 500)
    console.log('\n🔥 Deleting...');
    const BATCH_SIZE = 400;
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = toDelete.slice(i, i + BATCH_SIZE);
        chunk.forEach(u => batch.delete(db.collection('users').doc(u.id)));
        await batch.commit();
        console.log(`   Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} docs`);
    }

    console.log(`\n✅ Done. Deleted ${toDelete.length} user(s) from kenyasales/users.`);
    console.log(`   ${toKeep.length} numbered user(s) remain.\n`);
}

main().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
