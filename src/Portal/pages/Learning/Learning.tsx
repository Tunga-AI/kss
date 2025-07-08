import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, Play, FileText, Award, Clock, Users, Calendar, Eye, ChevronRight,
  Upload, Download, ExternalLink, Video, FileImage, Link, Plus, Edit, Trash2, 
  CheckCircle, AlertCircle, BarChart3, TrendingUp, Target, Star, MessageSquare,
  FolderOpen, Search, Filter
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

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
  programName?: string;
  managerName?: string;
}

interface Program {
  id: string;
  programName: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
}

interface ContentResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'article' | 'link' | 'image' | 'other';
  url: string;
  fileSize?: string;
  duration?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  cohortId?: string;
  week?: number;
  isPublic: boolean;
}

interface Assessment {
  id: string;
  title: string;
  type: 'formative' | 'summative' | 'milestone' | 'peer_feedback';
  description: string;
  cohortId: string;
  week?: number;
  dueDate?: string;
  maxScore: number;
  questions?: AssessmentQuestion[];
  createdAt: string;
  createdBy: string;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay' | 'practical' | 'rating';
  options?: string[];
  points: number;
}

interface TrainerReview {
  id: string;
  learnerId: string;
  cohortId: string;
  week: number;
  strengths: string;
  areasForImprovement: string;
  rating: number;
  comments: string;
  reviewedBy: string;
  reviewedAt: string;
}

interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  cohortId: string;
  type: 'individual' | 'group';
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  startDate: string;
  dueDate: string;
  requirements: string[];
  deliverables: string[];
  assignedLearners: string[];
  createdBy: string;
  createdAt: string;
}

const Learning: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cohorts');
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Content Library
  const [contentResources, setContentResources] = useState<ContentResource[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  
  // M&E (Monitoring & Evaluation)
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [trainerReviews, setTrainerReviews] = useState<TrainerReview[]>([]);
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false);
  
  // Capstone Projects
  const [capstoneProjects, setCapstoneProjects] = useState<CapstoneProject[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState('all');

  useEffect(() => {
    loadData();
    
    // Check if returning from cohort creation
    const shouldRefresh = sessionStorage.getItem('refresh_learning');
    if (shouldRefresh) {
      sessionStorage.removeItem('refresh_learning');
      // Small delay to ensure data is persisted
      setTimeout(() => {
        loadData();
      }, 500);
    }
  }, []);

  // Auto-refresh when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      // Refresh data when page regains focus (e.g., returning from another page)
      loadData();
    };

    const handleVisibilityChange = () => {
      // Refresh data when tab becomes visible again
      if (!document.hidden) {
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cohortsResult, programsResult, staffResult] = await Promise.all([
        FirestoreService.getAll('cohorts'),
        FirestoreService.getAll('programs'),
        FirestoreService.getWithQuery('users', [
          { field: 'role', operator: 'in', value: ['admin', 'staff'] }
        ])
      ]);

      if (cohortsResult.success && cohortsResult.data) {
        setCohorts(cohortsResult.data as Cohort[]);
      }

      if (programsResult.success && programsResult.data) {
        setPrograms(programsResult.data as Program[]);
      }

      if (staffResult.success && staffResult.data) {
        setStaff(staffResult.data as Staff[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhance cohorts with program and manager names
  const enrichedCohorts = cohorts.map(cohort => {
    const program = programs.find(p => p.id === cohort.programId);
    const manager = staff.find(s => s.id === cohort.staffManagerId);
    
    return {
      ...cohort,
      programName: program?.programName || 'Unknown Program',
      managerName: manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown Manager'
    };
  });

  const stats = [
    { 
      title: 'Active Cohorts', 
      value: enrichedCohorts.filter(c => c.status === 'active').length.toString(), 
      change: '+3', 
      icon: Users, 
      color: 'primary' 
    },
    { 
      title: 'Total Learners', 
      value: enrichedCohorts.reduce((sum, c) => sum + (c.enrolledCount || 0), 0).toString(), 
      change: '+45', 
      icon: GraduationCap, 
      color: 'accent' 
    },
    { 
      title: 'Completed Cohorts', 
      value: enrichedCohorts.filter(c => c.status === 'completed').length.toString(), 
      change: '+2', 
      icon: Award, 
      color: 'secondary' 
    },
  ];

  const tabs = [
    { id: 'cohorts', label: 'Cohorts', icon: Users },
    { id: 'content', label: 'Content Library', icon: BookOpen },
    { id: 'assessments', label: 'Monitoring & Evaluation', icon: CheckCircle },
    { id: 'capstone', label: 'Capstone Projects', icon: Award },
    { id: 'analytics', label: 'Learning Analytics', icon: BarChart3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDurationInWeeks = (startDate: string, closeDate: string) => {
    const start = new Date(startDate);
    const end = new Date(closeDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return `${diffWeeks} weeks`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Learning Management</h1>
            <p className="text-lg text-primary-100">
              Manage cohorts, learners, schedules, and learning experiences.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} this month
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
          {activeTab === 'cohorts' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Active Cohorts</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Cohorts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrichedCohorts.map((cohort) => (
                  <div key={cohort.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cohort.status)}`}>
                          {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">{cohort.name}</h3>
                    <p className="text-secondary-600 text-sm mb-4">ID: {cohort.cohortId}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Program:</span>
                        <span className="text-secondary-800 font-medium">{cohort.programName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Start Date:</span>
                        <span className="text-secondary-800 font-medium">{formatDate(cohort.startDate)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Duration:</span>
                        <span className="text-secondary-800 font-medium">{getDurationInWeeks(cohort.startDate, cohort.closeDate)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Enrolled:</span>
                        <span className="text-secondary-800 font-medium">{cohort.enrolledCount || 0}/{cohort.maxStudents || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Manager:</span>
                        <span className="text-secondary-800 font-medium">{cohort.managerName}</span>
                      </div>
                    </div>

                    {/* Progress Bar for enrollment */}
                    {cohort.maxStudents && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className="bg-accent-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(((cohort.enrolledCount || 0) / cohort.maxStudents) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                    
                    {/* Action buttons - Updated for view-only */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/portal/learning/cohort/${cohort.id}/learners`)}
                        className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Learners</span>
                      </button>
                      <button 
                        onClick={() => navigate(`/portal/learning/cohort/${cohort.id}/schedule`)}
                        className="flex-1 bg-secondary-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Schedule</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {enrichedCohorts.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Cohorts Found</h3>
                  <p className="text-secondary-600 mb-4">
                    Cohorts are managed from the Admissions module. Create cohorts there to see them here.
                  </p>
                  
                  <button
                    onClick={() => navigate('/portal/admissions')}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                  >
                    Go to Admissions
                  </button>
                </div>
              )}

              {/* Note about cohort management */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Cohort Management</h4>
                    <p className="text-sm text-blue-600">
                      Cohorts are managed from the <strong>Admissions</strong> module. 
                      To create or edit cohorts, please navigate to the Admissions section.
                    </p>
                    <button
                      onClick={() => navigate('/portal/admissions')}
                      className="mt-2 text-sm text-blue-700 hover:text-blue-800 font-medium underline"
                    >
                      Go to Admissions →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Content Library</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Cohorts</option>
                    <option value="public">Public Resources</option>
                    {enrichedCohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAddResourceModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Resource</span>
                  </button>
                </div>
              </div>

              {/* Resource Types Filter */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                {['all', 'video', 'pdf', 'article', 'link'].map((type) => (
                  <button
                    key={type}
                    className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-50 capitalize"
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sample Resources - Replace with actual data */}
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Video className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Sales Fundamentals Video</h3>
                    <p className="text-secondary-600 text-sm mb-4">Introduction to core sales principles and methodologies</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Type:</span>
                        <span className="text-secondary-800 font-medium">Video</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Duration:</span>
                        <span className="text-secondary-800 font-medium">45 mins</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Week:</span>
                        <span className="text-secondary-800 font-medium">Week 1</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Sales</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Fundamentals</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {contentResources.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Resources Found</h3>
                  <p className="text-secondary-600 mb-4">Start building your content library by adding learning resources.</p>
                  <button
                    onClick={() => setShowAddResourceModal(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                  >
                    Add Your First Resource
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assessments' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Monitoring & Evaluation (M&E)</h2>
                  <p className="text-secondary-600 mt-1">Rigorous M&E framework ensuring measurable, behavior-driven outcomes</p>
                </div>
                <button
                  onClick={() => setShowAddAssessmentModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Assessment</span>
                </button>
              </div>

              {/* M&E Framework Overview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">M&E Framework Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Milestone Tracking', desc: 'Predefined checkpoints throughout 12 weeks', icon: Target },
                    { title: 'Formative Assessments', desc: 'Quizzes, polls, and practical simulations', icon: CheckCircle },
                    { title: 'Summative Assessments', desc: 'Comprehensive end-of-program evaluations', icon: Award },
                    { title: 'Trainer Reviews', desc: 'Weekly learner reports from trainers', icon: Star },
                    { title: 'Peer Feedback', desc: 'Structured peer input during projects', icon: MessageSquare },
                    { title: 'Attendance & Engagement', desc: 'Tracked across virtual and physical sessions', icon: BarChart3 }
                  ].map((component, index) => {
                    const Icon = component.icon;
                    return (
                      <div key={index} className="bg-white p-4 rounded-lg border border-blue-100">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800">{component.title}</h4>
                            <p className="text-sm text-blue-600 mt-1">{component.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { title: 'Formative', count: 12, color: 'green', icon: CheckCircle },
                  { title: 'Summative', count: 3, color: 'blue', icon: Award },
                  { title: 'Milestones', count: 8, color: 'purple', icon: Target },
                  { title: 'Peer Reviews', count: 15, color: 'orange', icon: MessageSquare }
                ].map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.title} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`bg-${category.color}-100 p-3 rounded-lg`}>
                          <Icon className={`h-6 w-6 text-${category.color}-600`} />
                        </div>
                        <span className={`text-2xl font-bold text-${category.color}-600`}>{category.count}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-secondary-800">{category.title}</h3>
                      <p className="text-secondary-600 text-sm">Active assessments</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent Assessments Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-secondary-800">Recent Assessments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Sample Assessment Rows */}
                      {[
                        { title: 'Sales Fundamentals Quiz', type: 'formative', cohort: 'Cohort 2025-A', week: 2, due: '2025-01-15', status: 'active' },
                        { title: 'Milestone Assessment 1', type: 'milestone', cohort: 'Cohort 2025-A', week: 4, due: '2025-01-29', status: 'draft' },
                        { title: 'Peer Project Review', type: 'peer_feedback', cohort: 'Cohort 2025-B', week: 6, due: '2025-02-12', status: 'completed' }
                      ].map((assessment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              assessment.type === 'formative' ? 'bg-green-100 text-green-800' :
                              assessment.type === 'milestone' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {assessment.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.cohort}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Week {assessment.week}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.due}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              assessment.status === 'active' ? 'bg-green-100 text-green-800' :
                              assessment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {assessment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button className="text-primary-600 hover:text-primary-800">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty State */}
              {assessments.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Assessments Found</h3>
                  <p className="text-secondary-600 mb-4">Start building your M&E framework by creating assessments.</p>
                  <button
                    onClick={() => setShowAddAssessmentModal(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                  >
                    Create First Assessment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'capstone' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Capstone Projects</h2>
                  <p className="text-secondary-600 mt-1">Final projects demonstrating learner competency and skill application</p>
                </div>
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Project Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { title: 'Total Projects', count: 8, color: 'blue', icon: FolderOpen },
                  { title: 'In Progress', count: 5, color: 'yellow', icon: Clock },
                  { title: 'Under Review', count: 2, color: 'purple', icon: Eye },
                  { title: 'Completed', count: 1, color: 'green', icon: CheckCircle }
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.title} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`bg-${stat.color}-100 p-3 rounded-lg`}>
                          <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                        </div>
                        <span className={`text-2xl font-bold text-${stat.color}-600`}>{stat.count}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-secondary-800">{stat.title}</h3>
                      <p className="text-secondary-600 text-sm">Current projects</p>
                    </div>
                  );
                })}
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sample Projects */}
                {[
                  { 
                    title: 'Sales Strategy Development', 
                    cohort: 'Cohort 2025-A', 
                    type: 'individual', 
                    status: 'in_progress',
                    dueDate: '2025-02-15',
                    learners: 12,
                    description: 'Develop a comprehensive sales strategy for a real-world scenario'
                  },
                  { 
                    title: 'Team Sales Presentation', 
                    cohort: 'Cohort 2025-A', 
                    type: 'group', 
                    status: 'review',
                    dueDate: '2025-02-01',
                    learners: 4,
                    description: 'Collaborative presentation on advanced sales techniques'
                  },
                  { 
                    title: 'Customer Journey Mapping', 
                    cohort: 'Cohort 2025-B', 
                    type: 'individual', 
                    status: 'planning',
                    dueDate: '2025-02-28',
                    learners: 15,
                    description: 'Map complete customer journeys for different buyer personas'
                  }
                ].map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Award className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'review' ? 'bg-purple-100 text-purple-800' :
                          project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">{project.title}</h3>
                    <p className="text-secondary-600 text-sm mb-4">{project.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Cohort:</span>
                        <span className="text-secondary-800 font-medium">{project.cohort}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Type:</span>
                        <span className="text-secondary-800 font-medium capitalize">{project.type}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Due Date:</span>
                        <span className="text-secondary-800 font-medium">{project.dueDate}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-500">Learners:</span>
                        <span className="text-secondary-800 font-medium">{project.learners}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {capstoneProjects.length === 0 && (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Capstone Projects Found</h3>
                  <p className="text-secondary-600 mb-4">Create capstone projects to assess learner competency and skill application.</p>
                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Learning Analytics</h2>
                  <p className="text-secondary-600 mt-1">Track progress, performance, and engagement across all cohorts</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Cohorts</option>
                    {enrichedCohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                    ))}
                  </select>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { title: 'Average Progress', value: '76%', trend: '+5%', color: 'green', icon: TrendingUp },
                  { title: 'Completion Rate', value: '89%', trend: '+12%', color: 'blue', icon: CheckCircle },
                  { title: 'Engagement Score', value: '8.4/10', trend: '+0.3', color: 'purple', icon: Star },
                  { title: 'Attendance Rate', value: '92%', trend: '-2%', color: 'orange', icon: Users }
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.title} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`bg-${metric.color}-100 p-3 rounded-lg`}>
                          <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                        </div>
                        <span className={`text-sm font-medium ${
                          metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.trend}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-secondary-800">{metric.title}</h3>
                      <p className={`text-2xl font-bold text-${metric.color}-600`}>{metric.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Progress Over Time</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Progress chart will be displayed here</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Assessment Performance</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Performance chart will be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { learner: 'John Doe', action: 'Completed Sales Fundamentals Quiz', cohort: 'Cohort 2025-A', time: '2 hours ago' },
                    { learner: 'Jane Smith', action: 'Submitted Capstone Project', cohort: 'Cohort 2025-A', time: '4 hours ago' },
                    { learner: 'Mike Johnson', action: 'Attended Virtual Workshop', cohort: 'Cohort 2025-B', time: '1 day ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-100 p-2 rounded-full">
                          <Users className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-800">{activity.learner}</p>
                          <p className="text-sm text-secondary-600">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-secondary-800">{activity.cohort}</p>
                        <p className="text-xs text-secondary-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;