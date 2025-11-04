// Fix Duplicate Users Script
// Run this to identify and merge duplicate user records in Firestore

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Firebase config (copy from your firebase config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findDuplicateUsers() {
  console.log('🔍 Scanning for duplicate users...');

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];

    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📊 Total users found: ${users.length}`);

    // Group by email (case-insensitive)
    const emailGroups = {};
    users.forEach(user => {
      const email = user.email?.toLowerCase().trim();
      if (email) {
        if (!emailGroups[email]) emailGroups[email] = [];
        emailGroups[email].push(user);
      }
    });

    // Find duplicates
    const duplicateEmails = Object.keys(emailGroups).filter(email => emailGroups[email].length > 1);

    console.log(`⚠️  Found ${duplicateEmails.length} emails with duplicate records:`);

    duplicateEmails.forEach(email => {
      const dupes = emailGroups[email];
      console.log(`\n📧 ${email}:`);
      dupes.forEach(user => {
        console.log(`  - ID: ${user.id}, Role: ${user.role}, Created: ${user.createdAt}, HasAuth: ${user.hasFirebaseAuth}`);
      });
    });

    return { duplicateEmails, emailGroups, totalUsers: users.length };
  } catch (error) {
    console.error('❌ Error scanning users:', error);
    return null;
  }
}

async function mergeDuplicateUser(email, users) {
  console.log(`\n🔄 Merging duplicates for: ${email}`);

  try {
    // Determine primary user (prefer Firebase Auth user, then most recent)
    const primaryUser = users.reduce((primary, current) => {
      // Prefer user with Firebase Auth
      if (current.hasFirebaseAuth && !primary.hasFirebaseAuth) return current;
      if (!current.hasFirebaseAuth && primary.hasFirebaseAuth) return primary;

      // If both or neither have auth, prefer most recent
      const currentDate = current.createdAt ? new Date(current.createdAt) : new Date(0);
      const primaryDate = primary.createdAt ? new Date(primary.createdAt) : new Date(0);
      return currentDate > primaryDate ? current : primary;
    });

    const duplicates = users.filter(user => user.id !== primaryUser.id);

    console.log(`👑 Primary user: ${primaryUser.id} (${primaryUser.role})`);
    console.log(`🗑️  Will remove ${duplicates.length} duplicates: ${duplicates.map(d => d.id).join(', ')}`);

    // Merge data (keep most complete information)
    const mergedData = {
      displayName: primaryUser.displayName || duplicates[0]?.displayName || '',
      firstName: primaryUser.firstName || duplicates[0]?.firstName || '',
      lastName: primaryUser.lastName || duplicates[0]?.lastName || '',
      phoneNumber: primaryUser.phoneNumber || duplicates[0]?.phoneNumber || '',
      organization: primaryUser.organization || duplicates[0]?.organization || 'Kenya School of Sales',
      position: primaryUser.position || duplicates[0]?.position || '',
      bio: primaryUser.bio || duplicates[0]?.bio || '',
      // Keep most privileged role
      role: users.reduce((prevRole, user) => {
        const rolePriority = { admin: 5, staff: 4, instructor: 3, learner: 2, applicant: 1 };
        return (rolePriority[user.role] || 0) > (rolePriority[prevRole] || 0) ? user.role : prevRole;
      }, primaryUser.role),
      updatedAt: new Date().toISOString(),
      updatedBy: 'system-duplicate-fix'
    };

    // Update primary user
    await updateDoc(doc(db, 'users', primaryUser.id), mergedData);
    console.log(`✅ Updated primary user ${primaryUser.id}`);

    // Delete duplicates
    for (const duplicate of duplicates) {
      await deleteDoc(doc(db, 'users', duplicate.id));
      console.log(`🗑️  Deleted duplicate ${duplicate.id}`);
    }

    return { success: true, primaryId: primaryUser.id, removedCount: duplicates.length };
  } catch (error) {
    console.error(`❌ Error merging ${email}:`, error);
    return { success: false, error: error.message };
  }
}

async function fixAllDuplicates() {
  console.log('🚀 Starting duplicate user fix process...\n');

  const scanResult = await findDuplicateUsers();
  if (!scanResult) {
    console.log('❌ Failed to scan users. Exiting.');
    return;
  }

  const { duplicateEmails, emailGroups, totalUsers } = scanResult;

  if (duplicateEmails.length === 0) {
    console.log('✅ No duplicate users found! Your database is clean.');
    return;
  }

  console.log(`\n🔧 Starting merge process for ${duplicateEmails.length} duplicate emails...`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const email of duplicateEmails) {
    const result = await mergeDuplicateUser(email, emailGroups[email]);
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      errors.push(`${email}: ${result.error}`);
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 SUMMARY:');
  console.log(`📧 Total users before: ${totalUsers}`);
  console.log(`✅ Successfully merged: ${successCount} emails`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`🎯 Estimated users after cleanup: ${totalUsers - successCount * 1}`); // Rough estimate

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n✅ Duplicate fix process completed!');
  console.log('\n💡 Recommendations:');
  console.log('1. Run this script again to verify no duplicates remain');
  console.log('2. Update your app to use the new UserService for all user creation');
  console.log('3. Test user login/signup flows to ensure they work correctly');
}

// Run the fix
fixAllDuplicates()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });