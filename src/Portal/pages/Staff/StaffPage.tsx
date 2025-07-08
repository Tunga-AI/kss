import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, ArrowLeft, Edit, Mail, Phone, MapPin, GraduationCap, BookOpen, Award, Calendar, Users, Save, Plus, X } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface StaffData {
  id?: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  designations: string[];
  qualifications?: string;
  experience?: string;
  specialization?: string;
  summary?: string;
  dateJoined?: string;
  assignedPrograms: string[];
  status: 'active' | 'inactive' | 'on_leave';
  type: 'teaching' | 'administrative' | 'support';
  employeeId?: string;
  salary?: number;
  createdAt?: string;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  level?: string;
  status: string;
  students?: number;
}

const StaffPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('personal');
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New staff = editing mode

  // Staff designation options
  const staffDesignations = [
    'Instructor',
    'Committee Member',
    'Program Coordinator',
    'Department Head',
    'Academic Advisor',
    'Research Coordinator',
    'Administrative Assistant',
    'Finance Officer',
    'HR Manager',
    'IT Support',
    'Librarian',
    'Student Affairs Officer',
    'Registrar',
    'Counselor',
    'Security Officer',
    'Maintenance Staff',
    'Quality Assurance',
    'Marketing Officer',
    'Other'
  ];

  // Form state
  const [formData, setFormData] = useState<StaffData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    designations: ['Instructor'], // Default designation
    qualifications: '',
    experience: '',
    specialization: '',
    summary: '',
    dateJoined: new Date().toISOString().split('T')[0],
    assignedPrograms: [],
    status: 'active',
    type: 'teaching',
    employeeId: '',
    salary: 0
  });

  const tabs = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'professional', label: 'Professional Information' },
    { id: 'programs', label: 'Programs' },
  ];

  useEffect(() => {
    if (id) {
      loadStaff(id);
    }
    loadPrograms();
  }, [id]);

  const loadStaff = async (staffId: string) => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('staff', staffId);
      if (result.success && result.data) {
        const data = result.data as any;
        const staffData = {
          ...data,
          assignedPrograms: data.assignedPrograms || [],
          designations: data.designations || []
        } as StaffData;
        setStaff(staffData);
        setFormData(staffData);
      } else {
        console.error('Staff member not found');
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await FirestoreService.getAll('programs');
      if (result.success && result.data) {
        setAvailablePrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  // Get assigned programs details
  useEffect(() => {
    if (staff && availablePrograms.length > 0) {
      const assignedProgramDetails = availablePrograms.filter(program => 
        staff.assignedPrograms.includes(program.id)
      );
      setPrograms(assignedProgramDetails);
    }
  }, [staff, availablePrograms]);

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

  const handleProgramToggle = (programId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedPrograms: prev.assignedPrograms.includes(programId)
        ? prev.assignedPrograms.filter(id => id !== programId)
        : [...prev.assignedPrograms, programId]
    }));
  };

  const generateEmployeeId = () => {
    const prefix = formData.type === 'teaching' ? 'TCH' : 
                   formData.type === 'administrative' ? 'ADM' : 'SUP';
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${randomNum}`;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in required fields (Name and Email)');
      return;
    }

    setSaving(true);
    try {
      // Generate employee ID if creating new staff
      const dataToSave = {
        ...formData,
        employeeId: formData.employeeId || generateEmployeeId(),
        createdAt: formData.createdAt || new Date().toISOString(),
        createdBy: userProfile?.uid || 'system',
        displayName: formData.name
      };

      let result;
      if (id) {
        result = await FirestoreService.update('staff', id, dataToSave);
      } else {
        result = await FirestoreService.create('staff', dataToSave);
      }

      if (result.success) {
        // Also create/update in users collection for login access
        const userData = {
          uid: id || (result as any).id,
          email: dataToSave.email,
          displayName: dataToSave.name,
          role: dataToSave.type === 'teaching' ? 'staff' : 'staff',
          organization: 'Msomi Learning Platform',
          firstName: dataToSave.name.split(' ')[0] || '',
          lastName: dataToSave.name.split(' ').slice(1).join(' ') || '',
          phoneNumber: dataToSave.phone || '',
          department: dataToSave.department || '',
          position: dataToSave.position || '',
          createdAt: new Date().toISOString(),
          isEmailVerified: false
        };

        // Save to users collection
        try {
          const userResult = await FirestoreService.createOrUpdate('users', userData.uid, userData);
          console.log('User profile created/updated:', userResult.success);
        } catch (userError) {
          console.error('Error creating user profile:', userError);
        }

        if (!id && (result as any).id) {
          navigate(`/portal/staff/${(result as any).id}`);
        } else {
          setIsEditing(false);
          // Reload data
          if (id) {
            loadStaff(id);
          }
        }
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Error saving staff member. Please try again.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent-100 text-accent-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'teaching': return 'bg-primary-100 text-primary-800';
      case 'administrative': return 'bg-secondary-100 text-secondary-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgramStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent-100 text-accent-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!staff && id) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-secondary-800 mb-2">Staff Member Not Found</h3>
        <p className="text-secondary-600">The staff member you're looking for doesn't exist.</p>
      </div>
    );
  }

  const currentData = isEditing ? formData : staff!;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/portal/staff')}
            className="flex items-center space-x-2 text-primary-100 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Staff</span>
          </button>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 relative"
                  title={saving ? 'Saving...' : 'Save'}
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Save className="h-5 w-5 text-white" />
                  )}
                </button>
                <button 
                  onClick={handleCancel}
                  className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-all duration-200"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-all duration-200"
              >
                <Edit className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <UserCheck className="h-12 w-12 text-white" />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-4xl font-bold mb-2 bg-transparent border-b border-white border-opacity-50 text-white placeholder-primary-200 focus:outline-none focus:border-opacity-100"
                  placeholder="Staff Member Name"
                />
              ) : (
                <h1 className="text-4xl font-bold mb-2">
                  {id ? (isEditing ? 'Edit Staff Member' : currentData.name || 'Staff Details') : 'New Staff Member'}
                </h1>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.position || ''}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="text-lg bg-transparent border-b border-white border-opacity-50 text-primary-100 placeholder-primary-200 focus:outline-none focus:border-opacity-100 mb-2"
                  placeholder="Position"
                />
              ) : (
                <p className="text-lg text-primary-100 mb-2">{currentData.position}</p>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="bg-transparent border-b border-white border-opacity-50 text-primary-200 placeholder-primary-200 focus:outline-none focus:border-opacity-100"
                  placeholder="Department"
                />
              ) : (
                <p className="text-primary-200">{currentData.department}</p>
              )}
              <div className="flex items-center space-x-4 mt-4">
                {isEditing ? (
                  <>
                    <select
                      value={currentData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white text-secondary-800"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                    <select
                      value={currentData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white text-secondary-800"
                    >
                      <option value="teaching">Teaching</option>
                      <option value="administrative">Administrative</option>
                      <option value="support">Support</option>
                    </select>
                  </>
                ) : (
                  <>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentData.status)}`}>
                      {currentData.status.charAt(0).toUpperCase() + currentData.status.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(currentData.type)}`}>
                      {currentData.type.charAt(0).toUpperCase() + currentData.type.slice(1)}
                    </span>
                  </>
                )}
                <span className="text-primary-100">{currentData.experience} experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Employee ID</p>
                <p className="text-2xl font-bold text-white">{currentData.employeeId || 'N/A'}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Assigned Programs</p>
                <p className="text-2xl font-bold text-white">{currentData.assignedPrograms.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
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
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'personal' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Contact Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <Mail className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-secondary-500">Email Address</p>
                          {isEditing ? (
                            <input
                              type="email"
                              value={currentData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          ) : (
                            <p className="text-secondary-800 font-medium">{currentData.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-accent-100 p-2 rounded-lg">
                          <Phone className="h-5 w-5 text-accent-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-secondary-500">Phone Number</p>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={currentData.phone || ''}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          ) : (
                            <p className="text-secondary-800 font-medium">{currentData.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-secondary-100 p-2 rounded-lg">
                          <MapPin className="h-5 w-5 text-secondary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-secondary-500">Address</p>
                          {isEditing ? (
                            <textarea
                              value={currentData.address || ''}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              rows={2}
                            />
                          ) : (
                            <p className="text-secondary-800 font-medium">{currentData.address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Personal Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Full Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        ) : (
                          <p className="text-secondary-800 font-medium">{currentData.name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Employee ID</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentData.employeeId || ''}
                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Leave empty to auto-generate"
                          />
                        ) : (
                          <p className="text-secondary-800 font-medium">{currentData.employeeId}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Department</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentData.department || ''}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-secondary-800 font-medium">{currentData.department}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Date Joined</p>
                        {isEditing ? (
                          <input
                            type="date"
                            value={currentData.dateJoined}
                            onChange={(e) => handleInputChange('dateJoined', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-secondary-800 font-medium">
                            {currentData.dateJoined ? new Date(currentData.dateJoined).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Designations</p>
                        {isEditing ? (
                          <div>
                            <div className="flex flex-wrap gap-2 mb-2">
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
                            <div className="flex space-x-2">
                              <select
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleDesignationAdd(e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="">Select designation...</option>
                                {staffDesignations.map((designation) => (
                                  <option key={designation} value={designation}>
                                    {designation}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentData.designations.map((designation, index) => (
                              <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                                {designation}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Professional Information</h2>
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Qualifications & Experience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-secondary-500 mb-2">Primary Qualification</p>
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-primary-600" />
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentData.qualifications || ''}
                            onChange={(e) => handleInputChange('qualifications', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., Master's in Business Administration"
                          />
                        ) : (
                          <p className="text-secondary-800 font-medium">{currentData.qualifications}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500 mb-2">Experience</p>
                      <div className="flex items-center space-x-3">
                        <div className="bg-accent-100 p-2 rounded-lg">
                          <Award className="h-5 w-5 text-accent-600" />
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentData.experience || ''}
                            onChange={(e) => handleInputChange('experience', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., 5 years"
                          />
                        ) : (
                          <p className="text-secondary-800 font-medium">{currentData.experience}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Specialization</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.specialization || ''}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Human Resources Management, Financial Planning"
                    />
                  ) : (
                    <p className="text-secondary-600">{currentData.specialization}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Professional Summary</h3>
                  {isEditing ? (
                    <textarea
                      value={currentData.summary || ''}
                      onChange={(e) => handleInputChange('summary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      placeholder="Professional summary and achievements..."
                    />
                  ) : (
                    <p className="text-secondary-600 leading-relaxed">{currentData.summary}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Salary Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-secondary-500 mb-2">Monthly Salary</p>
                        <input
                          type="number"
                          value={currentData.salary || 0}
                          onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'programs' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Programs Assignment</h2>
              
              {isEditing && (
                <div className="mb-8 bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Available Programs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availablePrograms.map((program) => (
                      <label key={program.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={currentData.assignedPrograms.includes(program.id)}
                          onChange={() => handleProgramToggle(program.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium text-secondary-800">{program.programName}</p>
                          <p className="text-sm text-secondary-600">{program.programCode} • {program.level}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold text-secondary-800 mb-4">Assigned Programs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((program) => (
                  <div key={program.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary-600" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProgramStatusColor(program.status)}`}>
                        {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">{program.programName}</h3>
                    <p className="text-secondary-600 text-sm mb-4">Code: {program.programCode}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Level:</span>
                        <span className="text-secondary-800 font-medium">{program.level}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Students:</span>
                        <span className="text-secondary-800 font-medium">{program.students || 0}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/portal/programs/${program.id}`)}
                      className="w-full text-primary-600 hover:text-primary-700 font-medium text-sm bg-primary-50 hover:bg-primary-100 py-2 rounded-lg transition-colors duration-200"
                    >
                      View Program Details
                    </button>
                  </div>
                ))}
                
                {programs.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Programs Assigned</h3>
                    <p className="text-secondary-600">
                      {isEditing ? 'Select programs from the available programs above.' : 'This staff member has no assigned programs yet.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPage; 