import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Bell, Upload, Eye, EyeOff, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { FirestoreService, StaffService } from '../../../services/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';

interface DetailedProfileData {
  // Common fields
  id?: string;
  uid?: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  profilePicture?: string;
  
  // Role-specific fields
  role: 'admin' | 'staff' | 'learner' | 'applicant';
  
  // Staff-specific fields
  department?: string;
  position?: string;
  designations?: string[];
  qualifications?: string;
  experience?: string;
  specialization?: string;
  employeeId?: string;
  dateJoined?: string;
  assignedPrograms?: string[];
  type?: 'teaching' | 'administrative' | 'support';
  salary?: number;
  
  // Learner-specific fields
  studentId?: string;
  currentJobTitle?: string;
  currentOrganisation?: string;
  salesExperience?: string;
  keyAchievements?: string;
  programId?: string;
  learningGoals?: string;
  academicStatus?: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  currentGPA?: number;
  enrollmentDate?: string;
  cohort?: string;
  totalFees?: number;
  amountPaid?: number;
  outstandingBalance?: number;
  
  // Admin/User fields
  organization?: string;
  isEmailVerified?: boolean;
  status?: 'active' | 'inactive' | 'suspended' | 'on_leave';
  lastLoginAt?: string;
}

const Profile: React.FC = () => {
  const { user, userProfile, refreshUserProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<DetailedProfileData>({
    email: '',
    displayName: '',
    role: 'applicant'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    studentActivity: true,
    systemUpdates: true,
    eventReminders: true,
    financialAlerts: true,
  });

  useEffect(() => {
    loadProfileData();
  }, [user, userProfile]);

  const loadProfileData = async () => {
    if (!user || !userProfile) return;
    
    setLoading(true);
    try {
      // First get basic user data
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'uid', operator: '==', value: user.uid }
      ]);

      let basicUserData: any = {};
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        basicUserData = userResult.data[0];
      }

      // Based on role, fetch detailed data from appropriate collection
      let detailedData: any = {};
      
      if (userProfile.role === 'staff' || userProfile.role === 'admin') {
        // Try to find in staff collection
        const staffResult = await FirestoreService.getWithQuery('staff', [
          { field: 'email', operator: '==', value: user.email }
        ]);
        
        if (staffResult.success && staffResult.data && staffResult.data.length > 0) {
          detailedData = staffResult.data[0];
        }
      } else if (userProfile.role === 'learner') {
        // Try to find in learners collection
        const learnerResult = await FirestoreService.getWithQuery('learners', [
          { field: 'email', operator: '==', value: user.email }
        ]);
        
        if (learnerResult.success && learnerResult.data && learnerResult.data.length > 0) {
          detailedData = learnerResult.data[0];
        }
      }

      // Merge all data with priority: detailedData > basicUserData > defaults
      const mergedData: DetailedProfileData = {
        ...basicUserData,
        ...detailedData,
        email: user.email || '',
        displayName: detailedData.name || detailedData.displayName || basicUserData.displayName || `${detailedData.firstName || ''} ${detailedData.lastName || ''}`.trim() || '',
        firstName: detailedData.firstName || basicUserData.firstName || '',
        lastName: detailedData.lastName || basicUserData.lastName || '',
        phone: detailedData.phoneNumber || detailedData.phone || basicUserData.phoneNumber || '',
        role: userProfile.role,
        organization: basicUserData.organization || userProfile.organization || 'Msomi Learning Platform'
      };

      setProfileData(mergedData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;

    setSaving(true);
    setMessage(null);

    try {
      // Update users collection
      const userUpdateData = {
        displayName: profileData.displayName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phone,
        organization: profileData.organization,
        bio: profileData.bio,
        address: profileData.address,
        profilePicture: profileData.profilePicture
      };

      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'uid', operator: '==', value: user.uid }
      ]);

      if (userResult.success && userResult.data && userResult.data.length > 0) {
        await FirestoreService.update('users', userResult.data[0].id, userUpdateData);
      }

      // Update role-specific collection
      if (userProfile.role === 'staff' || userProfile.role === 'admin') {
        const staffUpdateData = {
          name: profileData.displayName,
          displayName: profileData.displayName,
          email: profileData.email,
          phone: profileData.phone,
          phoneNumber: profileData.phone,
          address: profileData.address,
          department: profileData.department,
          position: profileData.position,
          designations: profileData.designations || [],
          qualifications: profileData.qualifications,
          experience: profileData.experience,
          specialization: profileData.specialization,
          bio: profileData.bio,
          profilePicture: profileData.profilePicture,
          firstName: profileData.firstName,
          lastName: profileData.lastName
        };

        // Find existing staff record
        const staffResult = await FirestoreService.getWithQuery('staff', [
          { field: 'email', operator: '==', value: user.email }
        ]);

        if (staffResult.success && staffResult.data && staffResult.data.length > 0) {
          await FirestoreService.update('staff', staffResult.data[0].id, staffUpdateData);
        } else {
          // Create new staff record if doesn't exist
          await FirestoreService.create('staff', {
            ...staffUpdateData,
            status: 'active',
            type: 'administrative',
            assignedPrograms: []
          });
        }
      } else if (userProfile.role === 'learner') {
        const learnerUpdateData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phoneNumber: profileData.phone,
          currentJobTitle: profileData.currentJobTitle,
          currentOrganisation: profileData.currentOrganisation,
          salesExperience: profileData.salesExperience,
          keyAchievements: profileData.keyAchievements,
          learningGoals: profileData.learningGoals,
          bio: profileData.bio,
          address: profileData.address,
          profilePicture: profileData.profilePicture
        };

        // Find existing learner record
        const learnerResult = await FirestoreService.getWithQuery('learners', [
          { field: 'email', operator: '==', value: user.email }
        ]);

        if (learnerResult.success && learnerResult.data && learnerResult.data.length > 0) {
          await FirestoreService.update('learners', learnerResult.data[0].id, learnerUpdateData);
        }
      }

      await refreshUserProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to update password. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    setMessage(null);

    try {
      // Create storage reference
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update profile data
      setProfileData(prev => ({
        ...prev,
        profilePicture: downloadURL
      }));

      setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage({ type: 'error', text: 'Failed to upload profile picture. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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

  const renderRoleSpecificFields = () => {
    if (profileData.role === 'staff' || profileData.role === 'admin') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={profileData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={profileData.position || ''}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your position"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Qualifications
            </label>
            <textarea
              rows={3}
              value={profileData.qualifications || ''}
              onChange={(e) => handleInputChange('qualifications', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Your qualifications and certifications"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Experience
            </label>
            <textarea
              rows={3}
              value={profileData.experience || ''}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Your work experience"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Specialization
            </label>
            <input
              type="text"
              value={profileData.specialization || ''}
              onChange={(e) => handleInputChange('specialization', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Your area of specialization"
            />
          </div>
        </>
      );
    } else if (profileData.role === 'learner') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Current Job Title
              </label>
              <input
                type="text"
                value={profileData.currentJobTitle || ''}
                onChange={(e) => handleInputChange('currentJobTitle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your current job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Current Organization
              </label>
              <input
                type="text"
                value={profileData.currentOrganisation || ''}
                onChange={(e) => handleInputChange('currentOrganisation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your current organization"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Sales Experience
            </label>
            <textarea
              rows={3}
              value={profileData.salesExperience || ''}
              onChange={(e) => handleInputChange('salesExperience', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Describe your sales experience"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Key Achievements
            </label>
            <textarea
              rows={3}
              value={profileData.keyAchievements || ''}
              onChange={(e) => handleInputChange('keyAchievements', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Your key achievements and accomplishments"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Learning Goals
            </label>
            <textarea
              rows={3}
              value={profileData.learningGoals || ''}
              onChange={(e) => handleInputChange('learningGoals', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="What do you hope to achieve through this program?"
            />
          </div>

          {profileData.studentId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  value={profileData.studentId}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Academic Status
                </label>
                <input
                  type="text"
                  value={profileData.academicStatus || 'N/A'}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 capitalize"
                />
              </div>
            </div>
          )}
        </>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-lg text-primary-100">
              Manage your personal information and account settings.
            </p>
            <p className="text-sm text-primary-200 mt-1">
              Role: <span className="font-semibold capitalize">{profileData.role}</span>
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Profile Picture */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto overflow-hidden">
                  {profileData.profilePicture ? (
                    <img 
                      src={profileData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-primary-600" />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              <h3 className="text-xl font-semibold text-secondary-800 mt-4">{profileData.displayName || 'No Name'}</h3>
              <p className="text-secondary-600 capitalize">{profileData.role}</p>
              {profileData.role === 'learner' && profileData.studentId && (
                <p className="text-sm text-secondary-500">ID: {profileData.studentId}</p>
              )}
              {profileData.role === 'staff' && profileData.employeeId && (
                <p className="text-sm text-secondary-500">ID: {profileData.employeeId}</p>
              )}
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            {activeTab === 'personal' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Personal Information</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName || ''}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="How you want to be displayed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="+254 700 123 456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={profileData.organization || ''}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Your organization"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Your address"
                    />
                  </div>

                  {/* Role-specific fields */}
                  {renderRoleSpecificFields()}

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      value={profileData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Change Password</h3>
                    <p className="text-secondary-600 mb-4">Update your password to keep your account secure</p>
                    <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter new password"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Confirm new password"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="submit"
                        disabled={saving}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Two-Factor Authentication</h3>
                    <p className="text-secondary-600 mb-4">Add an extra layer of security to your account</p>
                    <button className="bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors duration-200">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  {[
                    { 
                      key: 'emailNotifications', 
                      title: 'Email Notifications', 
                      description: 'Receive updates via email' 
                    },
                    { 
                      key: 'studentActivity', 
                      title: 'Student Activity', 
                      description: 'Get notified about student enrollments and activities' 
                    },
                    { 
                      key: 'systemUpdates', 
                      title: 'System Updates', 
                      description: 'Notifications about system maintenance and updates' 
                    },
                    { 
                      key: 'eventReminders', 
                      title: 'Event Reminders', 
                      description: 'Reminders about upcoming events and deadlines' 
                    },
                    { 
                      key: 'financialAlerts', 
                      title: 'Financial Alerts', 
                      description: 'Notifications about payments and financial activities' 
                    },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-secondary-800">{setting.title}</h3>
                        <p className="text-sm text-secondary-600">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications[setting.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications(prev => ({
                            ...prev,
                            [setting.key]: e.target.checked
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <button 
                    onClick={() => setMessage({ type: 'success', text: 'Notification preferences saved!' })}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-5 w-5" />
                    <span>Save Preferences</span>
                  </button>
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
    </div>
  );
};

export default Profile;