import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirestoreService } from '../services/firestore';
import { UserPlus, Mail, Phone, User, ArrowLeft, CheckCircle, Home } from 'lucide-react';
import Logo from '../components/Logo';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore
      await FirestoreService.create('users', {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: 'applicant',
        organization: 'Msomi Learning Platform',
        isEmailVerified: false,
        hasCompletedApplication: false,
        createdAt: new Date()
      });

      setSuccess(true);
    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'An account with this email already exists' });
      } else {
        setErrors({ general: 'Failed to create account. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen">
        {/* Success Hero Section */}
        <section className="relative h-screen flex items-end overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/kss4.jpg"
              alt="Success celebration"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-secondary-900/90"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Content */}
          <div className="relative w-full px-6 sm:px-8 lg:px-12 pb-24">
            <div className="w-full text-center text-white">
              
              {/* Back to Home */}
              <Link to="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-8 transition-colors duration-200">
                <Home className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <CheckCircle className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">Account Created Successfully</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Msomi
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                We've sent a verification email to <strong className="text-yellow-400">{formData.email}</strong>. Please check your inbox to activate your account.
              </p>

              {/* Next Steps */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-semibold mb-6">What's Next?</h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <span className="text-gray-100">Check your email inbox (and spam folder)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <span className="text-gray-100">Click the verification link in the email</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <span className="text-gray-100">Log in to complete your application</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
                    <span className="text-gray-100">Start your learning journey!</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-lg font-semibold shadow-xl transition-colors duration-200"
                >
                  Continue to Login
                </button>
                <Link to="/">
                  <button className="inline-flex items-center border border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold shadow-lg transition-colors duration-200">
                    Back to Home
                  </button>
                </Link>
              </div>

              <p className="text-gray-300 mt-6">
                After verifying your email, you can log in to access your learning portal.
              </p>
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
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Signup Form */}
      <section className="relative min-h-screen flex items-end overflow-hidden py-12">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss2.jpg"
            alt="Students collaborating"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-secondary-900/90"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative w-full px-6 sm:px-8 lg:px-12 pb-24">
          <div className="w-full grid lg:grid-cols-2 gap-12 items-end">
            
            {/* Left Side - Hero Content */}
            <div className="text-white">
              {/* Back to Home */}
              <Link to="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-8 transition-colors duration-200">
                <Home className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <UserPlus className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">Join Africa's Premier Sales School</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Start Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Learning Journey
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Join Africa's premier sales education platform and gain industry-recognized qualifications that accelerate your career.
              </p>
            </div>

            {/* Right Side - Signup Form */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-lg mx-auto w-full">
              <div className="mb-6 text-center">
                <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-secondary-800 mb-2">Create Your Account</h2>
                <p className="text-secondary-600">
                  Start your professional journey with us today
                </p>
              </div>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter first name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 ${
                        errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-secondary-600">
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