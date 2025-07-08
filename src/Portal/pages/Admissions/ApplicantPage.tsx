import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus, Edit, User, Briefcase, FileText, CheckCircle, Plus, Trash2, BookOpen, Play, Eye, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { FirestoreService, ProgramService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface ApplicantData {
  id?: string;
  applicationNumber?: string;
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
  // Application
  programId: string;
  learningGoals: string;
  spokenToRep: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'not_paid';
  // Payment Details
  amountPaid: number;
  confirmationCode: string;
  paymentMethod: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
  // Application Status
  feedback: { date: string; message: string; author: string }[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  cohort: string;
  admittedProgram: string;
  submittedDate: string;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  level?: string;
  status: string;
  fees?: number;
}

interface CompetencyTest {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number;
  passingScore: number;
  questions: any[];
  status: 'draft' | 'active' | 'archived';
  totalPoints: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface TestAttempt {
  id: string;
  testId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    points: number;
  }[];
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
  submittedAt?: string;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  programId: string;
  startDate: string;
  applicationDeadline: string;
  closeDate: string;
  programCost: number;
  staffManagerId: string;
  description?: string;
  maxStudents?: number;
  enrolledCount?: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

const ApplicantPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New applicant = editing mode
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [competencyTests, setCompetencyTests] = useState<CompetencyTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);

  const [applicantData, setApplicantData] = useState<ApplicantData>({
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
    spokenToRep: '',
    paymentStatus: 'pending',
    amountPaid: 0,
    confirmationCode: '',
    paymentMethod: 'mpesa',
    feedback: [],
    status: 'pending',
    cohort: '',
    admittedProgram: '',
    submittedDate: new Date().toISOString().split('T')[0]
  });

  const [newFeedback, setNewFeedback] = useState({ message: '', author: '' });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'job-details', label: 'Job Details', icon: Briefcase },
    { id: 'application', label: 'Application', icon: FileText },
    { id: 'tests', label: 'Competency Tests', icon: BookOpen },
    { id: 'status', label: 'Application Status', icon: CheckCircle },
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
    if (id) {
      loadApplicant();
    } else if (userProfile?.role === 'applicant' && user?.email) {
      // For applicants accessing their own application
      loadApplicantByEmail();
    } else if (!id && user && userProfile) {
      // For new applications, pre-populate with user data
      initializeWithUserProfile();
    }
    loadPrograms();
    loadCohorts();
    loadCompetencyTests();
    if (user?.email) {
      loadTestAttempts();
    }
  }, [id, userProfile, user]);

  const loadApplicant = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('applicants', id!);
      if (result.success) {
        setApplicantData(result.data as ApplicantData);
      }
    } catch (error) {
      console.error('Error loading applicant:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicantByEmail = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('applicants', [
        { field: 'email', operator: '==', value: user!.email }
      ]);
      if (result.success && result.data && result.data.length > 0) {
        setApplicantData(result.data[0] as ApplicantData);
        setIsEditing(false); // Existing application, view mode
      } else {
        // No application found, pre-populate with user profile data
        initializeWithUserProfile();
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading applicant by email:', error);
      // Even if there's an error, try to pre-populate with user data
      initializeWithUserProfile();
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const initializeWithUserProfile = async () => {
    if (!user) return;

    // Try to get additional user data from users collection
    try {
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'uid', operator: '==', value: user.uid }
      ]);

      let userData: any = {};
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        userData = userResult.data[0];
      }

      // Pre-populate with available data
      setApplicantData(prev => ({
        ...prev,
        firstName: userData.firstName || userProfile?.displayName?.split(' ')[0] || '',
        lastName: userData.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phoneNumber: userData.phoneNumber || '',
        currentOrganisation: userData.organization || userProfile?.organization || '',
      }));
    } catch (error) {
      console.error('Error loading user profile for pre-population:', error);
      // Fallback to basic user data
      setApplicantData(prev => ({
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
        // Filter to only show active cohorts or cohorts that match the applicant's program
        const availableCohorts = (result.data as Cohort[]).filter(cohort => 
          cohort.status === 'active' || cohort.status === 'draft'
        );
        setCohorts(availableCohorts);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const loadCompetencyTests = async () => {
    try {
      const result = await FirestoreService.getAll('competencyTests');
      if (result.success && result.data) {
        // Only show active tests to applicants
        const activeTests = (result.data as CompetencyTest[]).filter(test => test.status === 'active');
        setCompetencyTests(activeTests);
      }
    } catch (error) {
      console.error('Error loading competency tests:', error);
    }
  };

  const loadTestAttempts = async () => {
    try {
      const result = await FirestoreService.getWithQuery('testAttempts', [
        { field: 'applicantEmail', operator: '==', value: user!.email }
      ]);
      if (result.success && result.data) {
        setTestAttempts(result.data as TestAttempt[]);
      }
    } catch (error) {
      console.error('Error loading test attempts:', error);
    }
  };

  const generateApplicationNumber = async () => {
    try {
      const result = await FirestoreService.getAll('applicants');
      if (result.success && result.data) {
        const count = result.data.length + 1;
        return `APP${count.toString().padStart(3, '0')}`;
      }
      return 'APP001';
    } catch (error) {
      console.error('Error generating application number:', error);
      return 'APP001';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...applicantData };

      if (!id) {
        // Generate application number for new applicants
        dataToSave.applicationNumber = await generateApplicationNumber();
        dataToSave.submittedDate = new Date().toISOString().split('T')[0];
        result = await FirestoreService.create('applicants', dataToSave);
      } else {
        result = await FirestoreService.update('applicants', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/admissions/applicants/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving applicant:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ApplicantData, value: any) => {
    setApplicantData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFeedback = () => {
    if (newFeedback.message && newFeedback.author) {
      const feedback = {
        date: new Date().toISOString().split('T')[0],
        message: newFeedback.message,
        author: newFeedback.author
      };
      
      setApplicantData(prev => ({
        ...prev,
        feedback: [...prev.feedback, feedback]
      }));
      
      setNewFeedback({ message: '', author: '' });
    }
  };

  const removeFeedback = (index: number) => {
    setApplicantData(prev => ({
      ...prev,
      feedback: prev.feedback.filter((_, i) => i !== index)
    }));
  };

  const getSelectedProgram = () => {
    return programs.find(p => p.id === applicantData.programId);
  };

  const getTestAttempt = (testId: string): TestAttempt | undefined => {
    return testAttempts.find(attempt => attempt.testId === testId);
  };

  const getTestStatus = (testId: string): { status: string; color: string; canTake: boolean; canViewResults: boolean } => {
    const attempt = getTestAttempt(testId);
    
    if (!attempt) {
      return { 
        status: 'Not Taken', 
        color: 'text-gray-500', 
        canTake: true, 
        canViewResults: false 
      };
    }

    if (attempt.status === 'in_progress') {
      return { 
        status: 'In Progress', 
        color: 'text-blue-600', 
        canTake: true, 
        canViewResults: false 
      };
    }

    if (attempt.status === 'completed') {
      if (attempt.passed) {
        return { 
          status: 'Passed', 
          color: 'text-green-600', 
          canTake: false, 
          canViewResults: true 
        };
      } else {
        return { 
          status: 'Failed', 
          color: 'text-red-600', 
          canTake: true, 
          canViewResults: true 
        };
      }
    }

    return { 
      status: 'Unknown', 
      color: 'text-gray-500', 
      canTake: true, 
      canViewResults: false 
    };
  };

  const handleTakeTest = (testId: string) => {
    navigate(`/portal/admissions/test/${testId}/take`);
  };

  const handleViewResults = (testId: string) => {
    navigate(`/portal/admissions/test/${testId}/results`);
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
              onClick={() => navigate(userProfile?.role === 'applicant' ? '/portal/admissions' : '/portal/admissions')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {userProfile?.role === 'applicant' 
                  ? (id ? (isEditing ? 'Edit My Application' : 'My Application') : 'Create Application')
                  : (id ? (isEditing ? 'Edit Applicant' : `${applicantData.firstName} ${applicantData.lastName}` || 'Applicant Details') : 'New Applicant')
                }
              </h1>
              <p className="text-lg text-primary-100">
                {userProfile?.role === 'applicant'
                  ? (id ? `Application ${applicantData.applicationNumber || 'N/A'}` : 'Complete your program application')
                  : (id ? `Application ${applicantData.applicationNumber || 'N/A'}` : 'Create a new applicant profile')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {id && !isEditing && userProfile?.role !== 'applicant' && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {id && !isEditing && userProfile?.role === 'applicant' && applicantData.status === 'pending' && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Application</span>
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
                <span>{saving ? 'Saving...' : (userProfile?.role === 'applicant' ? 'Submit Application' : 'Save Applicant')}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Application Status</p>
                  <p className="text-2xl font-bold text-white">{applicantData.status.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Payment Status</p>
                  <p className="text-2xl font-bold text-white">{applicantData.paymentStatus.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Applied Program</p>
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
                    value={applicantData.firstName}
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
                    value={applicantData.lastName}
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
                    value={applicantData.email}
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
                    value={applicantData.phoneNumber}
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
                    value={applicantData.currentJobTitle}
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
                    value={applicantData.currentOrganisation}
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
                  value={applicantData.salesExperience}
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
                  value={applicantData.keyAchievements}
                  onChange={(e) => handleInputChange('keyAchievements', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Describe your key achievements, awards, and notable sales successes..."
                />
              </div>
            </div>
          )}

          {activeTab === 'application' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Application Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Program *
                </label>
                <select
                  value={applicantData.programId}
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
                  value={applicantData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="What do you hope to achieve from this program?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Spoken to which rep
                </label>
                <input
                  type="text"
                  value={applicantData.spokenToRep}
                  onChange={(e) => handleInputChange('spokenToRep', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="Representative name"
                />
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-800 mb-4">Payment Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={applicantData.paymentStatus}
                      onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial Payment</option>
                      <option value="paid">Fully Paid</option>
                      <option value="not_paid">Not Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Amount Paid (KES)
                    </label>
                    <input
                      type="number"
                      value={applicantData.amountPaid || 0}
                      onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter amount paid"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={applicantData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {applicantData.paymentMethod === 'mpesa' ? 'M-Pesa Confirmation Code' : 
                       applicantData.paymentMethod === 'bank_transfer' ? 'Bank Reference Number' : 
                       'Confirmation Code'}
                    </label>
                    <input
                      type="text"
                      value={applicantData.confirmationCode}
                      onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={
                        applicantData.paymentMethod === 'mpesa' ? 'Enter M-Pesa confirmation code' :
                        applicantData.paymentMethod === 'bank_transfer' ? 'Enter bank reference number' :
                        'Enter confirmation code'
                      }
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                {getSelectedProgram() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h5 className="font-medium text-blue-800 mb-2">Payment Summary</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Program Fee:</span>
                        <span className="font-medium text-blue-800">
                          KES {getSelectedProgram()?.fees?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Amount Paid:</span>
                        <span className="font-medium text-blue-800">
                          KES {(applicantData.amountPaid || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 flex justify-between">
                        <span className="text-blue-600 font-medium">Balance:</span>
                        <span className="font-bold text-blue-800">
                          KES {((getSelectedProgram()?.fees || 0) - (applicantData.amountPaid || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary-800">Competency Tests</h2>
                <div className="text-sm text-secondary-600">
                  Complete these tests to demonstrate your competencies
                </div>
              </div>

              {competencyTests.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Available</h3>
                  <p className="text-gray-500">There are currently no competency tests available.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Test
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {competencyTests.map((test) => {
                          const { status, color, canTake, canViewResults } = getTestStatus(test.id);
                          const attempt = getTestAttempt(test.id);
                          
                          return (
                            <tr key={test.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {test.title}
                                  </div>
                                  <div className="text-sm text-gray-500 line-clamp-1">
                                    {test.description}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {test.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="space-y-1">
                                  <div className="flex items-center text-gray-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {test.timeLimit} min
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <FileText className="h-4 w-4 mr-1" />
                                    {test.questions.length} questions
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <Award className="h-4 w-4 mr-1" />
                                    Pass: {test.passingScore}%
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${color}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {attempt ? (
                                  <div>
                                    <div className="font-medium">
                                      {attempt.totalScore}/{test.totalPoints} ({attempt.percentage}%)
                                    </div>
                                    {attempt.submittedAt && (
                                      <div className="text-xs text-gray-500">
                                        {new Date(attempt.submittedAt).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                {canTake && (
                                  <button
                                    onClick={() => handleTakeTest(test.id)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    {status === 'In Progress' ? 'Continue' : status === 'Failed' ? 'Retake' : 'Take Test'}
                                  </button>
                                )}
                                {canViewResults && (
                                  <button
                                    onClick={() => handleViewResults(test.id)}
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Results
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Test Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Test Instructions</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Each test has a time limit. Once started, you must complete it within the allocated time.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You can retake failed tests, but passed tests cannot be retaken.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Ensure you have a stable internet connection before starting a test.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Questions are worth different points. Read carefully and answer all questions.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Application Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Application Status
                  </label>
                  <select
                    value={applicantData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Cohort
                  </label>
                  <input
                    type="text"
                    value={applicantData.cohort}
                    onChange={(e) => handleInputChange('cohort', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., Cohort 2025-A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Admitted Program
                </label>
                <input
                  type="text"
                  value={applicantData.admittedProgram}
                  onChange={(e) => handleInputChange('admittedProgram', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="Program admitted to"
                />
              </div>

              {/* Feedback Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Feedback History
                  </label>
                  {isEditing && (
                    <button
                      onClick={addFeedback}
                      disabled={!newFeedback.message || !newFeedback.author}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Feedback</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <input
                        type="text"
                        value={newFeedback.author}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, author: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Author name"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={newFeedback.message}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Add feedback message..."
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {applicantData.feedback.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-secondary-800">{item.author}</span>
                          <span className="text-sm text-secondary-500">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeFeedback(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-secondary-600">{item.message}</p>
                    </div>
                  ))}
                  
                  {applicantData.feedback.length === 0 && (
                    <div className="text-center py-8 text-secondary-500">
                      No feedback added yet.
                    </div>
                  )}
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

export default ApplicantPage; 