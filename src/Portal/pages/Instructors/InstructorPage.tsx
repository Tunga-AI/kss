import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { 
  ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar,
  GraduationCap, Briefcase, Clock, DollarSign, AlertCircle,
  Plus, Trash2, Award, BookOpen, Star, Users, CheckCircle
} from 'lucide-react';
import { InstructorService } from '../../../services/instructorService';
import { Instructor, AvailabilitySlot, InstructorAssignment } from '../../../types/instructor';
import LoadingSpinner from '../../../components/LoadingSpinner';

const InstructorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user, userProfile } = useAuthContext();
  
  // Extract id from the wildcard parameter since Portal uses /portal/* route
  const wildcardPath = params['*'] || '';
  const pathParts = wildcardPath.split('/');
  let id = pathParts[1]; // instructors/[id] -> get the id part
  
  // Check if this is the my-profile route
  const isMyProfile = window.location.pathname.includes('/my-profile');
  
  const isNewInstructor = id === 'new';
  const isEditMode = window.location.pathname.includes('/edit') || isNewInstructor;

  const [loading, setLoading] = useState(!isNewInstructor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructor, setInstructor] = useState<Instructor>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    specializations: [],
    qualifications: [],
    certifications: [],
    yearsOfExperience: 0,
    subjects: [],
    preferredPrograms: [],
    maxSessionsPerWeek: 10,
    availability: [
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
      { dayOfWeek: 'Sunday', startTime: '09:00', endTime: '13:00', isAvailable: false },
    ],
    status: 'active',
    contractType: 'full_time',
    joinedDate: new Date().toISOString().split('T')[0],
    currentLoad: 0
  });

  const [assignments, setAssignments] = useState<InstructorAssignment[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (isMyProfile) {
        // Load instructor profile based on current user's email
        await loadMyProfile();
      } else if (!isNewInstructor && id) {
        await loadInstructor();
        await loadAssignments();
      }
    };
    
    loadData();
  }, [id, isNewInstructor, isMyProfile, user?.email]);

  const loadMyProfile = async () => {
    if (!user?.email) {
      setError('User email not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Find instructor by email
      const instructors = await InstructorService.getAllInstructors();
      const myInstructor = instructors.find(inst => inst.email === user.email);
      
      if (myInstructor && myInstructor.id) {
        setInstructor(myInstructor);
        // Load assignments for this instructor
        const assignments = await InstructorService.getInstructorAssignments(myInstructor.id);
        setAssignments(assignments);
        // Update the id for further operations
        id = myInstructor.id;
      } else {
        setError('Instructor profile not found');
      }
    } catch (error) {
      console.error('Error loading instructor profile:', error);
      setError('Error loading instructor profile');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructor = async () => {
    if (!id || id === 'new') return;

    try {
      setLoading(true);
      const data = await InstructorService.getInstructorById(id);
      if (data) {
        setInstructor(data);
      } else {
        alert('Instructor not found');
        navigate('/portal/instructors');
      }
    } catch (error) {
      console.error('Error loading instructor:', error);
      setError('Error loading instructor');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!id || id === 'new') return;

    try {
      const data = await InstructorService.getInstructorAssignments(id);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!instructor.firstName || !instructor.lastName || !instructor.email || !instructor.phoneNumber) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (isNewInstructor) {
        const newId = await InstructorService.createInstructor(instructor);
        alert('Instructor created successfully!\n\nA user account has been created. The instructor can now log in using their email address and will be prompted to set up their password on first login.');
        navigate(`/portal/instructors/${newId}`);
      } else if (id) {
        await InstructorService.updateInstructor(id, instructor);
        alert('Instructor updated successfully!');
        navigate(`/portal/instructors/${id}`);
      }
    } catch (error) {
      console.error('Error saving instructor:', error);
      alert('Error saving instructor');
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityChange = (day: string, field: 'startTime' | 'endTime' | 'isAvailable', value: any) => {
    const updatedAvailability = instructor.availability.map(slot => {
      if (slot.dayOfWeek === day) {
        return { ...slot, [field]: value };
      }
      return slot;
    });
    setInstructor({ ...instructor, availability: updatedAvailability });
  };

  const addToList = (field: 'specializations' | 'qualifications' | 'certifications' | 'subjects', value: string) => {
    if (value.trim()) {
      const currentList = instructor[field] || [];
      if (!currentList.includes(value.trim())) {
        setInstructor({
          ...instructor,
          [field]: [...currentList, value.trim()]
        });
      }
    }
  };

  const removeFromList = (field: 'specializations' | 'qualifications' | 'certifications' | 'subjects', value: string) => {
    const currentList = instructor[field] || [];
    setInstructor({
      ...instructor,
      [field]: currentList.filter(item => item !== value)
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-red-800 font-medium">Error</h3>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button 
            onClick={() => navigate('/portal/instructors')}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Back to Instructors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/instructors')}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isNewInstructor ? 'Add New Instructor' : isEditMode ? 'Edit Instructor' : 'Instructor Details'}
              </h1>
              {!isNewInstructor && instructor && (
                <p className="text-primary-100 mt-1">
                  {instructor.firstName} {instructor.lastName}
                </p>
              )}
            </div>
          </div>

          {isEditMode ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate(`/portal/instructors/${id}/edit`)}
              className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={instructor.firstName}
                  onChange={(e) => setInstructor({ ...instructor, firstName: e.target.value })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={instructor.lastName}
                  onChange={(e) => setInstructor({ ...instructor, lastName: e.target.value })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={instructor.email}
                  onChange={(e) => setInstructor({ ...instructor, email: e.target.value })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={instructor.phoneNumber}
                  onChange={(e) => setInstructor({ ...instructor, phoneNumber: e.target.value })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={instructor.employeeId || ''}
                  onChange={(e) => setInstructor({ ...instructor, employeeId: e.target.value })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={instructor.yearsOfExperience}
                  onChange={(e) => setInstructor({ ...instructor, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={instructor.bio || ''}
                onChange={(e) => setInstructor({ ...instructor, bio: e.target.value })}
                disabled={!isEditMode}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                placeholder="Brief description about the instructor..."
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-primary-600" />
              Professional Information
            </h2>

            {/* Specializations */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations
              </label>
              {isEditMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToList('specializations', newSpecialization);
                        setNewSpecialization('');
                      }
                    }}
                    placeholder="Add specialization"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => {
                      addToList('specializations', newSpecialization);
                      setNewSpecialization('');
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {instructor.specializations?.map((spec, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {spec}
                    {isEditMode && (
                      <button
                        onClick={() => removeFromList('specializations', spec)}
                        className="hover:text-primary-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Subjects */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Subjects
              </label>
              {isEditMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToList('subjects', newSubject);
                        setNewSubject('');
                      }
                    }}
                    placeholder="Add subject"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => {
                      addToList('subjects', newSubject);
                      setNewSubject('');
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {instructor.subjects?.map((subject, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {subject}
                    {isEditMode && (
                      <button
                        onClick={() => removeFromList('subjects', subject)}
                        className="hover:text-secondary-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualifications
              </label>
              {isEditMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToList('qualifications', newQualification);
                        setNewQualification('');
                      }
                    }}
                    placeholder="Add qualification"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => {
                      addToList('qualifications', newQualification);
                      setNewQualification('');
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {instructor.qualifications?.map((qual, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {qual}
                    {isEditMode && (
                      <button
                        onClick={() => removeFromList('qualifications', qual)}
                        className="hover:text-accent-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              {isEditMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToList('certifications', newCertification);
                        setNewCertification('');
                      }
                    }}
                    placeholder="Add certification"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => {
                      addToList('certifications', newCertification);
                      setNewCertification('');
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {instructor.certifications?.map((cert, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm flex items-center gap-1"
                  >
                    <Award className="h-3 w-3" />
                    {cert}
                    {isEditMode && (
                      <button
                        onClick={() => removeFromList('certifications', cert)}
                        className="hover:text-neutral-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Schedule */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              Weekly Availability
            </h2>

            <div className="space-y-3">
              {instructor.availability?.map((slot, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                  <div className="w-32">
                    <span className="font-medium text-gray-700">{slot.dayOfWeek}</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={slot.isAvailable}
                    onChange={(e) => handleAvailabilityChange(slot.dayOfWeek, 'isAvailable', e.target.checked)}
                    disabled={!isEditMode}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500"
                  />

                  {slot.isAvailable && (
                    <>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleAvailabilityChange(slot.dayOfWeek, 'startTime', e.target.value)}
                        disabled={!isEditMode}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleAvailabilityChange(slot.dayOfWeek, 'endTime', e.target.value)}
                        disabled={!isEditMode}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      />
                    </>
                  )}

                  {!slot.isAvailable && (
                    <span className="text-gray-400 italic">Not Available</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status and Contract */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Employment Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={instructor.status}
                  onChange={(e) => setInstructor({ ...instructor, status: e.target.value as any })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Type
                </label>
                <select
                  value={instructor.contractType}
                  onChange={(e) => setInstructor({ ...instructor, contractType: e.target.value as any })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Sessions/Week
                </label>
                <input
                  type="number"
                  value={instructor.maxSessionsPerWeek}
                  onChange={(e) => setInstructor({ ...instructor, maxSessionsPerWeek: parseInt(e.target.value) || 0 })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  value={instructor.hourlyRate || ''}
                  onChange={(e) => setInstructor({ ...instructor, hourlyRate: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditMode}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined Date
                </label>
                <input
                  type="date"
                  value={instructor.joinedDate}
                  onChange={(e) => setInstructor({ ...instructor, joinedDate: e.target.value })}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Statistics */}
          {!isNewInstructor && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Load</span>
                  <span className="font-semibold">
                    {instructor.currentLoad || 0} / {instructor.maxSessionsPerWeek}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-semibold">{instructor.totalSessionsTaught || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">
                      {instructor.rating ? instructor.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Intakes</span>
                  <span className="font-semibold">
                    {instructor.assignedIntakes?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Assignments */}
          {!isNewInstructor && assignments.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Assignments</h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">
                      {assignment.sessionTitle}
                    </p>
                    <p className="text-xs text-gray-600">
                      {assignment.sessionDate} • {assignment.sessionTime}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      assignment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorPage;