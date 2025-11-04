import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, Plus, Eye, CheckCircle, XCircle, Clock, 
  TrendingUp, Edit, X, Phone, Mail, MessageSquare, Calendar,
  Tag, BarChart3, Download, Trash2, UserPlus, Target, Building2, User
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Customer, CustomerNote, Program, CustomerStats, ActivityModalProps, CustomerFilters, Contact, ContactFilters } from './types';
import WhatsAppButton from '../../../components/WhatsAppButton';

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, customer, onSave }) => {
  const { userProfile } = useAuthContext();
  const [formData, setFormData] = useState({
    content: '',
    type: 'call' as const,
    followUpRequired: false,
    followUpDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData: Partial<CustomerNote> = {
        customerId: customer?.id,
        content: formData.content.trim(),
        type: formData.type,
        author: userProfile?.id,
        authorName: `${userProfile?.firstName} ${userProfile?.lastName}`,
        createdAt: new Date().toISOString(),
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || undefined
      };

      await onSave(noteData);
      setFormData({
        content: '',
        type: 'call',
        followUpRequired: false,
        followUpDate: ''
      });
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-secondary-800">Add Activity</h3>
            <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-secondary-600 mb-2">
              Customer: <span className="font-medium">{customer?.firstName} {customer?.lastName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Activity Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
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
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter details about the activity..."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="followUpRequired" className="text-sm text-secondary-700">
                Requires follow-up
              </label>
            </div>

            {formData.followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Follow-up Date</label>
                <input
                  type="datetime-local"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.content.trim() || loading}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('leads');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'all',
    priority: 'all',
    programId: 'all',
    assignedTo: 'all',
    source: 'all',
    dateRange: 'all'
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  const [stats, setStats] = useState<CustomerStats>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    conversions: 0,
    conversionRate: 0,
    averageResponseTime: 0
  });

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [contactFilters, setContactFilters] = useState<ContactFilters>({
    source: 'all',
    organisation: 'all',
    searchTerm: ''
  });
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // B2B Leads state
  const [b2bLeads, setB2bLeads] = useState<any[]>([]);
  const [filteredB2bLeads, setFilteredB2bLeads] = useState<any[]>([]);
  const [b2bSearchTerm, setB2bSearchTerm] = useState('');
  const [b2bFilters, setB2bFilters] = useState({
    status: 'all',
    priority: 'all',
    source: 'all'
  });
  const [showB2bLeadModal, setShowB2bLeadModal] = useState(false);
  const [b2bLeadForm, setB2bLeadForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    position: '',
    companySize: '',
    industry: '',
    trainingNeeds: '',
    budget: '',
    timeline: '',
    source: 'business_page',
    status: 'new',
    priority: 'medium',
    notes: ''
  });

  // Check if user is a learner
  const isLearner = userProfile?.role === 'learner';

  useEffect(() => {
    loadCustomers();
    loadPrograms();
    loadContacts();
    loadB2bLeads();
  }, []);

  useEffect(() => {
    filterCustomers();
    calculateStats();
  }, [customers, searchTerm, filters]);

  useEffect(() => {
    filterContacts();
  }, [contacts, contactFilters]);

  useEffect(() => {
    filterB2bLeads();
  }, [b2bLeads, b2bSearchTerm, b2bFilters]);

  useEffect(() => {
    // Reset to first page when search term or filters change
    setCurrentPage(1);
  }, [searchTerm, filters, contactFilters, b2bSearchTerm, b2bFilters, activeTab]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('customers');
      if (result.success && result.data) {
        const customersData = result.data as Customer[];
        // Sort by submission date, newest first
        customersData.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await FirestoreService.getAll('programs');
      if (result.success && result.data) {
        setPrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const formatLeadSource = (customer: Customer): string => {
    if (customer.source === 'social_media' && customer.socialMediaPlatform) {
      return customer.socialMediaPlatform.charAt(0).toUpperCase() + customer.socialMediaPlatform.slice(1);
    }
    if (customer.source === 'referral') {
      if (customer.referralSource === 'staff_student' && customer.staffStudentName) {
        return `Referral - ${customer.staffStudentName}`;
      }
      if (customer.referralSource) {
        return `Referral - ${customer.referralSource.replace(/_/g, ' ')}`;
      }
      return 'Referral';
    }
    return customer.source?.replace(/_/g, ' ') || 'Unknown';
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.whatsappNumber.includes(searchTerm) ||
        customer.leadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.programName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(customer => customer.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(customer => customer.priority === filters.priority);
    }
    if (filters.programId !== 'all') {
      filtered = filtered.filter(customer => customer.programId === filters.programId);
    }
    if (filters.source !== 'all') {
      // Check for specific social media platforms
      if (['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'].includes(filters.source)) {
        filtered = filtered.filter(customer => 
          customer.source === 'social_media' && customer.socialMediaPlatform === filters.source
        );
      } else {
        filtered = filtered.filter(customer => customer.source === filters.source);
      }
    }

    setFilteredCustomers(filtered);
  };

  const calculateStats = () => {
    const totalLeads = customers.length;
    const newLeads = customers.filter(c => c.status === 'new').length;
    const applicants = customers.filter(c => c.status === 'applicant').length;
    const admitted = customers.filter(c => c.status === 'admitted').length;
    const conversionRate = totalLeads > 0 ? Math.round((admitted / totalLeads) * 100) : 0;

    setStats({
      totalLeads,
      newLeads,
      qualifiedLeads: applicants,
      conversions: admitted,
      conversionRate,
      averageResponseTime: 0 // Calculate this based on response times
    });
  };

  const updateCustomerStatus = async (customerId: string, status: Customer['status']) => {
    try {
      const result = await FirestoreService.update('customers', customerId, { 
        status,
        lastContactDate: new Date().toISOString()
      });
      
      if (result.success) {
        // If status is changed to 'applicant', create an applicant record
        if (status === 'applicant') {
          const customer = customers.find(c => c.id === customerId);
          if (customer) {
            await createApplicantFromCustomer(customer);
          }
        }
        loadCustomers();
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  const generateApplicationNumber = async () => {
    try {
      const result = await FirestoreService.getAll('applicants');
      let maxId = 0;
      
      if (result.success && result.data) {
        const applicants = result.data as any[];
        applicants.forEach(applicant => {
          if (applicant.applicationNumber && applicant.applicationNumber.startsWith('AP')) {
            const numStr = applicant.applicationNumber.substring(2);
            const num = parseInt(numStr);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        });
      }
      
      const nextId = maxId + 1;
      return `AP${nextId.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating application number:', error);
      return `AP${Math.floor(Math.random() * 9999) + 1000}`;
    }
  };

  const createApplicantFromCustomer = async (customer: Customer) => {
    try {
      const applicationNumber = await generateApplicationNumber();
      
      const applicantData = {
        applicationNumber,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phoneNumber: customer.whatsappNumber,
        programId: customer.programId,
        currentJobTitle: customer.currentRole,
        currentOrganisation: customer.currentOrganization,
        learningGoals: customer.learningGoals,
        status: 'pending',
        paymentStatus: 'pending',
        submittedDate: new Date().toISOString(),
        customerId: customer.id,
        leadNumber: customer.leadNumber
      };
      
      const result = await FirestoreService.create('applicants', applicantData);
      
      if (result.success) {
        console.log('Applicant created successfully with ID:', result.id);
        
        // Store applicant ID in customer record for future reference
        await FirestoreService.update('customers', customer.id, {
          applicantId: result.id,
          convertedToApplicantDate: new Date().toISOString()
        });
      } else {
        console.error('Failed to create applicant');
      }
    } catch (error) {
      console.error('Error creating applicant from customer:', error);
    }
  };

  const updateCustomerPriority = async (customerId: string, priority: Customer['priority']) => {
    try {
      const result = await FirestoreService.update('customers', customerId, { priority });
      if (result.success) {
        loadCustomers();
      }
    } catch (error) {
      console.error('Error updating customer priority:', error);
    }
  };

  const assignCustomer = async (customerId: string, assignedTo: string) => {
    try {
      const result = await FirestoreService.update('customers', customerId, { 
        assignedTo,
        assignedToName: userProfile?.firstName + ' ' + userProfile?.lastName
      });
      if (result.success) {
        loadCustomers();
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
    }
  };

  const saveActivity = async (noteData: Partial<CustomerNote>) => {
    try {
      const result = await FirestoreService.create('customerNotes', noteData);
      if (result.success) {
        // Update customer's last contact date
        await FirestoreService.update('customers', noteData.customerId!, {
          lastContactDate: new Date().toISOString()
        });
        loadCustomers();
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('customers', customerId);
        if (result.success) {
          loadCustomers();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  // Contacts functions
  const loadContacts = async () => {
    try {
      const result = await FirestoreService.getAll('contacts');
      if (result.success && result.data) {
        const contactsData = result.data as Contact[];
        contactsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    if (contactFilters.searchTerm) {
      filtered = filtered.filter(contact =>
        contact.firstName?.toLowerCase().includes(contactFilters.searchTerm.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(contactFilters.searchTerm.toLowerCase()) ||
        contact.surname?.toLowerCase().includes(contactFilters.searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(contactFilters.searchTerm.toLowerCase()) ||
        contact.phone.includes(contactFilters.searchTerm) ||
        contact.organisation?.toLowerCase().includes(contactFilters.searchTerm.toLowerCase())
      );
    }

    if (contactFilters.source !== 'all') {
      filtered = filtered.filter(contact => contact.source === contactFilters.source);
    }

    if (contactFilters.organisation !== 'all') {
      filtered = filtered.filter(contact => contact.organisation === contactFilters.organisation);
    }

    setFilteredContacts(filtered);
  };

  // B2B Leads functions
  const loadB2bLeads = async () => {
    try {
      const result = await FirestoreService.getAll('b2bleads');
      if (result.success && result.data) {
        const b2bLeadsData = result.data as any[];
        // Sort by submission date, newest first
        b2bLeadsData.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
        setB2bLeads(b2bLeadsData);
      }
    } catch (error) {
      console.error('Error loading B2B leads:', error);
    }
  };

  const filterB2bLeads = () => {
    let filtered = b2bLeads;

    // Filter by search term
    if (b2bSearchTerm) {
      filtered = filtered.filter(lead =>
        lead.companyName?.toLowerCase().includes(b2bSearchTerm.toLowerCase()) ||
        lead.contactPerson?.toLowerCase().includes(b2bSearchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(b2bSearchTerm.toLowerCase()) ||
        lead.phone.includes(b2bSearchTerm) ||
        lead.industry?.toLowerCase().includes(b2bSearchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (b2bFilters.status !== 'all') {
      filtered = filtered.filter(lead => lead.status === b2bFilters.status);
    }
    if (b2bFilters.priority !== 'all') {
      filtered = filtered.filter(lead => lead.priority === b2bFilters.priority);
    }
    if (b2bFilters.source !== 'all') {
      filtered = filtered.filter(lead => lead.source === b2bFilters.source);
    }

    setFilteredB2bLeads(filtered);
  };

  const saveB2bLead = async () => {
    try {
      const generateB2bLeadNumber = async () => {
        try {
          const result = await FirestoreService.getAll('b2bleads');
          let maxId = 0;
          
          if (result.success && result.data) {
            const leads = result.data as any[];
            leads.forEach(lead => {
              if (lead.leadNumber && lead.leadNumber.startsWith('B2B')) {
                const numStr = lead.leadNumber.substring(3);
                const num = parseInt(numStr);
                if (!isNaN(num) && num > maxId) {
                  maxId = num;
                }
              }
            });
          }
          
          const nextId = maxId + 1;
          return `B2B${nextId.toString().padStart(4, '0')}`;
        } catch (error) {
          console.error('Error generating B2B lead number:', error);
          return `B2B${Math.floor(Math.random() * 9999) + 1000}`;
        }
      };

      const b2bLeadData = {
        ...b2bLeadForm,
        leadNumber: await generateB2bLeadNumber(),
        submittedDate: new Date().toISOString(),
        assignedTo: userProfile?.id,
        assignedToName: `${userProfile?.firstName} ${userProfile?.lastName}`
      };

      const result = await FirestoreService.create('b2bleads', b2bLeadData);
      if (result.success) {
        setB2bLeadForm({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          position: '',
          companySize: '',
          industry: '',
          trainingNeeds: '',
          budget: '',
          timeline: '',
          source: 'business_page',
          status: 'new',
          priority: 'medium',
          notes: ''
        });
        setShowB2bLeadModal(false);
        loadB2bLeads();
      }
    } catch (error) {
      console.error('Error saving B2B lead:', error);
    }
  };

  const updateB2bLeadStatus = async (leadId: string, status: string) => {
    try {
      const result = await FirestoreService.update('b2bleads', leadId, { 
        status,
        lastContactDate: new Date().toISOString()
      });
      
      if (result.success) {
        loadB2bLeads();
      }
    } catch (error) {
      console.error('Error updating B2B lead status:', error);
    }
  };

  const updateB2bLeadPriority = async (leadId: string, priority: string) => {
    try {
      const result = await FirestoreService.update('b2bleads', leadId, { priority });
      if (result.success) {
        loadB2bLeads();
      }
    } catch (error) {
      console.error('Error updating B2B lead priority:', error);
    }
  };

  const deleteB2bLead = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this B2B lead? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('b2bleads', leadId);
        if (result.success) {
          loadB2bLeads();
        }
      } catch (error) {
        console.error('Error deleting B2B lead:', error);
      }
    }
  };

  // Pagination calculations based on active tab
  const currentData = activeTab === 'leads' ? filteredCustomers : 
                     activeTab === 'contacts' ? filteredContacts : 
                     filteredB2bLeads;
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);
  const paginatedB2bLeads = filteredB2bLeads.slice(startIndex, endIndex);

  const saveContact = async (contactData: Partial<Contact>) => {
    try {
      const newContact = {
        ...contactData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: contactData.source || 'manual'
      };

      const result = await FirestoreService.create('contacts', newContact);
      if (result.success) {
        loadContacts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving contact:', error);
      return false;
    }
  };

  const bulkUploadContacts = async (contactsData: Partial<Contact>[]) => {
    try {
      const promises = contactsData.map(contact => {
        const newContact = {
          ...contact,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'csv_upload' as const
        };
        return FirestoreService.create('contacts', newContact);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        loadContacts();
      }
      
      return { success: successCount, failed: results.length - successCount };
    } catch (error) {
      console.error('Error bulk uploading contacts:', error);
      return { success: 0, failed: contactsData.length };
    }
  };

  const convertContactToLead = async (contact: Contact) => {
    if (window.confirm('Convert this contact to a lead? This will create a new customer lead.')) {
      try {
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

        const mapContactSourceToCustomerSource = (contactSource: string): Customer['source'] => {
          switch (contactSource) {
            case 'manual':
            case 'csv_upload':
              return 'direct';
            case 'website':
              return 'website';
            case 'referral':
              return 'referral';
            case 'social_media':
              return 'social_media';
            default:
              return 'other';
          }
        };

        const customerData: Partial<Customer> = {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          whatsappNumber: contact.phone,
          learningGoals: contact.notes || 'Converted from contact',
          status: 'new',
          priority: 'medium',
          source: mapContactSourceToCustomerSource(contact.source),
          communicationPreference: 'any',
          leadNumber: await generateLeadNumber(),
          submittedDate: new Date().toISOString(),
          tags: contact.tags || []
        };

        const result = await FirestoreService.create('customers', customerData);
        if (result.success) {
          // Update contact to mark as converted
          await FirestoreService.update('contacts', contact.id, {
            isConverted: true,
            convertedToLeadId: result.id,
            updatedAt: new Date().toISOString()
          });
          
          loadContacts();
          loadCustomers();
          alert('Contact successfully converted to lead!');
        }
      } catch (error) {
        console.error('Error converting contact to lead:', error);
        alert('Error converting contact to lead. Please try again.');
      }
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const contact: any = {};
          
          headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
              contact.firstName = values[index] || '';
            } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
              contact.lastName = values[index] || '';
            } else if (lowerHeader.includes('surname')) {
              contact.surname = values[index] || '';
            } else if (lowerHeader.includes('email')) {
              contact.email = values[index] || '';
            } else if (lowerHeader.includes('phone')) {
              contact.phone = values[index] || '';
            } else if (lowerHeader.includes('organisation')) {
              contact.organisation = values[index] || '';
            } else if (lowerHeader.includes('source')) {
              contact.source = values[index] || 'csv_upload';
            }
          });
          
          return contact;
        }).filter(contact => contact.firstName && contact.lastName && contact.email);
        
        setCsvPreview(data);
      }
    };
    reader.readAsText(file);
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program?.programName || 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-orange-100 text-orange-800';
      case 'applicant': return 'bg-purple-100 text-purple-800';
      case 'admitted': return 'bg-green-100 text-green-800';
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

  const statsCards = [
    { 
      title: 'Total Leads', 
      value: stats.totalLeads.toString(), 
      change: `${stats.newLeads} new`, 
      icon: Users, 
      color: 'primary' 
    },
    { 
      title: 'New Leads', 
      value: stats.newLeads.toString(), 
      change: 'Last 7 days', 
      icon: UserPlus, 
      color: 'accent' 
    },
    { 
      title: 'Applicants', 
      value: stats.qualifiedLeads.toString(), 
      change: `${Math.round((stats.qualifiedLeads / Math.max(stats.totalLeads, 1)) * 100)}% of total`, 
      icon: Target, 
      color: 'secondary' 
    },
    { 
      title: 'Conversion Rate', 
      value: `${stats.conversionRate}%`, 
      change: `${stats.conversions} conversions`, 
      icon: TrendingUp, 
      color: 'primary' 
    }
  ];

  const tabs = [
    { id: 'leads', label: 'Individuals' },
    { id: 'b2b', label: 'Corporates' },
    { id: 'contacts', label: 'Alumni' }
  ];

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
          <div>
            <h1 className="text-4xl font-bold mb-2">Customer CRM</h1>
            <p className="text-lg text-primary-100">
              Manage individual leads, corporate clients, and alumni relationships.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">{stat.change}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
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
          {activeTab === 'leads' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="lost">Lost</option>
                    <option value="declined">Declined</option>
                    <option value="applicant">Applicant</option>
                    <option value="admitted">Admitted</option>
                  </select>
                  
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select
                    value={filters.source}
                    onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Sources</option>
                    <option value="website">Website/Google</option>
                    <option value="referral">All Referrals</option>
                    <option value="social_media">All Social Media</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="direct">Direct Contact</option>
                    <option value="other">Other</option>
                  </select>
                  
                  <select
                    value={filters.programId}
                    onChange={(e) => setFilters(prev => ({ ...prev, programId: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => navigate('/portal/customers/new')}
                    className="bg-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Individual</span>
                  </button>
                  <button className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Customers Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Lead #</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Source</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Submitted</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{customer.leadNumber}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{customer.firstName} {customer.lastName}</div>
                            <div className="text-sm text-secondary-500">{customer.email}</div>
                            <div className="text-sm text-secondary-500">{customer.whatsappNumber}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{customer.programName || getProgramName(customer.programId)}</td>
                        <td className="py-4 px-4">
                          <select
                            value={customer.status}
                            onChange={(e) => updateCustomerStatus(customer.id, e.target.value as Customer['status'])}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-none ${getStatusColor(customer.status)}`}
                          >
                            <option value="new">New</option>
                            <option value="lost">Lost</option>
                            <option value="declined">Declined</option>
                            <option value="applicant">Applicant</option>
                            <option value="admitted">Admitted</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={customer.priority}
                            onChange={(e) => updateCustomerPriority(customer.id, e.target.value as Customer['priority'])}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-none ${getPriorityColor(customer.priority)}`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {formatLeadSource(customer)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-secondary-600 text-sm">
                          {new Date(customer.submittedDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/customers/${customer.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <WhatsAppButton
                              customerId={customer.id}
                              customerPhone={customer.whatsappNumber}
                              customerName={`${customer.firstName} ${customer.lastName}`}
                              variant="icon"
                              size="sm"
                            />
                            {!isLearner && (
                              <button 
                                onClick={() => deleteCustomer(customer.id)}
                                className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {activeTab === 'leads' && totalItems === 0 && !loading && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Individual Leads Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || Object.values(filters).some(f => f !== 'all')
                        ? 'No individual leads match your search criteria.' 
                        : 'Start by adding your first individual lead.'
                      }
                    </p>
                    <button 
                      onClick={() => navigate('/portal/customers/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Individual Lead</span>
                    </button>
                  </div>
                )}

                {/* Pagination Controls for Leads */}
                {activeTab === 'leads' && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} leads
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-secondary-600 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={contactFilters.searchTerm}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  
                  <select
                    value={contactFilters.source}
                    onChange={(e) => setContactFilters(prev => ({ ...prev, source: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Sources</option>
                    <option value="manual">Manual Entry</option>
                    <option value="csv_upload">CSV Upload</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="direct">Direct</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowAddContactModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Alumni</span>
                  </button>
                  <button 
                    onClick={() => setShowBulkUploadModal(true)}
                    className="bg-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Bulk Upload</span>
                  </button>
                </div>
              </div>

              {/* Contacts Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Organisation</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Source</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedContacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div className="font-medium text-secondary-800">
                            {contact.firstName} {contact.lastName} {contact.surname && `(${contact.surname})`}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{contact.email}</td>
                        <td className="py-4 px-4 text-secondary-600">{contact.phone}</td>
                        <td className="py-4 px-4 text-secondary-600">{contact.organisation || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {contact.source?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {contact.isConverted ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Converted to Lead
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Active Contact
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <a 
                              href={`tel:${contact.phone}`}
                              className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                            <a 
                              href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '') || ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-secondary-400 hover:text-green-600 transition-colors duration-200"
                              title="WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                            {!contact.isConverted && (
                              <button 
                                onClick={() => convertContactToLead(contact)}
                                className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                title="Convert to Lead"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {activeTab === 'contacts' && totalItems === 0 && !loading && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Alumni Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {contactFilters.searchTerm || contactFilters.source !== 'all'
                        ? 'No alumni match your search criteria.' 
                        : 'Start by adding your first alumni contact or uploading a CSV file.'
                      }
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button 
                        onClick={() => setShowAddContactModal(true)}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add Alumni</span>
                      </button>
                      <button 
                        onClick={() => setShowBulkUploadModal(true)}
                        className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Download className="h-5 w-5" />
                        <span>Bulk Upload</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pagination Controls for Contacts */}
                {activeTab === 'contacts' && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} contacts
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-secondary-600 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'b2b' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search B2B leads..."
                      value={b2bSearchTerm}
                      onChange={(e) => setB2bSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  
                  <select
                    value={b2bFilters.status}
                    onChange={(e) => setB2bFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                  
                  <select
                    value={b2bFilters.priority}
                    onChange={(e) => setB2bFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select
                    value={b2bFilters.source}
                    onChange={(e) => setB2bFilters(prev => ({ ...prev, source: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Sources</option>
                    <option value="business_page">Business Page</option>
                    <option value="referral">Referral</option>
                    <option value="direct">Direct</option>
                    <option value="social_media">Social Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowB2bLeadModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Corporate</span>
                  </button>
                  <button className="bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* B2B Leads Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Lead #</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Industry</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Source</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Submitted</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedB2bLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{lead.leadNumber}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{lead.companyName}</div>
                            <div className="text-sm text-secondary-500">{lead.companySize} employees</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{lead.contactPerson}</div>
                            <div className="text-sm text-secondary-500">{lead.position}</div>
                            <div className="text-sm text-secondary-500">{lead.email}</div>
                            <div className="text-sm text-secondary-500">{lead.phone}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{lead.industry || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => updateB2bLeadStatus(lead.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-none ${getStatusColor(lead.status)}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal Sent</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={lead.priority}
                            onChange={(e) => updateB2bLeadPriority(lead.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-none ${getPriorityColor(lead.priority)}`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {lead.source?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-secondary-600 text-sm">
                          {new Date(lead.submittedDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/customers/b2b/${lead.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <WhatsAppButton
                              customerId={lead.id}
                              customerPhone={lead.phone}
                              customerName={`${lead.contactPerson} - ${lead.companyName}`}
                              variant="icon"
                              size="sm"
                            />
                            {!isLearner && (
                              <button 
                                onClick={() => deleteB2bLead(lead.id)}
                                className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {activeTab === 'b2b' && totalItems === 0 && !loading && (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Corporate Leads Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {b2bSearchTerm || Object.values(b2bFilters).some(f => f !== 'all')
                        ? 'No corporate leads match your search criteria.' 
                        : 'Start by adding your first corporate lead.'
                      }
                    </p>
                    <button 
                      onClick={() => setShowB2bLeadModal(true)}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Corporate Lead</span>
                    </button>
                  </div>
                )}

                {/* Pagination Controls for B2B Leads */}
                {activeTab === 'b2b' && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} B2B leads
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-secondary-600 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        customer={selectedCustomer}
        onSave={saveActivity}
      />

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-800">Add New Alumni</h3>
                <button 
                  onClick={() => setShowAddContactModal(false)} 
                  className="p-1 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const contactData = {
                    firstName: formData.get('firstName') as string,
                    lastName: formData.get('lastName') as string,
                    surname: formData.get('surname') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    organisation: formData.get('organisation') as string,
                    source: formData.get('source') as Contact['source'],
                    notes: formData.get('notes') as string
                  };
                  
                  const success = await saveContact(contactData);
                  if (success) {
                    setShowAddContactModal(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter last name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Surname</label>
                    <input
                      type="text"
                      name="surname"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter surname (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Organisation</label>
                    <input
                      type="text"
                      name="organisation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter organisation (optional)"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Source</label>
                  <select
                    name="source"
                    defaultValue="manual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="direct">Direct</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add any additional notes (optional)"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="flex-1 bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                  >
                    Add Alumni
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-800">Bulk Upload Contacts</h3>
                <button 
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                  }} 
                  className="p-1 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Your CSV file should include the following columns (in any order):
                  </p>
                  <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                    <li><strong>First Name</strong> (required)</li>
                    <li><strong>Last Name</strong> (required)</li>
                    <li><strong>Surname</strong> (optional)</li>
                    <li><strong>Email</strong> (required)</li>
                    <li><strong>Phone</strong> (required)</li>
                    <li><strong>Organisation</strong> (optional)</li>
                    <li><strong>Source</strong> (optional - defaults to csv_upload)</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCsvFile(file);
                        parseCsvFile(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">
                      Preview ({csvPreview.length} contacts found)
                    </h4>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-secondary-600">First Name</th>
                            <th className="text-left py-2 px-3 font-medium text-secondary-600">Last Name</th>
                            <th className="text-left py-2 px-3 font-medium text-secondary-600">Email</th>
                            <th className="text-left py-2 px-3 font-medium text-secondary-600">Phone</th>
                            <th className="text-left py-2 px-3 font-medium text-secondary-600">Organisation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 10).map((contact, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 px-3">{contact.firstName}</td>
                              <td className="py-2 px-3">{contact.lastName}</td>
                              <td className="py-2 px-3">{contact.email}</td>
                              <td className="py-2 px-3">{contact.phone}</td>
                              <td className="py-2 px-3">{contact.organisation || 'N/A'}</td>
                            </tr>
                          ))}
                          {csvPreview.length > 10 && (
                            <tr>
                              <td colSpan={5} className="py-2 px-3 text-center text-secondary-500">
                                ... and {csvPreview.length - 10} more contacts
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkUploadModal(false);
                      setCsvFile(null);
                      setCsvPreview([]);
                    }}
                    className="flex-1 bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (csvPreview.length > 0) {
                        const result = await bulkUploadContacts(csvPreview);
                        alert(`Upload complete: ${result.success} contacts added, ${result.failed} failed`);
                        setShowBulkUploadModal(false);
                        setCsvFile(null);
                        setCsvPreview([]);
                      }
                    }}
                    disabled={csvPreview.length === 0}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    Upload {csvPreview.length} Contacts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B2B Lead Modal */}
      {showB2bLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-800">Add New Corporate Lead</h3>
                <button 
                  onClick={() => setShowB2bLeadModal(false)} 
                  className="p-1 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  saveB2bLead();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-secondary-800 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Company Information
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={b2bLeadForm.companyName}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={b2bLeadForm.industry}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, industry: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Technology, Healthcare, Manufacturing"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Company Size
                      </label>
                      <select
                        value={b2bLeadForm.companySize}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, companySize: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-secondary-800 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Contact Information
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={b2bLeadForm.contactPerson}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter contact person name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={b2bLeadForm.position}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., HR Manager, Sales Director"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={b2bLeadForm.email}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={b2bLeadForm.phone}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Training Requirements */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-secondary-800 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Training Requirements
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Training Needs
                      </label>
                      <textarea
                        value={b2bLeadForm.trainingNeeds}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, trainingNeeds: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Describe the training needs..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Budget Range
                      </label>
                      <select
                        value={b2bLeadForm.budget}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select budget range</option>
                        <option value="Under 100K">Under KES 100,000</option>
                        <option value="100K-500K">KES 100,000 - 500,000</option>
                        <option value="500K-1M">KES 500,000 - 1,000,000</option>
                        <option value="1M-5M">KES 1,000,000 - 5,000,000</option>
                        <option value="5M+">Over KES 5,000,000</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Timeline
                      </label>
                      <select
                        value={b2bLeadForm.timeline}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, timeline: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select timeline</option>
                        <option value="Immediate">Immediate (within 1 month)</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6+ months">6+ months</option>
                        <option value="Planning">Still planning</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-secondary-800">Additional Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Source</label>
                      <select
                        value={b2bLeadForm.source}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, source: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="business_page">Business Page</option>
                        <option value="referral">Referral</option>
                        <option value="direct">Direct</option>
                        <option value="social_media">Social Media</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                      <select
                        value={b2bLeadForm.priority}
                        onChange={(e) => setB2bLeadForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                    <textarea
                      value={b2bLeadForm.notes}
                      onChange={(e) => setB2bLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowB2bLeadModal(false)}
                    className="flex-1 bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                  >
                    Add Corporate Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers; 