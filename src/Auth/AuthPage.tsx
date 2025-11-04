import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, RefreshCw, LogIn, ArrowRight } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestore';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import Logo from '../components/Logo';
import Navbar from '../Website/components/Navbar';

const AuthPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingReset, setIsResendingReset] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Multi-step auth states
  const [authStep, setAuthStep] = useState<'email' | 'password' | 'setup-password'>('email');
  const [userRecord, setUserRecord] = useState<any>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { signIn, signUp, resendPasswordReset } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for messages from navigation state
  React.useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      if (location.state.type === 'success') {
        setError('');
      }
    }
    
    // Pre-fill email from URL params if present
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [location.state, location.search]);

  const checkEmailInUsersCollection = async (email: string) => {
    console.log('🔍 [AuthPage] Checking email in users collection:', email);
    setIsCheckingEmail(true);
    setError('');
    setMessage('');

    try {
      const result = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: email.toLowerCase() }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        const user = result.data[0];
        console.log('✅ [AuthPage] User found in collection:', user.firstName, user.lastName);
        setUserRecord(user);
        
        // Now check if this user has Firebase Authentication set up
        setMessage(`Hi ${user.firstName}! Checking your account setup...`);
        await checkIfUserHasFirebaseAuth(email, user);
        return true;
      } else {
        console.log('❌ [AuthPage] User not found in users collection');
        setError('Email not found. Please contact an administrator to get access or check your email address.');
        return false;
      }
    } catch (error) {
      console.error('❌ [AuthPage] Error checking email:', error);
      setError('Unable to verify email. Please try again.');
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkIfUserHasFirebaseAuth = async (email: string, user: any) => {
    console.log('🔐 [AuthPage] DEBUG: Checking Firebase Auth for:', email);
    console.log('🔐 [AuthPage] DEBUG: Auth object:', auth);
    console.log('🔐 [AuthPage] DEBUG: Auth app:', auth.app);
    
    // Method 1: Try fetchSignInMethodsForEmail with full debugging
    try {
      console.log('🔍 [AuthPage] DEBUG: Calling fetchSignInMethodsForEmail...');
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      console.log('🔍 [AuthPage] DEBUG: Raw result:', signInMethods);
      console.log('🔍 [AuthPage] DEBUG: Result type:', typeof signInMethods);
      console.log('🔍 [AuthPage] DEBUG: Result length:', signInMethods?.length);
      console.log('🔍 [AuthPage] DEBUG: Result array:', Array.isArray(signInMethods));
      
      if (signInMethods && signInMethods.length > 0) {
        console.log('✅ [AuthPage] USER EXISTS in Firebase Auth → Ask for password');
        setAuthStep('password');
        setMessage(`Welcome back, ${user.firstName}! Please enter your password.`);
        setError('');
        return;
      }
      
      console.log('🆕 [AuthPage] fetchSignInMethodsForEmail returned empty - trying password test...');
      
    } catch (fetchError: any) {
      console.error('❌ [AuthPage] fetchSignInMethodsForEmail failed:', fetchError);
      console.log('🔄 [AuthPage] Falling back to password test method...');
    }
    
    // Method 2: Try a password test as backup
    try {
      console.log('🔍 [AuthPage] DEBUG: Testing with dummy password...');
      await signIn(email, 'absolutely-wrong-password-test-123456789');
      
      // If we get here, user somehow signed in (shouldn't happen)
      console.log('✅ [AuthPage] Unexpected successful login - user exists');
      setAuthStep('password');
      setMessage(`Welcome back, ${user.firstName}! Please enter your password.`);
      setError('');
      
    } catch (passwordError: any) {
      console.log('🔍 [AuthPage] DEBUG: Password test error:', passwordError);
      console.log('🔍 [AuthPage] DEBUG: Error type:', typeof passwordError);
      console.log('🔍 [AuthPage] DEBUG: Error string:', String(passwordError));
      
      const errorString = String(passwordError).toLowerCase();
      
      if (errorString.includes('user-not-found') || errorString.includes('invalid-email')) {
        console.log('🆕 [AuthPage] USER NOT FOUND → Create password');
        setAuthStep('setup-password');
        setMessage(`Welcome, ${user.firstName}! Please create your password.`);
        setError('');
      } else {
        console.log('✅ [AuthPage] USER FOUND (wrong password error) → Enter password');
        setAuthStep('password');
        setMessage(`Welcome back, ${user.firstName}! Please enter your password.`);
        setError('');
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📧 [AuthPage] Email step submitted:', formData.email);
    
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailFound = await checkEmailInUsersCollection(formData.email.trim());
    if (!emailFound) {
      // Reset step if email not found
      setAuthStep('email');
      setUserRecord(null);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 [AuthPage] Password step submitted');
    
    if (!formData.password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      console.log('🔐 [AuthPage] Attempting login with Firebase...');
      const result = await signIn(formData.email, formData.password);
      console.log('🔐 [AuthPage] Firebase login result:', result);
      
      if (result.success) {
        console.log('✅ [AuthPage] Login successful, user should be redirected');
        // Mark that user just authenticated to trigger portal redirect
        sessionStorage.setItem('justAuthenticated', 'true');
      } else {
        // Check if user doesn't exist in Firebase Auth (first-time user)
        if (result.error && (
          result.error.includes('user-not-found') || 
          result.error.includes('invalid-credential') ||
          result.error.includes('wrong-password')
        )) {
          console.log('🆕 [AuthPage] User may not have Firebase auth account, offering password setup');
          setAuthStep('setup-password');
          setMessage('Welcome! It looks like this is your first time logging in. Please set up your password.');
          setError('');
        } else if (result.needsPasswordReset) {
          console.log('🔑 [AuthPage] User needs password reset');
          setNeedsPasswordReset(true);
          setUserEmail(result.email || formData.email);
          setError('Please set your password first. Click below to receive a password reset email.');
        } else {
          console.log('❌ [AuthPage] Login failed:', result.error);
          setError(result.error || 'Login failed. Please check your password and try again.');
        }
      }
    } catch (err: any) {
      console.error('❌ [AuthPage] Unexpected error during password authentication:', err);
      // If it's a Firebase auth error suggesting user doesn't exist, offer password setup
      if (err.message && (err.message.includes('user-not-found') || err.message.includes('invalid-credential'))) {
        console.log('🆕 [AuthPage] Firebase auth error suggests new user, offering password setup');
        setAuthStep('setup-password');
        setMessage('Welcome! It looks like this is your first time logging in. Please set up your password.');
        setError('');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🆕 [AuthPage] Password setup submitted');

    // Validation
    if (!formData.newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreatingAuth(true);
    setError('');
    setMessage('');

    try {
      console.log('🆕 [AuthPage] Creating Firebase auth account...');
      
      // Create Firebase auth account with the user's email and new password
      const result = await signUp(
        formData.email, 
        formData.newPassword, 
        `${userRecord.firstName} ${userRecord.lastName}`.trim(),
        userRecord.organization || 'N/A'
      );
      
      console.log('🆕 [AuthPage] Firebase auth creation result:', result);
      
      if (result.success) {
        console.log('✅ [AuthPage] Firebase auth account created, attempting auto-login...');
        
        // Update the users collection to mark that Firebase auth has been created
        try {
          await FirestoreService.update('users', userRecord.id, {
            hasFirebaseAuth: true,
            firebaseAuthCreatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('✅ [AuthPage] Updated user record with hasFirebaseAuth flag');
        } catch (updateError) {
          console.warn('⚠️ [AuthPage] Could not update user record:', updateError);
        }
        
        // Try to sign in automatically with the new credentials (skip email verification)
        const loginResult = await signIn(formData.email, formData.newPassword);
        
        if (loginResult.success) {
          console.log('✅ [AuthPage] Auto-login successful after account creation - user authenticated!');
          // Mark that user just authenticated to trigger portal redirect
          sessionStorage.setItem('justAuthenticated', 'true');
          // User will be redirected automatically by AuthContext
        } else {
          console.log('ℹ️ [AuthPage] Auto-login failed but account created - user can now login manually');
          setMessage('Password set successfully! You can now sign in.');
          setAuthStep('password');
          setFormData(prev => ({ ...prev, password: formData.newPassword, newPassword: '', confirmPassword: '' }));
        }
      } else {
        console.log('❌ [AuthPage] Firebase auth creation failed:', result.error);
        setError(result.error || 'Failed to set your password. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ [AuthPage] Unexpected error during password setup:', err);
      setError(err.message || 'An unexpected error occurred while setting up your password');
    } finally {
      setIsCreatingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Route to appropriate handler based on authentication step
    if (authStep === 'email') {
      await handleEmailSubmit(e);
    } else if (authStep === 'setup-password') {
      await handlePasswordSetup(e);
    } else {
      await handlePasswordSubmit(e);
    }
  };

  const handleBackToEmail = () => {
    console.log('🔙 [AuthPage] Going back to email step');
    setAuthStep('email');
    setUserRecord(null);
    setError('');
    setMessage('');
    setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
  };


  const handleResendPasswordReset = async () => {
    console.log('🔄 [AuthPage] Resending password reset for:', userEmail);
    setIsResendingReset(true);
    setError('');
    setMessage('');

    try {
      const result = await resendPasswordReset(userEmail);
      console.log('🔄 [AuthPage] Password reset result:', result);
      
      if (result.success) {
        console.log('✅ [AuthPage] Password reset email sent successfully');
        setMessage(result.message || 'Password reset email sent! Check your inbox.');
        setNeedsPasswordReset(false);
      } else {
        console.log('❌ [AuthPage] Password reset failed:', result.error);
        setError(result.error || 'Failed to send password reset email');
      }
    } catch (err: any) {
      console.error('❌ [AuthPage] Unexpected error during password reset:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsResendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />
      
      {/* Hero Section with Auth Form */}
      <section className="relative h-screen bg-white pt-20 pb-8 lg:pb-12 safe-area-top safe-area-bottom">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[95%] overflow-hidden rounded-lg sm:rounded-xl shadow-2xl">
            <img
              src="/home.jpg"
              alt="Students learning together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            
            {/* Content */}
            <div className="absolute inset-0 px-4 sm:px-6 lg:px-12 overflow-y-auto scrollbar-thin">
              {/* Auth Form - Bottom Left on desktop, centered on mobile */}
              <div className="flex items-center min-h-full py-8 lg:py-0 lg:absolute lg:bottom-12 lg:left-12 max-w-md w-full lg:w-auto">
                <div className="w-full">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                    {authStep === 'email' 
                      ? 'Welcome Back' 
                      : authStep === 'setup-password'
                        ? `Welcome, ${userRecord?.firstName || 'User'}!`
                        : `Welcome, ${userRecord?.firstName || 'User'}!`
                    }
                  </h2>
                  <p className="text-lg text-gray-200">
                    {authStep === 'email' 
                      ? 'Enter your email to continue' 
                      : authStep === 'setup-password'
                        ? 'Set up your password to get started'
                        : 'Please enter your password'
                    }
                  </p>
                </div>

                {/* Messages */}
                {message && (
                  <div className="mb-4 p-3 bg-white/90 backdrop-blur-sm border border-accent-200 rounded-md">
                    <p className="text-sm text-accent-700">{message}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-white/90 backdrop-blur-sm border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Password Reset Needed */}
                {needsPasswordReset && (
                  <div className="mb-4 p-3 bg-white/90 backdrop-blur-sm border border-primary-200 rounded-md">
                    <p className="text-sm text-primary-700 mb-2">
                      Please set your password first.
                    </p>
                    <button
                      onClick={handleResendPasswordReset}
                      disabled={isResendingReset}
                      className="w-full bg-primary-600 text-white py-2 px-3 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
                    >
                      {isResendingReset ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span>Send Reset Email</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email - Show during email step */}
                  {authStep === 'email' && (
                    <div>
                      <label htmlFor="email" className="block text-sm sm:text-base font-medium text-white mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 sm:py-3.5 min-h-[48px] text-sm sm:text-base bg-white/95 backdrop-blur-sm border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm touch-manipulation"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Email display for password and setup-password steps */}
                  {(authStep === 'password' || authStep === 'setup-password') && (
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-white mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center space-x-3 bg-white/95 backdrop-blur-sm border-2 border-white/30 rounded-lg p-3 sm:p-3.5 min-h-[48px]">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 text-sm sm:text-base flex-1 truncate">{formData.email}</span>
                        <button
                          type="button"
                          onClick={handleBackToEmail}
                          className="text-primary-600 text-sm sm:text-base hover:text-primary-700 active:text-primary-800 underline flex-shrink-0 min-h-[32px] touch-manipulation"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password - Show during password step */}
                  {authStep === 'password' && (
                    <div>
                      <label htmlFor="password" className="block text-sm sm:text-base font-medium text-white mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-11 pr-14 py-3 sm:py-3.5 min-h-[48px] text-sm sm:text-base bg-white/95 backdrop-blur-sm border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm touch-manipulation"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password Setup Fields - Show during setup-password step */}
                  {authStep === 'setup-password' && (
                    <>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-white mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="newPassword"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full pl-10 pr-12 py-2.5 bg-white/90 backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="Create a new password"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-white/60 text-xs mt-1">Password must be at least 6 characters long</p>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-sm border border-white/20 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="Confirm your new password"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isCheckingEmail || isCreatingAuth}
                    className="w-full bg-primary-600 text-white py-3 sm:py-3.5 px-4 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 min-h-[48px] text-sm sm:text-base touch-manipulation shadow-lg"
                  >
                    {(isSubmitting || isCheckingEmail || isCreatingAuth) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>
                          {isCheckingEmail ? 'Checking...' : 
                           isCreatingAuth ? 'Creating Account...' :
                           authStep === 'email' ? 'Checking...' : 
                           authStep === 'setup-password' ? 'Creating Account...' : 
                           'Signing In...'}
                        </span>
                      </>
                    ) : (
                      <>
                        {authStep === 'email' ? (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            <span>Continue</span>
                          </>
                        ) : authStep === 'setup-password' ? (
                          <>
                            <Lock className="h-4 w-4" />
                            <span>Create Password</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            <span>Sign In</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                </form>



                {/* Forgot Password - Only show during password step */}
                {authStep === 'password' && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        handleResendPasswordReset();
                        setUserEmail(formData.email);
                      }}
                      className="text-white/80 hover:text-white text-sm underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-white/80 text-xs sm:text-sm">
                    Don't have access? Contact your administrator.
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthPage;