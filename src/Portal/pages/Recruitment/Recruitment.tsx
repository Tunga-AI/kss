import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Building, Search, Filter, Plus, Edit, Trash2, Eye, MapPin, Calendar, User } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

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
  experience: string;
  skills: string[];
  education: string;
  currentPosition?: string;
  currentCompany?: string;
  resumeUrl?: string;
  appliedJobs: string[];
  status: 'active' | 'hired' | 'inactive';
  registrationDate: string;
  expectedSalary?: number;
  location: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  logoUrl?: string;
  establishedYear?: number;
  employeeCount?: string;
  status: 'active' | 'inactive';
  registrationDate: string;
  jobsPosted?: number;
}

const Recruitment: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterData();
  }, [jobs, candidates, organizations, searchTerm, statusFilter, typeFilter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJobs(),
        loadCandidates(),
        loadOrganizations()
      ]);
    } catch (error) {
      console.error('Error loading recruitment data:', error);
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
        const candidatesData = result.data as Candidate[];
        // Sort by registration date, newest first
        candidatesData.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
        setCandidates(candidatesData);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const result = await FirestoreService.getAll('organizations');
      if (result.success && result.data) {
        const organizationsData = result.data as Organization[];
        // Sort by registration date, newest first
        organizationsData.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
        setOrganizations(organizationsData);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const filterData = () => {
    // Filter Jobs
    let filteredJobsData = jobs;
    if (searchTerm) {
      filteredJobsData = filteredJobsData.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filteredJobsData = filteredJobsData.filter(job => job.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filteredJobsData = filteredJobsData.filter(job => job.type === typeFilter);
    }
    setFilteredJobs(filteredJobsData);

    // Filter Candidates
    let filteredCandidatesData = candidates;
    if (searchTerm) {
      filteredCandidatesData = filteredCandidatesData.filter(candidate =>
        candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.currentPosition?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filteredCandidatesData = filteredCandidatesData.filter(candidate => candidate.status === statusFilter);
    }
    setFilteredCandidates(filteredCandidatesData);

    // Filter Organizations
    let filteredOrganizationsData = organizations;
    if (searchTerm) {
      filteredOrganizationsData = filteredOrganizationsData.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filteredOrganizationsData = filteredOrganizationsData.filter(org => org.status === statusFilter);
    }
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

  // Calculate stats
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'open').length;
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(c => c.status === 'active').length;
  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(o => o.status === 'active').length;
  const totalApplications = jobs.reduce((total, job) => total + (job.applicationsCount || 0), 0);

  const stats = [
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

  const tabs = [
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed':
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'hired': return 'bg-blue-100 text-blue-800';
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
            <h1 className="text-4xl font-bold mb-2">Recruitment</h1>
            <p className="text-lg text-primary-100">
              Manage job postings, candidates, and hiring organizations.
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
          {activeTab === 'jobs' && (
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
                <button 
                  onClick={() => navigate('/portal/recruitment/jobs/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Post Job</span>
                </button>
              </div>

              {/* Jobs Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Job Title</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Organization</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Applications</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Posted</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{job.title}</div>
                            <div className="text-sm text-secondary-500">
                              {job.salaryMin && job.salaryMax 
                                ? `KES ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                                : 'Salary negotiable'
                              }
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{job.organizationName || 'N/A'}</td>
                        <td className="py-4 px-4 text-secondary-600">{job.location}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                            {job.type.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-secondary-800">{job.applicationsCount || 0}</td>
                        <td className="py-4 px-4 text-secondary-600">{new Date(job.postedDate).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/recruitment/jobs/${job.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/recruitment/jobs/${job.id}/edit`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="Edit Job"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteItem('jobs', job.id, 'job')}
                              className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                              title="Delete Job"
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
                    <button 
                      onClick={() => navigate('/portal/recruitment/jobs/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Post Job</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'candidates' && (
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
                <button 
                  onClick={() => navigate('/portal/recruitment/candidates/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Candidate</span>
                </button>
              </div>

              {/* Candidates Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Current Position</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Experience</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Applications</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Registered</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{candidate.firstName} {candidate.lastName}</div>
                            <div className="text-sm text-secondary-500">{candidate.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-secondary-800">{candidate.currentPosition || 'N/A'}</div>
                            <div className="text-sm text-secondary-500">{candidate.currentCompany || ''}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{candidate.experience}</td>
                        <td className="py-4 px-4 text-secondary-600">{candidate.location}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-secondary-800">{candidate.appliedJobs?.length || 0}</td>
                        <td className="py-4 px-4 text-secondary-600">{new Date(candidate.registrationDate).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/recruitment/candidates/${candidate.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/recruitment/candidates/${candidate.id}/edit`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="Edit Candidate"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteItem('candidates', candidate.id, 'candidate')}
                              className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                              title="Delete Candidate"
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
                    <button 
                      onClick={() => navigate('/portal/recruitment/candidates/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Candidate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                </div>
                <button 
                  onClick={() => navigate('/portal/recruitment/organizations/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Organization</span>
                </button>
              </div>

              {/* Organizations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Organization</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Industry</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Employees</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Jobs Posted</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Registered</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrganizations.map((organization) => (
                      <tr key={organization.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{organization.name}</div>
                            <div className="text-sm text-secondary-500">{organization.contactEmail}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{organization.industry}</td>
                        <td className="py-4 px-4 text-secondary-600">{organization.location}</td>
                        <td className="py-4 px-4 text-secondary-600">{organization.employeeCount || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(organization.status)}`}>
                            {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-secondary-800">{organization.jobsPosted || 0}</td>
                        <td className="py-4 px-4 text-secondary-600">{new Date(organization.registrationDate).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/recruitment/organizations/${organization.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/recruitment/organizations/${organization.id}/edit`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="Edit Organization"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteItem('organizations', organization.id, 'organization')}
                              className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                              title="Delete Organization"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredOrganizations.length === 0 && (
                  <div className="text-center py-12">
                    <Building className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Organizations Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No organizations match your search criteria.'
                        : 'Start by adding your first organization.'
                      }
                    </p>
                    <button 
                      onClick={() => navigate('/portal/recruitment/organizations/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Organization</span>
                    </button>
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

export default Recruitment; 