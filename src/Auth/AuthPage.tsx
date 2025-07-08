import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, Home } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const AuthPage: React.FC = () => {
  const { user, signIn, signUp, loading } = useAuthContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    organization: '',
  });

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/portal" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let result;
      
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.name, formData.organization);
      }

      if (!result.success) {
        setError(result.error || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Auth Form */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss3.jpg"
            alt="Learning environment"
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
                  <Logo size="sm" showText={false} className="text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">
                    {isLogin ? 'Welcome Back to Your Portal' : 'Join Africa\'s Premier Sales School'}
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                {isLogin ? (
                  <>
                    Access Your
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      Learning Portal
                    </span>
                  </>
                ) : (
                  <>
                    Start Your
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      Learning Journey
                    </span>
                  </>
                )}
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                {isLogin 
                  ? 'Continue your professional development with expert-led programs and personalized learning paths.'
                  : 'Join Africa\'s premier sales education platform and transform your career with industry-recognized qualifications.'
                }
              </p>
            </div>

            {/* Right Side - Auth Form */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md mx-auto w-full">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-secondary-800 mb-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-secondary-600">
                  {isLogin ? 'Access your institution portal' : 'Get started with your free account'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-white/90"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-secondary-700 mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        required
                        value={formData.organization}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-white/90"
                        placeholder="Enter your institution name"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-white/90"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-white/90"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-secondary-600">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-secondary-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
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

export default AuthPage;