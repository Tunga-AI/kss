import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, Settings, HelpCircle, Sparkles, Filter, RefreshCw, Database, Bot, User, Send, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import AIChat from '../../../components/AIChat';
import aiService from '../../../services/aiService';
import aiDataService from '../../../services/aiDataService';
import { useAuthContext } from '../../../contexts/AuthContext';

const AI: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDataStats, setShowDataStats] = useState(false);
  const [dataStats, setDataStats] = useState<{ [key: string]: number }>({});
  const [dataStatus, setDataStatus] = useState<{
    loading: boolean;
    lastUpdated: Date | null;
    error: string | null;
    totalRecords: number;
    collectionsLoaded: number;
  }>({
    loading: false,
    lastUpdated: null,
    error: null,
    totalRecords: 0,
    collectionsLoaded: 0
  });

  const allCategories = [
    // Core Educational Data
    { id: 'learners', label: 'Learners', description: 'Student information and academic records', category: 'Education' },
    { id: 'applicants', label: 'Applicants', description: 'Application records and status', category: 'Education' },
    { id: 'admissions', label: 'Admissions', description: 'Application processes and admission data', category: 'Education' },
    { id: 'programs', label: 'Programs', description: 'Educational programs and curricula', category: 'Education' },
    { id: 'cohorts', label: 'Cohorts', description: 'Student groups and cohort information', category: 'Education' },
    { id: 'intakes', label: 'Intakes', description: 'Program intake periods and enrollment cycles', category: 'Education' },

    // Learning & Assessment
    { id: 'sessions', label: 'Sessions', description: 'Class sessions and scheduling', category: 'Learning' },
    { id: 'session_content', label: 'Session Content', description: 'Learning materials and class content', category: 'Learning' },
    { id: 'scheduleItems', label: 'Schedule Items', description: 'Calendar and scheduling information', category: 'Learning' },
    { id: 'learning', label: 'Learning Records', description: 'Learning sessions and educational content', category: 'Learning' },
    
    // Assessment & Testing
    { id: 'competencyTests', label: 'Competency Tests', description: 'Skills assessments and competency evaluations', category: 'Assessment' },
    { id: 'testAttempts', label: 'Test Attempts', description: 'Student test submissions and results', category: 'Assessment' },
    { id: 'applicationFeedback', label: 'Application Feedback', description: 'Admission feedback and evaluations', category: 'Assessment' },

    // People & Organizations
    { id: 'staff', label: 'Staff', description: 'Staff information and roles', category: 'People' },
    { id: 'customers', label: 'Customers', description: 'Customer relationship management data', category: 'People' },
    { id: 'contacts', label: 'Contacts', description: 'Contact information and directory', category: 'People' },
    { id: 'organizations', label: 'Organizations', description: 'Partner organizations and employers', category: 'People' },
    { id: 'roles', label: 'Roles', description: 'User roles and permissions', category: 'People' },

    // Recruitment & Jobs
    { id: 'jobs', label: 'Jobs', description: 'Job opportunities and placements', category: 'Recruitment' },
    { id: 'candidates', label: 'Candidates', description: 'Job candidates and applicants', category: 'Recruitment' },
    { id: 'jobApplications', label: 'Job Applications', description: 'Employment application records', category: 'Recruitment' },
    { id: 'recruitment', label: 'Recruitment', description: 'Job postings and hiring processes', category: 'Recruitment' },

    // Events & Activities
    { id: 'events', label: 'Events', description: 'Scheduled events and activities', category: 'Events' },
    { id: 'event_registrations', label: 'Event Registrations', description: 'Event attendance and registration data', category: 'Events' },

    // Communications
    { id: 'communications', label: 'Communications', description: 'Organizational communications and announcements', category: 'Communications' },
    { id: 'messages', label: 'Messages', description: 'Internal messaging and notifications', category: 'Communications' },
    { id: 'letterTemplates', label: 'Letter Templates', description: 'Communication templates and forms', category: 'Communications' },

    // Financial & Administrative
    { id: 'payment_records', label: 'Payment Records', description: 'Payment transactions and financial records', category: 'Finance' },
    { id: 'finances', label: 'Finance Records', description: 'Financial data and accounting information', category: 'Finance' },
    { id: 'settings', label: 'Settings', description: 'System configuration and preferences', category: 'System' }
  ];

  // Filter categories based on user role
  const userRole = userProfile?.role || 'applicant';
  const allowedCategoryIds = aiDataService.getAllowedCategories(userRole);
  const availableCategories = allCategories.filter(category => 
    allowedCategoryIds.includes(category.id)
  );

  useEffect(() => {
    loadDataStatus();
  }, []);

  const loadDataStatus = async () => {
    try {
      setDataStatus(prev => ({ ...prev, loading: true, error: null }));
      const data = await aiDataService.getAllContextData();
      const stats = await aiDataService.getCollectionStats();
      const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
      const collectionsLoaded = Object.keys(stats).length;
      
      setDataStats(stats);
      setDataStatus({
        loading: false,
        lastUpdated: new Date(),
        error: null,
        totalRecords,
        collectionsLoaded
      });
    } catch (error) {
      setDataStatus({
        loading: false,
        lastUpdated: null,
        error: error instanceof Error ? error.message : 'Failed to load data',
        totalRecords: 0,
        collectionsLoaded: 0
      });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  const refreshData = async () => {
    aiDataService.clearCache();
    await loadDataStatus();
  };

  const clearAllConversations = () => {
    if (window.confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) {
      aiService.clearAllConversations();
      setSelectedConversationId('');
    }
  };

  const getDataSummary = async () => {
    try {
      const summary = await aiDataService.getDataSummary();
      return summary;
    } catch (error) {
      return 'Unable to load data summary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8 mx-6 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">AI Assistant</h1>
            <p className="text-lg text-primary-100">
              {userRole === 'admin' && 'Full organizational access - Ask about anything in the system'}
              {userRole === 'staff' && 'Operational access - Ask about learners, admissions, programs, and more'}
              {userRole === 'learner' && 'Learning-focused access - Ask about your education and progress'}
              {userRole === 'applicant' && 'Application-focused access - Ask about programs and admissions'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm bg-primary-500 text-white px-3 py-1 rounded-full capitalize">
                {userRole} Access
              </span>
              <span className="text-sm text-primary-200">
                {dataStatus.lastUpdated ? 'Data: Live' : 'Data: Loading...'}
              </span>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-30 rounded-lg">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {aiService.getAllConversations().length}
                </h3>
                <p className="text-sm text-primary-100">Total Conversations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-30 rounded-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedCategories.length > 0 ? selectedCategories.length : 'All'}
                </h3>
                <p className="text-sm text-primary-100">Active Categories</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-30 rounded-lg">
                <Database size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {dataStatus.lastUpdated ? 'Live' : 'Offline'}
                </h3>
                <p className="text-sm text-primary-100">Data Connection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Control Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter size={16} />
                Filters
                {selectedCategories.length > 0 && (
                  <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
              <button
                onClick={refreshData}
                disabled={dataStatus.loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={dataStatus.loading ? 'animate-spin' : ''} />
                Refresh Data
              </button>
              <button
                onClick={() => setShowDataStats(!showDataStats)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Database size={16} />
                {showDataStats ? 'Hide Stats' : 'Show Stats'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllConversations}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Data Status Bar */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  Data Status: 
                  {dataStatus.loading ? (
                    <span className="text-yellow-600 ml-1 flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" />
                      Loading...
                    </span>
                  ) : dataStatus.error ? (
                    <span className="text-red-600 ml-1">Error</span>
                  ) : (
                    <span className="text-green-600 ml-1">
                      ✅ Ready ({dataStatus.totalRecords.toLocaleString()} records)
                    </span>
                  )}
                </span>
              </div>
              {dataStatus.lastUpdated && (
                <div className="text-sm text-gray-500">
                  Last updated: {dataStatus.lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <div className="text-sm text-gray-500">
                Collections: {dataStatus.collectionsLoaded}/{Object.keys(dataStats).length || 'Loading...'}
              </div>
            </div>
            {dataStatus.error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                {dataStatus.error}
              </div>
            )}
          </div>
        </div>

        {/* Data Statistics Panel */}
        {showDataStats && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Database Statistics</h3>
              <p className="text-sm text-gray-600">
                Real-time overview of all collections available to the AI for answering questions.
              </p>
            </div>
            
            {Object.keys(dataStats).length > 0 ? (
              (() => {
                // Group stats by category
                const groupedStats = allCategories.reduce((groups, category) => {
                  const categoryType = category.category || 'Other';
                  if (!groups[categoryType]) {
                    groups[categoryType] = [];
                  }
                  if (dataStats[category.id] !== undefined) {
                    groups[categoryType].push({
                      ...category,
                      count: dataStats[category.id]
                    });
                  }
                  return groups;
                }, {} as { [key: string]: Array<{ id: string; label: string; count: number; category?: string }> });

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedStats).map(([groupName, stats]) => (
                      <div key={groupName} className="bg-gray-50 rounded-lg p-4 border">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          {groupName === 'Education' && '🎓'}
                          {groupName === 'Learning' && '📚'}
                          {groupName === 'Assessment' && '📊'}
                          {groupName === 'People' && '👥'}
                          {groupName === 'Recruitment' && '💼'}
                          {groupName === 'Events' && '🎉'}
                          {groupName === 'Communications' && '📧'}
                          {groupName === 'Finance' && '💰'}
                          {groupName === 'System' && '⚙️'}
                          {groupName}
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {stats.reduce((sum, stat) => sum + stat.count, 0)}
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {stats
                            .sort((a, b) => b.count - a.count)
                            .map(stat => (
                              <div key={stat.id} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{stat.label}</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {stat.count.toLocaleString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8">
                <Database size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Loading database statistics...</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total Records: <strong>{dataStatus.totalRecords.toLocaleString()}</strong>
                </span>
                <span className="text-gray-600">
                  Collections: <strong>{dataStatus.collectionsLoaded}</strong>
                </span>
                <span className="text-gray-600">
                  Cache Status: <strong className="text-green-600">Active</strong>
                </span>
                <button
                  onClick={refreshData}
                  disabled={dataStatus.loading}
                  className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  <RefreshCw size={12} className={dataStatus.loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filter by Categories</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {availableCategories.length} categories available
                </span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {/* Group categories by category type */}
            {(() => {
              const groupedCategories = availableCategories.reduce((groups, category) => {
                const categoryType = category.category || 'Other';
                if (!groups[categoryType]) {
                  groups[categoryType] = [];
                }
                groups[categoryType].push(category);
                return groups;
              }, {} as { [key: string]: typeof availableCategories });

              return (
                <div className="space-y-6">
                  {Object.entries(groupedCategories).map(([groupName, categories]) => (
                    <div key={groupName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-medium text-gray-800 flex items-center gap-2">
                          {groupName === 'Education' && '🎓'}
                          {groupName === 'Learning' && '📚'}
                          {groupName === 'Assessment' && '📊'}
                          {groupName === 'People' && '👥'}
                          {groupName === 'Recruitment' && '💼'}
                          {groupName === 'Events' && '🎉'}
                          {groupName === 'Communications' && '📧'}
                          {groupName === 'Finance' && '💰'}
                          {groupName === 'System' && '⚙️'}
                          {groupName}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const groupCategoryIds = categories.map(c => c.id);
                              const allSelected = groupCategoryIds.every(id => selectedCategories.includes(id));
                              if (allSelected) {
                                setSelectedCategories(prev => prev.filter(id => !groupCategoryIds.includes(id)));
                              } else {
                                setSelectedCategories(prev => [...new Set([...prev, ...groupCategoryIds])]);
                              }
                            }}
                            className="text-xs text-primary-600 hover:text-primary-800"
                          >
                            {categories.every(c => selectedCategories.includes(c.id)) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.map(category => (
                          <div key={category.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={category.id}
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleCategoryToggle(category.id)}
                              className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={category.id} className="cursor-pointer flex-1">
                              <div className="text-sm font-medium text-gray-900">{category.label}</div>
                              <div className="text-xs text-gray-500">{category.description}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            
            {selectedCategories.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700 mb-3">Active filters ({selectedCategories.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(categoryId => {
                    const category = availableCategories.find(c => c.id === categoryId);
                    return (
                      <span
                        key={categoryId}
                        className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full"
                      >
                        {category?.label}
                        <button
                          onClick={() => handleCategoryToggle(categoryId)}
                          className="text-primary-600 hover:text-primary-800 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <AIChat
            selectedConversationId={selectedConversationId}
            onConversationSelect={setSelectedConversationId}
            categories={selectedCategories.length > 0 ? selectedCategories : undefined}
            userRole={userRole}
          />
        </div>
      </div>

      {/* Help Section */}
      <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <HelpCircle size={20} className="text-primary-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What can the AI help you with? ({userRole} access)
              </h3>
              
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">🎓 Educational Management</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Analyze learner performance and progress</li>
                        <li>• Review admission applications and feedback</li>
                        <li>• Track program effectiveness and cohort success</li>
                        <li>• Monitor competency test results</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">💼 Operations & HR</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Staff performance and role management</li>
                        <li>• Recruitment pipeline and candidate tracking</li>
                        <li>• Customer relationship insights</li>
                        <li>• Event attendance and engagement analysis</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">💰 Financial Analysis</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Payment records and revenue tracking</li>
                        <li>• Financial performance by program</li>
                        <li>• Outstanding balances and collections</li>
                        <li>• Cost analysis and profitability</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-primary-800">
                      <strong>Try asking:</strong> "What's our current enrollment status?", "Which programs have the highest completion rates?", 
                      "Show me financial performance this quarter", or "Who are our top performing staff members?"
                    </p>
                  </div>
                </div>
              )}

              {userRole === 'staff' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">👨‍🎓 Student Management</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Track learner progress and attendance</li>
                        <li>• Review application statuses and feedback</li>
                        <li>• Monitor test attempts and competency results</li>
                        <li>• Manage cohort schedules and sessions</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">📋 Operational Tasks</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Event planning and attendee management</li>
                        <li>• Customer communication and follow-ups</li>
                        <li>• Job placement and candidate matching</li>
                        <li>• Payment tracking and financial records</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Try asking:</strong> "Which students need follow-up?", "What's the attendance rate for today's sessions?", 
                      "Show me pending applications", or "Who's due for payment reminders?"
                    </p>
                  </div>
                </div>
              )}

              {userRole === 'learner' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">📚 Your Learning Journey</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Your progress and test results</li>
                        <li>• Upcoming sessions and schedules</li>
                        <li>• Available learning content and resources</li>
                        <li>• Your cohort information and peers</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">🎯 Academic Support</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Study recommendations and tips</li>
                        <li>• Event opportunities and networking</li>
                        <li>• Contact information for support</li>
                        <li>• Program requirements and milestones</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Try asking:</strong> "How am I performing in my program?", "What sessions do I have this week?", 
                      "Show me my test results", or "What events can I attend?"
                    </p>
                  </div>
                </div>
              )}

              {userRole === 'applicant' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">📝 Your Application</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Application status and next steps</li>
                        <li>• Required competency tests</li>
                        <li>• Feedback from admission reviewers</li>
                        <li>• Intake information and deadlines</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">🎓 Program Information</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Available programs and requirements</li>
                        <li>• Upcoming events and information sessions</li>
                        <li>• Contact information for admissions</li>
                        <li>• Success stories and testimonials</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Try asking:</strong> "What's the status of my application?", "What programs are available?", 
                      "Do I need to take any tests?", or "When is the next intake?"
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">💡 Tips for Better AI Responses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium mb-1">Be Specific:</p>
                      <p>Instead of "How are students doing?", try "Show me the completion rates for the Sales Excellence program"</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Use Filters:</p>
                      <p>Select specific categories above to focus the AI on particular data areas</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Ask Follow-ups:</p>
                      <p>Build on previous questions to dive deeper into insights</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Use Time Ranges:</p>
                      <p>Ask about "this week", "last month", or specific date ranges</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AI; 