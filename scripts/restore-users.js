#!/usr/bin/env node
/**
 * Restore L1-L63 users + add U5 (Victor Mutua, Admin)
 * Usage:  node scripts/restore-users.js
 */

const admin = require('firebase-admin');

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
db.settings({ databaseId: 'kenyasales' });

const NOW = admin.firestore.FieldValue.serverTimestamp();

// ── L1–L63 data captured from dry-run output ─────────────────────────────────
const L_USERS = [
    { id: 'L1', name: 'Victor Mutunga', email: 'victor@tunga.co', role: 'Learner' },
    { id: 'L2', name: 'Cyprian Esogol', email: 'victor@wontage.co', role: 'Learner' },
    { id: 'L6', name: 'Alex Mahugu', email: 'alex.mahugu@kss.or.ke', role: 'Learner' },
    { id: 'L7', name: 'Grace Aoko', email: 'graceaoko100@gmail.com', role: 'Learner' },
    { id: 'L8', name: 'Victor Mutunga', email: 'annamoit@yahoo.com', role: 'Learner' },
    { id: 'L9', name: 'Victor Mutunga', email: 'amoit@tunga.co', role: 'Learner' },
    { id: 'L10', name: 'Victor Mutua Mutunga', email: 'Victor@gozuka.com', role: 'Learner' },
    { id: 'L11', name: 'Alex Mahugu', email: 'alex.mahugu@yusudi.co', role: 'Learner' },
    { id: 'L12', name: 'Cathrine M. Cephas', email: 'cathrine.cephas@gmail.com', role: 'Learner' },
    { id: 'L13', name: 'Fred Ngolo', email: 'fredtooty@gmail.com', role: 'Learner' },
    { id: 'L14', name: 'Andrew Wachira', email: 'andrew.wachira@bicworld.com', role: 'Learner' },
    { id: 'L15', name: 'Sally Kimeu', email: 'sallykimeu@gmail.com', role: 'Learner' },
    { id: 'L16', name: 'Carolyne Kendi', email: 'kendi29@gmail.com', role: 'Learner' },
    { id: 'L17', name: 'Steve Abeka', email: 'steve@steveabeka.com', role: 'Learner' },
    { id: 'L18', name: 'Patrick Ngaruiya', email: 'patrickngaruiyak@gmail.com', role: 'Learner' },
    { id: 'L19', name: 'Martin Macharia', email: 'martinmacharia18@gmail.com', role: 'Learner' },
    { id: 'L20', name: 'Luizer Makena Njagi', email: 'luizer.maksi@gmail.com', role: 'Learner' },
    { id: 'L21', name: 'Esther Njoroge', email: 'esther.m.njoroge@gmail.com', role: 'Learner' },
    { id: 'L22', name: 'Isaiah Osano', email: 'iosanoe@gmail.com', role: 'Learner' },
    { id: 'L23', name: "Eunice Ong'ele", email: 'eongele@gmail.com', role: 'Learner' },
    { id: 'L24', name: 'George Were', email: 'wereogeorge@gmail.com', role: 'Learner' },
    { id: 'L25', name: 'Monica Ngogoyo', email: 'monaikka@yahoo.com', role: 'Learner' },
    { id: "L26", name: "Collins Wachira King'ori", email: 'kingoricollins9@gmail.com', role: 'Learner' },
    { id: 'L27', name: 'Wangechi Njoroge', email: 'wangechinjoroge.j@gmail.com', role: 'Learner' },
    { id: 'L28', name: 'Diana Mwikali', email: 'mwikaly@gmail.com', role: 'Learner' },
    { id: 'L29', name: 'Ruth Oloo', email: 'ruth@closingco.org', role: 'Learner' },
    { id: 'L30', name: 'Cecilia Kimani', email: 'kimani.cecilia.m@gmail.com', role: 'Learner' },
    { id: 'L31', name: 'Joe Muhuriri', email: 'joekinyua888@gmail.com', role: 'Learner' },
    { id: 'L32', name: 'Enid Muchiri', email: 'enymuchiri@gmail.com', role: 'Learner' },
    { id: 'L33', name: 'Grace Makena', email: 'gmiriti11@gmail.com', role: 'Learner' },
    { id: 'L34', name: 'Faith Karani', email: 'fkarani@tradedepot.co', role: 'Learner' },
    { id: 'L35', name: 'Peter Miringu', email: 'pkimani.kimani@gmail.com', role: 'Learner' },
    { id: 'L36', name: 'Caroline Yamina', email: 'carolinechanzu@gmail.com', role: 'Learner' },
    { id: 'L37', name: 'Terrence Odhiambo', email: 'odhiambo_terrence@yahoo.com', role: 'Learner' },
    { id: 'L38', name: 'Karen Mwarari', email: 'karenmwarari@gmail.com', role: 'Learner' },
    { id: 'L39', name: 'Salim Kumala', email: 'salimkumala@gmail.com', role: 'Learner' },
    { id: 'L40', name: 'Ronnie Tumusabe', email: 'ronnietumusabe@gmail.com', role: 'Learner' },
    { id: 'L41', name: 'Bernard Gitonga', email: 'berngitonga@gmail.com', role: 'Learner' },
    { id: 'L42', name: 'Ronald Ayieta', email: 'roayieta@gmail.com', role: 'Learner' },
    { id: 'L43', name: 'Dr. Katurebe Michel', email: 'drkaturebemichael1975@gmail.com', role: 'Learner' },
    { id: 'L44', name: 'Jullie Luseno', email: 'jullieluse@gmail.com', role: 'Learner' },
    { id: 'L45', name: 'Elizabeth Kinyanjui', email: 'cyrabmaking@yahoo.com', role: 'Learner' },
    { id: 'L46', name: 'Benjamin Mando', email: 'benmando@yahoo.com', role: 'Learner' },
    { id: 'L47', name: 'Gumato Golo', email: 'gumatoisaac@gmail.com', role: 'Learner' },
    { id: 'L48', name: 'James Mwaniki', email: 'james.mwaniki@kubtech.co.ke', role: 'Learner' },
    { id: 'L49', name: 'Moses Angima', email: 'moses.angima@kubtech.co.ke', role: 'Learner' },
    { id: 'L50', name: 'Brenda Miller', email: 'brenda.miller@kubtech.co.ke', role: 'Learner' },
    { id: 'L51', name: 'Denis Machuma', email: 'denis.machuma@kubtech.co.ke', role: 'Learner' },
    { id: 'L52', name: 'Emmanuel Mutonyi Maruti', email: 'emmanuel.maruti@gmail.com', role: 'Learner' },
    { id: 'L53', name: 'Daniel Alex Gatero', email: 'gatero88@gmail.com', role: 'Learner' },
    { id: 'L54', name: 'Barbara Agalomba', email: 'agalomba152@gmail.com', role: 'Learner' },
    { id: 'L55', name: 'Diana Oginga', email: 'dnoginga@gmail.com', role: 'Learner' },
    { id: 'L56', name: 'Joseph Munuhe', email: 'jmunuhe@gmail.com', role: 'Learner' },
    { id: 'L57', name: 'Samuel Kahiga', email: 'skahiga7@gmail.com', role: 'Learner' },
    { id: 'L58', name: 'Dina Ayiela', email: 'ayeladina@gmail.com', role: 'Learner' },
    { id: 'L59', name: 'Sally Njoki', email: 'sllmjoki2@gmail.com', role: 'Learner' },
    { id: 'L60', name: 'Kokole Ismail', email: 'kokoleismail886@gmail.com', role: 'Learner' },
    { id: 'L61', name: 'Beth Lucy', email: 'bethlucylydia29@gmail.com', role: 'Learner' },
    { id: 'L62', name: 'Evans', email: 'info@magiccolours.co.ke', role: 'Learner' },
    { id: 'L63', name: 'Belma', email: 'bebobelma@gmail.com', role: 'Learner' },
];

// ── U5 — new Admin user ───────────────────────────────────────────────────────
const U5 = {
    id: 'U5',
    name: 'Victor Mutua',
    email: 'victor@tunga.co',
    role: 'Admin',
    status: 'Active',
};

async function main() {
    console.log('\n🔄 Restoring L1–L63 + adding U5 to kenyasales/users\n');

    const allDocs = [
        ...L_USERS.map(u => ({ ...u, status: 'Active' })),
        U5,
    ];

    const BATCH_SIZE = 400;
    let written = 0;

    for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = allDocs.slice(i, i + BATCH_SIZE);
        chunk.forEach(u => {
            const { id, ...data } = u;
            batch.set(db.collection('users').doc(id), { ...data, createdAt: NOW }, { merge: true });
        });
        await batch.commit();
        written += chunk.length;
        console.log(`   Wrote batch: ${chunk.length} docs`);
    }

    console.log(`\n✅ Done. ${written} user(s) written to kenyasales/users.`);
    console.log(`   L1–L63  : ${L_USERS.length} learners restored`);
    console.log(`   U5      : Victor Mutua <victor@tunga.co>  role=Admin\n`);
}

main().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
