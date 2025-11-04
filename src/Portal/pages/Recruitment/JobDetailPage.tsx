import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Briefcase, Edit, MapPin, Building, FileText, Users, Plus, Trash2 } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface JobData {
  id?: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  organizationId: string;
  organizationName?: string;
  postedDate: string;
  closingDate?: string;
  status: 'open' | 'closed' | 'draft';
  experience: string;
  education: string;
  skills: string[];
  benefits: string[];
  applicationProcess: string;
  contactEmail: string;
  contactPhone?: string;
  applicationsCount?: number;
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
  status: 'active' | 'inactive';
}

const JobDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New job = editing mode
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [jobData, setJobData] = useState<JobData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    type: 'full-time',
    salaryMin: 0,
    salaryMax: 0,
    organizationId: '',
    organizationName: '',
    postedDate: new Date().toISOString().split('T')[0],
    closingDate: '',
    status: 'draft',
    experience: '',
    education: '',
    skills: [],
    benefits: [],
    applicationProcess: '',
    contactEmail: '',
    contactPhone: '',
    applicationsCount: 0
  });

  const [newSkill, setNewSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const tabs = [
    { id: 'details', label: 'Job Details', icon: Briefcase },
    { id: 'requirements', label: 'Requirements', icon: FileText },
    { id: 'benefits', label: 'Benefits & Perks', icon: Users },
    { id: 'application', label: 'Application', icon: MapPin },
  ];

  useEffect(() => {
    if (id) {
      loadJob();
    }
    loadOrganizations();
  }, [id]);

  const loadJob = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('jobs', id!);
      if (result.success) {
        const jobDataFromDB = result.data as JobData;
        // Get organization name
        if (jobDataFromDB.organizationId && organizations.length > 0) {
          const org = organizations.find(o => o.id === jobDataFromDB.organizationId);
          if (org) {
            jobDataFromDB.organizationName = org.name;
          }
        }
        setJobData(jobDataFromDB);
      }
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const result = await FirestoreService.getAll('organizations');
      if (result.success && result.data) {
        // Filter to show only active organizations
        const activeOrganizations = (result.data as Organization[]).filter(org => 
          org.status === 'active'
        );
        setOrganizations(activeOrganizations);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...jobData };

      // Get organization name for saving
      const selectedOrg = organizations.find(o => o.id === dataToSave.organizationId);
      if (selectedOrg) {
        dataToSave.organizationName = selectedOrg.name;
      }

      if (!id) {
        // New job
        dataToSave.postedDate = new Date().toISOString().split('T')[0];
        dataToSave.applicationsCount = 0;
        result = await FirestoreService.create('jobs', dataToSave);
      } else {
        result = await FirestoreService.update('jobs', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/opportunities/jobs/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof JobData, value: any) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !jobData.skills.includes(newSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setJobData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !jobData.benefits.includes(newBenefit.trim())) {
      setJobData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setJobData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(benefit => benefit !== benefitToRemove)
    }));
  };

  const getSelectedOrganization = () => {
    return organizations.find(o => o.id === jobData.organizationId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/opportunities')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {id ? (isEditing ? 'Edit Job' : jobData.title || 'Job Details') : 'New Job Posting'}
              </h1>
              <p className="text-lg text-primary-100">
                {id ? (jobData.organizationName || 'N/A') : 'Create a new job posting'}
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
                <span>{saving ? 'Saving...' : 'Save Job'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Job Status</p>
                  <p className="text-2xl font-bold text-white">{jobData.status.toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Applications</p>
                  <p className="text-2xl font-bold text-white">{jobData.applicationsCount || 0}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Location</p>
                  <p className="text-2xl font-bold text-white">{jobData.location || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
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
          {activeTab === 'details' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Job Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="Enter job title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Organization *
                  </label>
                  <select
                    value={jobData.organizationId}
                    onChange={(e) => handleInputChange('organizationId', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={jobData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., Nairobi, Kenya"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Job Type *
                  </label>
                  <select
                    value={jobData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status
                  </label>
                  <select
                    value={jobData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Closing Date
                  </label>
                  <input
                    type="date"
                    value={jobData.closingDate || ''}
                    onChange={(e) => handleInputChange('closingDate', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Minimum Salary (KES)
                  </label>
                  <input
                    type="number"
                    value={jobData.salaryMin || ''}
                    onChange={(e) => handleInputChange('salaryMin', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Maximum Salary (KES)
                  </label>
                  <input
                    type="number"
                    value={jobData.salaryMax || ''}
                    onChange={(e) => handleInputChange('salaryMax', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 80000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  rows={6}
                  value={jobData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Describe the job role, expectations, and what the candidate will be doing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Key Responsibilities
                </label>
                <textarea
                  rows={5}
                  value={jobData.responsibilities}
                  onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="List the main responsibilities and duties..."
                />
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Requirements & Qualifications</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Experience Required
                </label>
                <input
                  type="text"
                  value={jobData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="e.g., 2-5 years in sales"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Education Requirements
                </label>
                <input
                  type="text"
                  value={jobData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="e.g., Bachelor's degree or equivalent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Detailed Requirements
                </label>
                <textarea
                  rows={6}
                  value={jobData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="List all requirements, qualifications, and criteria..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Required Skills
                  </label>
                  {isEditing && (
                    <button
                      onClick={addSkill}
                      disabled={!newSkill.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Skill</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter a required skill"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {jobData.skills.map((skill, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {jobData.skills.length === 0 && (
                    <p className="text-secondary-500 text-sm">No skills added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Benefits & Perks</h2>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Company Benefits
                  </label>
                  {isEditing && (
                    <button
                      onClick={addBenefit}
                      disabled={!newBenefit.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Benefit</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter a company benefit"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {jobData.benefits.map((benefit, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                      <span className="text-secondary-800">{benefit}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeBenefit(benefit)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {jobData.benefits.length === 0 && (
                    <p className="text-secondary-500 text-center py-8">No benefits added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'application' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Application Process</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Application Process & Instructions
                </label>
                <textarea
                  rows={6}
                  value={jobData.applicationProcess}
                  onChange={(e) => handleInputChange('applicationProcess', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Describe how candidates should apply, what documents are needed, etc..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={jobData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="applications@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={jobData.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>

              {/* Organization Info Display */}
              {jobData.organizationId && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Organization Details</h3>
                  {getSelectedOrganization() && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-600">Name:</span>
                        <span className="text-secondary-800 font-medium">{getSelectedOrganization()?.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-600">Industry:</span>
                        <span className="text-secondary-800 font-medium">{getSelectedOrganization()?.industry}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-600">Location:</span>
                        <span className="text-secondary-800 font-medium">{getSelectedOrganization()?.location}</span>
                      </div>
                      {getSelectedOrganization()?.website && (
                        <div className="flex justify-between items-center">
                          <span className="text-secondary-600">Website:</span>
                          <a href={getSelectedOrganization()?.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 font-medium">
                            {getSelectedOrganization()?.website}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage; 