import { FirestoreService } from './firestore';
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'staff' | 'learner' | 'applicant' | 'instructor' | 'finance';
  organization?: string;
  phoneNumber?: string;
  position?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'suspended';
  isEmailVerified: boolean;
  hasFirebaseAuth: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  firebaseAuthCreatedAt?: string;
}

export interface CreateUserOptions {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserProfile['role'];
  organization?: string;
  phoneNumber?: string;
  position?: string;
  bio?: string;
  createFirebaseAuth?: boolean;
  createdBy: string;
}

export interface UpdateUserOptions {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: UserProfile['role'];
  organization?: string;
  phoneNumber?: string;
  position?: string;
  bio?: string;
  status?: 'active' | 'inactive' | 'suspended';
  isEmailVerified?: boolean;
  hasFirebaseAuth?: boolean;
  isActive?: boolean;
  updatedBy: string;
}

export class UserService {
  /**
   * Centralized method to find a user by email (case-insensitive)
   */
  static async findUserByEmail(email: string): Promise<{ success: boolean; user?: UserProfile; id?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const result = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: normalizedEmail }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        const userData = result.data[0] as UserProfile;
        return {
          success: true,
          user: userData,
          id: userData.uid || (result.data[0] as any).id
        };
      }

      return { success: true, user: undefined };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return { success: false };
    }
  }

  /**
   * Centralized method to create or update a user record
   * This is the SINGLE source of truth for user creation
   */
  static async createOrUpdateUser(options: CreateUserOptions): Promise<{
    success: boolean;
    userId?: string;
    user?: UserProfile;
    isNewUser: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const normalizedEmail = options.email.toLowerCase().trim();
      console.log('🔍 UserService: Creating/updating user for:', normalizedEmail);

      // STEP 1: Check for existing user
      const existingResult = await this.findUserByEmail(normalizedEmail);

      if (!existingResult.success) {
        return { success: false, isNewUser: false, error: 'Failed to check for existing user' };
      }

      const now = new Date().toISOString();

      // STEP 2: Prepare user data
      const userData: Partial<UserProfile> = {
        email: normalizedEmail,
        displayName: options.displayName,
        firstName: options.firstName || options.displayName.split(' ')[0] || '',
        lastName: options.lastName || options.displayName.split(' ').slice(1).join(' ') || '',
        role: options.role,
        organization: options.organization || 'Kenya School of Sales',
        phoneNumber: options.phoneNumber || '',
        position: options.position || '',
        bio: options.bio || '',
        status: 'active',
        isEmailVerified: false,
        hasFirebaseAuth: false,
        isActive: true,
        updatedAt: now,
        updatedBy: options.createdBy
      };

      if (existingResult.user) {
        // STEP 3A: Update existing user
        console.log('📝 UserService: Updating existing user:', existingResult.id);

        // Preserve creation data and Firebase auth status
        const updateData = {
          ...userData,
          // Preserve critical fields
          uid: existingResult.user.uid,
          createdAt: existingResult.user.createdAt,
          createdBy: existingResult.user.createdBy,
          hasFirebaseAuth: existingResult.user.hasFirebaseAuth,
          firebaseAuthCreatedAt: existingResult.user.firebaseAuthCreatedAt,
          isEmailVerified: existingResult.user.isEmailVerified
        };

        const result = await FirestoreService.update('users', existingResult.id!, updateData);

        if (result.success) {
          return {
            success: true,
            userId: existingResult.id!,
            user: { ...existingResult.user, ...updateData } as UserProfile,
            isNewUser: false,
            message: `${options.displayName} already exists. Their information has been updated.`
          };
        } else {
          return { success: false, isNewUser: false, error: 'Failed to update existing user' };
        }
      } else {
        // STEP 3B: Create new user
        console.log('🆕 UserService: Creating new user');

        const newUserData: UserProfile = {
          ...userData,
          uid: '', // Will be set after creation
          createdAt: now,
          createdBy: options.createdBy
        } as UserProfile;

        // Create Firebase Auth if requested
        if (options.createFirebaseAuth) {
          try {
            const tempPassword = Math.random().toString(36).slice(-8) + 'Temp!';
            const authResult = await createUserWithEmailAndPassword(auth, normalizedEmail, tempPassword);

            await updateProfile(authResult.user, { displayName: options.displayName });

            newUserData.uid = authResult.user.uid;
            newUserData.hasFirebaseAuth = true;
            newUserData.firebaseAuthCreatedAt = now;

            console.log('✅ UserService: Firebase Auth user created:', authResult.user.uid);
          } catch (authError: any) {
            console.error('❌ UserService: Firebase Auth creation failed:', authError);
            return {
              success: false,
              isNewUser: false,
              error: `Failed to create Firebase Auth: ${authError.message}`
            };
          }
        }

        // Create Firestore document
        const result = await FirestoreService.create('users', newUserData);

        if (result.success) {
          const finalUser = { ...newUserData, uid: newUserData.uid || result.id };

          // Update the document with the correct UID if needed
          if (!newUserData.uid) {
            await FirestoreService.update('users', result.id, { uid: result.id });
            finalUser.uid = result.id;
          }

          return {
            success: true,
            userId: result.id,
            user: finalUser,
            isNewUser: true,
            message: `${options.displayName} has been created successfully!`
          };
        } else {
          return { success: false, isNewUser: false, error: 'Failed to create user document' };
        }
      }
    } catch (error: any) {
      console.error('❌ UserService: Error in createOrUpdateUser:', error);
      return {
        success: false,
        isNewUser: false,
        error: `User creation/update failed: ${error.message}`
      };
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(userId: string, options: UpdateUserOptions): Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string;
  }> {
    try {
      const updateData = {
        ...options,
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update('users', userId, updateData);

      if (result.success) {
        // Get updated user data
        const getUserResult = await FirestoreService.getById('users', userId);
        return {
          success: true,
          user: getUserResult.data as UserProfile
        };
      } else {
        return { success: false, error: 'Failed to update user' };
      }
    } catch (error: any) {
      console.error('❌ UserService: Error updating user:', error);
      return { success: false, error: `Update failed: ${error.message}` };
    }
  }

  /**
   * Find and merge duplicate users by email
   */
  static async findAndMergeDuplicates(email: string): Promise<{
    success: boolean;
    merged: boolean;
    primaryUserId?: string;
    duplicatesRemoved?: number;
    error?: string;
  }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Find all users with this email (case-insensitive)
      const result = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: normalizedEmail }
      ]);

      if (!result.success || !result.data || result.data.length <= 1) {
        return { success: true, merged: false, duplicatesRemoved: 0 };
      }

      const users = result.data as any[];
      console.log(`🔍 UserService: Found ${users.length} duplicate users for ${normalizedEmail}`);

      // Determine primary user (prefer one with Firebase Auth, then most recent)
      const primaryUser = users.reduce((primary, current) => {
        if (current.hasFirebaseAuth && !primary.hasFirebaseAuth) return current;
        if (!current.hasFirebaseAuth && primary.hasFirebaseAuth) return primary;
        return new Date(current.createdAt) > new Date(primary.createdAt) ? current : primary;
      });

      const duplicates = users.filter(user => user.id !== primaryUser.id);

      console.log(`👑 UserService: Primary user: ${primaryUser.id}, Duplicates: ${duplicates.length}`);

      // Merge data into primary user (keep most complete information)
      const mergedData: Partial<UserProfile> = {
        displayName: primaryUser.displayName || duplicates[0]?.displayName,
        firstName: primaryUser.firstName || duplicates[0]?.firstName,
        lastName: primaryUser.lastName || duplicates[0]?.lastName,
        phoneNumber: primaryUser.phoneNumber || duplicates[0]?.phoneNumber,
        organization: primaryUser.organization || duplicates[0]?.organization,
        position: primaryUser.position || duplicates[0]?.position,
        bio: primaryUser.bio || duplicates[0]?.bio,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system-merge'
      };

      // Update primary user with merged data
      await FirestoreService.update('users', primaryUser.id, mergedData);

      // Delete duplicate users
      for (const duplicate of duplicates) {
        await FirestoreService.delete('users', duplicate.id);
        console.log(`🗑️ UserService: Removed duplicate user: ${duplicate.id}`);
      }

      return {
        success: true,
        merged: true,
        primaryUserId: primaryUser.id,
        duplicatesRemoved: duplicates.length
      };
    } catch (error: any) {
      console.error('❌ UserService: Error merging duplicates:', error);
      return { success: false, merged: false, error: error.message };
    }
  }

  /**
   * Audit all users and fix duplicates
   */
  static async auditAndFixDuplicates(): Promise<{
    success: boolean;
    totalUsers: number;
    duplicateEmails: string[];
    merged: number;
    errors: string[];
  }> {
    try {
      // Get all users
      const result = await FirestoreService.getAll('users');

      if (!result.success || !result.data) {
        return {
          success: false,
          totalUsers: 0,
          duplicateEmails: [],
          merged: 0,
          errors: ['Failed to fetch users']
        };
      }

      const users = result.data as any[];
      const emailGroups: { [email: string]: any[] } = {};

      // Group users by email
      users.forEach(user => {
        const email = user.email?.toLowerCase().trim();
        if (email) {
          if (!emailGroups[email]) emailGroups[email] = [];
          emailGroups[email].push(user);
        }
      });

      // Find emails with duplicates
      const duplicateEmails = Object.keys(emailGroups).filter(email => emailGroups[email].length > 1);

      console.log(`🔍 UserService: Found ${duplicateEmails.length} emails with duplicates out of ${users.length} total users`);

      let merged = 0;
      const errors: string[] = [];

      // Fix each duplicate email
      for (const email of duplicateEmails) {
        try {
          const mergeResult = await this.findAndMergeDuplicates(email);
          if (mergeResult.success && mergeResult.merged) {
            merged++;
          } else if (mergeResult.error) {
            errors.push(`${email}: ${mergeResult.error}`);
          }
        } catch (error: any) {
          errors.push(`${email}: ${error.message}`);
        }
      }

      return {
        success: true,
        totalUsers: users.length,
        duplicateEmails,
        merged,
        errors
      };
    } catch (error: any) {
      console.error('❌ UserService: Error in audit:', error);
      return {
        success: false,
        totalUsers: 0,
        duplicateEmails: [],
        merged: 0,
        errors: [error.message]
      };
    }
  }
}