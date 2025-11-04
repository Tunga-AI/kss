import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, MessageSquare, Calendar, 
  Plus, Edit, Save, X, Clock, Target, Tag, 
  CheckCircle, XCircle, AlertCircle, FileText, Trash2
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Customer, CustomerNote, Program } from './types';
import WhatsAppButton from '../../../components/WhatsAppButton';

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const { userProfile } = useAuthContext();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'general' as const,
    followUpRequired: false,
    followUpDate: ''
  });

  useEffect(() => {
    loadPrograms();
    loadIntakes();
    if (customerId) {
      loadCustomer();
      loadNotes();
    } else {
      // New customer mode
      setLoading(false);
      setIsEditing(true);
      setEditData({
        firstName: '',
        lastName: '',
        email: '',
        whatsappNumber: '',
        learningGoals: '',
        currentRole: '',
        currentOrganization: '',
        programId: '',
        intakeId: '',
        status: 'new',
        priority: 'medium',
        source: 'direct',
        communicationPreference: 'any',
        tags: []
      });
    }
  }, [customerId]);

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program?.programName || 'N/A';
  };

  const getIntakeName = (intakeId?: string) => {
    if (!intakeId) return 'No Intake';
    const intake = intakes.find(i => i.id === intakeId);
    return intake?.name || 'Unknown Intake';
  };

  const loadCustomer = async () => {
    try {
      const result = await FirestoreService.getById('customers', customerId!);
      if (result.success && result.data) {
        const customerData = result.data as Customer;
        setCustomer(customerData);
        setEditData(customerData);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const result = await FirestoreService.getWithQuery('customerNotes', [
        { field: 'customerId', operator: '==', value: customerId! }
      ]);
      if (result.success && result.data) {
        const notesData = result.data as CustomerNote[];
        // Sort by creation date, newest first
        notesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await FirestoreService.getAll('programs');
      if (result.success && result.data) {
        console.log('CustomerPage - Programs loaded:', result.data);
        console.log('CustomerPage - Program IDs and Names:', result.data.map((p: any) => ({ id: p.id, name: p.programName, slug: p.slug })));
        setPrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadIntakes = async () => {
    try {
      // Load all intakes without date filtering for informational purposes
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        console.log('CustomerPage - Raw intakes data:', result.data);
        console.log('CustomerPage - Intake-Program relationships:', result.data.map((i: any) => ({ 
          intakeId: i.id, 
          intakeName: i.name, 
          programId: i.programId, 
          status: i.status,
          startDate: i.startDate 
        })));
        
        // Filter to show intakes - more lenient filtering for informational display
        const currentDate = new Date();
        const upcomingIntakes = result.data.filter((intake: any) => {
          const startDate = new Date(intake.startDate);
          // Show intakes that are in the future or recently started (within 90 days)
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(currentDate.getDate() - 90);
          
          // Include active, draft, and upcoming status intakes
          const validStatuses = ['active', 'draft', 'upcoming'];
          const isRelevant = startDate >= ninetyDaysAgo && validStatuses.includes(intake.status);
          
          console.log(`CustomerPage - Intake ${intake.name}: startDate=${intake.startDate}, status=${intake.status}, programId=${intake.programId}, relevant=${isRelevant}`);
          return isRelevant;
        });
        
        console.log('CustomerPage - Filtered intakes:', upcomingIntakes);
        
        // If no intakes pass the filter, show all intakes for debugging
        if (upcomingIntakes.length === 0) {
          console.log('CustomerPage - No intakes passed filter, showing all intakes for debugging');
          setIntakes(result.data);
        } else {
          setIntakes(upcomingIntakes);
        }
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  const validateRequiredFields = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'whatsappNumber', 'learningGoals', 'currentRole', 'currentOrganization', 'programId', 'source', 'communicationPreference'];
    return requiredFields.every(field => editData[field as keyof Customer]?.toString().trim());
  };

  const saveCustomer = async () => {
    // Validate required fields
    if (!validateRequiredFields()) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editData.email && !emailRegex.test(editData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      if (customerId) {
        // Update existing customer
        const result = await FirestoreService.update('customers', customerId, editData);
        if (result.success) {
          setCustomer({ ...customer!, ...editData });
          setIsEditing(false);
        }
      } else {
        // Create new customer
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
            return 'LD1';
          }
        };

        const selectedProgram = programs.find(p => p.id === editData.programId);
        const selectedIntake = intakes.find(i => i.id === editData.intakeId);
        const customerData: Partial<Customer> = {
          ...editData,
          leadNumber: await generateLeadNumber(),
          submittedDate: new Date().toISOString(),
          programName: selectedProgram?.programName,
          intakeName: selectedIntake?.name
        };

        const result = await FirestoreService.create('customers', customerData);
        if (result.success) {
          navigate(`/portal/customers/${result.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const addNote = async () => {
    try {
      const noteData: Partial<CustomerNote> = {
        customerId: customerId!,
        content: newNote.content.trim(),
        type: newNote.type,
        author: userProfile?.uid,
        authorName: userProfile?.displayName || 'Unknown User',
        createdAt: new Date().toISOString(),
        followUpRequired: newNote.followUpRequired,
        followUpDate: newNote.followUpDate || undefined
      };

      const result = await FirestoreService.create('customerNotes', noteData);
      if (result.success) {
        // Update customer's last contact date
        await FirestoreService.update('customers', customerId!, {
          lastContactDate: new Date().toISOString()
        });
        
        setNewNote({
          content: '',
          type: 'general',
          followUpRequired: false,
          followUpDate: ''
        });
        setShowAddNote(false);
        loadNotes();
        loadCustomer();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteCustomer = async () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('customers', customerId!);
        if (result.success) {
          navigate('/portal/customers');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const convertToApplication = async () => {
    if (window.confirm('Convert this lead to a formal application? This will create an application record.')) {
      try {
        // Create application record with proper structure
        const applicationData = {
          applicationNumber: `APP${Date.now()}`,
          // Profile
          firstName: customer!.firstName,
          lastName: customer!.lastName,
          email: customer!.email,
          phoneNumber: customer!.whatsappNumber,
          // Job Details - Enhanced with lead data
          currentJobTitle: customer!.currentRole || '',
          currentOrganisation: customer!.currentOrganization || '',
          salesExperience: '',
          keyAchievements: '',
          // Work Experience and Education (required arrays)
          workExperience: [],
          education: [],
          // Application
          programId: customer!.programId,
          learningGoals: customer!.learningGoals,
          spokenToRep: 'no',
          paymentStatus: 'not_paid' as const,
          // Payment Details
          amountPaid: 0,
          confirmationCode: '',
          paymentMethod: 'mpesa' as const,
          // Application Status
          feedback: [],
          status: 'pending' as const,
          intake: customer!.intakeId || '',
          intakeName: customer!.intakeName || '',
          admittedProgram: '',
          submittedDate: new Date().toISOString(),
          // Metadata
          convertedFromLead: customerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const result = await FirestoreService.create('applicants', applicationData);
        if (result.success) {
          // Check if user already exists in users collection
          const existingUserResult = await FirestoreService.getWithQuery('users', [
            { field: 'email', operator: '==', value: customer!.email }
          ]);
          
          let userCreated = false;
          
          // Create user record if it doesn't exist
          if (!existingUserResult.success || !existingUserResult.data || existingUserResult.data.length === 0) {
            try {
              const now = new Date().toISOString();
              const userData = {
                firstName: customer!.firstName,
                lastName: customer!.lastName,
                email: customer!.email,
                phoneNumber: customer!.whatsappNumber || '',
                role: 'learner',
                status: 'active',
                source: 'lead_conversion',
                createdAt: now,
                updatedAt: now,
                // Profile information
                profile: {
                  fullName: `${customer!.firstName} ${customer!.lastName}`.trim(),
                  applicationId: result.data.id || applicationData.applicationNumber,
                  programId: customer!.programId,
                  conversionDate: now,
                  convertedFromLead: customerId
                },
                // Basic learner permissions
                permissions: {
                  canViewProfile: true,
                  canEditProfile: false,
                  canViewGrades: true,
                  canViewSchedule: true,
                  canAccessPortal: true
                }
              };
              
              const userResult = await FirestoreService.create('users', userData);
              if (userResult.success) {
                userCreated = true;
                console.log('✅ User created successfully for converted lead:', customer!.email);
              } else {
                console.error('❌ Failed to create user record:', userResult.error);
              }
            } catch (userError) {
              console.error('❌ Error creating user record:', userError);
            }
          } else {
            console.log('ℹ️ User already exists in users collection:', customer!.email);
            userCreated = true; // Consider it successful since user exists
          }

          // Update customer status to converted
          await FirestoreService.update('customers', customerId!, {
            status: 'converted',
            conversionDate: new Date().toISOString(),
            conversionType: 'application',
            userCreated: userCreated
          });
          
          loadCustomer();
          navigate('/portal/admissions');
        }
      } catch (error) {
        console.error('Error converting to application:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'follow_up': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'details', label: 'Customer Details' },
    { id: 'activity', label: 'Activity History' },
    { id: 'actions', label: 'Actions' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer && customerId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-secondary-800 mb-2">Customer Not Found</h2>
        <p className="text-secondary-600 mb-6">The customer you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/portal/customers')}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/customers')}
              className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-secondary-800">
                {customer ? `${customer.firstName} ${customer.lastName}` : 'New Customer'}
              </h1>
              <p className="text-secondary-600">
                {customer ? `Lead #${customer.leadNumber}` : 'Create a new customer lead'}
              </p>
            </div>
          </div>
          
          {customer && (
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(customer.priority)}`}>
                {customer.priority.charAt(0).toUpperCase() + customer.priority.slice(1)} Priority
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Only show for existing customers */}
      {customer && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${customer.email}`}
              className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </a>
            <WhatsAppButton
              customerId={customer.id}
              customerPhone={customer.whatsappNumber}
              customerName={`${customer.firstName} ${customer.lastName}`}
              variant="minimal"
              size="md"
            />
            {customer.status !== 'converted' && (
              <button
                onClick={convertToApplication}
                className="bg-primary-100 text-primary-800 px-4 py-2 rounded-lg font-medium hover:bg-primary-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Convert to Application</span>
              </button>
            )}
            <button
              onClick={deleteCustomer}
              className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 pt-6">
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
        <div className="p-6">
          {activeTab === 'details' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800">Customer Information</h3>
                  {isEditing && (
                    <p className="text-sm text-secondary-600 mt-1">
                      Fields marked with <span className="text-red-500">*</span> are required
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isEditing) {
                      saveCustomer();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span>{isEditing ? 'Save Changes' : 'Edit Details'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-semibold text-secondary-800 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.firstName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter first name"
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.firstName || 'N/A'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.lastName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter last name"
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter email address"
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        WhatsApp Number <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.whatsappNumber || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter WhatsApp number"
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.whatsappNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Current Role <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.currentRole || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, currentRole: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter your current job title/role"
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.currentRole || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Organization <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.currentOrganization || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, currentOrganization: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter your current organization/company"
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.currentOrganization || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Program Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-semibold text-secondary-800 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Program Interest
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Program <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <select
                          value={editData.programId || ''}
                          onChange={(e) => {
                            setEditData(prev => ({ ...prev, programId: e.target.value, intakeId: '' })); // Reset intake when program changes
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Select a program *</option>
                          {programs.map((program) => (
                            <option key={program.id} value={program.id}>
                              {program.programName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-secondary-800">{customer?.programName || 'Not specified'}</p>
                      )}
                    </div>
                    
                    {(customer?.programId || editData.programId) && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Cohort <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <select
                            value={editData.intakeId || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, intakeId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          >
                            <option value="">Select your preferred cohort *</option>
                            {intakes.filter(intake => intake.programId === (customer?.programId || editData.programId)).map((intake) => (
                              <option key={intake.id} value={intake.id}>
                                {intake.name} - Starts {new Date(intake.startDate).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-secondary-800">{customer?.intakeName || getIntakeName(customer?.intakeId) || 'Not specified'}</p>
                        )}
                      </div>
                    )}

                    {/* Upcoming Intakes Information - Show only for info when not editing */}
                    {!isEditing && (customer?.programId || editData.programId) && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Upcoming Intakes
                        </label>
                        <div className="space-y-2">
                          {loading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                              <span className="ml-2 text-sm text-secondary-600">Loading intakes...</span>
                            </div>
                          ) : (() => {
                            const selectedProgramId = customer?.programId || editData.programId;
                            const programIntakes = intakes.filter(intake => intake.programId === selectedProgramId);
                            
                            console.log('CustomerPage - Debug Info:');
                            console.log('Selected Program ID:', selectedProgramId);
                            console.log('Total Intakes:', intakes.length);
                            console.log('All Intakes:', intakes);
                            console.log('Program Intakes:', programIntakes);
                            
                            return programIntakes.slice(0, 3).map((intake) => {
                              // Safe date handling
                              const formatDate = (dateStr: string) => {
                                try {
                                  const date = new Date(dateStr);
                                  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                                } catch {
                                  return 'Invalid Date';
                                }
                              };

                              return (
                                <div key={intake.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-secondary-800 text-sm">{intake.name}</p>
                                      <p className="text-xs text-secondary-600">
                                        Starts: {formatDate(intake.startDate)}
                                      </p>
                                      <p className="text-xs text-secondary-600">
                                        Apply by: {formatDate(intake.applicationDeadline)}
                                      </p>
                                      {intake.programCost && (
                                        <p className="text-xs text-green-600 font-medium">
                                          Fee: KES {intake.programCost.toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      intake.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {intake.status}
                                    </span>
                                  </div>
                                </div>
                              );
                                                         });
                           })()}
                          {!loading && intakes.filter(intake => intake.programId === (customer?.programId || editData.programId)).length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm text-yellow-700">No upcoming intakes available for this program</p>
                              <p className="text-xs text-yellow-600 mt-1">Contact admissions for more information about future intakes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Learning Goals <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editData.learningGoals || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, learningGoals: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Describe what you want to achieve..."
                          required
                        />
                      ) : (
                        <p className="text-secondary-800">{customer?.learningGoals}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Source <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <select
                          value={editData.source || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, source: e.target.value as Customer['source'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Select source</option>
                          <option value="website">Website</option>
                          <option value="direct">Direct</option>
                          <option value="referral">Referral</option>
                          <option value="social_media">Social Media</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-secondary-800 capitalize">{customer?.source?.replace('_', ' ') || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Communication Preference <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <select
                          value={editData.communicationPreference || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, communicationPreference: e.target.value as Customer['communicationPreference'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Select preference</option>
                          <option value="any">Any</option>
                          <option value="email">Email</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="phone">Phone</option>
                        </select>
                      ) : (
                        <p className="text-secondary-800 capitalize">{customer?.communicationPreference || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-semibold text-secondary-800 mb-4">Status & Timeline</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                      {isEditing ? (
                        <select
                          value={editData.status || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as Customer['status'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${customer?.status ? getStatusColor(customer.status) : 'bg-gray-100 text-gray-800'}`}>
                          {customer?.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Not set'}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                      {isEditing ? (
                        <select
                          value={editData.priority || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as Customer['priority'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${customer?.priority ? getPriorityColor(customer.priority) : 'bg-gray-100 text-gray-800'}`}>
                          {customer?.priority ? customer.priority.charAt(0).toUpperCase() + customer.priority.slice(1) : 'Not set'}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Submitted Date</label>
                      <p className="text-secondary-800">{customer?.submittedDate ? new Date(customer.submittedDate).toLocaleDateString() : 'Not available'}</p>
                    </div>
                    
                    {customer?.lastContactDate && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Last Contact</label>
                        <p className="text-secondary-800">{new Date(customer.lastContactDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-semibold text-secondary-800 mb-4">Assignment</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Assigned To</label>
                      <p className="text-secondary-800">{customer?.assignedToName || 'Unassigned'}</p>
                    </div>
                    
                    {customer?.followUpDate && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Follow-up Date</label>
                        <p className="text-secondary-800">{new Date(customer.followUpDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-800">Activity History</h3>
                <button
                  onClick={() => setShowAddNote(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Activity</span>
                </button>
              </div>

              {/* Add Note Form */}
              {showAddNote && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h4 className="text-md font-semibold text-secondary-800 mb-4">Add New Activity</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Activity Type</label>
                      <select
                        value={newNote.type}
                        onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="meeting">Meeting</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="general">General Note</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Activity Notes</label>
                      <textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter details about the activity..."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="followUpRequired"
                        checked={newNote.followUpRequired}
                        onChange={(e) => setNewNote(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="followUpRequired" className="text-sm text-secondary-700">
                        Requires follow-up
                      </label>
                    </div>

                    {newNote.followUpRequired && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Follow-up Date</label>
                        <input
                          type="datetime-local"
                          value={newNote.followUpDate}
                          onChange={(e) => setNewNote(prev => ({ ...prev, followUpDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAddNote(false)}
                        className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addNote}
                        disabled={!newNote.content.trim()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        Save Activity
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          {getNoteTypeIcon(note.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-secondary-800 capitalize">
                              {note.type.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-secondary-500">
                              by {note.authorName}
                            </span>
                            {note.followUpRequired && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Follow-up Required
                              </span>
                            )}
                          </div>
                          <p className="text-secondary-700 mb-2">{note.content}</p>
                          <p className="text-sm text-secondary-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                          {note.followUpDate && (
                            <p className="text-sm text-yellow-600 mt-1">
                              Follow-up: {new Date(note.followUpDate).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {notes.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                    <p className="text-secondary-600">No activity recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-6">Available Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-semibold text-secondary-800 mb-4">Customer Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="w-full bg-blue-100 text-blue-800 px-4 py-3 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Activity Note</span>
                    </button>
                    
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg font-medium hover:bg-yellow-200 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Customer Details</span>
                    </button>
                  </div>
                </div>

                {customer?.status !== 'converted' && customer && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-md font-semibold text-secondary-800 mb-4">Conversion Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={convertToApplication}
                        className="w-full bg-green-100 text-green-800 px-4 py-3 rounded-lg font-medium hover:bg-green-200 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Convert to Application</span>
                      </button>
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

export default CustomerPage; 