import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building, Edit, Globe, Mail, Phone, Users, Briefcase, FileText, ExternalLink } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface OrganizationData {
  id?: string;
  // Basic Information
  name: string;
  description: string;
  industry: string;
  location: string;
  establishedYear?: number;
  employeeCount?: string;
  // Contact Information
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  contactPerson?: string;
  contactTitle?: string;
  // Address Information
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  // Social & Online Presence
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  logoUrl?: string;
  // Business Information
  businessType?: string;
  registrationNumber?: string;
  taxNumber?: string;
  // Status & Metadata
  status: 'active' | 'inactive';
  registrationDate: string;
  notes?: string;
  jobsPosted?: number;
}

interface Job {
  id: string;
  title: string;
  type: string;
  status: 'open' | 'closed' | 'draft';
  postedDate: string;
  applicationsCount?: number;
}

const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New organization = editing mode
  const [organizationJobs, setOrganizationJobs] = useState<Job[]>([]);

  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    description: '',
    industry: '',
    location: '',
    establishedYear: undefined,
    employeeCount: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    contactTitle: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    linkedinUrl: '',
    twitterUrl: '',
    facebookUrl: '',
    logoUrl: '',
    businessType: '',
    registrationNumber: '',
    taxNumber: '',
    status: 'active',
    registrationDate: new Date().toISOString().split('T')[0],
    notes: '',
    jobsPosted: 0
  });

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building },
    { id: 'contact', label: 'Contact & Address', icon: Mail },
    { id: 'business', label: 'Business Details', icon: Briefcase },
    { id: 'jobs', label: 'Posted Jobs', icon: FileText },
  ];

  const industryOptions = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Hospitality', 'Real Estate', 'Transportation', 'Media',
    'Government', 'Non-profit', 'Energy', 'Agriculture', 'Construction',
    'Telecommunications', 'Automotive', 'Aerospace', 'Pharmaceutical', 'Other'
  ];

  const employeeCountOptions = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  ];

  const businessTypeOptions = [
    'Corporation', 'Limited Liability Company (LLC)', 'Partnership',
    'Sole Proprietorship', 'Non-profit', 'Government Agency', 'Other'
  ];

  useEffect(() => {
    if (id) {
      loadOrganization();
      loadOrganizationJobs();
    }
  }, [id]);

  const loadOrganization = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('organizations', id!);
      if (result.success) {
        setOrganizationData(result.data as OrganizationData);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationJobs = async () => {
    try {
      const result = await FirestoreService.getWithQuery('jobs', [
        { field: 'organizationId', operator: '==', value: id! }
      ]);
      if (result.success && result.data) {
        setOrganizationJobs(result.data as Job[]);
      }
    } catch (error) {
      console.error('Error loading organization jobs:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...organizationData };

      if (!id) {
        // New organization
        dataToSave.registrationDate = new Date().toISOString().split('T')[0];
        dataToSave.jobsPosted = 0;
        result = await FirestoreService.create('organizations', dataToSave);
      } else {
        result = await FirestoreService.update('organizations', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/recruitment/organizations/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving organization:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof OrganizationData, value: any) => {
    setOrganizationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
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
                {id ? (isEditing ? 'Edit Organization' : organizationData.name || 'Organization Details') : 'New Organization'}
              </h1>
              <p className="text-lg text-primary-100">
                {id ? organizationData.industry || 'N/A' : 'Add a new organization profile'}
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
                <span>{saving ? 'Saving...' : 'Save Organization'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Building className="h-8 w-8 text-white" />
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
                  <p className="text-2xl font-bold text-white">{organizationData.status.toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Jobs Posted</p>
                  <p className="text-2xl font-bold text-white">{organizationJobs.length}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Employees</p>
                  <p className="text-2xl font-bold text-white">{organizationData.employeeCount || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
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
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={organizationData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={organizationData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Brief description of the organization..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Industry *
                  </label>
                  <select
                    value={organizationData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
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
                    value={organizationData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Established Year
                  </label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={organizationData.establishedYear || ''}
                    onChange={(e) => handleInputChange('establishedYear', parseInt(e.target.value) || undefined)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Employee Count
                  </label>
                  <select
                    value={organizationData.employeeCount || ''}
                    onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select range</option>
                    {employeeCountOptions.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status
                  </label>
                  <select
                    value={organizationData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Website
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={organizationData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://www.example.com"
                    />
                    {organizationData.website && (
                      <a 
                        href={organizationData.website} 
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
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={organizationData.logoUrl || ''}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={4}
                  value={organizationData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Any additional notes about the organization..."
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Contact & Address Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={organizationData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="contact@organization.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={organizationData.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={organizationData.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Person Title
                  </label>
                  <input
                    type="text"
                    value={organizationData.contactTitle || ''}
                    onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="HR Manager"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={3}
                  value={organizationData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Street address, building, floor..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={organizationData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Nairobi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={organizationData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Kenya"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={organizationData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="00100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    LinkedIn URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={organizationData.linkedinUrl || ''}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://linkedin.com/company/..."
                    />
                    {organizationData.linkedinUrl && (
                      <a 
                        href={organizationData.linkedinUrl} 
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
                    Twitter URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={organizationData.twitterUrl || ''}
                      onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://twitter.com/..."
                    />
                    {organizationData.twitterUrl && (
                      <a 
                        href={organizationData.twitterUrl} 
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
                    Facebook URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={organizationData.facebookUrl || ''}
                      onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="https://facebook.com/..."
                    />
                    {organizationData.facebookUrl && (
                      <a 
                        href={organizationData.facebookUrl} 
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

          {activeTab === 'business' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Business Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Business Type
                  </label>
                  <select
                    value={organizationData.businessType || ''}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select business type</option>
                    {businessTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={organizationData.registrationDate}
                    onChange={(e) => handleInputChange('registrationDate', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    value={organizationData.registrationNumber || ''}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Business registration number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Tax/VAT Number
                  </label>
                  <input
                    type="text"
                    value={organizationData.taxNumber || ''}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Tax/VAT number"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary-800">Posted Jobs</h2>
                <button 
                  onClick={() => navigate('/portal/recruitment/jobs/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Post New Job</span>
                </button>
              </div>
              
              {organizationJobs.length > 0 ? (
                <div className="space-y-4">
                  {organizationJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-800">{job.title}</h3>
                          <p className="text-secondary-600">{job.type}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-secondary-500">
                        <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
                        <span>Applications: {job.applicationsCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Jobs Posted</h3>
                  <p className="text-secondary-600 mb-6">This organization hasn't posted any jobs yet.</p>
                  <button 
                    onClick={() => navigate('/portal/recruitment/jobs/new')}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <Briefcase className="h-5 w-5" />
                    <span>Post First Job</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetailPage; 