import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, Plus, Edit, Trash2, Search, Filter, Download, Share2, Calendar, 
  BarChart3, TrendingUp, PieChart, LineChart, Target, Users, BookOpen,
  Settings, Eye, Copy, Save, AlertCircle, CheckCircle, Clock, Star,
  Table, Activity, Award, FileText, Upload, ExternalLink
} from 'lucide-react';
import { 
  AnalyticsService, 
  AnalyticsReport, 
  Dashboard, 
  LearningObjective,
  AnalyticsReportData,
  DashboardData,
  LearningObjectiveData,
  AnalyticsMetric,
  AnalyticsVisualization,
  DashboardWidget
} from '../../../services/analyticsService';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { intakeId } = useParams();
  const [activeTab, setActiveTab] = useState<'reports' | 'dashboards' | 'objectives'>('reports');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);

  // Stats
  const [stats, setStats] = useState([
    { title: 'Total Reports', value: '0', change: '+0', icon: BarChart3, color: 'primary' },
    { title: 'Active Dashboards', value: '0', change: '+0', icon: PieChart, color: 'accent' },
    { title: 'Learning Objectives', value: '0', change: '+0', icon: Target, color: 'secondary' },
    { title: 'Avg Engagement', value: '0%', change: '+0%', icon: TrendingUp, color: 'blue' },
  ]);

  // Form states
  const [reportForm, setReportForm] = useState<AnalyticsReportData>({
    title: '',
    description: '',
    type: 'performance',
    dateRange: {
      startDate: '',
      endDate: ''
    },
    metrics: [],
    visualizations: [],
    filters: [],
    isPublic: false,
    tags: [],
    status: 'draft'
  });

  const [dashboardForm, setDashboardForm] = useState<DashboardData>({
    title: '',
    description: '',
    layout: { columns: 3, rows: 2, gap: 16 },
    widgets: [],
    isDefault: false,
    isPublic: false,
    tags: []
  });

  const [objectiveForm, setObjectiveForm] = useState<LearningObjectiveData>({
    title: '',
    description: '',
    intakeId: intakeId || '',
    type: 'knowledge',
    targetValue: 0,
    unit: '',
    measurementMethod: 'assessment'
  });

  const tabs = [
    { id: 'reports', label: 'Analytics Reports', icon: BarChart3 },
    { id: 'dashboards', label: 'Dashboards', icon: PieChart },
    { id: 'objectives', label: 'Learning Objectives', icon: Target }
  ];

  useEffect(() => {
    loadData();
    loadStats();
  }, [intakeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsResult, dashboardsResult, objectivesResult] = await Promise.all([
        AnalyticsService.getReports({ intakeId }),
        AnalyticsService.getDashboards({ intakeId }),
        AnalyticsService.getObjectives({ intakeId })
      ]);

      if (reportsResult.success && reportsResult.data) {
        setReports(reportsResult.data);
      }
      if (dashboardsResult.success && dashboardsResult.data) {
        setDashboards(dashboardsResult.data);
      }
      if (objectivesResult.success && objectivesResult.data) {
        setObjectives(objectivesResult.data);
      }
    } catch (error) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await AnalyticsService.getAnalyticsStats();
      if (result.success && result.data) {
        setStats([
          { title: 'Total Reports', value: result.data.totalReports.toString(), change: '+2', icon: BarChart3, color: 'primary' },
          { title: 'Active Dashboards', value: result.data.activeDashboards.toString(), change: '+1', icon: PieChart, color: 'accent' },
          { title: 'Learning Objectives', value: result.data.trackingObjectives.toString(), change: '+3', icon: Target, color: 'secondary' },
          { title: 'Avg Engagement', value: `${result.data.avgEngagementScore}%`, change: '+0.5%', icon: TrendingUp, color: 'blue' },
        ]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await AnalyticsService.updateReport(editingItem, reportForm)
        : await AnalyticsService.createReport(reportForm);

      if (result.success) {
        setSuccess(editingItem ? 'Report updated successfully' : 'Report created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetReportForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save report');
      }
    } catch (error) {
      setError('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await AnalyticsService.updateDashboard(editingItem, dashboardForm)
        : await AnalyticsService.createDashboard(dashboardForm);

      if (result.success) {
        setSuccess(editingItem ? 'Dashboard updated successfully' : 'Dashboard created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetDashboardForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save dashboard');
      }
    } catch (error) {
      setError('Failed to save dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await AnalyticsService.updateObjective(editingItem, objectiveForm)
        : await AnalyticsService.createObjective(objectiveForm);

      if (result.success) {
        setSuccess(editingItem ? 'Objective updated successfully' : 'Objective created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetObjectiveForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save objective');
      }
    } catch (error) {
      setError('Failed to save objective');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'report' | 'dashboard' | 'objective') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      let result;
      switch (type) {
        case 'report':
          result = await AnalyticsService.deleteReport(id);
          break;
        case 'dashboard':
          result = await AnalyticsService.deleteDashboard(id);
          break;
        case 'objective':
          result = await AnalyticsService.deleteObjective(id);
          break;
      }

      if (result.success) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        loadData();
        loadStats();
      } else {
        setError(result.error || `Failed to delete ${type}`);
      }
    } catch (error) {
      setError(`Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const resetReportForm = () => {
    setReportForm({
      title: '',
      description: '',
      type: 'performance',
      dateRange: {
        startDate: '',
        endDate: ''
      },
      metrics: [],
      visualizations: [],
      filters: [],
      isPublic: false,
      tags: [],
      status: 'draft'
    });
  };

  const resetDashboardForm = () => {
    setDashboardForm({
      title: '',
      description: '',
      layout: { columns: 3, rows: 2, gap: 16 },
      widgets: [],
      isDefault: false,
      isPublic: false,
      tags: []
    });
  };

  const resetObjectiveForm = () => {
    setObjectiveForm({
      title: '',
      description: '',
      intakeId: intakeId || '',
      type: 'knowledge',
      targetValue: 0,
      unit: '',
      measurementMethod: 'assessment'
    });
  };

  const openForm = (type: 'report' | 'dashboard' | 'objective') => {
    setActiveTab(type === 'report' ? 'reports' : type === 'dashboard' ? 'dashboards' : 'objectives');
    setShowForm(true);
    setEditingItem(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setError(null);
    resetReportForm();
    resetDashboardForm();
    resetObjectiveForm();
  };

  const loadReport = async (id: string) => {
    try {
      const result = await AnalyticsService.getReport(id);
      if (result.success && result.data) {
        setReportForm({
          title: result.data.title,
          description: result.data.description,
          type: result.data.type,
          intakeId: result.data.intakeId,
          learnerId: result.data.learnerId,
          dateRange: result.data.dateRange,
          metrics: result.data.metrics,
          visualizations: result.data.visualizations,
          filters: result.data.filters,
          schedule: result.data.schedule,
          isPublic: result.data.isPublic,
          tags: result.data.tags,
          status: result.data.status
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('reports');
      }
    } catch (error) {
      setError('Failed to load report');
    }
  };

  const loadDashboard = async (id: string) => {
    try {
      const result = await AnalyticsService.getDashboard(id);
      if (result.success && result.data) {
        setDashboardForm({
          title: result.data.title,
          description: result.data.description,
          layout: result.data.layout,
          widgets: result.data.widgets,
          intakeId: result.data.intakeId,
          isDefault: result.data.isDefault,
          isPublic: result.data.isPublic,
          tags: result.data.tags
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('dashboards');
      }
    } catch (error) {
      setError('Failed to load dashboard');
    }
  };

  const loadObjective = async (id: string) => {
    try {
      const result = await AnalyticsService.getObjective(id);
      if (result.success && result.data) {
        setObjectiveForm({
          title: result.data.title,
          description: result.data.description,
          intakeId: result.data.intakeId,
          week: result.data.week,
          type: result.data.type,
          targetValue: result.data.targetValue,
          unit: result.data.unit,
          measurementMethod: result.data.measurementMethod
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('objectives');
      }
    } catch (error) {
      setError('Failed to load objective');
    }
  };

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(report => 
    filterType === 'all' || report.type === filterType
  );

  const filteredDashboards = dashboards.filter(dashboard => 
    dashboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredObjectives = objectives.filter(objective => 
    objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    objective.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(objective => 
    filterType === 'all' || objective.type === filterType
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'exceeded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return BarChart3;
      case 'engagement': return Users;
      case 'progress': return TrendingUp;
      case 'assessment': return CheckCircle;
      case 'resource_usage': return BookOpen;
      case 'attendance': return Clock;
      case 'knowledge': return BookOpen;
      case 'skill': return Target;
      case 'behavior': return Users;
      case 'outcome': return Award;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Learning Analytics</h1>
            <p className="text-lg text-primary-100">
              Comprehensive analytics, reports, and performance tracking for learning outcomes.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
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
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!showForm ? (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    {activeTab === 'reports' && (
                      <>
                        <option value="performance">Performance</option>
                        <option value="engagement">Engagement</option>
                        <option value="progress">Progress</option>
                        <option value="assessment">Assessment</option>
                        <option value="resource_usage">Resource Usage</option>
                        <option value="attendance">Attendance</option>
                        <option value="custom">Custom</option>
                      </>
                    )}
                    {activeTab === 'objectives' && (
                      <>
                        <option value="knowledge">Knowledge</option>
                        <option value="skill">Skill</option>
                        <option value="behavior">Behavior</option>
                        <option value="outcome">Outcome</option>
                      </>
                    )}
                  </select>
                </div>
                <button
                  onClick={() => openForm(activeTab === 'reports' ? 'report' : activeTab === 'dashboards' ? 'dashboard' : 'objective')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    Create {activeTab === 'reports' ? 'Report' : activeTab === 'dashboards' ? 'Dashboard' : 'Objective'}
                  </span>
                </button>
              </div>

              {/* Content Grid */}
              <div>
                {activeTab === 'reports' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report) => {
                      const Icon = getTypeIcon(report.type);
                      return (
                        <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{report.title}</h3>
                                <p className="text-sm text-gray-600 capitalize">{report.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{report.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {report.metrics.length} metrics
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {report.visualizations.length} charts
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => loadReport(report.id)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(report.id, 'report')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'dashboards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDashboards.map((dashboard) => (
                      <div key={dashboard.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <PieChart className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{dashboard.title}</h3>
                              <p className="text-sm text-gray-600">
                                {dashboard.isDefault ? 'Default Dashboard' : 'Custom Dashboard'}
                              </p>
                            </div>
                          </div>
                          {dashboard.isPublic && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Public
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dashboard.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {dashboard.widgets.length} widgets
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {dashboard.layout.columns}x{dashboard.layout.rows}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => loadDashboard(dashboard.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(dashboard.id, 'dashboard')}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'objectives' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredObjectives.map((objective) => {
                      const Icon = getTypeIcon(objective.type);
                      const progress = (objective.currentValue / objective.targetValue) * 100;
                      return (
                        <div key={objective.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Icon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{objective.title}</h3>
                                <p className="text-sm text-gray-600 capitalize">{objective.type}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}>
                              {objective.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{objective.description}</p>
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Progress</span>
                              <span className="text-sm font-medium text-gray-800">
                                {objective.currentValue}/{objective.targetValue} {objective.unit}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 capitalize">
                              {objective.measurementMethod.replace('_', ' ')}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => loadObjective(objective.id)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(objective.id, 'objective')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {((activeTab === 'reports' && filteredReports.length === 0) ||
                  (activeTab === 'dashboards' && filteredDashboards.length === 0) ||
                  (activeTab === 'objectives' && filteredObjectives.length === 0)) && (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                      {activeTab === 'reports' && <BarChart3 className="h-8 w-8 text-gray-400" />}
                      {activeTab === 'dashboards' && <PieChart className="h-8 w-8 text-gray-400" />}
                      {activeTab === 'objectives' && <Target className="h-8 w-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No {activeTab} found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'Try adjusting your search terms' : `Get started by creating your first ${activeTab.slice(0, -1)}`}
                    </p>
                    <button
                      onClick={() => openForm(activeTab === 'reports' ? 'report' : activeTab === 'dashboards' ? 'dashboard' : 'objective')}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Create {activeTab === 'reports' ? 'Report' : activeTab === 'dashboards' ? 'Dashboard' : 'Objective'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Form Content */}
              {activeTab === 'reports' && (
                <form onSubmit={handleReportSubmit} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-secondary-800">
                      {editingItem ? 'Edit Report' : 'Create New Report'}
                    </h2>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Title *
                      </label>
                      <input
                        type="text"
                        value={reportForm.title}
                        onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Type *
                      </label>
                      <select
                        value={reportForm.type}
                        onChange={(e) => setReportForm({ ...reportForm, type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="performance">Performance</option>
                        <option value="engagement">Engagement</option>
                        <option value="progress">Progress</option>
                        <option value="assessment">Assessment</option>
                        <option value="resource_usage">Resource Usage</option>
                        <option value="attendance">Attendance</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={reportForm.dateRange.startDate}
                        onChange={(e) => setReportForm({ 
                          ...reportForm, 
                          dateRange: { ...reportForm.dateRange, startDate: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={reportForm.dateRange.endDate}
                        onChange={(e) => setReportForm({ 
                          ...reportForm, 
                          dateRange: { ...reportForm.dateRange, endDate: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={reportForm.status}
                        onChange={(e) => setReportForm({ ...reportForm, status: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-4 mt-8">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reportForm.isPublic}
                          onChange={(e) => setReportForm({ ...reportForm, isPublic: e.target.checked })}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Make Public</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingItem ? 'Update Report' : 'Create Report'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'dashboards' && (
                <form onSubmit={handleDashboardSubmit} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-secondary-800">
                      {editingItem ? 'Edit Dashboard' : 'Create New Dashboard'}
                    </h2>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dashboard Title *
                      </label>
                      <input
                        type="text"
                        value={dashboardForm.title}
                        onChange={(e) => setDashboardForm({ ...dashboardForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Layout Columns
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={dashboardForm.layout.columns}
                        onChange={(e) => setDashboardForm({ 
                          ...dashboardForm, 
                          layout: { ...dashboardForm.layout, columns: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={dashboardForm.description}
                      onChange={(e) => setDashboardForm({ ...dashboardForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Layout Rows
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={dashboardForm.layout.rows}
                        onChange={(e) => setDashboardForm({ 
                          ...dashboardForm, 
                          layout: { ...dashboardForm.layout, rows: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grid Gap (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={dashboardForm.layout.gap}
                        onChange={(e) => setDashboardForm({ 
                          ...dashboardForm, 
                          layout: { ...dashboardForm.layout, gap: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dashboardForm.isDefault}
                        onChange={(e) => setDashboardForm({ ...dashboardForm, isDefault: e.target.checked })}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Set as Default</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dashboardForm.isPublic}
                        onChange={(e) => setDashboardForm({ ...dashboardForm, isPublic: e.target.checked })}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Make Public</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingItem ? 'Update Dashboard' : 'Create Dashboard'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'objectives' && (
                <form onSubmit={handleObjectiveSubmit} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-secondary-800">
                      {editingItem ? 'Edit Learning Objective' : 'Create New Learning Objective'}
                    </h2>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objective Title *
                      </label>
                      <input
                        type="text"
                        value={objectiveForm.title}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objective Type *
                      </label>
                      <select
                        value={objectiveForm.type}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="knowledge">Knowledge</option>
                        <option value="skill">Skill</option>
                        <option value="behavior">Behavior</option>
                        <option value="outcome">Outcome</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={objectiveForm.description}
                      onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Value *
                      </label>
                      <input
                        type="number"
                        value={objectiveForm.targetValue}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, targetValue: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={objectiveForm.unit}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., points, %, hours"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Week (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={objectiveForm.week || ''}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, week: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Measurement Method *
                    </label>
                    <select
                      value={objectiveForm.measurementMethod}
                      onChange={(e) => setObjectiveForm({ ...objectiveForm, measurementMethod: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="assessment">Assessment</option>
                      <option value="observation">Observation</option>
                      <option value="self_report">Self Report</option>
                      <option value="peer_review">Peer Review</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingItem ? 'Update Objective' : 'Create Objective'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 