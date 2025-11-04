import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  applyActionCode, 
  checkActionCode,
  User 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthContext } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestore';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Home,
  Lock
} from 'lucide-react';
import Logo from '../components/Logo';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUserProfile } = useAuthContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [actionType, setActionType] = useState<'resetPassword' | 'verifyEmail' | null>(null);
  
  // Get email from location state or user
  const email = location.state?.email || user?.email || '';

  useEffect(() => {
    // Check if there's an action code in the URL
    const urlParams = new URLSearchParams(location.search);
    const actionCode = urlParams.get('oobCode');
    const mode = urlParams.get('mode');
    
    if (actionCode && mode) {
      if (mode === 'resetPassword') {
        setActionType('resetPassword');
        handlePasswordResetConfirmation();
      } else if (mode === 'verifyEmail') {
        setActionType('verifyEmail');
        handleEmailVerification(actionCode);
      }
    }
  }, [location]);

  const handlePasswordResetConfirmation = async () => {
    // Firebase handles password reset automatically, so we just show success
    setSuccess(true);
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate('/auth', { 
        state: { 
          message: 'Password updated successfully! You can now log in with your new password.',
          type: 'success' 
        } 
      });
    }, 3000);
  };

  const handleEmailVerification = async (actionCode: string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Verify the action code
      await checkActionCode(auth, actionCode);
      
      // Apply the action code to verify the email
      await applyActionCode(auth, actionCode);
      
      // Update user profile in Firestore to mark as active
      if (user) {
        await FirestoreService.update('users', user.uid, {
          hasSetPassword: true,
          isActive: true,
          emailVerifiedAt: new Date().toISOString()
        });
        
        await refreshUserProfile();
      }
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth', { 
          state: { 
            message: 'Email verified successfully! You can now log in.',
            type: 'success' 
          } 
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsProcessing(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-action-code':
        return 'The reset link is invalid or has expired. Please request a new one.';
      case 'auth/expired-action-code':
        return 'The reset link has expired. Please request a new one.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen">
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/kss4.jpg"
              alt="Success celebration"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-800/80 to-green-900/90"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">
                {actionType === 'resetPassword' ? 'Password Updated!' : 'Email Verified!'}
              </h2>
              <p className="text-gray-200 mb-6">
                {actionType === 'resetPassword' 
                  ? 'Your password has been successfully updated. You can now log in with your new password.'
                  : 'Your email has been successfully verified. You can now access your account.'
                }
              </p>
              
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                <span>Redirecting to login...</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/kss3.jpg"
              alt="Error"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-red-800/80 to-red-900/90"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Oops! Something went wrong</h2>
              <p className="text-gray-200 mb-6">{error}</p>
              
              <div className="space-y-4">
                <Link
                  to="/auth"
                  className="block w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors text-center"
                >
                  Back to Login
                </Link>
                <Link
                  to="/"
                  className="block w-full border border-white text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors text-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss3.jpg"
            alt="Processing"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-secondary-900/90"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Processing...</h2>
            <p className="text-gray-200 mb-6">
              We're processing your request. Please wait a moment.
            </p>
            
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              <span>Please wait...</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmailVerificationPage; 