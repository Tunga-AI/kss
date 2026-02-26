import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:e5f52aa7d526a2fe88b9ae",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch programs
const programsSnap = await getDocs(collection(db, 'programs'));
console.log('\n=== PROGRAMS ===');
programsSnap.docs.forEach(d => {
  const data = d.data();
  console.log('ID:', d.id, '| Name:', data.programName, '| Type:', data.programType, '| Status:', data.status);
});

// Fetch cohorts
const cohortsSnap = await getDocs(collection(db, 'cohorts'));
console.log('\n=== COHORTS ===');
cohortsSnap.docs.forEach(d => {
  const data = d.data();
  console.log('ID:', d.id, '| Name:', data.name, '| Status:', data.status, '| Programs:', data.programIds);
});

// Fetch counters
console.log('\n=== COUNTERS ===');
for (const name of ['cohorts', 'users', 'learners']) {
  const snap = await getDoc(doc(db, 'counters', name));
  console.log(name + ':', snap.exists() ? snap.data().count : 'not found');
}

process.exit(0);
