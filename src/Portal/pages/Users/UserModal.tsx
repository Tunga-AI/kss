import React, { useState, useEffect } from 'react';
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

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  mode: 'view' | 'edit' | 'create';
  onUserSaved?: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, userId, mode, onUserSaved }) => {
  const isNew = mode === 'create';
  const isEditing = mode === 'edit' || isNew;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isNew) {
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
      } else if (userId) {
        loadUser(userId);
      }
      setActiveTab('basic');
      setMessage(null);
      setErrors({});
    }
  }, [isOpen, userId, isNew]);

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
      const tempPassword = Math.random().toString(36).slice(-8) + 'Temp!';
      const result = await createUserWithEmailAndPassword(auth, email, tempPassword);
      await updateProfile(result.user, { displayName });
      
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
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false
      });
      await signOut(auth);
      
      return { success: true, user: result.user };
    } catch (error: any) {
      throw error;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value } as any
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.displayName) newErrors.displayName = 'Display name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.organization && isNew) newErrors.organization = 'Organization is required for new users';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setMessage(null);
    try {
      if (isNew) {
        const result = await createFirebaseUser(
          formData.email!,
          formData.displayName!,
          formData.role!,
          formData.organization!
        );
        if (result.success) {
          setMessage({ type: 'success', text: 'User created successfully!' });
          setTimeout(() => {
            onUserSaved?.();
            onClose();
          }, 2000);
        }
      } else {
        const dataToSave = { ...formData, updatedAt: new Date().toISOString() };
        const result = await FirestoreService.update('users', userId!, dataToSave);
        if (result.success) {
          setMessage({ type: 'success', text: 'User updated successfully!' });
          setTimeout(() => {
            onUserSaved?.();
            onClose();
          }, 1500);
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'An account with this email already exists' });
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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Building },
    { id: 'account', label: 'Account Status', icon: Shield },
    { id: 'additional', label: 'Additional', icon: MapPin },
  ];

  const getCurrentTabIndex = () => tabs.findIndex(tab => tab.id === activeTab);
  const getPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex > 0 ? tabs[currentIndex - 1] : null;
  };
  const getNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-primary-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200">
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isNew ? 'Create New User' : (formData.displayName || 'User Details')}
                  </h1>
                  <p className="text-primary-100">
                    {isNew ? 'Set up a new user account with role-based access' : 'User information and settings'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isNew && !isEditing && (
                <button onClick={() => setActiveTab('basic')} className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit User</span>
                </button>
              )}
              
              {(isEditing || isNew) && (
                <>
                  <button onClick={onClose} className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2">
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button onClick={handleSave} disabled={saving} className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50">
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : (isNew ? 'Create User' : 'Save Changes')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {message && (
            <div className={`p-4 mx-6 mt-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{message.text}</span>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mt-4">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white mx-6 mt-6 rounded-2xl shadow-lg overflow-hidden">
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Display Name *</label>
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
                      {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Email Address *</label>
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
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      {!isNew && <p className="text-xs text-secondary-500 mt-1">Email cannot be changed after account creation</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">First Name</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Last Name</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Phone Number</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Role *</label>
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
                      {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                      {isNew && <p className="text-xs text-secondary-500 mt-1">Note: Applicants should use the public signup form</p>}
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Organization {isNew && '*'}</label>
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
                      {errors.organization && <p className="text-red-500 text-sm mt-1">{errors.organization}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Department</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Position/Title</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Experience</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Education</label>
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
                          <div className="bg-blue-100 p-1 rounded-full mt-1"><Check className="h-3 w-3 text-blue-600" /></div>
                          <span className="text-sm text-blue-800">User account will be created in Firebase Auth</span>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-1 rounded-full mt-1"><Mail className="h-3 w-3 text-blue-600" /></div>
                          <span className="text-sm text-blue-800">Password setup email will be sent to user</span>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-1 rounded-full mt-1"><Shield className="h-3 w-3 text-blue-600" /></div>
                          <span className="text-sm text-blue-800">User must set password before first login</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Email Verification</label>
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
                            {formData.isEmailVerified ? <Check className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-yellow-600" />}
                            <span className="text-secondary-800">{formData.isEmailVerified ? 'Verified' : 'Not verified'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Account Status</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Address</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">City</label>
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
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Country</label>
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
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Bio</label>
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
                </div>
              )}

              {/* Tab Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
                <div>
                  {getPreviousTab() ? (
                    <button
                      onClick={() => setActiveTab(getPreviousTab()!.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      {getPreviousTab()?.label}
                    </button>
                  ) : <div></div>}
                </div>
                
                <div className="text-center">
                  <span className="text-sm text-gray-500">{getCurrentTabIndex() + 1} of {tabs.length}</span>
                </div>

                <div>
                  {getNextTab() ? (
                    <button
                      onClick={() => setActiveTab(getNextTab()!.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                    >
                      {getNextTab()?.label}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </button>
                  ) : <div></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal; 