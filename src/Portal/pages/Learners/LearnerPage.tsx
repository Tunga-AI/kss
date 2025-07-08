import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, GraduationCap, Edit, User, Briefcase, FileText, Banknote, Plus, Trash2 } from 'lucide-react';
import { FirestoreService, ProgramService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface LearnerData {
  id?: string;
  studentId?: string;
  // Profile
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  // Job Details
  currentJobTitle: string;
  currentOrganisation: string;
  salesExperience: string;
  keyAchievements: string;
  // Academic
  programId: string;
  learningGoals: string;
  enrollmentDate: string;
  academicStatus: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  cohort: string; // Keep for backward compatibility
  cohortId?: string; // New field from cohorts collection
  cohortName?: string; // Cohort name from cohorts collection
  currentGPA?: number;
  // Finance
  paymentRecords: {
    id: string;
    date: string;
    amount: number;
    type: 'tuition' | 'fees' | 'materials' | 'other';
    status: 'paid' | 'pending' | 'overdue';
    description: string;
    method?: string;
  }[];
  totalFees: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentPlan?: string;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  level?: string;
  status: string;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  programId: string;
  startDate: string;
  closeDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  maxStudents?: number;
  enrolledCount?: number;
}

const LearnerPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New learner = editing mode
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  const [learnerData, setLearnerData] = useState<LearnerData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    currentJobTitle: '',
    currentOrganisation: '',
    salesExperience: '',
    keyAchievements: '',
    programId: '',
    learningGoals: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    academicStatus: 'active',
    cohort: '',
    cohortId: '',
    cohortName: '',
    currentGPA: 0,
    paymentRecords: [],
    totalFees: 0,
    amountPaid: 0,
    outstandingBalance: 0,
    paymentPlan: 'full'
  });

  const [newPayment, setNewPayment] = useState({
    amount: '',
    type: 'tuition' as const,
    description: '',
    method: 'cash'
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'job-details', label: 'Job Details', icon: Briefcase },
    { id: 'academic', label: 'Academic', icon: FileText },
    { id: 'finance', label: 'Finance', icon: Banknote },
  ];

  useEffect(() => {
    if (id) {
      loadLearner();
    } else if (userProfile?.role === 'learner' && user?.email) {
      // For learners accessing their own profile
      loadLearnerByEmail();
    } else if (!id && user && userProfile) {
      // For new learners, pre-populate with user data
      initializeWithUserProfile();
    }
    loadPrograms();
    loadCohorts();
  }, [id, userProfile, user]);

  const loadLearner = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('learners', id!);
      if (result.success) {
        setLearnerData(result.data as LearnerData);
      }
    } catch (error) {
      console.error('Error loading learner:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLearnerByEmail = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('learners', [
        { field: 'email', operator: '==', value: user!.email }
      ]);
      if (result.success && result.data && result.data.length > 0) {
        setLearnerData(result.data[0] as LearnerData);
        setIsEditing(false); // Existing learner, view mode
      } else {
        // No learner found, pre-populate with user profile data
        initializeWithUserProfile();
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading learner by email:', error);
      initializeWithUserProfile();
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const initializeWithUserProfile = async () => {
    if (!user) return;

    try {
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'uid', operator: '==', value: user.uid }
      ]);

      let userData: any = {};
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        userData = userResult.data[0];
      }

      // Pre-populate with available data
      setLearnerData(prev => ({
        ...prev,
        firstName: userData.firstName || userProfile?.displayName?.split(' ')[0] || '',
        lastName: userData.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phoneNumber: userData.phoneNumber || '',
        currentOrganisation: userData.organization || userProfile?.organization || '',
      }));
    } catch (error) {
      console.error('Error loading user profile for pre-population:', error);
      setLearnerData(prev => ({
        ...prev,
        firstName: userProfile?.displayName?.split(' ')[0] || '',
        lastName: userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        currentOrganisation: userProfile?.organization || '',
      }));
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await ProgramService.getAll('programs');
      if (result.success && result.data) {
        setPrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadCohorts = async () => {
    try {
      const result = await FirestoreService.getAll('cohorts');
      if (result.success && result.data) {
        // Filter to show only active cohorts
        const activeCohortsData = (result.data as Cohort[]).filter(cohort => 
          cohort.status === 'active' || cohort.status === 'draft'
        );
        setCohorts(activeCohortsData);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const generateStudentId = async () => {
    try {
      const result = await FirestoreService.getAll('learners');
      if (result.success && result.data) {
        const count = result.data.length + 1;
        return `LN${count.toString().padStart(3, '0')}`;
      }
      return 'LN001';
    } catch (error) {
      console.error('Error generating student ID:', error);
      return 'LN001';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...learnerData };

      if (!id) {
        // Generate student ID for new learners
        dataToSave.studentId = await generateStudentId();
        dataToSave.enrollmentDate = new Date().toISOString().split('T')[0];
        result = await FirestoreService.create('learners', dataToSave);
      } else {
        result = await FirestoreService.update('learners', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/learners/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving learner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LearnerData, value: any) => {
    setLearnerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPayment = () => {
    if (newPayment.amount && newPayment.description) {
      const payment = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(newPayment.amount),
        type: newPayment.type,
        status: 'paid' as const,
        description: newPayment.description,
        method: newPayment.method
      };
      
      const updatedRecords = [...learnerData.paymentRecords, payment];
      const newAmountPaid = learnerData.amountPaid + payment.amount;
      const newOutstanding = learnerData.totalFees - newAmountPaid;
      
      setLearnerData(prev => ({
        ...prev,
        paymentRecords: updatedRecords,
        amountPaid: newAmountPaid,
        outstandingBalance: Math.max(0, newOutstanding)
      }));
      
      setNewPayment({ amount: '', type: 'tuition', description: '', method: 'cash' });
    }
  };

  const removePayment = (paymentId: string) => {
    const paymentToRemove = learnerData.paymentRecords.find(p => p.id === paymentId);
    if (paymentToRemove) {
      const updatedRecords = learnerData.paymentRecords.filter(p => p.id !== paymentId);
      const newAmountPaid = learnerData.amountPaid - paymentToRemove.amount;
      const newOutstanding = learnerData.totalFees - newAmountPaid;
      
      setLearnerData(prev => ({
        ...prev,
        paymentRecords: updatedRecords,
        amountPaid: Math.max(0, newAmountPaid),
        outstandingBalance: Math.max(0, newOutstanding)
      }));
    }
  };

  const getSelectedProgram = () => {
    return programs.find(p => p.id === learnerData.programId);
  };

  const getSelectedCohort = () => {
    return cohorts.find(c => c.id === learnerData.cohortId);
  };

  const getAcademicStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/learners')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {userProfile?.role === 'learner' 
                  ? (id ? (isEditing ? 'Edit My Profile' : 'My Profile') : 'Create Profile')
                  : (id ? (isEditing ? 'Edit Learner' : `${learnerData.firstName} ${learnerData.lastName}` || 'Learner Details') : 'New Learner')
                }
              </h1>
              <p className="text-lg text-primary-100">
                {userProfile?.role === 'learner'
                  ? (id ? `Student ID: ${learnerData.studentId || 'N/A'}` : 'Complete your learner profile')
                  : (id ? `Student ID: ${learnerData.studentId || 'N/A'}` : 'Create a new learner profile')
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
                <span>{saving ? 'Saving...' : 'Save Learner'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Academic Status</p>
                  <p className="text-2xl font-bold text-white">{learnerData.academicStatus.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-white">KSh {learnerData.outstandingBalance?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Banknote className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Program</p>
                  <p className="text-2xl font-bold text-white">{getSelectedProgram()?.programName || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
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
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={learnerData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={learnerData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={learnerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={learnerData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'job-details' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Job Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Current Job Title/Role
                  </label>
                  <input
                    type="text"
                    value={learnerData.currentJobTitle}
                    onChange={(e) => handleInputChange('currentJobTitle', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., Sales Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Current Organisation
                  </label>
                  <input
                    type="text"
                    value={learnerData.currentOrganisation}
                    onChange={(e) => handleInputChange('currentOrganisation', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  How many years of experience do you have in sales?
                </label>
                <input
                  type="text"
                  value={learnerData.salesExperience}
                  onChange={(e) => handleInputChange('salesExperience', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="e.g., 5 years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Key Achievements in Your Sales Career
                </label>
                <textarea
                  rows={6}
                  value={learnerData.keyAchievements}
                  onChange={(e) => handleInputChange('keyAchievements', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Describe your key achievements, awards, and notable sales successes..."
                />
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Academic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Program *
                </label>
                <select
                  value={learnerData.programId}
                  onChange={(e) => handleInputChange('programId', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.programName} ({program.programCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Learning Goals
                </label>
                <textarea
                  rows={4}
                  value={learnerData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="What do you hope to achieve from this program?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Academic Status
                  </label>
                  <select
                    value={learnerData.academicStatus}
                    onChange={(e) => handleInputChange('academicStatus', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Cohort
                  </label>
                  <select
                    value={learnerData.cohortId || ''}
                    onChange={(e) => {
                      const selectedCohort = cohorts.find(c => c.id === e.target.value);
                      if (selectedCohort) {
                        handleInputChange('cohortId', selectedCohort.id);
                        handleInputChange('cohortName', selectedCohort.name);
                        handleInputChange('cohort', selectedCohort.name); // For backward compatibility
                      } else {
                        handleInputChange('cohortId', '');
                        handleInputChange('cohortName', '');
                        handleInputChange('cohort', '');
                      }
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select a cohort</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name} ({cohort.cohortId}) - {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                      </option>
                    ))}
                  </select>
                  {learnerData.cohortId && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Program: {cohorts.find(c => c.id === learnerData.cohortId)?.programId || 'N/A'}</p>
                      <p>Start Date: {cohorts.find(c => c.id === learnerData.cohortId) ? new Date(cohorts.find(c => c.id === learnerData.cohortId)!.startDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Current GPA
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4.0"
                    value={learnerData.currentGPA || ''}
                    onChange={(e) => handleInputChange('currentGPA', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={learnerData.enrollmentDate}
                  onChange={(e) => handleInputChange('enrollmentDate', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Finance & Payments</h2>
              
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-2">Total Fees</h3>
                  <p className="text-3xl font-bold text-secondary-800">KSh {learnerData.totalFees?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Amount Paid</h3>
                  <p className="text-3xl font-bold text-green-600">KSh {learnerData.amountPaid?.toLocaleString() || '0'}</p>
                </div>
                <div className={`p-6 rounded-xl ${learnerData.outstandingBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${learnerData.outstandingBalance > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    Outstanding Balance
                  </h3>
                  <p className={`text-3xl font-bold ${learnerData.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    KSh {learnerData.outstandingBalance?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* Fee Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Total Program Fees (KSh)
                  </label>
                  <input
                    type="number"
                    value={learnerData.totalFees || ''}
                    onChange={(e) => {
                      const newTotal = parseFloat(e.target.value) || 0;
                      const newOutstanding = newTotal - learnerData.amountPaid;
                      handleInputChange('totalFees', newTotal);
                      handleInputChange('outstandingBalance', Math.max(0, newOutstanding));
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter total fees"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Payment Plan
                  </label>
                  <select
                    value={learnerData.paymentPlan || ''}
                    onChange={(e) => handleInputChange('paymentPlan', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="full">Full Payment</option>
                    <option value="installments">Installments</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              {/* Payment Records */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Payment Records
                  </label>
                  {isEditing && (
                    <button
                      onClick={addPayment}
                      disabled={!newPayment.amount || !newPayment.description}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Payment</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <input
                        type="number"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Amount (KSh)"
                      />
                      <select
                        value={newPayment.type}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value as any }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="tuition">Tuition</option>
                        <option value="fees">Fees</option>
                        <option value="materials">Materials</option>
                        <option value="other">Other</option>
                      </select>
                      <select
                        value={newPayment.method}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="cheque">Cheque</option>
                        <option value="card">Card</option>
                      </select>
                      <input
                        type="text"
                        value={newPayment.description}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {learnerData.paymentRecords?.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="font-medium text-secondary-800">KSh {payment.amount.toLocaleString()}</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-secondary-500">
                            <p>{new Date(payment.date).toLocaleDateString()}</p>
                            <p>{payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} • {payment.method?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removePayment(payment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-secondary-600">{payment.description}</p>
                    </div>
                  ))}
                  
                  {(!learnerData.paymentRecords || learnerData.paymentRecords.length === 0) && (
                    <div className="text-center py-8 text-secondary-500">
                      No payment records found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerPage; 