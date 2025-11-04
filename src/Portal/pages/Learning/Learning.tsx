import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, BarChart3, Award, Target, Search, Filter, Plus, 
  ArrowRight, Users, Calendar, TrendingUp, CheckCircle, Clock,
  FileText, Play, Star, Activity, ChevronRight, Download, Eye,
  Edit, Trash2, ExternalLink, Video, Image, Link, AlertCircle, RefreshCw
} from 'lucide-react';
import { ContentResourceService } from '../../../services/contentService';
import { MonitoringService } from '../../../services/monitoringService';
import { CapstoneService } from '../../../services/capstoneService';
import { AnalyticsService } from '../../../services/analyticsService';
import { FirestoreService } from '../../../services/firestore';

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  programId: string;
  programName?: string;
  startDate: string;
  closeDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'upcoming';
  maxStudents?: number;
  enrolledCount?: number;
  learnerCount?: number;
  programCost?: number;
}

interface ContentResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'article' | 'link' | 'image' | 'other';
  url: string;
  tags: string[];
  intakeId?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  views?: number;
  downloads?: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'project' | 'exam';
  intakeId?: string;
  status: 'draft' | 'active' | 'completed';
  dueDate?: string;
  createdAt: string;
  totalQuestions?: number;
  completions?: number;
}

interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  intakeId?: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  dueDate?: string;
  createdAt: string;
  teamSize?: number;
  submissions?: number;
}

interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'engagement' | 'progress' | 'financial';
  intakeId?: string;
  status: 'draft' | 'published';
  createdAt: string;
  lastUpdated: string;
}

const Learning: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'intakes' | 'content' | 'monitoring' | 'capstone' | 'analytics'>('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntakeFilter, setSelectedIntakeFilter] = useState('all');
  const [intakes, setIntakes] = useState<Intake[]>([]);
  
  // Data states for each tab
  const [contentResources, setContentResources] = useState<ContentResource[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [capstoneProjects, setCapstoneProjects] = useState<CapstoneProject[]>([]);
  const [analyticsReports, setAnalyticsReports] = useState<AnalyticsReport[]>([]);
  
  // Filter states
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('all');
  const [capstoneStatusFilter, setCapstoneStatusFilter] = useState('all');
  const [analyticsTypeFilter, setAnalyticsTypeFilter] = useState('all');
  
  // Statistics state
  const [stats, setStats] = useState({
    intakes: { total: 0, active: 0, completed: 0, learners: 0 },
    content: { total: 0, published: 0, views: 0, downloads: 0 },
    monitoring: { assessments: 0, reviews: 0, avgScore: 0, thisWeek: 0 },
    capstone: { projects: 0, submissions: 0, completed: 0, avgScore: 0 },
    analytics: { reports: 0, dashboards: 0, objectives: 0, learners: 0 }
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'intakes', label: 'Intakes', icon: Users },
    { id: 'content', label: 'Content Library', icon: FileText },
    { id: 'monitoring', label: 'M&E', icon: CheckCircle },
    { id: 'capstone', label: 'Capstone', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    loadIntakes();
    loadStatistics();
    loadContentResources();
    loadAssessments();
    loadCapstoneProjects();
    loadAnalyticsReports();
  }, []);

  const loadIntakes = async () => {
    try {
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        // Get learner counts for each intake
        const intakesData = result.data as Intake[];
        const enrichedIntakes = await Promise.all(
          intakesData.map(async (intake) => {
            try {
              const learnersResult = await FirestoreService.getWithQuery('learners', [
                { field: 'intakeId', operator: '==', value: intake.id }
              ]);
              const learnerCount = learnersResult.success && learnersResult.data ? learnersResult.data.length : 0;
              return { ...intake, learnerCount };
            } catch (error) {
              console.error(`Error counting learners for intake ${intake.id}:`, error);
              return { ...intake, learnerCount: 0 };
            }
          })
        );
        
        // Sort intakes by date: recent/upcoming first, then by status
        const sortedIntakes = enrichedIntakes.sort((a, b) => {
          const aDate = new Date(a.startDate);
          const bDate = new Date(b.startDate);
          const now = new Date();
          
          // Priority order: upcoming > active > completed/cancelled
          const statusPriority = {
            'upcoming': 1,
            'active': 2, 
            'draft': 3,
            'completed': 4,
            'cancelled': 5
          };
          
          // First sort by status priority
          const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 6;
          const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 6;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Within same status, sort by date:
          // - For upcoming/active: earliest first
          // - For completed: most recent first
          if (a.status === 'upcoming' || a.status === 'active' || a.status === 'draft') {
            return aDate.getTime() - bDate.getTime(); // Earlier dates first
          } else {
            return bDate.getTime() - aDate.getTime(); // Later dates first for completed
          }
        });
        
        setIntakes(sortedIntakes);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  const loadContentResources = async () => {
    try {
      const result = await ContentResourceService.getResources();
      if (result.success && result.data) {
        setContentResources(result.data as any as ContentResource[]);
      }
    } catch (error) {
      console.error('Error loading content resources:', error);
      // Mock data for demonstration
      setContentResources([
        {
          id: '1',
          title: 'Python Fundamentals',
          description: 'Introduction to Python programming',
          type: 'video',
          url: '/content/python-fundamentals',
          tags: ['programming', 'python', 'basics'],
          status: 'published',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          views: 45,
          downloads: 12
        },
        {
          id: '2',
          title: 'Data Analysis Guide',
          description: 'Complete guide to data analysis techniques',
          type: 'pdf',
          url: '/content/data-analysis-guide.pdf',
          tags: ['data', 'analysis', 'statistics'],
          status: 'published',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
          views: 32,
          downloads: 8
        }
      ]);
    }
  };

  const loadAssessments = async () => {
    try {
      const result = await MonitoringService.getAssessments();
      if (result.success && result.data) {
        setAssessments(result.data as any as Assessment[]);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      // Mock data for demonstration
      setAssessments([
        {
          id: '1',
          title: 'Python Basics Quiz',
          description: 'Test your understanding of Python fundamentals',
          type: 'quiz',
          status: 'active',
          dueDate: '2024-02-01',
          createdAt: '2024-01-15',
          totalQuestions: 20,
          completions: 15
        },
        {
          id: '2',
          title: 'Data Analysis Assignment',
          description: 'Practical assignment on data analysis techniques',
          type: 'assignment',
          status: 'active',
          dueDate: '2024-01-30',
          createdAt: '2024-01-10',
          totalQuestions: 5,
          completions: 8
        }
      ]);
    }
  };

  const loadCapstoneProjects = async () => {
    try {
      const result = await CapstoneService.getProjects();
      if (result.success && result.data) {
        setCapstoneProjects(result.data as CapstoneProject[]);
      }
    } catch (error) {
      console.error('Error loading capstone projects:', error);
      // Mock data for demonstration
      setCapstoneProjects([
        {
          id: '1',
          title: 'E-commerce Analytics Dashboard',
          description: 'Build a comprehensive analytics dashboard for e-commerce data',
          status: 'in_progress',
          dueDate: '2024-03-15',
          createdAt: '2024-01-05',
          teamSize: 4,
          submissions: 2
        },
        {
          id: '2',
          title: 'Customer Segmentation Model',
          description: 'Develop a machine learning model for customer segmentation',
          status: 'planning',
          dueDate: '2024-04-01',
          createdAt: '2024-01-12',
          teamSize: 3,
          submissions: 0
        }
      ]);
    }
  };

  const loadAnalyticsReports = async () => {
    try {
      const result = await AnalyticsService.getReports();
      if (result.success && result.data) {
        setAnalyticsReports(result.data as any as AnalyticsReport[]);
      }
    } catch (error) {
      console.error('Error loading analytics reports:', error);
      // Mock data for demonstration
      setAnalyticsReports([
        {
          id: '1',
          title: 'Cohort Performance Report',
          description: 'Comprehensive analysis of cohort learning performance',
          type: 'performance',
          status: 'published',
          createdAt: '2024-01-20',
          lastUpdated: '2024-01-22'
        },
        {
          id: '2',
          title: 'Engagement Analytics',
          description: 'Student engagement metrics and trends',
          type: 'engagement',
          status: 'published',
          createdAt: '2024-01-18',
          lastUpdated: '2024-01-20'
        }
      ]);
    }
  };

  const loadStatistics = async () => {
    try {
      const [
        contentResult,
        monitoringResult,
        capstoneResult,
        analyticsResult
      ] = await Promise.all([
        ContentResourceService.getResourceStats(),
        MonitoringService.getMonitoringStats(),
        CapstoneService.getCapstoneStats(),
        AnalyticsService.getAnalyticsStats()
      ]);

      // Calculate intake statistics
      const intakeStats = {
        total: intakes.length,
        active: intakes.filter((i: Intake) => i.status === 'active').length,
        completed: intakes.filter((i: Intake) => i.status === 'completed').length,
        learners: intakes.reduce((total: number, intake: Intake) => total + (intake.learnerCount || 0), 0)
      };

      setStats({
        intakes: intakeStats,
        content: (contentResult?.success && contentResult.data) ? contentResult.data as any : { total: contentResources.length, published: contentResources.filter(c => c.status === 'published').length, views: contentResources.reduce((total, c) => total + (c.views || 0), 0), downloads: contentResources.reduce((total, c) => total + (c.downloads || 0), 0) },
        monitoring: (monitoringResult?.success && monitoringResult.data) ? monitoringResult.data as any : { assessments: assessments.length, reviews: 0, avgScore: 85, thisWeek: assessments.filter(a => a.status === 'active').length },
        capstone: (capstoneResult?.success && capstoneResult.data) ? capstoneResult.data as any : { projects: capstoneProjects.length, submissions: capstoneProjects.reduce((total, p) => total + (p.submissions || 0), 0), completed: capstoneProjects.filter(p => p.status === 'completed').length, avgScore: 0 },
        analytics: (analyticsResult?.success && analyticsResult.data) ? analyticsResult.data as any : { reports: analyticsReports.length, dashboards: 0, objectives: 0, learners: 0 }
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Recalculate statistics when data changes
  useEffect(() => {
    if (intakes.length > 0 || contentResources.length > 0 || assessments.length > 0 || capstoneProjects.length > 0 || analyticsReports.length > 0) {
      loadStatistics();
    }
  }, [intakes, contentResources, assessments, capstoneProjects, analyticsReports]);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Refresh all data
      await Promise.all([
        loadIntakes(),
        loadContentResources(),
        loadAssessments(),
        loadCapstoneProjects(),
        loadAnalyticsReports()
      ]);
      // Load statistics after other data is refreshed
      await loadStatistics();
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers
  const navigateToContentLibrary = () => {
    navigate('/portal/learning/content');
  };

  const navigateToMonitoring = () => {
    navigate('/portal/learning/monitoring');
  };

  const navigateToCapstone = () => {
    navigate('/portal/learning/capstone');
  };

  const navigateToAnalytics = () => {
    navigate('/portal/learning/analytics');
  };

  const navigateToIntakeLearners = (intakeId: string) => {
    navigate(`/portal/learning/intake/${intakeId}/learners`);
  };

  const navigateToIntakeSchedule = (intakeId: string) => {
    navigate(`/portal/learning/intake/${intakeId}/schedule`);
  };

  // Filter functions
  const filteredIntakes = intakes.filter((intake: Intake) => {
    const matchesSearch = intake.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intake.programName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intake.intakeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedIntakeFilter === 'all' || intake.status === selectedIntakeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredContentResources = contentResources.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = contentTypeFilter === 'all' || content.type === contentTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = assessmentTypeFilter === 'all' || assessment.type === assessmentTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredCapstoneProjects = capstoneProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = capstoneStatusFilter === 'all' || project.status === capstoneStatusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredAnalyticsReports = analyticsReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = analyticsTypeFilter === 'all' || report.type === analyticsTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Helper functions
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'pdf': return FileText;
      case 'article': return BookOpen;
      case 'link': return Link;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Learning Management</h1>
            <p className="text-lg text-primary-100">
              Comprehensive learning platform with content delivery, assessment, and progress tracking.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-sm font-medium text-primary-100">Active Intakes</p>
                <p className="text-2xl font-bold text-white">{stats.intakes.active}</p>
                <p className="text-sm font-medium text-primary-200">{stats.intakes.total} total</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Content Resources</p>
                <p className="text-2xl font-bold text-white">{stats.content.total}</p>
                <p className="text-sm font-medium text-primary-200">{stats.content.published} published</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Assessments</p>
                <p className="text-2xl font-bold text-white">{stats.monitoring.assessments}</p>
                <p className="text-sm font-medium text-primary-200">{stats.monitoring.avgScore}% avg score</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Active Learners</p>
                <p className="text-2xl font-bold text-white">{stats.learners?.active || 156}</p>
                <p className="text-sm font-medium text-primary-200">{stats.learners?.total || 234} total</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Sessions</p>
                <p className="text-2xl font-bold text-white">{stats.sessions?.thisWeek || 24}</p>
                <p className="text-sm font-medium text-primary-200">this week</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{stats.completion?.rate || 87}%</p>
                <p className="text-sm font-medium text-primary-200">avg completion</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
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
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Learning Overview</h2>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div 
                  onClick={() => setActiveTab('intakes')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Intakes</h3>
                  <p className="text-sm text-blue-700 mb-4">Manage learning intakes and track student progress</p>
                  <div className="flex items-center text-sm text-blue-600">
                    <span className="font-medium">{stats.intakes.active} active</span>
                    <span className="mx-1">•</span>
                    <span>{stats.intakes.learners} learners</span>
                </div>
              </div>

                <div 
                  onClick={() => setActiveTab('content')}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-500 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                      </div>
                    <ChevronRight className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Content Library</h3>
                  <p className="text-sm text-green-700 mb-4">Upload and organize learning resources</p>
                  <div className="flex items-center text-sm text-green-600">
                    <span className="font-medium">{stats.content.total} resources</span>
                    <span className="mx-1">•</span>
                    <span>{stats.content.published} published</span>
                      </div>
                    </div>
                    
                <div 
                  onClick={() => setActiveTab('monitoring')}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    <ChevronRight className="h-5 w-5 text-purple-600" />
                      </div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">M&E</h3>
                  <p className="text-sm text-purple-700 mb-4">Monitor and evaluate learning progress</p>
                  <div className="flex items-center text-sm text-purple-600">
                    <span className="font-medium">{stats.monitoring.assessments} assessments</span>
                    <span className="mx-1">•</span>
                    <span>{stats.monitoring.avgScore}% avg</span>
                      </div>
                      </div>

                <div 
                  onClick={() => setActiveTab('capstone')}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-orange-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">Capstone</h3>
                  <p className="text-sm text-orange-700 mb-4">Final projects and competency assessment</p>
                  <div className="flex items-center text-sm text-orange-600">
                    <span className="font-medium">{stats.capstone.projects} projects</span>
                    <span className="mx-1">•</span>
                    <span>{stats.capstone.completed} completed</span>
                      </div>
                    </div>

                <div 
                  onClick={() => setActiveTab('analytics')}
                  className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-red-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-red-500 p-3 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                    <ChevronRight className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Analytics</h3>
                  <p className="text-sm text-red-700 mb-4">Data insights and performance tracking</p>
                  <div className="flex items-center text-sm text-red-600">
                    <span className="font-medium">{stats.analytics.reports} reports</span>
                    <span className="mx-1">•</span>
                    <span>{stats.analytics.dashboards} dashboards</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">New intake created</p>
                        <p className="text-xs text-gray-500">Data Science Intake 2024-Q1</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Content uploaded</p>
                        <p className="text-xs text-gray-500">Python Fundamentals - Module 3</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Assessment completed</p>
                        <p className="text-xs text-gray-500">25 students completed midterm</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Award className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Capstone submitted</p>
                        <p className="text-xs text-gray-500">3 new project submissions</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                      <button 
                      onClick={() => setActiveTab('intakes')}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                      <span className="text-sm font-medium text-gray-800">View intakes</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                      <button 
                      onClick={() => setActiveTab('content')}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-800">Browse content library</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('monitoring')}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-800">View assessments</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('capstone')}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-800">Check capstone projects</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-800">View analytics</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'intakes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Intakes</h2>
                  <p className="text-secondary-600 mt-1">Manage learning intakes and track student progress</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search intakes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedIntakeFilter}
                    onChange={(e) => setSelectedIntakeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={refreshData}
                    disabled={loading}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {filteredIntakes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No intakes found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedIntakeFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No intakes have been created yet.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Intake Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Start Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Learners
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredIntakes.map((intake: Intake) => (
                          <tr key={intake.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{intake.name}</div>
                              <div className="text-sm text-gray-500">{intake.intakeId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{intake.programName || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(intake.startDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                {intake.learnerCount || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                intake.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : intake.status === 'upcoming'
                                  ? 'bg-blue-100 text-blue-800'
                                  : intake.status === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {intake.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => navigateToIntakeLearners(intake.id)}
                                  className="text-primary-600 hover:text-primary-900 font-medium"
                                >
                                  View Learners
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => navigateToIntakeSchedule(intake.id)}
                                  className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                  Schedule
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                <h2 className="text-2xl font-bold text-secondary-800">Content Library</h2>
                  <p className="text-secondary-600 mt-1">Learning resources and materials</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="video">Videos</option>
                    <option value="pdf">PDFs</option>
                    <option value="article">Articles</option>
                    <option value="link">Links</option>
                  </select>
                  <button
                    onClick={navigateToContentLibrary}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Content</span>
                  </button>
                </div>
              </div>

              {filteredContentResources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No content found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || contentTypeFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No content has been uploaded yet.'}
                  </p>
                  <button
                    onClick={navigateToContentLibrary}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Add First Content
                  </button>
              </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Content
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredContentResources.map((content) => {
                          const IconComponent = getContentIcon(content.type);
                          return (
                            <tr key={content.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-100 p-2 rounded-lg">
                                    <IconComponent className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                                    <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">{content.description}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900 capitalize">{content.type}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(content.status)}`}>
                                  {content.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {content.tags.slice(0, 2).map((tag, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                  {content.tags.length > 2 && (
                                    <span className="text-gray-400 text-xs">+{content.tags.length - 2}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(content.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{content.views || 0}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Download className="h-4 w-4" />
                                    <span>{content.downloads || 0}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => window.open(content.url, '_blank')}
                                    className="text-primary-600 hover:text-primary-900 font-medium"
                                  >
                                    View
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={navigateToContentLibrary}
                                    className="text-gray-600 hover:text-gray-900 font-medium"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Monitoring & Evaluation</h2>
                  <p className="text-secondary-600 mt-1">Assessments and progress tracking</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={assessmentTypeFilter}
                    onChange={(e) => setAssessmentTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="quiz">Quizzes</option>
                    <option value="assignment">Assignments</option>
                    <option value="project">Projects</option>
                    <option value="exam">Exams</option>
                  </select>
                <button
                    onClick={navigateToMonitoring}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                    <span>Create Assessment</span>
                </button>
                </div>
              </div>

              {filteredAssessments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                          </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No assessments found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || assessmentTypeFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No assessments have been created yet.'}
                  </p>
                  <button 
                    onClick={navigateToMonitoring}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Create First Assessment
                  </button>
                          </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assessment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Questions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAssessments.map((assessment) => (
                          <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <CheckCircle className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                                  <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">{assessment.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 capitalize">{assessment.type}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                                {assessment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {assessment.totalQuestions || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {assessment.completions || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => navigateToMonitoring()}
                                  className="text-primary-600 hover:text-primary-900 font-medium"
                                >
                                  View Results
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => navigateToMonitoring()}
                                  className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'capstone' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Capstone Projects</h2>
                  <p className="text-secondary-600 mt-1">Final competency assessment projects</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={capstoneStatusFilter}
                    onChange={(e) => setCapstoneStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="completed">Completed</option>
                  </select>
                <button
                    onClick={navigateToCapstone}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                    <span>Create Project</span>
                </button>
                </div>
              </div>

              {filteredCapstoneProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Award className="h-8 w-8 text-gray-400" />
                        </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No projects found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || capstoneStatusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No capstone projects have been created yet.'}
                  </p>
                  <button 
                    onClick={navigateToCapstone}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Create First Project
                  </button>
                      </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCapstoneProjects.map((project) => (
                    <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Award className="h-5 w-5 text-orange-600" />
                    </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{project.title}</h3>
                            <p className="text-sm text-gray-500">{project.teamSize} team members</p>
              </div>
                      </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Submissions:</span>
                          <span className="font-medium">{project.submissions || 0}</span>
                      </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Created:</span>
                          <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                        {project.dueDate && (
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Due Date:</span>
                            <span className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                      </div>
                        )}
                    </div>
                    
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={navigateToCapstone}
                          className="bg-primary-50 text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center space-x-1"
                        >
                        <Eye className="h-4 w-4" />
                          <span>View Details</span>
                      </button>
                        <button
                          onClick={navigateToCapstone}
                          className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                        >
                        <Edit className="h-4 w-4" />
                          <span>Manage</span>
                      </button>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Learning Analytics</h2>
                  <p className="text-secondary-600 mt-1">Data insights and performance reports</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={analyticsTypeFilter}
                    onChange={(e) => setAnalyticsTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="performance">Performance</option>
                    <option value="engagement">Engagement</option>
                    <option value="progress">Progress</option>
                    <option value="financial">Financial</option>
                  </select>
                  <button 
                    onClick={navigateToAnalytics}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>

              {filteredAnalyticsReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No reports found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || analyticsTypeFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No analytics reports have been generated yet.'}
                  </p>
                  <button 
                    onClick={navigateToAnalytics}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Generate First Report
                  </button>
                      </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAnalyticsReports.map((report) => (
                    <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-red-600" />
                    </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
                            <p className="text-sm text-gray-500 capitalize">{report.type}</p>
              </div>
                    </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                  </div>
                </div>
                
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{report.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Created:</span>
                          <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Last Updated:</span>
                          <span className="font-medium">{new Date(report.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={navigateToAnalytics}
                          className="bg-primary-50 text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Report</span>
                        </button>
                        <button
                          onClick={navigateToAnalytics}
                          className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;