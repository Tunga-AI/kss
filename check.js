const admin = require('firebase-admin');
const PROJECT_ID = 'msommii';
const CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@msommii.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwGXzvuNXDZHQh\naZEH/Uj/opkWlYx5Xm+IitnhgPnsqmHHBi/PL4V2fSOQ3lK1B6zAadwsRA+t4/g3\nUlEvVBbJX/xMPnicAvtOGT9hv9t/NfQ8GC18i8G82yBuNXXL7NbbEtP/glPSw+sf\nOX0b9bUMiV39ju6QUWvJFSl5ibOVd6lWWxFXB9xmVeWn+keodw6rLQTWa1Rj95pW\nUMaC9ev/Y6V9ANcGoToNOamJ5U33eG//5b+GwT8dvvqR/fvyOunGWq7P9yfYW9id\n+kyAyRlJQBcv5GUUPx+vrMKNcR/fqYxIX7w+uz+RDqL3ce4+zIt59omsvUB3ivBb\nV2oRV68XAgMBAAECggEAAPjluDBwjwdxyVzFrgzHcjs0a4FViQwCQ0zk9A+cEaLv\n2ZiepfRbYR1CwizVZGYk8tutbq8iLlxuWpEr8pNycW0uvZWwtnJ2bxFznfdgX7JC\nusbgEBUjc4alhgY/NBTcK3x4oCtY3svcc0vZdXs5+IDqUcPlbErkH0mXH4fTmSp8\nHBnbnpNYil+UEQdRlueac6eOB2o/DDiaB70hw4Vqm1fwzTRkc8S6zvQDJ5RiEwS6\n1Pwi0pSl3Ur9AZr9kLoBt0plN5ZMOJtokKdnVpJDMWJeMqPELz/qOyZcTC07HxuY\neii+frTnTCbIWTS1qkkfoPfT1YMrbx96RbRKLwzYAQKBgQDph7676LJ++Mbnypsz\nYhf9oqGmA1Eljqv5bY1ZvMc6o8iba4zT0uOicGeRk4lvBiOvACdFAg8rbAQ7Cclv\nktbMw4Alir8vL3yOfH5tzXKY6f5zeDzj/tY80DUD2lg0vynr3+lBCaLmMyucXmlo\n3JamTM8QOLhBdtSKxelt7JI3FwKBgQDBCyAgxMq6qfdkQoIinujHRSZNgxO5SsED\n1l8TKoVj0dgEqLkAYE2EBtZ/jBaLSmE9uOXhqUVlN6utxyz/qSgiOZtToU1VDos1\nzgUh0EZHE/tNZV92da2lZEvqqBxc6fwWf+PM12wRZdk9FYN7mYuuoijpWk+O5D0i\nH7QbgVFIAQKBgDk84zvtUeqbES141Edo0JaDCPnGsFnzOSV+e3m2MmKmCCJH3xGA\nC/khcdEVh0bmC1L2R6m7UnqDFBpgULX/GJTBiiQpeKiZC/9kdhx1kZP3Lj2hB9Od\n/2aSZZwXJS1weVbt357oPLwNaK//1/gysN37z3ibXlX1SSzmS0t9A21rAoGAVFTd\n5jLSNZWGw7/iRemR22uz/eyjMzEa/OgrhJ3ww9iqO+7RUv6/Hhw2bGXwe001Cde6\nZUijTkJxt2rpl454P+tWlcRDmkLOQeUMjOcFrItoHzmH6KIkB7q3B34FVfnJ7LJV\n++ioBzmtG2hIljhPsyyYHskbNFs08bFT5ygpMAECgYEA6IfnweahRvu2GmRGQMK4\nxBaK0c9kyy1G+5+3w/j2f43oVTRlfKmIlo6Ck7OybUQs9XCbmmUWMuw+QITYHSRN\nztWA+RpIJxzgR7NWvWJ0PvyRCbSZwjMkDfhehwXMTgXzoovPvbTZN4kTEPnN6iLs\nIjj45fnXFhqmYPpD9tG0MWc=\n-----END PRIVATE KEY-----`;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: PRIVATE_KEY
        })
    });
}
const db = admin.firestore();

async function check() {
  const coursesSnap = await db.collection('learningCourses').get();
  console.log(`Global DB found ${coursesSnap.docs.length} courses!`);
  for (let d of coursesSnap.docs) {
      console.log(d.id, "title:", d.data().title, "| programTitle:", d.data().programTitle, "| cohortName:", d.data().cohortName);
  }
}
check();
