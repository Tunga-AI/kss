import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, BookOpen, Award, CheckCircle, Calendar, Target, Star, GraduationCap, Tag, Phone, Mail, User } from 'lucide-react';
import { ProgramService, FirestoreService } from '../../services/firestore';
import { useModal } from '../../contexts/ModalContext';
import { useAuthContext } from '../../contexts/AuthContext';
import CustomerLeadModal from '../../components/CustomerLeadModal';
import { Customer, Program } from '../Portal/pages/Customers/types';

interface Quadrant {
  name: string;
  themes: string;
  keyModules: string;
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

interface ProgramData {
  id: string;
  programName: string;
  programCode: string;
  slug?: string;
  programDuration: string;
  shortDescription: string;
  level: number;
  objectives: string[];
  whoIsItFor: string[];
  curriculumBreakdown: Quadrant[];
  completionRequirements: string[];
  programFormat: string[];
  status: string;
  price?: number;
  currency?: string;
  intakes?: string[];
  image?: string;
  // Legacy fields for backward compatibility
  description?: string;
  duration?: string;
  prerequisites?: string[];
  overview?: string;
  outline?: string[];
  certification?: string;
  targetAudience?: string;
}

const ProgramDetailPage: React.FC = () => {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { openLeadModal, showLeadModal, setShowLeadModal, selectedProgramType } = useModal();
  
  // Use either id or slug parameter (slug is used for root-level routes)
  const programIdentifier = id || slug;
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Registration section state
  const [showRegistrationSection, setShowRegistrationSection] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
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

  // Helper function to get program identifier for URLs
  const getProgramIdentifier = (program: Program) => {
    return program.slug || program.id;
  };

  useEffect(() => {
    if (programIdentifier) {
      loadProgram();
    }
  }, [programIdentifier]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      let result;
      
      // First try to fetch by slug (new approach)
      const slugResult = await ProgramService.getBySlug(programIdentifier!);
      if (slugResult.success) {
        result = slugResult;
      } else {
        // Fall back to fetching by ID (backward compatibility)
        result = await ProgramService.getById('programs', programIdentifier!);
      }
      
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
          loadedData.curriculumBreakdown = [];
        }
        
        // Ensure all required arrays exist with defaults
        const programData: Program = {
          ...loadedData,
          objectives: Array.isArray(loadedData.objectives) ? loadedData.objectives : [],
          whoIsItFor: Array.isArray(loadedData.whoIsItFor) ? loadedData.whoIsItFor : [],
          curriculumBreakdown: Array.isArray(loadedData.curriculumBreakdown) ? loadedData.curriculumBreakdown : [],
          completionRequirements: Array.isArray(loadedData.completionRequirements) ? loadedData.completionRequirements : [],
          programFormat: Array.isArray(loadedData.programFormat) ? loadedData.programFormat : [],
        };
        
        setProgram(programData);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showRegistrationSection) {
      loadPrograms();
      loadIntakes();
      // Initialize form with program ID when opening
      setFormData(prev => ({
        ...prev,
        programId: program?.id || '',
        firstName: user?.displayName?.split(' ')[0] || '',
        lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        whatsappNumber: user?.phoneNumber || ''
      }));
      setSubmitted(false);
      setError('');
    }
  }, [showRegistrationSection, program, user]);

  const loadPrograms = async () => {
    try {
      const result = await ProgramService.getActivePrograms();
      if (result.success && result.data) {
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
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        const currentDate = new Date();
        const availableIntakes = result.data.filter((intake: any) => {
          const startDate = new Date(intake.startDate);
          const isActive = intake.status === 'active' || intake.status === 'upcoming';
          const isFuture = startDate >= currentDate;
          return isActive && isFuture;
        }).sort((a: any, b: any) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        setIntakes(availableIntakes);
      } else {
        setIntakes([]);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
      setIntakes([]);
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
      let leadNumber;
      if (nextId <= 999999) {
        leadNumber = `LD${nextId}`;
      } else {
        leadNumber = `LD${nextId.toString().padStart(7, '0')}`;
      }
      
      return leadNumber;
    } catch (error) {
      console.error('Error generating lead number:', error);
      return `LD${Math.floor(Math.random() * 999999) + 1}`;
    }
  };

  const handleGetStarted = () => {
    setShowRegistrationSection(true);
    
    // Scroll to registration section with a small delay
    setTimeout(() => {
      const registrationSection = document.getElementById('program-registration-section');
      if (registrationSection) {
        registrationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.whatsappNumber || !formData.programId || !formData.learningGoals) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Validate conditional fields
      if (formData.source === 'social_media' && !formData.socialMediaPlatform) {
        setError('Please specify which social media platform');
        setSubmitting(false);
        return;
      }

      if ((formData.source === 'referral') && formData.referralSource === 'staff_student' && !formData.staffStudentName) {
        setError('Please provide the name of the staff/student who referred you');
        setSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setSubmitting(false);
        return;
      }

      // Validate phone number
      const phoneRegex = /^(\+254|0)[7-9]\d{8}$/;
      if (!phoneRegex.test(formData.whatsappNumber)) {
        setError('Please enter a valid WhatsApp number (e.g., 0712345678 or +254712345678)');
        setSubmitting(false);
        return;
      }

      const selectedProgram = programs.find(p => p.id === formData.programId) || program;
      
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
        programType: 'core',
        learningGoals: formData.learningGoals.trim(),
        status: 'new',
        priority: 'medium',
        source: formData.source,
        submittedDate: new Date().toISOString(),
        communicationPreference: formData.communicationPreference,
        tags: []
      };

      // Only add optional fields if they have values
      if (formData.intakeId) customerData.intakeId = formData.intakeId;
      if (formData.referralSource) customerData.referralSource = formData.referralSource;
      if (formData.socialMediaPlatform) customerData.socialMediaPlatform = formData.socialMediaPlatform;
      if (formData.staffStudentName) customerData.staffStudentName = formData.staffStudentName;

      const result = await FirestoreService.create('customers', customerData);
      
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(`Failed to submit lead: ${result.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">Program Not Found</h2>
          <p className="text-secondary-600 mb-6">The program you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/programs')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="mb-4">
              <span className="bg-primary-500 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">
                {program.programCode}
              </span>
            </div>
                          <h1 className="text-5xl md:text-6xl font-bold mb-6">{program.programName}</h1>
                          <p className="text-xl  text-primary-100 leading-relaxed mb-8">
                {program.shortDescription || program.description}
              </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Clock className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Duration</h3>
                <p className="text-primary-200">{program.programDuration || program.duration}</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Award className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Level</h3>
                <p className="text-primary-200">Level {program.level}</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Users className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Certification</h3>
                <p className="text-primary-200">{program.certification || 'Certificate of Completion'}</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Tag className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Price</h3>
                <p className="text-primary-200">
                  {program.price && program.price > 0 
                    ? `${new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: program.currency || 'KES',
                        minimumFractionDigits: 0
                      }).format(program.price)}`
                    : 'Contact for Pricing'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Content */}
      <section className="py-16">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="w-full">
            {/* Call to Action Section */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-xl p-8 mb-16">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Join thousands of professionals who have advanced their careers with our world-class sales training.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                >
                  Apply Now - Get Started Today
                </button>
              </div>
            </div>

            {/* Main Content - Full Width */}
            <div className="space-y-16">
              {/* Overview Section with Image */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-bold text-secondary-800 mb-6">
                    Program Overview
                  </h2>
                  <div className="prose prose-lg text-secondary-600">
                    <p className="text-xl leading-relaxed mb-6">
                      {program.shortDescription || program.overview || program.description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-secondary-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-primary-600" />
                        <span className="font-medium">{program.programDuration || program.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-accent-600" />
                        <span className="font-medium">Level {program.level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-secondary-600" />
                        <span className="font-medium">Certificate Included</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                    <img
                      src={program.image || '/kss.jpg'}
                      alt="Program Overview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>
                </div>
              </div>

              {/* Learning Objectives with Visual Background */}
              {program.objectives && program.objectives.length > 0 && program.objectives[0] && (
                <div className="relative">
                  {/* Background Image Section */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <img
                      src="/about.jpg"
                      alt="Learning Environment"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-white/95"></div>
                  </div>

                  {/* Content */}
                  <div className="relative p-12">
                    <div className="text-center mb-12">
                      <h2 className="text-4xl font-bold text-secondary-800 mb-4">
                        What You'll Achieve
                      </h2>
                      <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
                        Our comprehensive curriculum is designed to transform you into a sales professional with real-world impact.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {program.objectives.filter(obj => obj.trim()).map((objective, index) => (
                        <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50">
                          <div className="flex items-start space-x-4">
                            <div className="bg-accent-600 p-2 rounded-lg">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-secondary-800 mb-2">Objective {index + 1}</h3>
                              <p className="text-secondary-700 text-sm leading-relaxed">{objective}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Who Is It For with Image */}
              {program.whoIsItFor && program.whoIsItFor.length > 0 && program.whoIsItFor[0] && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="relative order-2 lg:order-1">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                      <img
                        src="/events.jpeg"
                        alt="Perfect for professionals"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <p className="text-lg font-semibold">Join Professionals Like You</p>
                        <p className="text-white/90">Transform Your Career Today</p>
                      </div>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2">
                    <h2 className="text-4xl font-bold text-secondary-800 mb-6">
                      Perfect For
                    </h2>
                    <p className="text-xl text-secondary-600 mb-8">
                      This program is designed for ambitious professionals ready to take their sales career to the next level.
                    </p>

                    <div className="space-y-4">
                      {program.whoIsItFor.filter(target => target.trim()).map((target, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
                          <div className="bg-primary-600 p-2 rounded-lg">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary-800 mb-1">Target Group {index + 1}</h3>
                            <p className="text-secondary-700">{target}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum Breakdown */}
              {program.curriculumBreakdown && program.curriculumBreakdown.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <GraduationCap className="h-8 w-8 text-primary-600" />
                    <span>Curriculum Breakdown – The 4 Capability Quadrants</span>
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
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
                        {program.curriculumBreakdown.map((quadrant, index) => (
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
                </div>
              )}

              {/* Completion Requirements */}
              {program.completionRequirements && program.completionRequirements.length > 0 && program.completionRequirements[0] && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-accent-600" />
                    <span>Completion Requirements</span>
                  </h2>
                  <div className="space-y-3">
                    {program.completionRequirements.filter(req => req.trim()).map((requirement, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
                        <span className="text-secondary-700">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Program Format */}
              {program.programFormat && program.programFormat.length > 0 && program.programFormat[0] && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <Calendar className="h-8 w-8 text-secondary-600" />
                    <span>Program Format</span>
                  </h2>
                  <div className="space-y-3">
                    {program.programFormat.filter(format => format.trim()).map((format, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-secondary-600 flex-shrink-0 mt-1" />
                        <span className="text-secondary-700">{format}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Program Outline - for backward compatibility */}
              {program.outline && program.outline.length > 0 && !program.curriculumBreakdown?.length && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <Calendar className="h-8 w-8 text-secondary-600" />
                    <span>Program Outline</span>
                  </h2>
                  <div className="space-y-4">
                    {program.outline.map((module, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-secondary-800">{module}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fallback message if no curriculum content */}
              {!program.curriculumBreakdown?.length && !program.outline?.length && (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Detailed curriculum outline will be provided upon enrollment.</p>
                </div>
              )}

              {/* Program Gallery Section */}
              <div>
                <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-primary-600" />
                  <span>Program Experience</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={program.image || '/kss.jpg'}
                      alt="Learning Environment"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={program.image || '/kss.jpg'}
                      alt="Interactive Sessions"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={program.image || '/kss.jpg'}
                      alt="Practical Training"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={program.image || '/kss.jpg'}
                      alt="Certification Process"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="w-full">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary-800 mb-4">
                Success Stories
              </h2>
              <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
                See how our graduates have transformed their careers and achieved remarkable success.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Testimonial Cards */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-800">Success Story</h4>
                      <p className="text-secondary-600 text-sm">Career Transformation</p>
                    </div>
                  </div>
                  <p className="text-secondary-700 italic mb-4">
                    "This program completely changed my approach to sales. Within 6 months of graduation, I increased my sales performance by 150% and got promoted to Sales Manager."
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-secondary-600">5.0 out of 5</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-accent-600 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-800">Industry Recognition</h4>
                      <p className="text-secondary-600 text-sm">Professional Growth</p>
                    </div>
                  </div>
                  <p className="text-secondary-700 italic mb-4">
                    "The practical skills and certification from KSS opened doors I never thought possible. I now lead a team of 20+ sales professionals at a Fortune 500 company."
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-secondary-600">5.0 out of 5</span>
                  </div>
                </div>
              </div>

              {/* Success Image */}
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="/contact us.jpg"
                    alt="Success stories"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Join Our Success Community</h3>
                    <p className="text-white/90 text-lg">1000+ graduates • 95% job placement rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                Start Your Success Story Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Program Registration Section - Last section for better UX */}
      {showRegistrationSection && (
        <section id="program-registration-section" className="py-16 bg-gray-50">
          <div className="px-6 sm:px-8 lg:px-12">
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-secondary-800">Program Registration</h2>
                  <button
                    onClick={() => setShowRegistrationSection(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {submitted ? (
                  // Thank You Content
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h3>
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
                          Our admissions team will review your application
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
                      onClick={() => setShowRegistrationSection(false)}
                      className="bg-secondary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200"
                    >
                      Continue Browsing
                    </button>
                  </div>
                ) : (
                  // Form Content
                  <div className="space-y-6">
                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Program Display */}
                    {program && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-blue-700 mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Program of Interest:</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{program.programName}</p>
                        <p className="text-gray-600 text-sm mt-1">
                          We'll provide detailed information about this program when we contact you
                        </p>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmitLead} className="space-y-6">
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
                              handleInputChange('intakeId', '');
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          >
                            <option value="">Select a program</option>
                            {programs.map((prog) => (
                              <option key={prog.id} value={prog.id}>
                                {prog.programName}
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
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <button
                          type="button"
                          onClick={() => setShowRegistrationSection(false)}
                          className="px-6 py-3 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-8 py-3 bg-secondary-600 text-white rounded-lg font-semibold hover:bg-secondary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5" />
                              <span>Submit Application</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-center text-sm text-gray-600">
                        By submitting this form, you agree to be contacted by our admissions team.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Global Modal Integration - This modal is controlled from navbar */}
      <CustomerLeadModal
        isOpen={showLeadModal && selectedProgramType === 'core'}
        onClose={() => setShowLeadModal(false)}
        programId={program?.id}
        programName={program?.programName}
        programType="core"
      />
    </div>
  );
};

export default ProgramDetailPage; 