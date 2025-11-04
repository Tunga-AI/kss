import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Edit, User, Mail, Phone, Calendar, Shield, Building, MapPin, X, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'staff' | 'learner' | 'applicant';
  organization?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  status?: 'active' | 'inactive' | 'suspended';
  profilePicture?: string;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  hasSetPassword?: boolean;
  isActive?: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';
  const isEditing = location.pathname.includes('/edit') || isNew;

  console.log('🚀 UserPage render - id:', id, 'isNew:', isNew, 'isEditing:', isEditing, 'pathname:', location.pathname);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  console.log('📊 UserPage state - loading:', loading, 'saving:', saving);

  useEffect(() => {
    console.log('🔍 UserPage useEffect - id:', id, 'isNew:', isNew, 'isEditing:', isEditing);
    
    if (isNew) {
      console.log('✅ Setting up new user form');
      setUser(null);
      setFormData({
        role: 'staff',
        status: 'active',
        isEmailVerified: false,
        hasSetPassword: false,
        isActive: false,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
      console.log('✅ Loading set to false for new user');
    } else if (id) {
      console.log('📥 Loading existing user:', id);
      loadUser(id);
    } else {
      console.log('❌ No ID provided and not new user');
      setLoading(false);
    }
  }, [id, isNew]);

  const loadUser = async (userId: string) => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('users', userId);
      if (result.success && result.data) {
        const userData = result.data as User;
        setUser(userData);
        setFormData(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFirebaseUser = async (email: string, displayName: string, role: string, organization: string) => {
    try {
      console.log('📝 [createFirebaseUser] Creating new user account for:', email);
      
      // Create user with a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'Temp!';
      console.log('🔑 [createFirebaseUser] Generated temporary password');
      
      const result = await createUserWithEmailAndPassword(auth, email, tempPassword);
      console.log('✅ [createFirebaseUser] Firebase user created:', result.user.uid);

      // Update user profile
      await updateProfile(result.user, {
        displayName: displayName
      });
      console.log('✅ [createFirebaseUser] User display name updated');

      // Create user document in Firestore
      const userProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: role as 'admin' | 'staff' | 'learner' | 'applicant',
        organization: organization,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        position: formData.position,
        bio: formData.bio,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        skills: formData.skills,
        experience: formData.experience,
        education: formData.education,
        status: formData.status || 'active',
        isEmailVerified: false,
        hasSetPassword: false,
        isActive: false,
        createdAt: new Date().toISOString(),
        emergencyContact: formData.emergencyContact
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      console.log('✅ [createFirebaseUser] User profile document created');
      
      // Send password reset email so user can set their own password
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false
      });
      console.log('✅ [createFirebaseUser] Password reset email sent');
      
      // Sign out the user immediately since they need to set password first
      await signOut(auth);
      console.log('✅ [createFirebaseUser] User signed out, awaiting password reset');
      
      return { 
        success: true, 
        user: result.user,
        message: 'User created successfully! They will receive an email to set their password.'
      };
    } catch (error: any) {
      console.error('❌ [createFirebaseUser] Failed to create user:', error.code, error.message);
      throw error;
    }
  };

  const handleInputChange = (field: string, value: any) => {
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

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      } as any
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.organization && isNew) {
      newErrors.organization = 'Organization is required for new users';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (isNew) {
        // Create new user with Firebase Auth
        const result = await createFirebaseUser(
          formData.email!,
          formData.displayName!,
          formData.role!,
          formData.organization!
        );
        
        if (result.success) {
          // Show success message
          setMessage({ type: 'success', text: `User created successfully! ${formData.displayName} will receive an email to set their password.` });
          setTimeout(() => {
            navigate('/portal/users');
          }, 2000);
        }
      } else {
        // Update existing user (only Firestore data, not Firebase Auth)
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

        const result = await FirestoreService.update('users', id!, dataToSave);
      if (result.success) {
          setMessage({ type: 'success', text: 'User updated successfully!' });
          setTimeout(() => {
        navigate('/portal/users');
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'An account with this email already exists' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Please enter a valid email address' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ general: 'Unable to create account with provided details' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save user. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-primary-100 text-primary-800';
      case 'learner': return 'bg-accent-100 text-accent-800';
      case 'applicant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isVerified: boolean, status?: string) => {
    if (status === 'suspended') return 'bg-red-100 text-red-800';
    if (!isVerified) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isVerified: boolean, status?: string) => {
    if (status === 'suspended') return 'Suspended';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Building },
    { id: 'account', label: 'Account Status', icon: Shield },
    { id: 'additional', label: 'Additional', icon: MapPin },
  ];

  const getCurrentTabIndex = () => {
    return tabs.findIndex(tab => tab.id === activeTab);
  };

  const getPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex > 0 ? tabs[currentIndex - 1] : null;
  };

  const getNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
  };

  const goToPreviousTab = () => {
    const previousTab = getPreviousTab();
    if (previousTab) {
      setActiveTab(previousTab.id);
    }
  };

  const goToNextTab = () => {
    const nextTab = getNextTab();
    if (nextTab) {
      setActiveTab(nextTab.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
          <button
            onClick={() => navigate('/portal/users')}
        className="inline-flex items-center text-secondary-600 hover:text-secondary-800 transition-colors duration-200"
          >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Users
          </button>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Show error message if any */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
              {formData.profilePicture ? (
                <img 
                  src={formData.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            
            {/* User Info */}
          <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-1">
                {isNew ? 'Create New User' : (formData.displayName || 'User Details')}
            </h1>
              <p className="text-lg text-primary-100 mb-2">
              {isNew 
                  ? 'Set up a new user account with role-based access'
                  : (isEditing ? 'Edit user information and settings' : 'View user details and account status')
              }
            </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-primary-200">
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(formData.role || 'staff')} bg-white bg-opacity-20 text-white`}>
                    {formData.role?.charAt(0).toUpperCase()}{formData.role?.slice(1) || 'Staff'}
                  </span>
                </div>
                {formData.email && (
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{formData.email}</span>
                  </span>
                )}
                {formData.phoneNumber && (
                  <span className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    <span>{formData.phoneNumber}</span>
                  </span>
                )}
                {formData.organization && (
                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{formData.organization}</span>
                  </span>
                )}
              </div>
          </div>
        </div>

          {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {!isNew && !isEditing && (
            <button
              onClick={() => navigate(`/portal/users/${id}/edit`)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit User</span>
            </button>
          )}
          
          {(isEditing || isNew) && (
            <>
              <button
                onClick={() => navigate(isNew ? '/portal/users' : `/portal/users/${id}`)}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : (isNew ? 'Create User' : 'Save Changes')}</span>
              </button>
            </>
          )}
        </div>
      </div>
              </div>
              
      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Display Name *
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.displayName || ''}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.displayName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter display name"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.displayName || 'Not provided'}</p>
                    )}
                    {errors.displayName && (
                      <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email Address *
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isNew}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                      } ${!isNew ? 'bg-gray-100' : ''}`}
                        placeholder="Enter email address"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.email || 'Not provided'}</p>
                    )}
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  {!isNew && (isEditing || true) && (
                    <p className="text-xs text-secondary-500 mt-1">Email cannot be changed after account creation</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      First Name
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter first name"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.firstName || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Last Name
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter last name"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.lastName || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="tel"
                        value={formData.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter phone number"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.phoneNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Role *
                    </label>
                    {isEditing || isNew ? (
                      <select
                        value={formData.role || ''}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.role ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select role</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="learner">Learner</option>
                      </select>
                    ) : (
                    <p className="text-secondary-800 py-3 capitalize">{formData.role || 'Not assigned'}</p>
                    )}
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                    )}
                  {isNew && (
                    <p className="text-xs text-secondary-500 mt-1">Note: Applicants should use the public signup form</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Professional Information Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Professional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Organization {isNew && '*'}
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.organization || ''}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.organization ? 'border-red-500' : 'border-gray-300'
                      }`}
                        placeholder="Enter organization"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.organization || 'Not provided'}</p>
                  )}
                  {errors.organization && (
                    <p className="text-red-500 text-sm mt-1">{errors.organization}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Department
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter department"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.department || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Position/Title
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.position || ''}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter position or job title"
                      />
                    ) : (
                    <p className="text-secondary-800 py-3">{formData.position || 'Not provided'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Experience
                  </label>
                  {isEditing || isNew ? (
                    <textarea
                      value={formData.experience || ''}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Describe work experience and background..."
                    />
                  ) : (
                    <p className="text-secondary-800 py-3 whitespace-pre-wrap">{formData.experience || 'Not provided'}</p>
                    )}
                  </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Education
                  </label>
                  {isEditing || isNew ? (
                    <textarea
                      value={formData.education || ''}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Describe educational background and qualifications..."
                    />
                  ) : (
                    <p className="text-secondary-800 py-3 whitespace-pre-wrap">{formData.education || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Status Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Account Status</h2>
              
              {isNew ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-4">Account Creation Process</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-1 rounded-full mt-1">
                        <Check className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">User account will be created in Firebase Auth</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-1 rounded-full mt-1">
                        <Mail className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">Password setup email will be sent to user</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-1 rounded-full mt-1">
                        <Shield className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">User must set password before first login</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-1 rounded-full mt-1">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">Account will be activated after password setup</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Email Verification
                      </label>
                      {isEditing ? (
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.isEmailVerified || false}
                            onChange={(e) => handleInputChange('isEmailVerified', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-secondary-700">Email is verified</span>
                        </div>
                      ) : (
                      <div className="flex items-center space-x-2 py-3">
                          {formData.isEmailVerified ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          )}
                          <span className="text-secondary-800">
                            {formData.isEmailVerified ? 'Verified' : 'Not verified'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Account Status
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.status || 'active'}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      ) : (
                      <p className="text-secondary-800 py-3 capitalize">{formData.status || 'active'}</p>
                      )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Password Setup Status
                    </label>
                    <div className="flex items-center space-x-2 py-3">
                      {formData.hasSetPassword ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="text-secondary-800">
                        {formData.hasSetPassword ? 'Password has been set' : 'Awaiting password setup'}
                      </span>
                    </div>
                    {!formData.hasSetPassword && (
                      <p className="text-xs text-secondary-500 mt-1">
                        User needs to check their email and set up their password
                      </p>
                    )}
                  </div>

                  {formData.createdAt && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Account Created
                      </label>
                      <div className="flex items-center space-x-2 py-3">
                        <Calendar className="h-4 w-4 text-secondary-400" />
                        <span className="text-secondary-800">
                          {new Date(formData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Additional Information Tab */}
          {activeTab === 'additional' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Additional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Address
                  </label>
                  {isEditing || isNew ? (
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter address"
                    />
                  ) : (
                    <p className="text-secondary-800 py-3">{formData.address || 'Not provided'}</p>
                  )}
                </div>

              <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    City
                  </label>
                  {isEditing || isNew ? (
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter city"
                    />
                  ) : (
                    <p className="text-secondary-800 py-3">{formData.city || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Country
                  </label>
                  {isEditing || isNew ? (
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter country"
                    />
                  ) : (
                    <p className="text-secondary-800 py-3">{formData.country || 'Not provided'}</p>
                  )}
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Bio
                  </label>
                  {isEditing || isNew ? (
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Enter user bio..."
                    />
                  ) : (
                  <p className="text-secondary-800 py-3 whitespace-pre-wrap">{formData.bio || 'No bio provided'}</p>
                  )}
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Name
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.emergencyContact?.name || ''}
                        onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Emergency contact name"
                      />
                    ) : (
                      <p className="text-secondary-800 py-3">{formData.emergencyContact?.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="tel"
                        value={formData.emergencyContact?.phone || ''}
                        onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Emergency contact phone"
                      />
                    ) : (
                      <p className="text-secondary-800 py-3">{formData.emergencyContact?.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Relationship
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.emergencyContact?.relationship || ''}
                        onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Relationship"
                      />
                    ) : (
                      <p className="text-secondary-800 py-3">{formData.emergencyContact?.relationship || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
            <div>
              {getPreviousTab() ? (
                <button
                  onClick={goToPreviousTab}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {getPreviousTab()?.label}
                </button>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-500">
                {getCurrentTabIndex() + 1} of {tabs.length}
              </span>
            </div>

            <div>
              {getNextTab() ? (
                <button
                  onClick={goToNextTab}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  {getNextTab()?.label}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage; 