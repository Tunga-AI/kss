import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from 'firebase/auth';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff' | 'learner' | 'applicant' | 'finance' | 'instructor' | 'facilitator';
  organization: string;
  createdAt: Date;
  hasSetPassword?: boolean;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string; needsPasswordReset?: boolean; email?: string | null }>;
  signUp: (email: string, password: string, name: string, organization: string) => Promise<{ success: boolean; user?: User; error?: string; message?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  refreshUserProfile: () => Promise<void>;
  resendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  activateUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};