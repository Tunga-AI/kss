import { FirestoreService } from '../services/firestore';

/**
 * Quick admin utility functions for managing user roles
 * Use these in browser console for quick fixes
 */

export class AdminUtils {
  /**
   * Update a user's role by email
   * Usage: AdminUtils.updateUserRole('user@email.com', 'admin')
   */
  static async updateUserRole(email: string, newRole: 'admin' | 'staff' | 'learner' | 'applicant') {
    try {
      console.log(`🔧 [AdminUtils] Looking for user with email: ${email}`);
      
      // Find user by email
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: email }
      ]);
      
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        const user = userResult.data[0];
        console.log(`📝 [AdminUtils] Found user:`, user);
        
        // Update role
        const updateResult = await FirestoreService.update('users', user.id, {
          role: newRole,
          updatedAt: new Date().toISOString()
        });
        
        if (updateResult.success) {
          console.log(`✅ [AdminUtils] Successfully updated ${email} role to ${newRole}`);
          return { success: true, message: `Role updated to ${newRole}` };
        } else {
          console.error(`❌ [AdminUtils] Failed to update role:`, updateResult.error);
          return { success: false, error: updateResult.error };
        }
      } else {
        console.error(`❌ [AdminUtils] User not found with email: ${email}`);
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error(`❌ [AdminUtils] Error updating user role:`, error);
      return { success: false, error: error };
    }
  }

  /**
   * List all users and their roles
   * Usage: AdminUtils.listUsers()
   */
  static async listUsers() {
    try {
      console.log(`🔍 [AdminUtils] Fetching all users...`);
      
      const result = await FirestoreService.getAll('users');
      
      if (result.success && result.data) {
        console.log(`📋 [AdminUtils] Found ${result.data.length} users:`);
        result.data.forEach((user: any) => {
          console.log(`  • ${user.email} - ${user.role} (${user.displayName || 'No name'})`);
        });
        return result.data;
      } else {
        console.error(`❌ [AdminUtils] Failed to fetch users:`, result.error);
        return [];
      }
    } catch (error) {
      console.error(`❌ [AdminUtils] Error fetching users:`, error);
      return [];
    }
  }

  /**
   * Check current user's permissions
   * Usage: AdminUtils.checkPermissions()
   */
  static async checkPermissions() {
    try {
      // Test applicants collection access
      console.log(`🔍 [AdminUtils] Testing applicants collection access...`);
      
      const applicantsResult = await FirestoreService.getAll('applicants');
      
      if (applicantsResult.success) {
        console.log(`✅ [AdminUtils] Can access applicants collection - ${applicantsResult.data?.length || 0} records`);
      } else {
        console.error(`❌ [AdminUtils] Cannot access applicants collection:`, applicantsResult.error);
      }
      
      // Test other collections
      const collections = ['users', 'staff', 'learners', 'programs'];
      for (const collection of collections) {
        try {
          const result = await FirestoreService.getAll(collection);
          console.log(`${result.success ? '✅' : '❌'} [AdminUtils] ${collection}: ${result.success ? `${result.data?.length || 0} records` : result.error}`);
        } catch (error) {
          console.error(`❌ [AdminUtils] ${collection}: ${error}`);
        }
      }
      
      return applicantsResult;
    } catch (error) {
      console.error(`❌ [AdminUtils] Error checking permissions:`, error);
      return { success: false, error };
    }
  }
}

// Make it available globally for browser console usage
if (typeof window !== 'undefined') {
  (window as any).AdminUtils = AdminUtils;
} 