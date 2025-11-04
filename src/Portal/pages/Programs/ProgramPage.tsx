import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen, Plus, Trash2, Edit, UserPlus, CheckCircle, Upload, X } from 'lucide-react';
import { ProgramService } from '../../../services/firestore';
import { ContentResourceService } from '../../../services/contentService';
import { useAuthContext } from '../../../contexts/AuthContext';

interface Quadrant {
  name: string;
  themes: string;
  keyModules: string;
}

interface ProgramData {
  id?: string;
  programName: string;
  programCode: string;
  slug: string;
  programDuration: string;
  shortDescription: string;
  objectives: string[];
  whoIsItFor: string[];
  level: number;
  curriculumBreakdown: Quadrant[];
  completionRequirements: string[];
  programFormat: string[];
  status: 'draft' | 'active' | 'archived';
  image?: string;
  price?: number;
  currency?: string;
  intakes?: string[]; // Array of intake IDs
}

const ProgramPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const isApplicant = userProfile?.role === 'applicant';
  const canManagePrograms = userProfile?.role === 'admin' || userProfile?.role === 'staff';
  const [isEditing, setIsEditing] = useState(!id && canManagePrograms); // Only allow editing for non-applicants

  const [programData, setProgramData] = useState<ProgramData>({
    programName: '',
    programCode: '',
    slug: '',
    programDuration: '',
    shortDescription: '',
    objectives: [''],
    whoIsItFor: [''],
    level: 1,
    curriculumBreakdown: [{ name: '', themes: '', keyModules: '' }],
    completionRequirements: [''],
    programFormat: [''],
    status: 'draft',
    image: '',
    price: 0,
    currency: 'KES',
    intakes: []
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'outlines', label: 'Outlines' },
  ];

  useEffect(() => {
    if (id) {
      loadProgram();
      checkRegistrationStatus();
    }
  }, [id]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      const result = await ProgramService.getById('programs', id!);
      if (result.success) {
        const loadedData = result.data as any;
        
        // Handle data migration: old 'quadrants' field to new 'curriculumBreakdown' field
        if (loadedData.quadrants && !loadedData.curriculumBreakdown) {
          // Migrate old nested quadrants structure to simple structure
          loadedData.curriculumBreakdown = loadedData.quadrants.map((quad: any) => ({
            name: quad.name || '',
            themes: quad.themes?.map((t: any) => t.name).join(', ') || '',
            keyModules: quad.themes?.flatMap((t: any) => t.modules?.map((m: any) => m.name) || []).join(', ') || ''
          }));
          // Remove old quadrants field
          delete loadedData.quadrants;
        }
        
        // Ensure curriculumBreakdown exists and is an array
        if (!loadedData.curriculumBreakdown) {
          loadedData.curriculumBreakdown = [{ name: '', themes: '', keyModules: '' }];
        }
        
        // Ensure all required arrays exist with defaults
        const programData: ProgramData = {
          ...loadedData,
          slug: loadedData.slug || '', // Ensure slug field exists
          objectives: loadedData.objectives || [''],
          whoIsItFor: loadedData.whoIsItFor || [''],
          curriculumBreakdown: loadedData.curriculumBreakdown || [{ name: '', themes: '', keyModules: '' }],
          completionRequirements: loadedData.completionRequirements || [''],
          programFormat: loadedData.programFormat || [''],
        };
        
        setProgramData(programData);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const checkSlugUniqueness = async (slug: string, currentId?: string) => {
    try {
      const result = await ProgramService.getWithQuery('programs', [
        { field: 'slug', operator: '==', value: slug }
      ]);
      
      if (result.success && result.data) {
        // If editing existing program, exclude current program from check
        const conflictingPrograms = currentId 
          ? result.data.filter((program: any) => program.id !== currentId)
          : result.data;
        
        return conflictingPrograms.length === 0;
      }
      return true;
    } catch (error) {
      console.error('Error checking slug uniqueness:', error);
      return false;
    }
  };

  const checkRegistrationStatus = async () => {
    if (!userProfile || !isApplicant) return;
    
    try {
      // Check if user is already registered for this program
      // This is a placeholder - you would implement actual registration checking
      // const registrationResult = await FirestoreService.query('registrations', {
      //   programId: id,
      //   applicantId: userProfile.uid
      // });
      // setIsRegistered(registrationResult.data.length > 0);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleRegisterForProgram = async () => {
    if (!userProfile || !id) return;
    
    setRegistering(true);
    try {
      // Here you would implement the registration logic
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // You would typically create a registration record in Firestore
      // await FirestoreService.create('registrations', {
      //   programId: id,
      //   applicantId: userProfile.uid,
      //   registeredAt: new Date(),
      //   status: 'pending'
      // });
      
      setIsRegistered(true);
      alert('Registration successful! You will be notified about the next steps.');
    } catch (error) {
      console.error('Error registering for program:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleSave = async () => {
    if (!canManagePrograms) return;
    
    // Basic validation
    if (!programData.programName || !programData.slug) {
      alert('Please fill in all required fields including program name and URL slug');
      return;
    }

    // Check slug uniqueness
    const isSlugUnique = await checkSlugUniqueness(programData.slug, id);
    if (!isSlugUnique) {
      alert('This URL slug is already taken. Please choose a different one.');
      return;
    }
    
    setSaving(true);
    try {
      let result;
      if (id) {
        result = await ProgramService.update('programs', id, programData);
      } else {
        result = await ProgramService.create('programs', programData);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/programs/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving program:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProgramData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setProgramData(prev => ({
      ...prev,
      [field]: (prev[field as keyof ProgramData] as any[]).map((item: any, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string, defaultValue: any = '') => {
    setProgramData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof ProgramData] as any[]), defaultValue]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setProgramData(prev => ({
      ...prev,
      [field]: (prev[field as keyof ProgramData] as any[]).filter((_: any, i: number) => i !== index)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await ContentResourceService.uploadFile(file, 'programs');
      if (uploadResult.success && uploadResult.url) {
        handleInputChange('image', uploadResult.url);
      } else {
        alert('Failed to upload image: ' + uploadResult.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    handleInputChange('image', '');
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
              onClick={() => {
                // Navigate based on user role
                if (userProfile?.role === 'learner') {
                  navigate('/portal/learning/cohorts');
                } else {
                  navigate('/portal/programs');
                }
              }}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {id ? (isEditing ? 'Edit Program' : programData.programName || 'Program Details') : 'New Program'}
              </h1>
              <p className="text-lg text-primary-100">
                {isApplicant 
                  ? 'View program details and register for enrollment'
                  : (id ? 'Manage program details and outlines' : 'Create a new academic program')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isApplicant && id && (
              <button
                onClick={handleRegisterForProgram}
                disabled={registering || isRegistered}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  isRegistered 
                    ? 'bg-green-500 text-white cursor-not-allowed' 
                    : 'bg-white text-primary-600 hover:bg-gray-100 disabled:opacity-50'
                }`}
              >
                {registering ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : isRegistered ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>
                  {registering ? 'Registering...' : isRegistered ? 'Registered' : 'Register Now'}
                </span>
              </button>
            )}
            {canManagePrograms && (
              <>
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
                <span>{saving ? 'Saving...' : 'Save Program'}</span>
              </button>
                )}
              </>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary-800">Program Overview</h2>
                {isApplicant && isRegistered && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>You are registered for this program</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={programData.programName}
                    onChange={(e) => {
                      handleInputChange('programName', e.target.value);
                      // Auto-generate slug from program name if slug is empty
                      if (!programData.slug && e.target.value) {
                        const generatedSlug = generateSlug(e.target.value);
                        handleInputChange('slug', generatedSlug);
                      }
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter program name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Code *
                  </label>
                  <input
                    type="text"
                    value={programData.programCode}
                    onChange={(e) => handleInputChange('programCode', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., CS101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    URL Slug *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      /
                    </span>
                    <input
                      type="text"
                      value={programData.slug}
                      onChange={(e) => handleInputChange('slug', generateSlug(e.target.value))}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="url-friendly-name"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This will be used for the public program URL (domain.com/slug)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Image
                  </label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      />
                      {programData.image && (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={programData.image}
                              alt="Program thumbnail"
                              className="w-12 h-12 object-cover rounded"
                            />
                            <span className="text-sm text-green-700 font-medium">Image uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {uploading && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      {programData.image ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={programData.image}
                            alt="Program thumbnail"
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-gray-700">Image uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No image uploaded</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program Duration *
                  </label>
                  <input
                    type="text"
                    value={programData.programDuration}
                    onChange={(e) => handleInputChange('programDuration', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="e.g., 4 years, 6 months"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Level *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={programData.level}
                    onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Short Description *
                </label>
                <textarea
                  rows={4}
                  value={programData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Brief description of the program"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={programData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Live</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Program Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={programData.price || ''}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="Enter price (e.g., 50000)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={programData.currency || 'KES'}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    >
                      <option value="KES">KES (Kenyan Shilling)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Set the program price. Leave as 0 for "Contact for Pricing".
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Program Objectives
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('objectives', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Objective</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(Array.isArray(programData.objectives) ? programData.objectives : ['']).map((objective, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Objective ${index + 1}`}
                      />
                      {isEditing && (Array.isArray(programData.objectives) ? programData.objectives.length : 0) > 1 && (
                        <button
                          onClick={() => removeArrayItem('objectives', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Who Is It For
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('whoIsItFor', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Target Audience</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(Array.isArray(programData.whoIsItFor) ? programData.whoIsItFor : ['']).map((target, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={target}
                        onChange={(e) => handleArrayChange('whoIsItFor', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Target audience ${index + 1}`}
                      />
                      {isEditing && (Array.isArray(programData.whoIsItFor) ? programData.whoIsItFor.length : 0) > 1 && (
                        <button
                          onClick={() => removeArrayItem('whoIsItFor', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>


            </div>
          )}

          {activeTab === 'outlines' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Program Outlines</h2>
              
              {/* Curriculum Breakdown - The 4 Capability Quadrants */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-lg font-semibold text-secondary-800">
                      Curriculum Breakdown – The 4 Capability Quadrants
                    </label>
                    <p className="text-sm text-secondary-600 mt-1">Define the core capability areas and their components</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('curriculumBreakdown', { name: '', themes: '', keyModules: '' })}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Quadrant</span>
                    </button>
                  )}
                </div>
                
                {/* Table View for Non-editing Mode */}
                {!isEditing && programData.curriculumBreakdown?.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-primary-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-primary-700 uppercase tracking-wider">
                            Quadrant
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-primary-700 uppercase tracking-wider">
                            Themes
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-primary-700 uppercase tracking-wider">
                            Key Modules
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(Array.isArray(programData.curriculumBreakdown) ? programData.curriculumBreakdown : []).map((quadrant, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{quadrant.name || 'Untitled Quadrant'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700">{quadrant.themes || 'No themes defined'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700">{quadrant.keyModules || 'No modules defined'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Edit Mode - Simple Form */}
                {isEditing && (
                  <div className="space-y-4">
                    {(Array.isArray(programData.curriculumBreakdown) ? programData.curriculumBreakdown : []).map((quadrant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-secondary-800">Quadrant {index + 1}</h4>
                          {(Array.isArray(programData.curriculumBreakdown) ? programData.curriculumBreakdown.length : 0) > 1 && (
                            <button
                              onClick={() => removeArrayItem('curriculumBreakdown', index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quadrant Name</label>
                            <input
                              type="text"
                              value={quadrant.name}
                              onChange={(e) => {
                                const currentBreakdown = Array.isArray(programData.curriculumBreakdown) ? programData.curriculumBreakdown : [];
                                const newQuadrants = [...currentBreakdown];
                                newQuadrants[index] = { ...newQuadrants[index], name: e.target.value };
                                handleInputChange('curriculumBreakdown', newQuadrants);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              placeholder="e.g., Core, Business, Leadership, Self"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Themes</label>
                            <input
                              type="text"
                              value={quadrant.themes}
                              onChange={(e) => {
                                const currentBreakdown = Array.isArray(programData.curriculumBreakdown) ? programData.curriculumBreakdown : [];
                                const newQuadrants = [...currentBreakdown];
                                newQuadrants[index] = { ...newQuadrants[index], themes: e.target.value };
                                handleInputChange('curriculumBreakdown', newQuadrants);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              placeholder="e.g., Selling techniques, customer interaction"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Key Modules</label>
                            <input
                              type="text"
                              value={quadrant.keyModules}
                              onChange={(e) => {
                                const currentBreakdown = Array.isArray(programData.curriculumBreakdown) ? programData.curriculumBreakdown : [];
                                const newQuadrants = [...currentBreakdown];
                                newQuadrants[index] = { ...newQuadrants[index], keyModules: e.target.value };
                                handleInputChange('curriculumBreakdown', newQuadrants);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              placeholder="e.g., Prospecting, Follow-Up, Closing"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion Requirements */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Completion Requirements
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('completionRequirements', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Requirement</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(Array.isArray(programData.completionRequirements) ? programData.completionRequirements : ['']).map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) => handleArrayChange('completionRequirements', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Requirement ${index + 1}`}
                      />
                      {isEditing && (Array.isArray(programData.completionRequirements) ? programData.completionRequirements.length : 0) > 1 && (
                        <button
                          onClick={() => removeArrayItem('completionRequirements', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Format */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Program Format
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('programFormat', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Format</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(Array.isArray(programData.programFormat) ? programData.programFormat : ['']).map((format, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={format}
                        onChange={(e) => handleArrayChange('programFormat', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Format ${index + 1}`}
                      />
                      {isEditing && (Array.isArray(programData.programFormat) ? programData.programFormat.length : 0) > 1 && (
                        <button
                          onClick={() => removeArrayItem('programFormat', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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

export default ProgramPage;