import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Building, Search, Filter, Plus, Edit, Trash2, Eye, MapPin, Calendar, User, ChevronRight, UserPlus, Heart, ExternalLink } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import JobApplicationModal from '../../../components/JobApplicationModal';
import WhatsAppButton from '../../../components/WhatsAppButton';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  organizationId: string;
  organizationName?: string;
  postedDate: string;
  closingDate?: string;
  status: 'open' | 'closed' | 'draft';
  applicationsCount?: number;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  location: string;
  currentPosition: string;
  currentCompany: string;
  expectedSalary?: number;
  status: 'active' | 'hired' | 'inactive';
  appliedJobs: string[];
  registrationDate: string;
  resumeUrl?: string;
  skills: string[];
}

interface Organization {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  status: 'active' | 'inactive';
  openPositions?: number;
  logo?: string;
  founded?: string;
  size?: string;
  culture?: string;
  benefits?: string[];
}

interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  learnerId: string;
  applicantName: string;
  applicantEmail: string;
  applicationDate: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  coverLetter?: string;
  notes?: string;
}

const Opportunities: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState(userProfile?.role === 'learner' ? 'open-roles' : 'jobs');
  
  // Role-based access control
  const isAdmin = userProfile?.role === 'admin';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [jobApplicationModal, setJobApplicationModal] = useState<{
    isOpen: boolean;
    job: Job | null;
  }>({
    isOpen: false,
    job: null
  });

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterData();
  }, [jobs, candidates, organizations, searchTerm, statusFilter, typeFilter, locationFilter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJobs(),
        loadCandidates(),
        loadOrganizations(),
        loadApplications()
      ]);
    } catch (error) {
      console.error('Error loading opportunities data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const result = await FirestoreService.getAll('jobs');
      if (result.success && result.data) {
        const jobsData = result.data as Job[];
        // Sort by posted date, newest first
        jobsData.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      const result = await FirestoreService.getAll('candidates');
      if (result.success && result.data) {
        setCandidates(result.data as Candidate[]);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const result = await FirestoreService.getAll('organizations');
      if (result.success && result.data) {
        setOrganizations(result.data as Organization[]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const result = await FirestoreService.getAll('jobApplications');
      if (result.success && result.data) {
        setApplications(result.data as JobApplication[]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const filterData = () => {
    let filteredJobsData = jobs;
    let filteredCandidatesData = candidates;
    let filteredOrganizationsData = organizations;

    // Apply search filter
    if (searchTerm) {
      filteredJobsData = filteredJobsData.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredCandidatesData = filteredCandidatesData.filter(candidate => 
        candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.currentPosition.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredOrganizationsData = filteredOrganizationsData.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredJobsData = filteredJobsData.filter(job => job.status === statusFilter);
      filteredCandidatesData = filteredCandidatesData.filter(candidate => candidate.status === statusFilter);
      filteredOrganizationsData = filteredOrganizationsData.filter(org => org.status === statusFilter);
    }

    // Apply type filter for jobs
    if (typeFilter !== 'all') {
      filteredJobsData = filteredJobsData.filter(job => job.type === typeFilter);
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filteredJobsData = filteredJobsData.filter(job => job.location === locationFilter);
      filteredOrganizationsData = filteredOrganizationsData.filter(org => org.location === locationFilter);
    }

    setFilteredJobs(filteredJobsData);
    setFilteredCandidates(filteredCandidatesData);
    setFilteredOrganizations(filteredOrganizationsData);
  };

  const deleteItem = async (collection: string, itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete this ${itemName}? This action cannot be undone.`)) {
      try {
        const result = await FirestoreService.delete(collection, itemId);
        if (result.success) {
          loadAllData(); // Reload all data
        }
      } catch (error) {
        console.error(`Error deleting ${itemName}:`, error);
      }
    }
  };

  const handleApplyToJob = (job: Job) => {
    // Check if user has already applied
    const existingApplication = applications.find(app => 
      app.jobId === job.id && app.learnerId === userProfile?.uid
    );

    if (existingApplication) {
      alert('You have already applied to this job.');
      return;
    }

    // Open application modal
    setJobApplicationModal({
      isOpen: true,
      job: job
    });
  };

  const closeApplicationModal = () => {
    setJobApplicationModal({
      isOpen: false,
      job: null
    });
  };

  const handleApplicationSubmitted = () => {
    loadApplications(); // Reload applications
  };

  const hasApplied = (jobId: string) => {
    return applications.some(app => 
      app.jobId === jobId && app.learnerId === userProfile?.uid
    );
  };

  // Calculate stats
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'open').length;
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(c => c.status === 'active').length;
  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(o => o.status === 'active').length;
  const totalApplications = applications.length;
  const myApplications = applications.filter(app => app.learnerId === userProfile?.uid).length;

  // Get unique locations for filter
  const uniqueLocations = [...new Set([...jobs.map(j => j.location), ...organizations.map(o => o.location)])];

  const isLearner = userProfile?.role === 'learner';

  const adminStaffStats = [
    { 
      title: 'Total Jobs', 
      value: totalJobs.toString(), 
      change: `${openJobs} open`, 
      icon: Briefcase, 
      color: 'primary' 
    },
    { 
      title: 'Total Candidates', 
      value: totalCandidates.toString(), 
      change: `${activeCandidates} active`, 
      icon: Users, 
      color: 'accent' 
    },
    { 
      title: 'Organizations', 
      value: totalOrganizations.toString(), 
      change: `${activeOrganizations} active`, 
      icon: Building, 
      color: 'secondary' 
    },
    {
      title: 'Applications',
      value: totalApplications.toString(),
      change: 'Total received',
      icon: User,
      color: 'primary'
    }
  ];

  const learnerStats = [
    { 
      title: 'Open Jobs', 
      value: openJobs.toString(), 
      change: 'Available now', 
      icon: Briefcase, 
      color: 'primary' 
    },
    { 
      title: 'My Applications', 
      value: myApplications.toString(), 
      change: 'Submitted', 
      icon: UserPlus, 
      color: 'accent' 
    },
    { 
      title: 'Hiring Organizations', 
      value: activeOrganizations.toString(), 
      change: 'Active recruiters', 
      icon: Building, 
      color: 'secondary' 
    },
    {
      title: 'New This Week',
      value: jobs.filter(j => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(j.postedDate) > weekAgo;
      }).length.toString(),
      change: 'Fresh opportunities',
      icon: Calendar,
      color: 'primary'
    }
  ];

  const stats = isLearner ? learnerStats : adminStaffStats;

  const adminStaffTabs = [
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building },
  ];

  const learnerTabs = [
    { id: 'open-roles', label: 'Open Roles', icon: Briefcase },
    { id: 'organizations', label: 'Hiring Organizations', icon: Building },
    { id: 'my-applications', label: 'My Applications', icon: UserPlus },
  ];

  const tabs = isLearner ? learnerTabs : adminStaffTabs;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed':
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'hired': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-blue-100 text-blue-800';
      case 'part-time': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Negotiable';
    if (min && max) return `KES ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `KES ${min.toLocaleString()}+`;
    return 'Competitive';
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
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {isLearner ? 'Job Opportunities' : 'Opportunities Management'}
            </h1>
            <p className="text-lg text-primary-100">
              {isLearner 
                ? 'Discover career opportunities and apply to jobs that match your skills.'
                : 'Manage job postings, candidates, and hiring organizations.'
              }
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change}
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
          {/* Open Roles Tab for Learners */}
          {activeTab === 'open-roles' && isLearner && (
            <div>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Locations</option>
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jobs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.filter(job => job.status === 'open').map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-800 mb-2">{job.title}</h3>
                        <p className="text-sm text-secondary-600 mb-2">{job.organizationName}</p>
                        <div className="flex items-center space-x-4 text-sm text-secondary-500 mb-3">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(job.postedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                          {job.type}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-secondary-600 mb-4 line-clamp-3">{job.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-secondary-800">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/portal/opportunities/jobs/${job.id}`)}
                          className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleApplyToJob(job)}
                          disabled={hasApplied(job.id)}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                            hasApplied(job.id)
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {hasApplied(job.id) ? 'Applied' : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredJobs.filter(job => job.status === 'open').length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Open Jobs Found</h3>
                  <p className="text-secondary-600 mb-6">
                    {searchTerm || typeFilter !== 'all' || locationFilter !== 'all'
                      ? 'No jobs match your search criteria.'
                      : 'No open positions available at the moment.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* My Applications Tab for Learners */}
          {activeTab === 'my-applications' && isLearner && (
            <div>
              <div className="space-y-4">
                {applications.filter(app => app.learnerId === userProfile?.uid).map((application) => {
                  const job = jobs.find(j => j.id === application.jobId);
                  if (!job) return null;
                  
                  return (
                    <div key={application.id} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-secondary-800 mb-2">{job.title}</h3>
                          <p className="text-sm text-secondary-600 mb-2">{job.organizationName}</p>
                          <div className="flex items-center space-x-4 text-sm text-secondary-500 mb-3">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Applied: {new Date(application.applicationDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                          <button
                            onClick={() => navigate(`/portal/opportunities/jobs/${job.id}`)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {applications.filter(app => app.learnerId === userProfile?.uid).length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Applications Yet</h3>
                  <p className="text-secondary-600 mb-6">
                    Start applying to jobs to see your applications here.
                  </p>
                  <button
                    onClick={() => setActiveTab('open-roles')}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                  >
                    Browse Open Roles
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Organizations Tab */}
          {activeTab === 'organizations' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Locations</option>
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/portal/opportunities/organizations/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Organization</span>
                  </button>
                )}
              </div>

              {/* Organizations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrganizations.filter(org => org.status === 'active').map((organization) => (
                  <div key={organization.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-800 mb-2">{organization.name}</h3>
                        <p className="text-sm text-secondary-600 mb-2">{organization.industry}</p>
                        <div className="flex items-center space-x-4 text-sm text-secondary-500 mb-3">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {organization.location}
                          </span>
                          {organization.openPositions && (
                            <span className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {organization.openPositions} open
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(organization.status)}`}>
                        {organization.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-secondary-600 mb-4 line-clamp-3">{organization.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {organization.website && (
                          <a
                            href={organization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/portal/opportunities/organizations/${organization.id}`)}
                          className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                          View Details
                        </button>
                        {!isLearner && (
                          <button
                            onClick={() => navigate(`/portal/opportunities/organizations/${organization.id}/edit`)}
                            className="px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors duration-200"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredOrganizations.filter(org => org.status === 'active').length === 0 && (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Organizations Found</h3>
                  <p className="text-secondary-600 mb-6">
                    {searchTerm || statusFilter !== 'all' || locationFilter !== 'all'
                      ? 'No organizations match your search criteria.'
                      : 'No active organizations available.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Admin/Staff Jobs Tab */}
          {activeTab === 'jobs' && !isLearner && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/portal/opportunities/jobs/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Post Job</span>
                  </button>
                )}
              </div>

              {/* Jobs Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{formatSalary(job.salaryMin, job.salaryMax)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.organizationName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                            {job.type}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">{job.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.postedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/opportunities/jobs/${job.id}`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/opportunities/jobs/${job.id}/edit`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteItem('jobs', job.id, 'job')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredJobs.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Jobs Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'No jobs match your search criteria.'
                        : 'Start by posting your first job.'
                      }
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={() => navigate('/portal/opportunities/jobs/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Post Job</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin/Staff Candidates Tab */}
          {activeTab === 'candidates' && !isLearner && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="hired">Hired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/portal/opportunities/candidates/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Candidate</span>
                  </button>
                )}
              </div>

              {/* Candidates Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Jobs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.firstName} {candidate.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{candidate.currentPosition}</div>
                          <div className="text-sm text-gray-500">{candidate.currentCompany}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {candidate.appliedJobs.length} jobs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/opportunities/candidates/${candidate.id}`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/opportunities/candidates/${candidate.id}/edit`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {candidate.phoneNumber && (
                              <WhatsAppButton
                                customerId={candidate.id}
                                customerPhone={candidate.phoneNumber}
                                customerName={`${candidate.firstName} ${candidate.lastName}`}
                                variant="icon"
                                size="sm"
                              />
                            )}
                            <button 
                              onClick={() => deleteItem('candidates', candidate.id, 'candidate')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredCandidates.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Candidates Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No candidates match your search criteria.'
                        : 'Start by adding your first candidate.'
                      }
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={() => navigate('/portal/opportunities/candidates/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add Candidate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Application Modal */}
      {jobApplicationModal.isOpen && jobApplicationModal.job && (
        <JobApplicationModal
          isOpen={jobApplicationModal.isOpen}
          onClose={closeApplicationModal}
          job={jobApplicationModal.job}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}
    </div>
  );
};

export default Opportunities; 