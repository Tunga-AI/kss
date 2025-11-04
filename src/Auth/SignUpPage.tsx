import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Phone, User, Home, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import Logo from '../components/Logo';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [programInfo, setProgramInfo] = useState<{id: string, name: string} | null>(null);
  
  // New state for flow management
  const [flowType, setFlowType] = useState<'new_user' | 'existing_applicant'>('new_user');
  const [existingApplicant, setExistingApplicant] = useState<any>(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuthContext();

  useEffect(() => {
    // Get program information from URL parameters
    const programId = searchParams.get('program');
    const programName = searchParams.get('programName');
    
    if (programId && programName) {
      setProgramInfo({
        id: programId,
        name: decodeURIComponent(programName)
      });
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Check if email exists in users collection as an applicant
  const checkExistingApplicant = async (email: string) => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      return;
    }

    setEmailCheckLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: email.toLowerCase() },
        { field: 'role', operator: '==', value: 'applicant' },
        { field: 'hasSetPassword', operator: '==', value: false }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        const applicant = result.data[0];
        setExistingApplicant(applicant);
        setFlowType('existing_applicant');
        setFormData(prev => ({
          ...prev,
          firstName: applicant.displayName?.split(' ')[0] || '',
          lastName: applicant.displayName?.split(' ').slice(1).join(' ') || ''
        }));
      } else {
        setExistingApplicant(null);
        setFlowType('new_user');
      }
    } catch (error) {
      console.error('Error checking existing applicant:', error);
      setFlowType('new_user');
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Handle email change with debounced checking
  const handleEmailChange = (value: string) => {
    handleInputChange('email', value);
    
    // Reset flow when email changes
    if (existingApplicant) {
      setExistingApplicant(null);
      setFlowType('new_user');
    }
    
    // Debounce email checking
    const timeoutId = setTimeout(() => {
      checkExistingApplicant(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (flowType === 'new_user') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (flowType === 'existing_applicant') {
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setCreatingAccount(true);
    
    try {
      if (flowType === 'existing_applicant') {
        // Handle password setup for existing applicant
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Update user profile
        await updateProfile(result.user, {
          displayName: existingApplicant.displayName
        });

        // Update the user document to mark as having set password and being active
        await FirestoreService.update('users', existingApplicant.uid, {
          hasSetPassword: true,
          isActive: true,
          activatedAt: new Date().toISOString()
        });

        setCreatingAccount(false);
        setSuccess(true);
        
        // Redirect to portal after success
        setTimeout(() => {
          navigate('/portal/admissions', {
            state: {
              message: 'Welcome! You can now continue with your application.',
              type: 'success'
            }
          });
        }, 2000);
      } else {
        // Handle new user registration (existing flow)
        const result = await signUp(
          formData.email,
          'temporary-password-will-be-reset',
          `${formData.firstName} ${formData.lastName}`,
          'Kenya School of Sales'
        );

        if (result.success) {
          setTimeout(() => {
            setCreatingAccount(false);
            setSuccess(true);
            
            setTimeout(() => {
              navigate('/auth', {
                state: {
                  message: 'Account created successfully! Please check your email and click the password setup link to set your password.',
                  type: 'success'
                }
              });
            }, 4000);
          }, 500);
        } else {
          setCreatingAccount(false);
          if (result.error?.includes('email already exists')) {
            setErrors({ email: 'An account with this email already exists' });
          } else {
            setErrors({ general: result.error || 'Failed to create account. Please try again.' });
          }
        }
      }
    } catch (error: any) {
      console.error('Error in submit:', error);
      setCreatingAccount(false);
      setErrors({ general: 'Failed to complete registration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (creatingAccount) {
    return (
      <div className="min-h-screen">
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/kss2.jpg"
              alt="Creating account"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-secondary-900/90"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Creating Your Account...</h2>
              <p className="text-gray-200 mb-6 ">
                Please wait while we set up your account and send you the password setup email.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-white text-sm space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Setting up your profile...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-200"></div>
                    <span>Preparing welcome email...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-400"></div>
                    <span>Finalizing account...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
              
              <h2 className="text-3xl font-bold mb-4">Account Created!</h2>
              <p className="text-gray-200 mb-6 ">
                Your account has been created successfully. Please check your email and click the password reset link to set your password before you can log in.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                <p className="text-white text-sm ">
                  📧 Password setup email sent to: <br />
                  <span className="font-semibold text-accent-400">{formData.email}</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center ">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                <span>Redirecting to login...</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Signup Form */}
      <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden py-12">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="/kss2.jpg"
            alt="Students collaborating"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/60 to-primary-700/40"></div>
        </div>

        {/* Back to Home - Fixed at top */}
        <div className="absolute top-8 left-6 sm:left-8 lg:left-12 z-20">
          <Link to="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200 ">
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-end justify-start min-h-screen px-6 sm:px-8 lg:px-12 pb-24">
          <div className="w-full grid lg:grid-cols-2 gap-12 items-end mt-auto">
            
            {/* Left Side - Hero Content */}
            <div className="text-white">

              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <UserPlus className="w-5 h-5 text-accent-400 mr-2" />
                  <span className="text-white text-sm font-medium ">Join Africa's Premier Sales School</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Start Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-500">
                  Learning Journey
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed ">
                Join Africa's premier sales education platform and gain industry-recognized qualifications that accelerate your career.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-accent-400">Quick & Easy Process:</h3>
                <div className="space-y-3 text-sm ">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <span>Create your account with basic info</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <span>Check email & click password reset link</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <span>Set your password & start learning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-lg mx-auto w-full">
              <div className="mb-6 text-center">
                <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                
                {flowType === 'existing_applicant' ? (
                  <>
                    <h2 className="text-3xl font-bold text-neutral-800 mb-2">Welcome Back!</h2>
                    <p className="text-neutral-600 ">
                      Hi {existingApplicant?.displayName}! Set your password to continue your application.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-neutral-800 mb-2">Create Your Account</h2>
                    <p className="text-neutral-600 ">
                      Enter your details below - we'll email you a link to set your password
                    </p>
                  </>
                )}
                
                {/* Program Information Display */}
                {programInfo && (
                  <div className="mt-4 bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <div className="flex items-center justify-center space-x-2 text-primary-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium ">Selected Program:</span>
                    </div>
                    <p className="text-primary-800 font-semibold mt-1">{programInfo.name}</p>
                    <p className="text-primary-600 text-sm mt-1 ">
                      You'll be able to apply for this program after creating your account
                    </p>
                  </div>
                )}
              </div>

              {errors.general && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 mb-6">
                  <p className="text-secondary-600 text-sm ">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email - Always first */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  ${
                        errors.email ? 'border-secondary-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                      disabled={flowType === 'existing_applicant'}
                    />
                    {emailCheckLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-secondary-600 text-sm mt-1 ">{errors.email}</p>
                  )}
                  {flowType === 'existing_applicant' && (
                    <p className="text-green-600 text-sm mt-1 ">
                      ✓ We found your application! Please set your password below.
                    </p>
                  )}
                </div>

                {/* Conditional Fields based on flow type */}
                {flowType === 'new_user' && (
                  <>
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                          First Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  ${
                              errors.firstName ? 'border-secondary-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter first name"
                          />
                        </div>
                        {errors.firstName && (
                          <p className="text-secondary-600 text-sm mt-1 ">{errors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                          Last Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  ${
                              errors.lastName ? 'border-secondary-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter last name"
                          />
                        </div>
                        {errors.lastName && (
                          <p className="text-secondary-600 text-sm mt-1 ">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  ${
                            errors.phoneNumber ? 'border-secondary-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-secondary-600 text-sm mt-1 ">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Password Fields for existing applicants */}
                {flowType === 'existing_applicant' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                        Password *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  ${
                            errors.password ? 'border-secondary-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-secondary-600 text-sm mt-1 ">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  ${
                            errors.confirmPassword ? 'border-secondary-300' : 'border-gray-300'
                          }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-secondary-600 text-sm mt-1 ">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || emailCheckLoading}
                  className="w-full bg-secondary-600 text-white py-3 px-4 rounded-lg  font-semibold hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>
                        {flowType === 'existing_applicant' ? 'Set Password & Continue' : 'Create Account'}
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-neutral-600 ">
                  Already have an account?{' '}
                  <Link
                    to="/auth"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignUpPage; 