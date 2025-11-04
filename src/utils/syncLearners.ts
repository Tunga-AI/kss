import { FirestoreService } from '../services/firestore';

export interface SyncResult {
  success: boolean;
  summary?: {
    totalLearners: number;
    contactsAdded: number;
    contactsSkipped: number;
    usersAdded: number;
    usersSkipped: number;
    errors: number;
  };
  error?: string;
}

export const syncLearnersToCollections = async (): Promise<SyncResult> => {
  console.log('🔄 Starting learners sync to contacts and users collections...');
  
  try {
    // Get all learners
    console.log('📚 Fetching all learners...');
    const learnersResult = await FirestoreService.getAll('learners');
    
    if (!learnersResult.success || !learnersResult.data) {
      console.error('❌ Failed to fetch learners:', learnersResult.error);
      return {
        success: false,
        error: 'Failed to fetch learners'
      };
    }
    
    const learners = learnersResult.data;
    console.log(`📋 Found ${learners.length} learners to sync`);
    
    // Get existing contacts and users to avoid duplicates
    console.log('👥 Fetching existing contacts...');
    const contactsResult = await FirestoreService.getAll('contacts');
    const existingContacts = contactsResult.success ? contactsResult.data : [];
    const existingContactEmails = new Set(existingContacts.map((c: any) => c.email?.toLowerCase()));
    
    console.log('👤 Fetching existing users...');
    const usersResult = await FirestoreService.getAll('users');
    const existingUsers = usersResult.success ? usersResult.data : [];
    const existingUserEmails = new Set(existingUsers.map((u: any) => u.email?.toLowerCase()));
    
    // Get program names for reference
    console.log('🎓 Fetching programs...');
    const programsResult = await FirestoreService.getAll('programs');
    const programs = programsResult.success ? programsResult.data : [];
    const programMap: Record<string, string> = {};
    programs.forEach((p: any) => programMap[p.id] = p.programName);
    
    let contactsAdded = 0;
    let usersAdded = 0;
    let contactsSkipped = 0;
    let usersSkipped = 0;
    let errors = 0;
    
    console.log('🚀 Starting sync process...');
    
    for (const learner of learners as any[]) {
      try {
        const email = learner.email?.toLowerCase();
        const now = new Date().toISOString();
        
        // Sync to contacts collection
        if (email && !existingContactEmails.has(email)) {
          const contactData = {
            firstName: learner.firstName || '',
            lastName: learner.lastName || '',
            email: learner.email,
            phoneNumber: learner.phoneNumber || '',
            type: 'learner',
            source: 'learners_sync',
            tags: ['learner', 'student'],
            notes: `Synced from learners collection. Student ID: ${learner.studentId}. Program: ${programMap[learner.programId] || 'Unknown'}`,
            createdAt: now,
            updatedAt: now,
            // Additional learner-specific fields
            studentId: learner.studentId,
            programId: learner.programId,
            programName: programMap[learner.programId],
            academicStatus: learner.academicStatus,
            enrollmentDate: learner.enrollmentDate
          };
          
          const contactResult = await FirestoreService.create('contacts', contactData);
          if (contactResult.success) {
            contactsAdded++;
            existingContactEmails.add(email); // Prevent duplicate attempts in same run
          } else {
            console.error(`❌ Failed to create contact for ${learner.email}:`, contactResult.error);
            errors++;
          }
        } else {
          contactsSkipped++;
        }
        
        // Sync to users collection (not Firebase Auth)
        if (email && !existingUserEmails.has(email)) {
          const userData = {
            firstName: learner.firstName || '',
            lastName: learner.lastName || '',
            email: learner.email,
            phoneNumber: learner.phoneNumber || '',
            role: 'learner',
            status: 'active',
            source: 'learners_sync',
            createdAt: now,
            updatedAt: now,
            // Profile information
            profile: {
              studentId: learner.studentId,
              programId: learner.programId,
              programName: programMap[learner.programId],
              academicStatus: learner.academicStatus,
              enrollmentDate: learner.enrollmentDate,
              fullName: `${learner.firstName || ''} ${learner.lastName || ''}`.trim()
            },
            // Permissions (basic learner permissions)
            permissions: {
              canViewProfile: true,
              canEditProfile: false,
              canViewGrades: true,
              canViewSchedule: true,
              canAccessPortal: true
            }
          };
          
          const userResult = await FirestoreService.create('users', userData);
          if (userResult.success) {
            usersAdded++;
            existingUserEmails.add(email); // Prevent duplicate attempts in same run
          } else {
            console.error(`❌ Failed to create user for ${learner.email}:`, userResult.error);
            errors++;
          }
        } else {
          usersSkipped++;
        }
        
        // Log progress every 10 items
        if ((contactsAdded + usersAdded + contactsSkipped + usersSkipped) % 10 === 0) {
          console.log(`📊 Progress: ${contactsAdded + usersAdded + contactsSkipped + usersSkipped}/${learners.length} processed`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing learner ${learner.email}:`, error);
        errors++;
      }
    }
    
    // Summary
    console.log('\n✅ Sync completed!');
    console.log('📊 Summary:');
    console.log(`   👥 Contacts added: ${contactsAdded}`);
    console.log(`   👥 Contacts skipped (already exist): ${contactsSkipped}`);
    console.log(`   👤 Users added: ${usersAdded}`);
    console.log(`   👤 Users skipped (already exist): ${usersSkipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📚 Total learners processed: ${learners.length}`);
    
    return {
      success: true,
      summary: {
        totalLearners: learners.length,
        contactsAdded,
        contactsSkipped,
        usersAdded,
        usersSkipped,
        errors
      }
    };
    
  } catch (error) {
    console.error('❌ Critical error during sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};