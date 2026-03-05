const admin = require('firebase-admin');

const privateKey = `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`;

const app = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: 'msommii',
        clientEmail: 'firebase-adminsdk-fbsvc@msommii.iam.gserviceaccount.com',
        privateKey,
    }),
});

async function run() {
    const dbDefault = admin.firestore(app);

    const { getFirestore } = require('firebase-admin/firestore');
    const dbKenya = getFirestore(app, 'kenyasales');

    console.log("Searching in default database:");
    let snap = await dbDefault.collection('customers').where('name', '==', 'JAMLICK MBAUNI').get();
    if (!snap.empty) {
        console.log('Found JAMLICK MBAUNI in default database > customers collection.');
        console.dir(snap.docs[0].data(), { depth: null });
    } else {
        console.log('Not found in default database > customers');
    }

    console.log("Searching in kenyasales database:");
    let snapKenya = await dbKenya.collection('customers').where('name', '==', 'JAMLICK MBAUNI').get();
    if (!snapKenya.empty) {
        console.log('Found JAMLICK MBAUNI in kenyasales database > customers collection.');
        console.dir(snapKenya.docs[0].data(), { depth: null });
    } else {
        console.log('Not found in kenyasales database > customers');
    }

}

run().catch(console.error).then(() => process.exit(0));
