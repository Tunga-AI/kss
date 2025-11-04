import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, User, Mail, Phone, BookOpen, Target, CheckCircle, AlertCircle, X, MessageSquare, Calendar } from 'lucide-react';
import { FirestoreService, ProgramService } from '../services/firestore';
import { Customer, Program } from '../Portal/pages/Customers/types';

interface CustomerLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId?: string;
  programName?: string;
  programType?: 'core' | 'short';
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  currentRole: string;
  currentOrganization: string;
  programId: string;
  intakeId?: string;
  learningGoals: string;
  communicationPreference: 'email' | 'whatsapp' | 'phone' | 'any';
  source: 'website' | 'referral' | 'social_media' | 'direct' | 'other';
  referralSource?: string;
  socialMediaPlatform?: string;
  staffStudentName?: string;
  mediaConsent: boolean;
  mediaPrivacy: boolean;
}

const CustomerLeadModal: React.FC<CustomerLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  programId, 
  programName,
  programType = 'core'
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: '',
    currentRole: '',
    currentOrganization: '',
    programId: '',
    intakeId: '',
    learningGoals: '',
    communicationPreference: 'any',
    source: 'website',
    mediaConsent: false,
    mediaPrivacy: false
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedProgramName, setSelectedProgramName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadPrograms();
      loadIntakes();
      // Reset form when modal opens
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        whatsappNumber: '',
        currentRole: '',
        currentOrganization: '',
        programId: programId || '',
        intakeId: '',
        learningGoals: '',
        communicationPreference: 'any',
        source: 'website',
        mediaConsent: false,
        mediaPrivacy: false
      });
      setSelectedProgramName(programName || '');
      setSubmitted(false);
      setError('');
    }
  }, [isOpen, programId, programName]);

  useEffect(() => {
    // Pre-select program if coming from program detail page
    const urlProgramId = searchParams.get('program');
    const urlProgramName = searchParams.get('programName');
    
    if (urlProgramId && urlProgramName && programs.length > 0) {
      // Verify the program exists in our loaded programs
      const foundProgram = programs.find(p => p.id === urlProgramId);
      if (foundProgram) {
        setFormData(prev => ({
          ...prev,
          programId: urlProgramId
        }));
        setSelectedProgramName(foundProgram.programName);
      }
    }
  }, [searchParams, programs]);

  const loadPrograms = async () => {
    try {
      const result = await ProgramService.getActivePrograms();
      if (result.success && result.data) {
        // Sort programs by level (ascending)
        const sortedPrograms = (result.data as Program[]).sort((a, b) => {
          const levelA = a.level || 0;
          const levelB = b.level || 0;
          return levelA - levelB;
        });
        setPrograms(sortedPrograms);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadIntakes = async () => {
    try {
      // Load from intakes collection
      const result = await FirestoreService.getAll('intakes');
      
      if (result.success && result.data) {
        // Filter for active intakes with future start dates
        const currentDate = new Date();
        const availableIntakes = result.data.filter((intake: any) => {
          const startDate = new Date(intake.startDate);
          const isActive = intake.status === 'active' || intake.status === 'upcoming';
          const isFuture = startDate >= currentDate;
          return isActive && isFuture;
        }).sort((a: any, b: any) => {
          // Sort by start date, earliest first
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        
        setIntakes(availableIntakes);
      } else {
        setIntakes([]); // Set empty array if no data
      }
    } catch (error) {
      console.error('Error loading intakes from intakes collection:', error);
      setIntakes([]); // Set empty array on error
    }
  };

  const generateLeadNumber = async () => {
    try {
      console.log('🔍 [CustomerLeadModal] Generating lead number...');
      const result = await FirestoreService.getAll('customers');
      console.log('🔍 [CustomerLeadModal] Customers result:', result);
      let maxId = 0;
      
      if (result.success && result.data) {
        const customers = result.data as Customer[];
        console.log('🔍 [CustomerLeadModal] Found customers:', customers.length);
        customers.forEach(customer => {
          if (customer.leadNumber && customer.leadNumber.startsWith('LD')) {
            const numStr = customer.leadNumber.substring(2);
            const num = parseInt(numStr);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        });
      }
      
      const nextId = maxId + 1;
      console.log('🔍 [CustomerLeadModal] Next lead ID:', nextId);
      
      // Format based on the number range
      let leadNumber;
      if (nextId <= 999999) {
        // LD1 to LD999999 (no padding)
        leadNumber = `LD${nextId}`;
      } else {
        // LD01 to LD0999999 (with padding for numbers over 999999)
        leadNumber = `LD${nextId.toString().padStart(7, '0')}`;
      }
      
      console.log('✅ [CustomerLeadModal] Generated lead number:', leadNumber);
      return leadNumber;
    } catch (error) {
      console.error('❌ [CustomerLeadModal] Error generating lead number:', error);
      const fallbackNumber = `LD${Math.floor(Math.random() * 999999) + 1}`;
      console.log('🔄 [CustomerLeadModal] Using fallback lead number:', fallbackNumber);
      return fallbackNumber;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.whatsappNumber || !formData.programId || !formData.learningGoals) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate conditional fields
      if (formData.source === 'social_media' && !formData.socialMediaPlatform) {
        setError('Please specify which social media platform');
        setLoading(false);
        return;
      }

      if ((formData.source === 'referral') && formData.referralSource === 'staff_student' && !formData.staffStudentName) {
        setError('Please provide the name of the staff/student who referred you');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Validate phone number (basic validation for Kenyan numbers)
      const phoneRegex = /^(\+254|0)[7-9]\d{8}$/;
      if (!phoneRegex.test(formData.whatsappNumber)) {
        setError('Please enter a valid WhatsApp number (e.g., 0712345678 or +254712345678)');
        setLoading(false);
        return;
      }

      const selectedProgram = programs.find(p => p.id === formData.programId);
      
      // Build customer data, only including fields that have values (not undefined)
      const customerData: Partial<Customer> = {
        leadNumber: await generateLeadNumber(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        currentRole: formData.currentRole.trim() || '',
        currentOrganization: formData.currentOrganization.trim() || '',
        programId: formData.programId,
        programName: selectedProgram?.programName || '',
        programType,
        learningGoals: formData.learningGoals.trim(),
        status: 'new',
        priority: 'medium',
        source: formData.source,
        submittedDate: new Date().toISOString(),
        communicationPreference: formData.communicationPreference,
        tags: []
      };

      // Only add optional fields if they have values
      if (formData.intakeId) {
        customerData.intakeId = formData.intakeId;
      }
      if (formData.referralSource) {
        customerData.referralSource = formData.referralSource;
      }
      if (formData.socialMediaPlatform) {
        customerData.socialMediaPlatform = formData.socialMediaPlatform;
      }
      if (formData.staffStudentName) {
        customerData.staffStudentName = formData.staffStudentName;
      }

      console.log('🔍 [CustomerLeadModal] Submitting customer data:', customerData);
      const result = await FirestoreService.create('customers', customerData);
      console.log('🔍 [CustomerLeadModal] Firestore result:', result);
      
      if (result.success) {
        console.log('✅ [CustomerLeadModal] Lead submitted successfully');
        setSubmitted(true);
      } else {
        console.error('❌ [CustomerLeadModal] Failed to submit lead:', result.error);
        setError(`Failed to submit lead: ${result.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    if (submitted) {
      // If submitted, navigate to home page
      navigate('/');
    }
    onClose();
  };

    if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 w-12 h-12 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {submitted ? 'Thank You!' : `${programType === 'core' ? 'Core Program' : 'Short Program'} Enquiry`}
              </h2>
              <p className="text-gray-600">
                {submitted ? 'Your enquiry has been submitted successfully' : 'Fill out this form and we\'ll get back to you within 24 hours'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {submitted ? (
            // Thank You Content
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lead Submitted!</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Thank you for your interest in our programs. We'll get back to you within 24 hours.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
                <p className="text-gray-900 font-medium mb-4">
                  What happens next?
                </p>
                <ul className="text-gray-600 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Our admissions team will review your enquiry
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    You'll receive a call/message within 24 hours
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    We'll provide detailed program information
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Schedule a consultation if interested
                  </li>
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="bg-secondary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200"
              >
                Return to Home
              </button>
            </div>
          ) : (
            // Form Content
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Selected Program Display */}
              {selectedProgramName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-700 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Program of Interest:</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{selectedProgramName}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    We'll provide detailed information about this program when we contact you
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0712345678 or +254712345678"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Current Role and Organization Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Role
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.currentRole}
                        onChange={(e) => handleInputChange('currentRole', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g. Software Developer, Student, Manager"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Organization/Employer
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.currentOrganization}
                        onChange={(e) => handleInputChange('currentOrganization', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g. Company name, University name, Self-employed"
                      />
                    </div>
                  </div>
                </div>

                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Interested In *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={formData.programId}
                      onChange={(e) => {
                        handleInputChange('programId', e.target.value);
                        // Update selected program name for display
                        const selectedProgram = programs.find(p => p.id === e.target.value);
                        setSelectedProgramName(selectedProgram?.programName || '');
                        // Reset intake selection when program changes
                        handleInputChange('intakeId', '');
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select a program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.programName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Intake and Communication Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Intake (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={formData.intakeId || ''}
                        onChange={(e) => handleInputChange('intakeId', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={!formData.programId}
                      >
                        <option value="">Select an intake (optional)</option>
                        {intakes
                          .filter(intake => !formData.programId || intake.programId === formData.programId)
                          .map((intake) => (
                            <option key={intake.id} value={intake.id}>
                              {intake.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Communication
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={formData.communicationPreference}
                        onChange={(e) => handleInputChange('communicationPreference', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="any">Any method</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone Call</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Learning Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Goals *
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      value={formData.learningGoals}
                      onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Tell us about your learning goals, what you hope to achieve, and how this program fits into your career plans..."
                      required
                    />
                  </div>
                </div>

                {/* How did you hear about us */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How did you hear about us?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'website', label: 'Website/Google Search' },
                      { value: 'referral', label: 'Friend/Colleague Referral' },
                      { value: 'social_media', label: 'Social Media' },
                      { value: 'direct', label: 'Direct Contact' },
                      { value: 'other', label: 'Other' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                        <input
                          type="radio"
                          name="source"
                          value={option.value}
                          checked={formData.source === option.value}
                          onChange={(e) => {
                            handleInputChange('source', e.target.value);
                            // Reset conditional fields when source changes
                            handleInputChange('socialMediaPlatform', '');
                            handleInputChange('referralSource', '');
                            handleInputChange('staffStudentName', '');
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Conditional Social Media Platform Selection */}
                  {formData.source === 'social_media' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Which social media platform? *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { value: 'facebook', label: 'Facebook' },
                          { value: 'instagram', label: 'Instagram' },
                          { value: 'twitter', label: 'Twitter/X' },
                          { value: 'linkedin', label: 'LinkedIn' },
                          { value: 'tiktok', label: 'TikTok' },
                          { value: 'youtube', label: 'YouTube' }
                        ].map((platform) => (
                          <label key={platform.value} className="flex items-center bg-gray-50 rounded-lg p-2 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="socialMediaPlatform"
                              value={platform.value}
                              checked={formData.socialMediaPlatform === platform.value}
                              onChange={(e) => handleInputChange('socialMediaPlatform', e.target.value)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-gray-700 text-sm">{platform.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditional Referral Type Selection */}
                  {formData.source === 'referral' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type of referral:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'friend_colleague', label: 'Friend or Colleague' },
                          { value: 'staff_student', label: 'Staff or Student' },
                          { value: 'family', label: 'Family Member' },
                          { value: 'other_referral', label: 'Other' }
                        ].map((type) => (
                          <label key={type.value} className="flex items-center bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="referralSource"
                              value={type.value}
                              checked={formData.referralSource === type.value}
                              onChange={(e) => handleInputChange('referralSource', e.target.value)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-3 text-gray-700">{type.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Staff/Student Name Input */}
                      {formData.referralSource === 'staff_student' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name of Staff/Student who referred you: *
                          </label>
                          <input
                            type="text"
                            value={formData.staffStudentName || ''}
                            onChange={(e) => handleInputChange('staffStudentName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter full name of staff/student"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Media Consent and Privacy Checkboxes */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mediaConsent}
                        onChange={(e) => handleInputChange('mediaConsent', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        required
                      />
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Media Consent:</span> I consent to the use of my photographs, video footage, or testimonials taken during KSS programs for promotional and documentation purposes. I understand this consent is voluntary and can be withdrawn at any time by emailing{' '}
                        <a href="mailto:hello@kss.or.ke" className="text-primary-600 hover:text-primary-700 underline">
                          hello@kss.or.ke
                        </a>
                        .{' '}
                        <a href="/media-consent" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                          Learn more about media consent
                        </a>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mediaPrivacy}
                        onChange={(e) => handleInputChange('mediaPrivacy', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        required
                      />
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Privacy Notice:</span> I acknowledge that I have read and understood the KSS Media & Privacy Notice. I understand that photos and videos may be taken during sessions and I can opt out by requesting a badge/sticker at registration.{' '}
                        <a href="/media-privacy" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                          Read the full privacy notice
                        </a>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Enquiry</span>
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-600">
                  By submitting this form, you agree to be contacted by our admissions team.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLeadModal; 