import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Users, 
  Calendar, 
  Tag, 
  User, 
  BookOpen,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { FirestoreService, ProgramService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface IntakeData {
  intakeId: string;
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
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  fees?: number;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const IntakePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuthContext();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<IntakeData>({
    intakeId: '',
    name: '',
    programId: '',
    startDate: '',
    applicationDeadline: '',
    closeDate: '',
    programCost: 0,
    staffManagerId: '',
    description: '',
    maxStudents: 30,
    enrolledCount: 0,
    status: 'draft'
  });

  useEffect(() => {
    loadData();
    if (isEditing) {
      loadIntake();
    } else {
      generateIntakeId();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [programsResult, staffResult] = await Promise.all([
        FirestoreService.getAll('programs'),
        FirestoreService.getWithQuery('users', [
          { field: 'role', operator: 'in', value: ['admin', 'staff'] }
        ])
      ]);

      if (programsResult.success && programsResult.data) {
        setPrograms(programsResult.data as Program[]);
      }

      if (staffResult.success && staffResult.data) {
        setStaff(staffResult.data as Staff[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadIntake = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await FirestoreService.getById('intakes', id);
      if (result.success && result.data) {
        setFormData(result.data as unknown as IntakeData);
      }
    } catch (error) {
      console.error('Error loading intake:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateIntakeId = async () => {
    try {
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        const count = result.data.length + 1;
        const intakeId = `INT${count.toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, intakeId }));
      }
    } catch (error) {
      console.error('Error generating intake ID:', error);
      setFormData(prev => ({ ...prev, intakeId: 'INT001' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Intake name is required';
    }

    if (!formData.intakeId.trim()) {
      newErrors.intakeId = 'Intake ID is required';
    }

    if (!formData.programId) {
      newErrors.programId = 'Program selection is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = 'Application deadline is required';
    }

    if (!formData.closeDate) {
      newErrors.closeDate = 'Close date is required';
    }

    if (!formData.staffManagerId) {
      newErrors.staffManagerId = 'Staff manager is required';
    }

    if (formData.programCost < 0) {
      newErrors.programCost = 'Program cost cannot be negative';
    }

    if (formData.maxStudents && formData.maxStudents < 1) {
      newErrors.maxStudents = 'Maximum students must be at least 1';
    }

    // Date validations
    if (formData.startDate && formData.applicationDeadline) {
      if (new Date(formData.applicationDeadline) >= new Date(formData.startDate)) {
        newErrors.applicationDeadline = 'Application deadline must be before start date';
      }
    }

    if (formData.startDate && formData.closeDate) {
      if (new Date(formData.closeDate) <= new Date(formData.startDate)) {
        newErrors.closeDate = 'Close date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof IntakeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-populate program cost when program is selected
    if (field === 'programId' && value) {
      const selectedProgram = programs.find(p => p.id === value);
      if (selectedProgram && selectedProgram.fees) {
        setFormData(prev => ({ ...prev, programCost: selectedProgram.fees || 0 }));
      }
    }
  };

  const handleSave = async () => {
    console.log('🚀 Starting save process...');
    console.log('📝 isEditing:', isEditing);
    console.log('🆔 id:', id);
    console.log('📋 Route logic: id exists =', !!id, 'so isEditing =', !!id);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setSaving(true);
    try {
      const intakeData = {
        ...formData
        // Note: createdAt and updatedAt will be automatically added by FirestoreService
      };

      console.log('Intake data to save:', intakeData);

      let result;
      if (isEditing) {
        console.log('Updating existing intake...');
        result = await FirestoreService.update('intakes', id!, intakeData);
      } else {
        console.log('Creating new intake...');
        result = await FirestoreService.create('intakes', intakeData);
      }

      console.log('💾 Save result:', result);

      if (result.success) {
        console.log('✅ Intake saved successfully to Firestore!');
        console.log('📝 Collection: intakes');
        console.log('🆔 Document ID:', isEditing ? id : (result as any).id);
        alert(`✅ Intake ${isEditing ? 'updated' : 'created'} successfully!`);
        
        // Check if we came from Learning module
        const referrer = sessionStorage.getItem('intake_referrer');
        if (referrer === 'learning') {
          sessionStorage.removeItem('intake_referrer');
          sessionStorage.setItem('refresh_learning', 'true');
          navigate('/portal/learning');
        } else {
          navigate('/portal/admissions');
        }
      } else {
        console.error('❌ Save failed with result:', result);
        alert(`❌ Failed to ${isEditing ? 'update' : 'create'} intake. Please try again.`);
      }
    } catch (error) {
      console.error('Error saving intake:', error);
      alert(`❌ Error ${isEditing ? 'updating' : 'creating'} intake. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const selectedProgram = programs.find(p => p.id === formData.programId);
  const selectedStaff = staff.find(s => s.id === formData.staffManagerId);

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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/admissions')}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {isEditing ? 'Edit Intake' : 'Create New Intake'}
              </h1>
              <p className="text-lg text-primary-100">
                {isEditing ? 'Update intake information and settings' : 'Set up a new intake for student enrollment'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mt-8">
          <button
            onClick={() => navigate('/portal/admissions')}
            className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-opacity-30 transition-colors duration-200 border border-white border-opacity-20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Saving...' : 'Save Intake'}</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-secondary-800">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Intake Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Sales Excellence 2024 Q1 Intake"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Intake ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.intakeId}
                  onChange={(e) => handleInputChange('intakeId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.intakeId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="INT001"
                />
                {errors.intakeId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.intakeId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.programId}
                  onChange={(e) => handleInputChange('programId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.programId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.programName}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.programId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="Brief description of the intake..."
              />
            </div>
          </div>

          {/* Dates and Timeline */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-secondary-800">Dates & Timeline</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Application Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.applicationDeadline ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.applicationDeadline && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.applicationDeadline}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.startDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Close Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => handleInputChange('closeDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.closeDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.closeDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.closeDate}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial and Management */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <Tag className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-secondary-800">Financial & Management</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Program Cost <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-secondary-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    value={formData.programCost}
                    onChange={(e) => handleInputChange('programCost', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.programCost ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.programCost && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.programCost}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Maximum Students
                </label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.maxStudents ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="30"
                  min="1"
                />
                {errors.maxStudents && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.maxStudents}</span>
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Staff Manager <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.staffManagerId}
                  onChange={(e) => handleInputChange('staffManagerId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.staffManagerId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a staff manager</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.role})
                    </option>
                  ))}
                </select>
                {errors.staffManagerId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.staffManagerId}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-secondary-800 mb-4">Intake Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.status === 'active' ? 'bg-green-100 text-green-800' :
                  formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  formData.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </span>
              </div>
              
              {selectedProgram && (
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600">Program</span>
                  <span className="text-secondary-800 font-medium">{selectedProgram.programName}</span>
                </div>
              )}
              
              {formData.programCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600">Cost</span>
                  <span className="text-secondary-800 font-medium">KES {formData.programCost.toLocaleString()}</span>
                </div>
              )}
              
              {formData.maxStudents && (
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600">Max Students</span>
                  <span className="text-secondary-800 font-medium">{formData.maxStudents}</span>
                </div>
              )}
              
              {selectedStaff && (
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600">Manager</span>
                  <span className="text-secondary-800 font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Card */}
          {(formData.applicationDeadline || formData.startDate || formData.closeDate) && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-secondary-800 mb-4">Timeline</h3>
              <div className="space-y-4">
                {formData.applicationDeadline && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-secondary-800">Application Deadline</p>
                      <p className="text-sm text-secondary-600">{new Date(formData.applicationDeadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                
                {formData.startDate && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-secondary-800">Start Date</p>
                      <p className="text-sm text-secondary-600">{new Date(formData.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                
                {formData.closeDate && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-secondary-800">Close Date</p>
                      <p className="text-sm text-secondary-600">{new Date(formData.closeDate).toLocaleDateString()}</p>
                    </div>
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

export default IntakePage; 