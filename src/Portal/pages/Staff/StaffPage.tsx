import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, ArrowLeft, Edit, Save, User, Briefcase, Mail, Phone, MapPin, GraduationCap, Award, Calendar, Users, Plus, X, ChevronLeft, ChevronRight, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
// Firebase imports removed - we now create users directly in Firestore users collection

interface StaffData {
  id?: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string;
  address?: string;
  position?: string;
  designations: string[];
  qualifications?: string;
  experience?: string;
  specialization?: string;
  summary?: string;
  dateJoined?: string;
  assignedPrograms: string[];
  status: 'active' | 'inactive' | 'on_leave';
  type: 'administrative' | 'support';
  employeeId?: string;
  salary?: number;
  profileImage?: string;
  createdAt?: string;
  department?: string;
  uid?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  department?: string;
  level?: 'entry' | 'mid' | 'senior' | 'executive';
  status: 'active' | 'inactive';
  createdAt: string;
}

const StaffPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('personal');
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Default to view mode
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStaffData, setPendingStaffData] = useState<StaffData | null>(null);

  // Form state
  const [formData, setFormData] = useState<StaffData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    designations: [],
    qualifications: '',
    experience: '',
    specialization: '',
    summary: '',
    dateJoined: new Date().toISOString().split('T')[0],
    assignedPrograms: [],
    status: 'active',
    type: 'administrative',
    employeeId: '',
    salary: 0,
    profileImage: '',
    department: ''
  });

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'employment', label: 'Employment Information', icon: Briefcase },
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

  useEffect(() => {
    if (location.pathname.endsWith('/my-profile')) {
      // Load current user's staff profile
      loadCurrentUserStaffProfile();
    } else if (id) {
      // Load specific staff member by ID
      loadStaff(id);
    } else {
      // No ID means new staff creation
      setIsEditing(true);
    }
    loadRoles();
  }, [id, location.pathname, user, userProfile]);

  const loadStaff = async (staffId: string) => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('staff', staffId);
      if (result.success && result.data) {
        const data = result.data as StaffData;
        const staffData = {
          ...data,
          assignedPrograms: data.assignedPrograms || [],
          designations: data.designations || []
        };
        setStaff(staffData);
        setFormData(staffData);
        setIsEditing(false); // View mode for existing staff
      } else {
        setMessage({ type: 'error', text: 'Staff member not found' });
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setMessage({ type: 'error', text: 'Error loading staff member' });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserStaffProfile = async () => {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'User email not available' });
      return;
    }

    setLoading(true);
    try {
      // First try to find staff record by email
      const result = await FirestoreService.getWithQuery('staff', [
        { field: 'email', operator: '==', value: user.email }
      ]);
      
      if (result.success && result.data && result.data.length > 0) {
        const data = result.data[0] as StaffData;
        const staffData = {
          ...data,
          assignedPrograms: data.assignedPrograms || [],
          designations: data.designations || []
        };
        setStaff(staffData);
        setFormData(staffData);
        setIsEditing(false); // View mode for current user's profile
      } else {
        // If no staff record found, try to find by UID
        const uidResult = await FirestoreService.getWithQuery('staff', [
          { field: 'uid', operator: '==', value: user.uid }
        ]);
        
        if (uidResult.success && uidResult.data && uidResult.data.length > 0) {
          const data = uidResult.data[0] as StaffData;
          const staffData = {
            ...data,
            assignedPrograms: data.assignedPrograms || [],
            designations: data.designations || []
          };
          setStaff(staffData);
          setFormData(staffData);
          setIsEditing(false); // View mode for current user's profile
        } else {
          // No staff record found, pre-populate with user data for profile creation
          const userData = {
            name: userProfile?.displayName || '',
            email: user.email || '',
            phone: '',
            address: '',
            position: '',
            designations: [],
            qualifications: '',
            experience: '',
            specialization: '',
            summary: '',
            dateJoined: new Date().toISOString().split('T')[0],
            assignedPrograms: [],
            status: 'active' as const,
            type: 'administrative' as const,
            employeeId: '',
            salary: 0,
            profileImage: '',
            department: ''
          };
          setFormData(userData);
          setIsEditing(true); // Edit mode to create profile
          setMessage({ 
            type: 'error', 
            text: 'Staff profile not found. Please create your profile.' 
          });
        }
      }
    } catch (error) {
      console.error('Error loading current user staff profile:', error);
      setMessage({ type: 'error', text: 'Error loading your profile' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const result = await FirestoreService.getAll('roles');
      if (result.success && result.data) {
        setRoles(result.data as Role[]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleInputChange = (field: keyof StaffData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDesignationAdd = (designation: string) => {
    if (designation && !formData.designations.includes(designation)) {
      setFormData(prev => ({
        ...prev,
        designations: [...prev.designations, designation]
      }));
    }
  };

  const handleDesignationRemove = (designation: string) => {
    setFormData(prev => ({
      ...prev,
      designations: prev.designations.filter(d => d !== designation)
    }));
  };

  const generateEmployeeId = async () => {
    try {
      const result = await FirestoreService.getAll('staff');
      let maxId = 0;
      
      if (result.success && result.data) {
        const staffList = result.data as StaffData[];
        staffList.forEach(staff => {
          if (staff.employeeId && staff.employeeId.startsWith('ST')) {
            const numStr = staff.employeeId.substring(2);
            const num = parseInt(numStr);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        });
      }
      
      const nextId = maxId + 1;
      return `ST${nextId.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return `ST${Math.floor(Math.random() * 999) + 1}`.padStart(5, '0');
    }
  };

  const createOrUpdateUserRecord = async (email: string, displayName: string, staffData: StaffData) => {
    try {
      console.log('🔍 Checking if user exists with email:', email);
      
      // Check if user already exists in users collection
      const existingUserResult = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: email.toLowerCase() }
      ]);

      const userDoc = {
        email: email.toLowerCase(),
        displayName: displayName,
        firstName: staffData.name.split(' ')[0] || '',
        lastName: staffData.name.split(' ').slice(1).join(' ') || '',
        role: 'staff' as const,
        organization: 'Kenya School of Sales',
        phoneNumber: staffData.phone || '',
        position: staffData.position || '',
        bio: staffData.summary || '',
        status: 'active',
        isEmailVerified: false,
        hasFirebaseAuth: false, // Staff member hasn't set password yet
        isActive: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.uid || 'system'
      };

      if (existingUserResult.success && existingUserResult.data && existingUserResult.data.length > 0) {
        // User already exists, update their information (except email)
        const existingUser = existingUserResult.data[0];
        console.log('✅ User exists, updating record:', existingUser.id);
        
        const updateData = {
          ...userDoc,
          // Preserve existing Firebase auth status if they already have it
          hasFirebaseAuth: existingUser.hasFirebaseAuth || false,
          firebaseAuthCreatedAt: existingUser.firebaseAuthCreatedAt,
          // Don't overwrite creation data
          createdAt: existingUser.createdAt,
          createdBy: existingUser.createdBy
        };
        
        const result = await FirestoreService.update('users', existingUser.id, updateData);
        
        return {
          success: true,
          isNewUser: false,
          userId: existingUser.id,
          userRecord: { ...existingUser, ...updateData },
          message: `${displayName} already exists as a user. Their information has been updated and they are now added to staff.`
        };
      } else {
        // Create new user record
        console.log('🆕 Creating new user record');
        const newUserDoc = {
          ...userDoc,
          createdAt: new Date().toISOString(),
          createdBy: userProfile?.uid || 'system'
        };
        
        const result = await FirestoreService.create('users', newUserDoc);
        
        if (result.success) {
          return {
            success: true,
            isNewUser: true,
            userId: result.id,
            userRecord: { ...newUserDoc, id: result.id },
            message: `${displayName} has been added as a staff member! They can now log in using their email and will be prompted to set up their password.`
          };
        } else {
          throw new Error('Failed to create user record');
        }
      }
    } catch (error: any) {
      console.error('Failed to create or update user:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setMessage({ type: 'error', text: 'Please fill in required fields (Name and Email)' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const dataToSave = {
        ...formData,
        employeeId: formData.employeeId || await generateEmployeeId(),
        createdAt: formData.createdAt || new Date().toISOString(),
        createdBy: userProfile?.uid || 'system',
        displayName: formData.name
      };

      let result;
      if (id) {
        // Update existing staff member
        result = await FirestoreService.update('staff', id, dataToSave);

        if (result.success) {
          try {
            const userData = {
              email: dataToSave.email,
              displayName: dataToSave.name,
              firstName: dataToSave.name.split(' ')[0] || '',
              lastName: dataToSave.name.split(' ').slice(1).join(' ') || '',
              phoneNumber: dataToSave.phone || '',
              position: dataToSave.position || '',
              bio: dataToSave.summary || '',
              updatedAt: new Date().toISOString()
            };

            await FirestoreService.update('users', id, userData);
          } catch (userError) {
            console.error('Error updating user profile:', userError);
          }

          setMessage({ type: 'success', text: 'Staff member updated successfully!' });
        }
              } else {
        // Create new staff member - show confirmation modal first
        setPendingStaffData(dataToSave);
        setShowConfirmModal(true);
        return;
      }

      if (result && result.success) {
        setIsEditing(false);
        if (id) {
          loadStaff(id);
        }
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      setMessage({ type: 'error', text: 'Error saving staff member. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!id) {
      navigate('/portal/staff');
    } else {
      setFormData(staff!);
      setIsEditing(false);
    }
  };

  const handleConfirmedStaffCreation = async () => {
    if (!pendingStaffData) return;

    setSaving(true);
    setShowConfirmModal(false);
    setMessage(null);

    try {
      console.log('🔄 Starting staff creation process...');
      
      // Create or update user record in users collection
      const userResult = await createOrUpdateUserRecord(
        pendingStaffData.email, 
        pendingStaffData.name, 
        pendingStaffData
      );
      
      if (userResult.success) {
        // Create staff document with the user ID
        const staffDataWithUserId = {
          ...pendingStaffData,
          uid: userResult.userId // Link to user record
        };

        const staffResult = await FirestoreService.create('staff', staffDataWithUserId);
        
        if (staffResult.success) {
          console.log('✅ Staff record created successfully');
          setMessage({ type: 'success', text: userResult.message });
          
          // Navigate to the new staff member's page
          setTimeout(() => {
            navigate(`/portal/staff/${staffResult.id}`);
          }, 2000);
        } else {
          setMessage({ type: 'error', text: 'Failed to create staff record. Please try again.' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to create user record. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      setMessage({ type: 'error', text: 'Error creating staff member. Please try again.' });
    } finally {
      setSaving(false);
      setPendingStaffData(null);
    }
  };

  const handleCancelStaffCreation = () => {
    setShowConfirmModal(false);
    setPendingStaffData(null);
    setSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'administrative': return 'bg-secondary-100 text-secondary-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableRoles = () => {
    const activeRoleNames = roles
      .filter(role => role.status === 'active')
      .map(role => role.name);
    
    // Return unique role names only
    return [...new Set(activeRoleNames)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentData = isEditing ? formData : (staff || formData);

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <UserCheck className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/staff')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {location.pathname.endsWith('/my-profile') 
                  ? `Welcome, ${currentData.name || user?.displayName || user?.email?.split('@')[0] || 'User'}!`
                  : id 
                    ? (isEditing ? 'Edit Staff Member' : currentData.name || 'Staff Details') 
                    : 'New Staff Member'
                }
              </h1>
              <p className="text-lg text-primary-100">
                {location.pathname.endsWith('/my-profile')
                  ? 'This is your profile - you can view and edit your information here'
                  : id 
                    ? `Employee ID: ${currentData.employeeId || 'N/A'}` 
                    : 'Create a new staff member profile'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Staff Member'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Status</p>
                  <p className="text-2xl font-bold text-white">{currentData.status.toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Designations</p>
                  <p className="text-2xl font-bold text-white">{currentData.designations.length}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Years at Institution</p>
                  <p className="text-2xl font-bold text-white">
                    {currentData.dateJoined ? new Date().getFullYear() - new Date(currentData.dateJoined).getFullYear() : 0}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
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
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={currentData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={currentData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={currentData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={currentData.employeeId || ''}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Address
                </label>
                <textarea
                  value={currentData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  rows={3}
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Designations/Roles
                </label>
                {isEditing ? (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentData.designations.map((designation, index) => (
                        <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center space-x-1">
                          <span>{designation}</span>
                          <button
                            onClick={() => handleDesignationRemove(designation)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleDesignationAdd(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select role to add...</option>
                      {getAvailableRoles().map((roleName) => (
                        <option key={roleName} value={roleName}>
                          {roleName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentData.designations.length > 0 ? (
                      currentData.designations.map((designation, index) => (
                        <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                          {designation}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No designations assigned</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'employment' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Employment Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Position/Job Title
                  </label>
                  <input
                    type="text"
                    value={currentData.position || ''}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., Senior Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status
                  </label>
                  <select
                    value={currentData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Date Joined
                </label>
                <input
                  type="date"
                  value={currentData.dateJoined}
                  onChange={(e) => handleInputChange('dateJoined', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Professional Summary
                </label>
                <textarea
                  value={currentData.summary || ''}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  rows={4}
                  placeholder="Professional summary and achievements..."
                />
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Staff Creation</h3>
                <p className="text-sm text-gray-500">This will create a user record and add them to staff</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                You are about to add a new staff member:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div><strong>Name:</strong> {pendingStaffData?.name}</div>
                  <div><strong>Email:</strong> {pendingStaffData?.email}</div>
                  <div><strong>Position:</strong> {pendingStaffData?.position || 'Not specified'}</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• A user record will be created in the users collection</li>
                      <li>• If the email exists, existing user info will be updated</li>
                      <li>• The staff member can log in using their email</li>
                      <li>• First-time users will be prompted to set up their password</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelStaffCreation}
                disabled={saving}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedStaffCreation}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Create Staff Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage; 