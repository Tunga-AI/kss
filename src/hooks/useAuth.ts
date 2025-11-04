import { useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/invalid-credential':
      return 'The provided credentials are invalid.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'An error occurred. Please try again.';
  }
};

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff' | 'instructor' | 'learner' | 'applicant' | 'finance';
  organization: string;
  createdAt: Date;
  hasSetPassword?: boolean; // Track if user has set their own password
  isActive?: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: User) => {
    try {
  
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        
        
        // Auto-fix existing users who were created before the new auth flow
        // If user can sign in with Firebase Auth but lacks the new flags, activate them
        if (userData.hasSetPassword === undefined || userData.isActive === undefined || 
            userData.hasSetPassword === false || userData.isActive === false) {
          
          
          
          const updatedProfile = {
            ...userData,
            hasSetPassword: true,
            isActive: true,
            activatedAt: new Date().toISOString()
          };
          
          await updateDoc(doc(db, 'users', user.uid), {
            hasSetPassword: true,
            isActive: true,
            activatedAt: new Date().toISOString()
          });
          
          
          setUserProfile(updatedProfile);
          return updatedProfile;
        }
        
        
        setUserProfile(userData);
        return userData;
      } else {
        
        
        // Create profile for users who exist in Auth but not in Firestore
        // Since they can sign in, they're legitimate users - activate them
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Unknown User',
          role: 'applicant',
          organization: 'Kenya School of Sales',
          createdAt: new Date(),
          hasSetPassword: true, // They can sign in, so they have a password
          isActive: true // They can sign in, so they should be active
        };
        
        await setDoc(doc(db, 'users', user.uid), defaultProfile);
        
        setUserProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('❌ [fetchUserProfile] Error fetching user profile:', error);
      setUserProfile(null);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔄 [useAuth] Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 [onAuthStateChanged] Auth state changed:', user ? `User: ${user.uid} (${user.email})` : 'No user');
      
      setUser(user);
      
      if (user) {
        console.log('👤 [onAuthStateChanged] User is logged in, fetching profile...');
        await fetchUserProfile(user);
      } else {
        console.log('👤 [onAuthStateChanged] No user, clearing profile');
        setUserProfile(null);
      }
      
      setLoading(false);
      console.log('✅ [onAuthStateChanged] Auth state processing complete');
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [signIn] Attempting sign in for:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ [signIn] Firebase auth successful for:', result.user.uid);
      
      // fetchUserProfile (called by onAuthStateChanged) will handle profile creation/activation
      // No need to duplicate logic here since the auth state change will trigger it
      
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('❌ [signIn] Firebase auth failed:', error.code, error.message);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const signUp = async (email: string, password: string, name: string, organization: string) => {
    try {
      console.log('📝 [signUp] Creating new user account for:', email);
      
      // Create user with the actual password they provided
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ [signUp] Firebase user created:', result.user.uid);

      // Update user profile
      await updateProfile(result.user, {
        displayName: name
      });
      console.log('✅ [signUp] User display name updated');

      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: name,
        role: 'applicant',
        organization,
        createdAt: new Date(),
        hasSetPassword: true, // They just set their password
        isActive: true // Activate them immediately since they set their own password
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      console.log('✅ [signUp] User profile document created');
      
      // Keep user signed in after account creation
      console.log('✅ [signUp] User remains signed in');
      
      return { 
        success: true, 
        user: result.user,
        message: 'Account created successfully! You are now signed in.'
      };
    } catch (error: any) {
      console.error('❌ [signUp] Failed to create user:', error.code, error.message);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const resendPasswordReset = async (email: string) => {
    try {
      console.log('🔄 [resendPasswordReset] Sending password reset email to:', email);
      
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false
      });
      
      console.log('✅ [resendPasswordReset] Password reset email sent successfully');
      return { success: true, message: 'Password reset email sent!' };
    } catch (error: any) {
      console.error('❌ [resendPasswordReset] Failed to send password reset email:', error.code, error.message);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Function to manually activate a user (for admin use)
  const activateUser = async (userId: string) => {
    try {
      console.log('🔧 [activateUser] Manually activating user:', userId);
      
      await updateDoc(doc(db, 'users', userId), {
        hasSetPassword: true,
        isActive: true,
        activatedAt: new Date().toISOString()
      });
      
      console.log('✅ [activateUser] User activated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [activateUser] Failed to activate user:', error);
      return { success: false, error: 'Failed to activate user' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [logout] Signing out user');
      
      await signOut(auth);
      
      console.log('✅ [logout] User signed out successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [logout] Failed to sign out user:', error.code, error.message);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    refreshUserProfile,
    resendPasswordReset,
    activateUser
  };
};