import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit, User, Mail, Phone, Calendar, Shield, Building, MapPin, X, Check, AlertCircle } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

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
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = location.pathname.includes('/edit');
  const isNew = id === 'new';
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isNew) {
      setUser(null);
      setFormData({
        role: 'applicant',
        status: 'active',
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
    } else if (id) {
      loadUser(id);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      let result;
      if (isNew) {
        result = await FirestoreService.create('users', dataToSave);
      } else {
        result = await FirestoreService.update('users', id!, dataToSave);
      }

      if (result.success) {
        navigate('/portal/users');
      }
    } catch (error) {
      console.error('Error saving user:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/portal/users')}
            className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary-800">
              {isNew ? 'Add New User' : isEditing ? 'Edit User' : 'User Details'}
            </h1>
            <p className="text-secondary-600">
              {isNew 
                ? 'Create a new user account'
                : isEditing 
                ? 'Update user information'
                : 'View and manage user details'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isNew && !isEditing && (
            <button
              onClick={() => navigate(`/portal/users/${id}/edit`)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit User</span>
            </button>
          )}
          
          {(isEditing || isNew) && (
            <>
              <button
                onClick={() => navigate(isNew ? '/portal/users' : `/portal/users/${id}`)}
                className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save User'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {formData.profilePicture ? (
                  <img 
                    src={formData.profilePicture} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-600" />
                )}
              </div>
              
              <h2 className="text-xl font-bold text-secondary-800 mb-2">
                {formData.displayName || 'New User'}
              </h2>
              
              <div className="flex justify-center space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(formData.role || 'learner')}`}>
                  {formData.role?.charAt(0).toUpperCase()}{formData.role?.slice(1)}
                </span>
                {!isNew && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(formData.isEmailVerified || false, formData.status)}`}>
                    {getStatusText(formData.isEmailVerified || false, formData.status)}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">{formData.email || 'No email'}</span>
                </div>
                {formData.phoneNumber && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-secondary-400" />
                    <span className="text-secondary-600">{formData.phoneNumber}</span>
                  </div>
                )}
                {formData.organization && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-secondary-400" />
                    <span className="text-secondary-600">{formData.organization}</span>
                  </div>
                )}
                {formData.createdAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-secondary-400" />
                    <span className="text-secondary-600">
                      Joined {new Date(formData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - User Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Display Name *
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.displayName || ''}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.displayName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter display name"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.displayName || 'Not provided'}</p>
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.email || 'Not provided'}</p>
                    )}
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.firstName || 'Not provided'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.lastName || 'Not provided'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.phoneNumber || 'Not provided'}</p>
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.role ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select role</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="learner">Learner</option>
                        <option value="applicant">Applicant</option>
                      </select>
                    ) : (
                      <p className="text-secondary-800 capitalize">{formData.role || 'Not assigned'}</p>
                    )}
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Organization
                    </label>
                    {isEditing || isNew ? (
                      <input
                        type="text"
                        value={formData.organization || ''}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter organization"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.organization || 'Not provided'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter department"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.department || 'Not provided'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter position or job title"
                      />
                    ) : (
                      <p className="text-secondary-800">{formData.position || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Status */}
              {(isEditing || !isNew) && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Account Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="flex items-center space-x-2">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      ) : (
                        <p className="text-secondary-800 capitalize">{formData.status || 'active'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Additional Information</h3>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Bio
                  </label>
                  {isEditing || isNew ? (
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter user bio..."
                    />
                  ) : (
                    <p className="text-secondary-800 whitespace-pre-wrap">{formData.bio || 'No bio provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage; 