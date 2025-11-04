// Script to convert all approved/admitted applicants to learners
// Run this with: node convert-approved-applicants.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:facd538c2cbada7b88b9ae",
  measurementId: "G-S60Y2Q9EXF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate student ID
async function generateStudentId() {
  try {
    const learnersSnapshot = await getDocs(collection(db, 'learners'));
    const count = learnersSnapshot.size + 1;
    return `LN${count.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating student ID:', error);
    return `LN${Math.floor(Math.random() * 999) + 1}`.padStart(5, 'LN00');
  }
}

async function convertApprovedApplicants() {
  try {
    console.log('🔍 Finding approved/admitted applicants...');
    
    // Get all applicants with status 'approved' or 'admitted'
    const applicantsQuery = query(
      collection(db, 'applicants'),
      where('status', 'in', ['approved', 'admitted'])
    );
    
    const applicantsSnapshot = await getDocs(applicantsQuery);
    const approvedApplicants = applicantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 Found ${approvedApplicants.length} approved/admitted applicants`);
    
    if (approvedApplicants.length === 0) {
      console.log('✅ No approved applicants found to convert');
      return;
    }
    
    // Check existing learners to avoid duplicates
    const learnersSnapshot = await getDocs(collection(db, 'learners'));
    const existingLearnerEmails = learnersSnapshot.docs.map(doc => doc.data().email);
    
    console.log(`📋 Found ${existingLearnerEmails.length} existing learners`);
    console.log('📧 Existing learner emails:', existingLearnerEmails);
    
    let conversionsCount = 0;
    let skippedCount = 0;
    
    for (const applicant of approvedApplicants) {
      console.log(`\n🔄 Processing applicant: ${applicant.firstName} ${applicant.lastName} (${applicant.email})`);
      
      // Check if learner already exists
      if (existingLearnerEmails.includes(applicant.email)) {
        console.log(`⏭️  Skipping - learner already exists for ${applicant.email}`);
        skippedCount++;
        continue;
      }
      
      // Generate student ID
      const studentId = await generateStudentId();
      
      // Create learner data
      const learnerData = {
        studentId,
        firstName: applicant.firstName || '',
        lastName: applicant.lastName || '',
        email: applicant.email,
        phoneNumber: applicant.phoneNumber || '',
        programId: applicant.programId || '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        academicStatus: 'active',
        intakeId: applicant.intake || '',
        totalFees: applicant.expectedAmount || 0,
        amountPaid: applicant.amountPaid || 0,
        outstandingBalance: Math.max(0, (applicant.expectedAmount || 0) - (applicant.amountPaid || 0)),
        role: 'learner',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      try {
        // Create learner record
        const docRef = await addDoc(collection(db, 'learners'), learnerData);
        console.log(`✅ Created learner: ${studentId} (${applicant.email}) - Document ID: ${docRef.id}`);
        conversionsCount++;
      } catch (error) {
        console.error(`❌ Failed to create learner for ${applicant.email}:`, error.message);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Approved applicants found: ${approvedApplicants.length}`);
    console.log(`   • Successfully converted: ${conversionsCount}`);
    console.log(`   • Skipped (already learners): ${skippedCount}`);
    console.log(`   • Failed conversions: ${approvedApplicants.length - conversionsCount - skippedCount}`);
    
    if (conversionsCount > 0) {
      console.log(`\n🎉 Successfully converted ${conversionsCount} applicants to learners!`);
    }
    
  } catch (error) {
    console.error('❌ Error in conversion process:', error);
  }
}

// Run the conversion
convertApprovedApplicants()
  .then(() => {
    console.log('\n✅ Conversion process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Conversion process failed:', error);
    process.exit(1);
  });