import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Edit, Mail, Phone, Briefcase, FileText, Plus, Trash2, Download, ExternalLink } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface CandidateData {
  id?: string;
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  location: string;
  dateOfBirth?: string;
  // Professional Information
  currentPosition?: string;
  currentCompany?: string;
  experience: string;
  expectedSalary?: number;
  noticePeriod?: string;
  // Education & Skills
  education: string;
  skills: string[];
  certifications: string[];
  languages: string[];
  // Career Information
  careerSummary: string;
  achievements: string;
  // Application Information
  appliedJobs: string[];
  status: 'active' | 'hired' | 'inactive';
  registrationDate: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  // Additional
  availability: string;
  willingToRelocate: boolean;
  notes?: string;
}

interface Job {
  id: string;
  title: string;
  organizationName?: string;
  location: string;
  status: 'open' | 'closed' | 'draft';
}

const CandidateDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New candidate = editing mode
  const [jobs, setJobs] = useState<Job[]>([]);

  const [candidateData, setCandidateData] = useState<CandidateData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    location: '',
    dateOfBirth: '',
    currentPosition: '',
    currentCompany: '',
    experience: '',
    expectedSalary: 0,
    noticePeriod: '',
    education: '',
    skills: [],
    certifications: [],
    languages: [],
    careerSummary: '',
    achievements: '',
    appliedJobs: [],
    status: 'active',
    registrationDate: new Date().toISOString().split('T')[0],
    resumeUrl: '',
    portfolioUrl: '',
    linkedinUrl: '',
    availability: 'immediate',
    willingToRelocate: false,
    notes: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'education', label: 'Education & Skills', icon: FileText },
    { id: 'applications', label: 'Applications', icon: Mail },
  ];

  useEffect(() => {
    if (id) {
      loadCandidate();
    }
    loadJobs();
  }, [id]);

  const loadCandidate = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('candidates', id!);
      if (result.success) {
        setCandidateData(result.data as CandidateData);
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const result = await FirestoreService.getAll('jobs');
      if (result.success && result.data) {
        setJobs(result.data as Job[]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...candidateData };

      if (!id) {
        // New candidate
        dataToSave.registrationDate = new Date().toISOString().split('T')[0];
        result = await FirestoreService.create('candidates', dataToSave);
      } else {
        result = await FirestoreService.update('candidates', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/recruitment/candidates/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving candidate:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CandidateData, value: any) => {
    setCandidateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = (type: 'skills' | 'certifications' | 'languages', value: string, setter: (value: string) => void) => {
    if (value.trim() && !candidateData[type].includes(value.trim())) {
      setCandidateData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setter('');
    }
  };

  const removeItem = (type: 'skills' | 'certifications' | 'languages', itemToRemove: string) => {
    setCandidateData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== itemToRemove)
    }));
  };

  const getAppliedJobsDetails = () => {
    return candidateData.appliedJobs.map(jobId => {
      const job = jobs.find(j => j.id === jobId);
      return job || { id: jobId, title: 'Unknown Job', organizationName: 'N/A', location: 'N/A', status: 'unknown' as const };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-red-100 text-red-800';
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
              onClick={() => navigate('/portal/recruitment')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {id ? (isEditing ? 'Edit Candidate' : `${candidateData.firstName} ${candidateData.lastName}` || 'Candidate Details') : 'New Candidate'}
              </h1>
              <p className="text-lg text-primary-100">
                {id ? candidateData.currentPosition || candidateData.email : 'Add a new candidate profile'}
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
                <span>{saving ? 'Saving...' : 'Save Candidate'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Status</p>
                  <p className="text-2xl font-bold text-white">{candidateData.status.toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Applications</p>
                  <p className="text-2xl font-bold text-white">{candidateData.appliedJobs?.length || 0}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Expected Salary</p>
                  <p className="text-2xl font-bold text-white">
                    {candidateData.expectedSalary ? `KES ${candidateData.expectedSalary.toLocaleString()}` : 'Negotiable'}
                  </p>
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
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={candidateData.firstName}
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
                    value={candidateData.lastName}
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
                    value={candidateData.email}
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
                    value={candidateData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={candidateData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="City, Country"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={candidateData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status
                  </label>
                  <select
                    value={candidateData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="hired">Hired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={candidateData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="2_weeks">2 Weeks Notice</option>
                    <option value="1_month">1 Month Notice</option>
                    <option value="2_months">2 Months Notice</option>
                    <option value="3_months">3 Months Notice</option>
                  </select>
                </div>

                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    checked={candidateData.willingToRelocate}
                    onChange={(e) => handleInputChange('willingToRelocate', e.target.checked)}
                    disabled={!isEditing}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-secondary-700">
                    Willing to relocate
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={4}
                  value={candidateData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Any additional notes about the candidate..."
                />
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Professional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Current Position
                  </label>
                  <input
                    type="text"
                    value={candidateData.currentPosition || ''}
                    onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., Sales Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Current Company
                  </label>
                  <input
                    type="text"
                    value={candidateData.currentCompany || ''}
                    onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={candidateData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 5 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Expected Salary (KES)
                  </label>
                  <input
                    type="number"
                    value={candidateData.expectedSalary || ''}
                    onChange={(e) => handleInputChange('expectedSalary', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Career Summary
                </label>
                <textarea
                  rows={6}
                  value={candidateData.careerSummary}
                  onChange={(e) => handleInputChange('careerSummary', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Brief summary of career highlights and experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Key Achievements
                </label>
                <textarea
                  rows={5}
                  value={candidateData.achievements}
                  onChange={(e) => handleInputChange('achievements', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Notable achievements, awards, and accomplishments..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Resume URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={candidateData.resumeUrl || ''}
                      onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://..."
                    />
                    {candidateData.resumeUrl && (
                      <a 
                        href={candidateData.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Portfolio URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={candidateData.portfolioUrl || ''}
                      onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://..."
                    />
                    {candidateData.portfolioUrl && (
                      <a 
                        href={candidateData.portfolioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    LinkedIn URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={candidateData.linkedinUrl || ''}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://linkedin.com/in/..."
                    />
                    {candidateData.linkedinUrl && (
                      <a 
                        href={candidateData.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Education & Skills</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Education Background
                </label>
                <textarea
                  rows={4}
                  value={candidateData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Education details, degrees, institutions..."
                />
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Skills
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addItem('skills', newSkill, setNewSkill)}
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
                      onKeyPress={(e) => e.key === 'Enter' && addItem('skills', newSkill, setNewSkill)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter a skill"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                  {candidateData.skills.map((skill, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeItem('skills', skill)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {candidateData.skills.length === 0 && (
                    <p className="text-secondary-500 text-sm">No skills added yet.</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Certifications
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addItem('certifications', newCertification, setNewCertification)}
                      disabled={!newCertification.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Certification</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('certifications', newCertification, setNewCertification)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter a certification"
                    />
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {candidateData.certifications.map((certification, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                      <span className="text-secondary-800">{certification}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeItem('certifications', certification)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {candidateData.certifications.length === 0 && (
                    <p className="text-secondary-500 text-center py-4">No certifications added yet.</p>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Languages
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addItem('languages', newLanguage, setNewLanguage)}
                      disabled={!newLanguage.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Language</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('languages', newLanguage, setNewLanguage)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter a language"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {candidateData.languages.map((language, index) => (
                    <div key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                      <span>{language}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeItem('languages', language)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {candidateData.languages.length === 0 && (
                    <p className="text-secondary-500 text-sm">No languages added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Job Applications</h2>
              
              {getAppliedJobsDetails().length > 0 ? (
                <div className="space-y-4">
                  {getAppliedJobsDetails().map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-800">{job.title}</h3>
                          <p className="text-secondary-600">{job.organizationName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-secondary-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Applications Yet</h3>
                  <p className="text-secondary-600">This candidate hasn't applied to any jobs yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailPage; 