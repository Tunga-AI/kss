import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Send, User, Mail, Phone, BookOpen, Target, CheckCircle, AlertCircle, Home, MessageSquare, Calendar } from 'lucide-react';
import { FirestoreService, ProgramService } from '../../services/firestore';
import { Customer, Program } from '../../Portal/pages/Customers/types';

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
}

const CustomerLead: React.FC = () => {
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
    source: 'website'
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedProgramName, setSelectedProgramName] = useState<string>('');

  useEffect(() => {
    loadPrograms();
    loadIntakes();
  }, []);

  useEffect(() => {
    // Pre-select program if coming from program detail page
    const programId = searchParams.get('program');
    const programName = searchParams.get('programName');
    
    if (programId && programName && programs.length > 0) {
      // Verify the program exists in our loaded programs
      const foundProgram = programs.find(p => p.id === programId);
      if (foundProgram) {
        setFormData(prev => ({
          ...prev,
          programId: programId
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
      const result = await FirestoreService.getAll('customers');
      let maxId = 0;
      
      if (result.success && result.data) {
        const customers = result.data as Customer[];
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
      
      // Format based on the number range
      if (nextId <= 999999) {
        // LD1 to LD999999 (no padding)
        return `LD${nextId}`;
      } else {
        // LD01 to LD0999999 (with padding for numbers over 999999)
        return `LD${nextId.toString().padStart(7, '0')}`;
      }
    } catch (error) {
      console.error('Error generating lead number:', error);
      return `LD${Math.floor(Math.random() * 999999) + 1}`;
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
      
      const customerData: Partial<Customer> = {
        leadNumber: await generateLeadNumber(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        currentRole: formData.currentRole.trim(),
        currentOrganization: formData.currentOrganization.trim(),
        programId: formData.programId,
        programName: selectedProgram?.programName,
        learningGoals: formData.learningGoals.trim(),
        status: 'new',
        priority: 'medium',
        source: formData.source,
        submittedDate: new Date().toISOString(),
        communicationPreference: formData.communicationPreference,
        referralSource: formData.referralSource,
        socialMediaPlatform: formData.socialMediaPlatform,
        staffStudentName: formData.staffStudentName,
        tags: []
      };

      const result = await FirestoreService.create('customers', customerData);
      
      if (result.success) {
        setSubmitted(true);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          whatsappNumber: '',
          currentRole: '',
          currentOrganization: '',
          programId: '',
          learningGoals: '',
          communicationPreference: 'any',
          source: 'website'
        });
      } else {
        setError('Failed to submit lead. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <section className="relative h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src="/about.jpg" 
              alt="Success celebration" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-800/60 to-green-700/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center h-full px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">Lead Submitted!</h2>
              <p className="text-gray-200 mb-6 ">
                Thank you for your interest in our programs. We'll get back to you within 24 hours.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                <p className="text-white text-sm font-medium  mb-2">
                  What happens next?
                </p>
                <ul className="text-white text-sm space-y-1 ">
                  <li>• Our admissions team will review your enquiry</li>
                  <li>• You'll receive a call/message within 24 hours</li>
                  <li>• We'll provide detailed program information</li>
                  <li>• Schedule a consultation if interested</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full bg-secondary-600 text-white px-6 py-3 rounded-lg  font-medium hover:bg-secondary-700 transition-colors duration-200"
              >
                Return to Home
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Lead Form */}
      <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden py-12">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/programs.jpg" 
            alt="Students learning together" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/60 to-primary-700/40"></div>
        </div>

        {/* Back to Home - Fixed at top */}
        <div className="absolute top-8 left-6 sm:left-8 lg:left-12 z-20">
          <Link to="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200 ">
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-end justify-start h-full px-6 sm:px-8 lg:px-12 pb-24">
          <div className="w-full grid lg:grid-cols-2 gap-12 items-end">
            
            {/* Left Side - Hero Content */}
            <div className="text-white">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <MessageSquare className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium ">Start Your Learning Journey</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Get in
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Touch
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl  text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Interested in our programs? Fill out the form and we'll get back to you within 24 hours with detailed information.
              </p>

              {/* Selected Program Display */}
              {selectedProgramName && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md">
                  <div className="flex items-center space-x-2 text-accent-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Program of Interest:</span>
                  </div>
                  <p className="text-white font-semibold text-lg">{selectedProgramName}</p>
                  <p className="text-gray-200 text-sm mt-1 ">
                    We'll provide detailed information about this program when we contact you
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md mt-6">
                <h3 className="text-lg font-semibold mb-4 text-accent-400">What You Get:</h3>
                <div className="space-y-3 text-sm ">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                    <span>Detailed program information</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                    <span>Personalized consultation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                    <span>Career guidance & support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Lead Form */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto w-full">
              <div className="mb-6 text-center">
                <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-neutral-800 mb-2">Program Enquiry</h2>
                <p className="text-neutral-600 ">
                  Fill out this form and we'll get back to you within 24 hours
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-secondary-500 flex-shrink-0" />
                  <p className="text-secondary-700 ">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
                        placeholder="0712345678 or +254712345678"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Current Role and Organization Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      Current Role
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.currentRole}
                        onChange={(e) => handleInputChange('currentRole', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
                        placeholder="e.g. Software Developer, Student, Manager"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      Current Organization/Employer
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.currentOrganization}
                        onChange={(e) => handleInputChange('currentOrganization', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
                        placeholder="e.g. Company name, University name, Self-employed"
                      />
                    </div>
                  </div>
                </div>

                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                    Program Interested In *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      Preferred Intake (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <select
                        value={formData.intakeId || ''}
                        onChange={(e) => handleInputChange('intakeId', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                      Preferred Communication
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <select
                        value={formData.communicationPreference}
                        onChange={(e) => handleInputChange('communicationPreference', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 "
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2 ">
                    Learning Goals *
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    <textarea
                      value={formData.learningGoals}
                      onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90  resize-none"
                      placeholder="Tell us about your learning goals, what you hope to achieve, and how this program fits into your career plans..."
                      required
                    />
                  </div>
                </div>

                {/* How did you hear about us */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3 ">
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
                      <label key={option.value} className="flex items-center bg-white/50 rounded-lg p-3 border border-gray-200 hover:bg-white/70 transition-colors cursor-pointer">
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
                        <span className="ml-3 text-neutral-700 ">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Conditional Social Media Platform Selection */}
                  {formData.source === 'social_media' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                          <label key={platform.value} className="flex items-center bg-white/50 rounded-lg p-2 border border-gray-200 hover:bg-white/70 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="socialMediaPlatform"
                              value={platform.value}
                              checked={formData.socialMediaPlatform === platform.value}
                              onChange={(e) => handleInputChange('socialMediaPlatform', e.target.value)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-neutral-700 text-sm">{platform.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditional Referral Type Selection */}
                  {formData.source === 'referral' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Type of referral:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'friend_colleague', label: 'Friend or Colleague' },
                          { value: 'staff_student', label: 'Staff or Student' },
                          { value: 'family', label: 'Family Member' },
                          { value: 'other_referral', label: 'Other' }
                        ].map((type) => (
                          <label key={type.value} className="flex items-center bg-white/50 rounded-lg p-3 border border-gray-200 hover:bg-white/70 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="referralSource"
                              value={type.value}
                              checked={formData.referralSource === type.value}
                              onChange={(e) => handleInputChange('referralSource', e.target.value)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-3 text-neutral-700">{type.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Staff/Student Name Input */}
                      {formData.referralSource === 'staff_student' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Name of Staff/Student who referred you: *
                          </label>
                          <input
                            type="text"
                            value={formData.staffStudentName || ''}
                            onChange={(e) => handleInputChange('staffStudentName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90"
                            placeholder="Enter full name of staff/student"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary-600 text-white py-3 px-4 rounded-lg  font-semibold hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
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

                <p className="text-center text-sm text-neutral-600 ">
                  By submitting this form, you agree to be contacted by our admissions team.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerLead; 