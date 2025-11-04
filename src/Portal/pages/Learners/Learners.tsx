import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Eye, Banknote, Calendar, UserPlus, X, FileText, Download, Upload, AlertCircle, CheckCircle, UserCheck, RefreshCw } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import AttendeeModal from '../Events/AttendeeModal';
import AttendeesPDF from '../Events/AttendeesPDF';
import PDFService from '../../../services/pdfService';
import { syncLearnersToCollections, SyncResult } from '../../../utils/syncLearners';

interface Learner {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  programId: string;
  programName?: string;
  intake?: string; // Keep for backward compatibility
  intakeId?: string; // New field from intakes collection
  intakeName?: string; // Intake name from intakes collection
  academicStatus: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  enrollmentDate: string;
  totalFees?: number;
  amountPaid?: number;
  outstandingBalance?: number;
}

interface Program {
  id: string;
  programName: string;
}

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  programId: string;
  startDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

interface Event {
  id: string;
  title: string;
  description: string;
  slug: string;
  dates: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  goals: string[];
  targetAudience: string[];
  isPublic: boolean;
  registrationDeadline: string;
  image?: string;
  price?: number;
  currency?: string;
  requirements?: string;
  registrationForm: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'checkbox' | 'multiple-choice' | 'email' | 'phone';
    required: boolean;
    options?: string[];
  }>;
  createdAt?: string;
}

interface Attendee {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'free' | 'partially_paid';
  totalAmountDue?: number;
  totalAmountPaid?: number;
  paymentRecords?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    confirmationCode?: string;
    transactionDate: string;
    notes?: string;
    transactionId?: string;
  }>;
  paymentAmount?: number;
  paymentMethod?: string;
  mpesaCode?: string;
  customResponses: Record<string, any>;
}

const Learners: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('students');
  const [learners, setLearners] = useState<Learner[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<Learner[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [intakeFilter, setIntakeFilter] = useState('all');
  
  // Attendees state
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Attendee Modal State
  const [attendeeModal, setAttendeeModal] = useState({
    isOpen: false,
    attendee: null as Attendee | null,
    eventId: undefined as string | undefined,
    mode: 'edit' as 'view' | 'edit' | 'create'
  });

  // Check-in Modal State
  const [checkInModal, setCheckInModal] = useState({
    isOpen: false,
    attendee: null as Attendee | null,
    event: null as Event | null,
    isProcessing: false
  });

  // Attendee Filters
  const [attendeeFilters, setAttendeeFilters] = useState({
    eventTitle: '',
    paymentStatus: '',
    attendanceStatus: '',
    dateRange: { start: '', end: '' },
    searchTerm: ''
  });

  // PDF Export State
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Bulk Upload State
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  // Check if user is a learner
  const isLearner = userProfile?.role === 'learner';
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadLearners();
    loadPrograms();
    loadIntakes();
    loadEvents();
    loadAttendees();
  }, []);

  useEffect(() => {
    filterLearners();
  }, [learners, searchTerm, statusFilter, programFilter, intakeFilter]);

  useEffect(() => {
    // Reset to first page when search term or filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, programFilter, intakeFilter, activeTab]);

  const loadLearners = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('learners');
      if (result.success && result.data) {
        const learnersData = result.data as Learner[];
        // Sort by student ID in descending order (most recent learning ID first)
        learnersData.sort((a, b) => {
          const idA = a.studentId.toLowerCase();
          const idB = b.studentId.toLowerCase();
          return idB.localeCompare(idA);
        });
        setLearners(learnersData);
      }
    } catch (error) {
      console.error('Error loading learners:', error);
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

  const loadIntakes = async () => {
    try {
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        setIntakes(result.data as Intake[]);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const result = await FirestoreService.getAll('events');
      if (result.success && result.data) {
        setEvents(result.data as Event[]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadAttendees = async () => {
    try {
      const result = await FirestoreService.getAll('event_registrations');
      if (result.success && result.data) {
        setAttendees(result.data as Attendee[]);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
  };

  const filterLearners = () => {
    let filtered = learners;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(learner => {
        const intakeName = getIntakeName(learner.intakeId);
        return learner.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.intake?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.intakeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          intakeName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(learner => learner.academicStatus === statusFilter);
    }

    // Filter by program
    if (programFilter !== 'all') {
      filtered = filtered.filter(learner => learner.programId === programFilter);
    }

    // Filter by intake
    if (intakeFilter !== 'all') {
      filtered = filtered.filter(learner => learner.intakeId === intakeFilter);
    }

    setFilteredLearners(filtered);
  };

  const deleteLearner = async (learnerId: string) => {
    if (window.confirm('Are you sure you want to delete this learner? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('learners', learnerId);
        if (result.success) {
          loadLearners(); // Reload learners list
        }
      } catch (error) {
        console.error('Error deleting learner:', error);
      }
    }
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program?.programName || 'N/A';
  };

  const getIntakeName = (intakeId?: string) => {
    if (!intakeId) return 'No Intake';
    const intake = intakes.find(c => c.id === intakeId);
    return intake?.name || intake?.intakeId || 'Unknown Intake';
  };

  // Attendee Filter Functions - moved before stats calculation
  const filteredAttendees = (attendees.filter(attendee => {
    const event = events.find(e => e.id === attendee.eventId);
    
    // Search term filter
    if (attendeeFilters.searchTerm) {
      const searchLower = attendeeFilters.searchTerm.toLowerCase();
      const matchesSearch = 
        attendee.name.toLowerCase().includes(searchLower) ||
        attendee.email.toLowerCase().includes(searchLower) ||
        attendee.phone.toLowerCase().includes(searchLower) ||
        (event?.title.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Event title filter
    if (attendeeFilters.eventTitle && event?.title !== attendeeFilters.eventTitle) {
      return false;
    }

    // Payment status filter
    if (attendeeFilters.paymentStatus && attendee.paymentStatus !== attendeeFilters.paymentStatus) {
      return false;
    }

    // Attendance status filter
    if (attendeeFilters.attendanceStatus && attendee.status !== attendeeFilters.attendanceStatus) {
      return false;
    }

    // Date range filter
    if (attendeeFilters.dateRange.start && attendeeFilters.dateRange.end) {
      const registrationDate = new Date(attendee.registrationDate);
      const startDate = new Date(attendeeFilters.dateRange.start);
      const endDate = new Date(attendeeFilters.dateRange.end);
      
      if (registrationDate < startDate || registrationDate > endDate) {
        return false;
      }
    }

    return true;
  }) as any[]).sort((a, b) => {
    // Sort by registration date in descending order (latest first)
    const dateA = new Date(a.registrationDate);
    const dateB = new Date(b.registrationDate);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate stats from real data
  const totalLearners = learners.length;
  const activeLearners = learners.filter(l => l.academicStatus === 'active').length;
  const graduates = learners.filter(l => l.academicStatus === 'completed').length;
  const totalOutstanding = learners.reduce((total, learner) => total + (learner.outstandingBalance || 0), 0);
  const totalFees = learners.reduce((total, learner) => total + (learner.totalFees || 0), 0);
  const collectionRate = totalFees > 0 ? Math.round(((totalFees - totalOutstanding) / totalFees) * 100) : 0;

  // Pagination calculations based on active tab
  const currentFilteredLearners = activeTab === 'alumni' 
    ? filteredLearners.filter(l => l.academicStatus === 'completed')
    : filteredLearners;
  
  const totalItems = currentFilteredLearners.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLearners = currentFilteredLearners.slice(startIndex, endIndex);

  const stats = [
    { 
      title: 'Total Students', 
      value: totalLearners.toString(), 
      change: `${activeLearners} active`, 
      icon: Users, 
      color: 'primary' 
    },
    { 
      title: 'Active Students', 
      value: activeLearners.toString(), 
      change: `${Math.round((activeLearners / Math.max(totalLearners, 1)) * 100)}% of total`, 
      icon: GraduationCap, 
      color: 'accent' 
    },
    { 
      title: 'Short Program Attendees', 
      value: attendees.length.toString(), 
      change: `${filteredAttendees.filter(a => a.status === 'attended').length} attended`, 
      icon: Calendar, 
      color: 'secondary' 
    },
    ...(!isLearner ? [{
      title: 'Outstanding Fees',
      value: `KSh ${totalOutstanding.toLocaleString()}`,
      change: `${collectionRate}% collected`,
      icon: Banknote,
      color: 'primary'
    }] : [])
  ];

  const tabs = [
    { id: 'students', label: 'Core Programs' },
    ...(isAdmin ? [{ id: 'attendees', label: 'Short Programs' }] : []),
    { id: 'alumni', label: 'Alumni' },
    { id: 'corporates', label: 'Corporates' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Attendee Modal Functions
  const openAttendeeModal = (attendee?: Attendee, eventId?: string, mode: 'view' | 'edit' | 'create' = 'edit') => {
    setAttendeeModal({
      isOpen: true,
      attendee: attendee || null,
      eventId: eventId,
      mode: mode
    });
  };

  const closeAttendeeModal = () => {
    setAttendeeModal({
      isOpen: false,
      attendee: null,
      eventId: undefined,
      mode: 'edit'
    });
  };

  const handleAttendeeSaved = () => {
    loadAttendees(); // Reload attendees after save
    closeAttendeeModal();
  };

  // Check-in Modal Functions
  const openCheckInModal = (attendee: Attendee) => {
    const event = events.find(e => e.id === attendee.eventId);
    setCheckInModal({
      isOpen: true,
      attendee,
      event: event || null,
      isProcessing: false
    });
  };

  const closeCheckInModal = () => {
    setCheckInModal({
      isOpen: false,
      attendee: null,
      event: null,
      isProcessing: false
    });
  };

  const handleCheckIn = async (markPaid = false) => {
    if (!checkInModal.attendee) return;

    setCheckInModal(prev => ({ ...prev, isProcessing: true }));

    try {
      const updateData: any = {
        status: 'attended',
        updatedAt: new Date().toISOString()
      };

      // If marking as paid, update payment status
      if (markPaid) {
        updateData.paymentStatus = 'completed';
        updateData.totalAmountPaid = checkInModal.attendee.totalAmountDue || 0;
        // Add payment record
        const newPaymentRecord = {
          id: `payment_${Date.now()}`,
          amount: checkInModal.attendee.totalAmountDue || 0,
          paymentMethod: 'cash',
          confirmationCode: `CHECKIN_${Date.now()}`,
          transactionDate: new Date().toISOString(),
          notes: 'Payment confirmed during check-in'
        };
        updateData.paymentRecords = [...(checkInModal.attendee.paymentRecords || []), newPaymentRecord];
      }

      const result = await FirestoreService.update('event_registrations', checkInModal.attendee.id, updateData);
      
      if (result.success) {
        loadAttendees(); // Refresh attendees
        closeCheckInModal();
      }
    } catch (error) {
      console.error('Error checking in attendee:', error);
    } finally {
      setCheckInModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Sync Functions
  const handleSync = async () => {
    const confirmed = confirm(
      '🔄 This will sync all learners to contacts and users collections. This may take a few moments. Continue?'
    );
    
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncLearnersToCollections();
      setSyncResult(result);
      setShowSyncModal(true);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setShowSyncModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pagination calculations for attendees
  const attendeeTotalPages = Math.ceil(filteredAttendees.length / itemsPerPage);
  const attendeeStartIndex = (currentPage - 1) * itemsPerPage;
  const attendeeEndIndex = attendeeStartIndex + itemsPerPage;
  const paginatedAttendees = filteredAttendees.slice(attendeeStartIndex, attendeeEndIndex);

  const clearAttendeeFilters = () => {
    setAttendeeFilters({
      eventTitle: '',
      paymentStatus: '',
      attendanceStatus: '',
      dateRange: { start: '', end: '' },
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  // Get unique event titles for filter dropdown
  const uniqueEventTitles = Array.from(
    new Set(events.map(event => event.title))
  ).sort();

  // Export Functions
  const handleExportCSV = () => {
    try {
      // Get all unique custom form fields from all events
      const allCustomFields = new Set<string>();
      events.forEach(event => {
        event.registrationForm?.forEach(field => {
          allCustomFields.add(field.question);
        });
      });

      // Prepare CSV data with all information
      const csvData = filteredAttendees.map(attendee => {
        const event = events.find(e => e.id === attendee.eventId);
        
        // Base attendee information
        const baseData: any = {
          'Attendee Name': attendee.name,
          'Email': attendee.email,
          'Phone': attendee.phone,
          'Registration Date': new Date(attendee.registrationDate).toLocaleDateString(),
          'Attendance Status': attendee.status === 'attended' ? 'Attended' : 
                             attendee.status === 'registered' ? 'Registered' : 'No Show',
          'Program Title': event?.title || 'Unknown Program',
          'Program Date': event?.dates[0]?.date ? new Date(event.dates[0].date).toLocaleDateString() : 'TBD',
          'Program Location': event?.dates[0]?.location || 'TBD',
          'Program Price': event?.price || 0,
          'Program Currency': event?.currency || 'KES',
          'Payment Status': attendee.paymentStatus === 'completed' ? 'Paid' :
                          attendee.paymentStatus === 'partially_paid' ? 'Partially Paid' :
                          attendee.paymentStatus === 'pending' ? 'Not Paid' :
                          attendee.paymentStatus === 'failed' ? 'Payment Failed' : 'Free',
          'Balance': Math.max(0, (attendee.totalAmountDue || 0) - (attendee.totalAmountPaid || 0)),
          'Payment Records Count': attendee.paymentRecords?.length || 0
        };

        return baseData;
      });

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => {
          const value = row[header] || '';
          const escapedValue = value.toString().replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendees-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    
    setExportLoading(true);
    try {
      const filename = `attendees-report-${new Date().toISOString().split('T')[0]}.pdf`;
      await PDFService.generatePDF(pdfRef.current, {
        filename,
        format: 'a4',
        margin: 20
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const openPDFPreview = () => {
    setShowPDFPreview(true);
  };

  const closePDFPreview = () => {
    setShowPDFPreview(false);
  };

  // Bulk Upload Functions
  const downloadCSVTemplate = () => {
    const csvContent = [
      ['firstName', 'lastName', 'email', 'phoneNumber', 'programId', 'academicStatus'],
      ['John', 'Doe', 'john.doe@example.com', '+254712345678', 'program-id-here', 'active'],
      ['Jane', 'Smith', 'jane.smith@example.com', '+254712345679', 'program-id-here', 'active']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'learners-upload-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadErrors(['Please select a CSV file.']);
      return;
    }

    setUploadFile(file);
    setUploadErrors([]);
    parseCSVFile(file);
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setUploadErrors(['CSV file must contain at least a header row and one data row.']);
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
        const requiredFields = ['firstname', 'lastname', 'email', 'phonenumber'];
        
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          setUploadErrors([`Missing required columns: ${missingFields.join(', ')}`]);
          return;
        }

        const data = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          
          if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: Column count mismatch`);
            continue;
          }

          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          // Validate required fields
          const rowErrors = [];
          if (!row.firstname) rowErrors.push('firstName is required');
          if (!row.lastname) rowErrors.push('lastName is required');
          if (!row.email) rowErrors.push('email is required');
          if (!row.phonenumber) rowErrors.push('phoneNumber is required');

          // Validate email format
          if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            rowErrors.push('invalid email format');
          }

          if (rowErrors.length > 0) {
            errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
            continue;
          }

          // Map to proper field names and add defaults
          const learner = {
            firstName: row.firstname,
            lastName: row.lastname,
            email: row.email,
            phoneNumber: row.phonenumber,
            programId: row.programid || programs[0]?.id || '',
            academicStatus: row.academicstatus || 'active',
            enrollmentDate: new Date().toISOString()
          };

          data.push(learner);
        }

        setUploadPreview(data);
        setUploadErrors(errors);
      } catch (error) {
        setUploadErrors(['Error parsing CSV file. Please check the format.']);
        console.error('CSV parsing error:', error);
      }
    };

    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (uploadPreview.length === 0) return;

    setIsUploading(true);
    try {
      // Get the next learner ID number
      const getNextLearnerId = async () => {
        const existingLearners = await FirestoreService.getAll('learners');
        let maxNumber = 0;
        
        if (existingLearners.success && existingLearners.data) {
          existingLearners.data.forEach((learner: any) => {
            if (learner.studentId && learner.studentId.startsWith('L')) {
              const numberPart = learner.studentId.substring(1);
              const number = parseInt(numberPart);
              if (!isNaN(number) && number > maxNumber) {
                maxNumber = number;
              }
            }
          });
        }
        
        return maxNumber + 1;
      };

      let nextIdNumber = await getNextLearnerId();

      const results = await Promise.allSettled(
        uploadPreview.map(async (learner, index) => {
          // Generate ascending learner ID with L prefix
          const studentId = `L${String(nextIdNumber + index).padStart(2, '0')}`;
          
          const learnerData = {
            ...learner,
            studentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          return await FirestoreService.create('learners', learnerData);
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        setUploadSuccess(true);
        loadLearners(); // Refresh the learners list
        
        if (failed === 0) {
          // Complete success
          setTimeout(() => {
            closeBulkUploadModal();
          }, 2000);
        }
      }

      if (failed > 0) {
        const failedResults = results
          .map((result, index) => ({ result, index }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ index }) => `Row ${index + 1}: Upload failed`);
        
        setUploadErrors(prev => [...prev, ...failedResults]);
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadErrors(['An error occurred during bulk upload. Please try again.']);
    } finally {
      setIsUploading(false);
    }
  };

  const closeBulkUploadModal = () => {
    setShowBulkUpload(false);
    setUploadFile(null);
    setUploadPreview([]);
    setUploadErrors([]);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Learners</h1>
            <p className="text-lg text-primary-100">
              Manage core program students, short program attendees, and corporate clients.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change}
                    </p>
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
          {activeTab === 'students' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search learners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={intakeFilter}
                    onChange={(e) => setIntakeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Intakes</option>
                    {intakes.map((intake) => (
                      <option key={intake.id} value={intake.id}>
                        {intake.name || intake.intakeId}
                      </option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync to Contacts'}</span>
                  </button>
                  <button 
                    onClick={() => setShowBulkUpload(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Bulk Upload</span>
                  </button>
                  <button 
                    onClick={() => navigate('/portal/learners/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Student</span>
                  </button>
                </div>
                )}
              </div>

              {/* Learners Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Student ID & Enrollment</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name & Email</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Program & Intake</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLearners.map((learner) => (
                      <tr key={learner.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{learner.studentId}</div>
                            {learner.enrollmentDate && (
                              <div className="text-sm text-secondary-500">
                                Enrolled: {new Date(learner.enrollmentDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{learner.firstName} {learner.lastName}</div>
                            <div className="text-sm text-secondary-500">{learner.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-600">{getProgramName(learner.programId)}</div>
                            <div className="text-sm text-secondary-500">
                              {learner.intakeName || learner.intake || getIntakeName(learner.intakeId)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(learner.academicStatus)}`}>
                            {learner.academicStatus.charAt(0).toUpperCase() + learner.academicStatus.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <a 
                              href={`mailto:${learner.email}`}
                              className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                            {learner.phoneNumber && (
                              <a 
                                href={`tel:${learner.phoneNumber}`}
                                className="p-1 text-secondary-400 hover:text-green-600 transition-colors duration-200"
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/learners/${learner.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button 
                                  onClick={() => navigate(`/portal/learners/${learner.id}/edit`)}
                                  className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                  title="Edit Learner"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => deleteLearner(learner.id)}
                                  className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                  title="Delete Learner"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalItems === 0 && !loading && (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                      {searchTerm || statusFilter !== 'all' || programFilter !== 'all' || intakeFilter !== 'all'
                        ? 'No Core Program Students Found' 
                        : 'No Core Program Students Enrolled'
                      }
                    </h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all' || programFilter !== 'all' || intakeFilter !== 'all'
                        ? 'No core program students match your search criteria.' 
                        : isLearner ? 'No core program students to display.' : 'Start by adding your first core program student.'
                      }
                    </p>
                    {isAdmin && !searchTerm && statusFilter === 'all' && programFilter === 'all' && intakeFilter === 'all' && (
                    <button 
                      onClick={() => navigate('/portal/learners/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Student</span>
                    </button>
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} learners
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

          {activeTab === 'alumni' && (
            <div>
              {/* Alumni Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search alumni..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={intakeFilter}
                    onChange={(e) => setIntakeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Graduation Years</option>
                    {intakes.map((intake) => (
                      <option key={intake.id} value={intake.id}>
                        {intake.name || intake.intakeId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alumni Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Student ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Graduation</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLearners.map((alumnus) => (
                      <tr key={alumnus.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{alumnus.studentId}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{alumnus.firstName} {alumnus.lastName}</div>
                            <div className="text-sm text-secondary-500">{alumnus.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{getProgramName(alumnus.programId)}</td>
                        <td className="py-4 px-4 text-secondary-600">
                          {alumnus.intakeName || alumnus.intake || getIntakeName(alumnus.intakeId)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <a 
                              href={`mailto:${alumnus.email}`}
                              className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                            {alumnus.phoneNumber && (
                              <a 
                                href={`tel:${alumnus.phoneNumber}`}
                                className="p-1 text-secondary-400 hover:text-green-600 transition-colors duration-200"
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/learners/${alumnus.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalItems === 0 && !loading && (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Alumni Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || programFilter !== 'all' || intakeFilter !== 'all'
                        ? 'No alumni match your search criteria.' 
                        : 'No students have graduated yet.'
                      }
                    </p>
                  </div>
                )}

                {/* Pagination Controls for Alumni */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} alumni
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

              {/* Alumni Statistics */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-800">Total Alumni</h3>
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {learners.filter(l => l.academicStatus === 'completed').length}
                  </p>
                  <p className="text-sm text-blue-700 mt-2">Graduated students</p>
                </div>

                {!isLearner && (
                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">Programs Completed</h3>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {new Set(learners.filter(l => l.academicStatus === 'completed').map(l => l.programId)).size}
                  </p>
                  <p className="text-sm text-purple-700 mt-2">Different programs</p>
                </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attendees' && isAdmin && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-secondary-800">Short Program Attendees</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => openAttendeeModal()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Attendee</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredAttendees.length === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={openPDFPreview}
                    disabled={filteredAttendees.length === 0}
                    className="bg-accent-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Attendees Filters */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search attendees..."
                      value={attendeeFilters.searchTerm}
                      onChange={(e) => setAttendeeFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
                    />
                  </div>
                  <select
                    value={attendeeFilters.eventTitle}
                    onChange={(e) => setAttendeeFilters(prev => ({ ...prev, eventTitle: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Events</option>
                    {uniqueEventTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={attendeeFilters.attendanceStatus}
                    onChange={(e) => setAttendeeFilters(prev => ({ ...prev, attendanceStatus: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Attendance</option>
                    <option value="attended">Attended</option>
                    <option value="registered">Registered</option>
                    <option value="no_show">No Show</option>
                  </select>
                  <select
                    value={attendeeFilters.paymentStatus}
                    onChange={(e) => setAttendeeFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Payment Status</option>
                    <option value="completed">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="free">Free</option>
                    <option value="partially_paid">Partially Paid</option>
                  </select>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-secondary-600">
                    Showing {filteredAttendees.length} attendees
                  </div>
                  <button
                    onClick={clearAttendeeFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Attendees Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name & Email</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Event & Date</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Registration Date</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Attendance</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAttendees.map((attendee) => {
                      const event = events.find(e => e.id === attendee.eventId);
                      const eventDate = event?.dates[0] ? new Date(event.dates[0].date) : null;
                      
                      return (
                        <tr key={attendee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-secondary-800">{attendee.name}</div>
                              <div className="text-sm text-secondary-500">{attendee.email}</div>
                              <div className="text-sm text-secondary-500">{attendee.phone}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-secondary-800">{event?.title || 'Unknown Event'}</div>
                              {eventDate && (
                                <div className="text-sm text-secondary-500">
                                  {eventDate.toLocaleDateString()} • {event?.dates[0]?.location}
                                </div>
                              )}
                              {event?.price && event.price > 0 && (
                                <div className="text-xs text-secondary-400">
                                  {new Intl.NumberFormat('en-KE', {
                                    style: 'currency',
                                    currency: event.currency || 'KES',
                                    minimumFractionDigits: 0
                                  }).format(event.price)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-secondary-600">
                              {new Date(attendee.registrationDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-secondary-400">
                              {new Date(attendee.registrationDate).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              attendee.status === 'attended' ? 'bg-green-100 text-green-800' :
                              attendee.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendee.status === 'attended' ? 'Attended' :
                               attendee.status === 'registered' ? 'Registered' : 'No Show'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                attendee.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                attendee.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                attendee.paymentStatus === 'partially_paid' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {attendee.paymentStatus === 'completed' ? 'Paid' :
                                 attendee.paymentStatus === 'pending' ? 'Pending' :
                                 attendee.paymentStatus === 'partially_paid' ? 'Partial' : 'Free'}
                              </span>
                              {attendee.totalAmountDue && attendee.totalAmountDue > 0 && (
                                <div className="text-xs text-secondary-400 mt-1">
                                  Balance: KSh {((attendee.totalAmountDue || 0) - (attendee.totalAmountPaid || 0)).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => openAttendeeModal(attendee, attendee.eventId, 'view')}
                                className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                title="View Attendee"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button 
                                    onClick={() => openAttendeeModal(attendee, attendee.eventId, 'edit')}
                                    className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                    title="Edit Attendee"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  {attendee.status !== 'attended' && (
                                    <button 
                                      onClick={() => openCheckInModal(attendee)}
                                      className="p-1 text-secondary-400 hover:text-green-600 transition-colors duration-200"
                                      title="Check In Attendee"
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredAttendees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                      {attendeeFilters.searchTerm || attendeeFilters.eventTitle || attendeeFilters.attendanceStatus || attendeeFilters.paymentStatus
                        ? 'No Short Program Attendees Found'
                        : 'No Short Program Attendees Yet'
                      }
                    </h3>
                    <p className="text-secondary-600 mb-6">
                      {attendeeFilters.searchTerm || attendeeFilters.eventTitle || attendeeFilters.attendanceStatus || attendeeFilters.paymentStatus
                        ? 'No short program attendees match your filter criteria.'
                        : 'Short program attendees will appear here when people register for events.'
                      }
                    </p>
                    {isAdmin && !attendeeFilters.searchTerm && !attendeeFilters.eventTitle && (
                      <button
                        onClick={() => openAttendeeModal()}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Add Attendee</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination for Attendees */}
                {attendeeTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {attendeeStartIndex + 1}-{Math.min(attendeeEndIndex, filteredAttendees.length)} of {filteredAttendees.length} attendees
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
                        {Array.from({ length: Math.min(5, attendeeTotalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(attendeeTotalPages - 4, currentPage - 2)) + i;
                          if (pageNum > attendeeTotalPages) return null;
                          
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, attendeeTotalPages))}
                        disabled={currentPage === attendeeTotalPages}
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

          {activeTab === 'corporates' && (
            <div>
              {/* Corporates Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search corporate clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Corporate Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={intakeFilter}
                    onChange={(e) => setIntakeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Corporate Intakes</option>
                    {intakes.map((intake) => (
                      <option key={intake.id} value={intake.id}>
                        {intake.name || intake.intakeId}
                      </option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync to Contacts'}</span>
                  </button>
                  <button 
                    onClick={() => setShowBulkUpload(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Bulk Upload</span>
                  </button>
                  <button 
                    onClick={() => navigate('/portal/learners/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Corporate Client</span>
                  </button>
                </div>
                )}
              </div>

              {/* Corporate Clients Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Client ID & Enrollment</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Company & Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Program & Intake</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLearners.map((learner) => (
                      <tr key={learner.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{learner.studentId}</div>
                            {learner.enrollmentDate && (
                              <div className="text-sm text-secondary-500">
                                Enrolled: {new Date(learner.enrollmentDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{learner.firstName} {learner.lastName}</div>
                            <div className="text-sm text-secondary-500">{learner.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-600">{getProgramName(learner.programId)}</div>
                            <div className="text-sm text-secondary-500">
                              {learner.intakeName || learner.intake || getIntakeName(learner.intakeId)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(learner.academicStatus)}`}>
                            {learner.academicStatus.charAt(0).toUpperCase() + learner.academicStatus.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <a 
                              href={`mailto:${learner.email}`}
                              className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                            {learner.phoneNumber && (
                              <a 
                                href={`tel:${learner.phoneNumber}`}
                                className="p-1 text-secondary-400 hover:text-green-600 transition-colors duration-200"
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/learners/${learner.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button 
                                  onClick={() => navigate(`/portal/learners/${learner.id}/edit`)}
                                  className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                  title="Edit Corporate Client"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => deleteLearner(learner.id)}
                                  className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                  title="Delete Corporate Client"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalItems === 0 && !loading && (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                      {searchTerm || statusFilter !== 'all' || programFilter !== 'all' || intakeFilter !== 'all'
                        ? 'No Corporate Clients Found' 
                        : 'No Corporate Clients Enrolled'
                      }
                    </h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all' || programFilter !== 'all' || intakeFilter !== 'all'
                        ? 'No corporate clients match your search criteria.' 
                        : isLearner ? 'No corporate clients to display.' : 'Start by adding your first corporate client.'
                      }
                    </p>
                    {isAdmin && !searchTerm && statusFilter === 'all' && programFilter === 'all' && intakeFilter === 'all' && (
                    <button 
                      onClick={() => navigate('/portal/learners/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Corporate Client</span>
                    </button>
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-secondary-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} corporate clients
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

              {/* Corporate Clients Statistics */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-800">Total Corporate Clients</h3>
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {learners.filter(l => l.academicStatus === 'active').length}
                  </p>
                  <p className="text-sm text-blue-700 mt-2">Active corporate training clients</p>
                </div>

                {!isLearner && (
                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">Corporate Programs</h3>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {new Set(learners.filter(l => l.academicStatus === 'active').map(l => l.programId)).size}
                  </p>
                  <p className="text-sm text-purple-700 mt-2">Different corporate programs</p>
                </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendee Modal */}
      <AttendeeModal
        isOpen={attendeeModal.isOpen}
        onClose={closeAttendeeModal}
        attendee={attendeeModal.attendee}
        eventId={attendeeModal.eventId}
        onSave={handleAttendeeSaved}
        mode={attendeeModal.mode}
      />

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Attendees Report Preview</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleExportPDF}
                    disabled={exportLoading}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {exportLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    <span>{exportLoading ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={closePDFPreview}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <AttendeesPDF
                  ref={pdfRef}
                  attendees={filteredAttendees}
                  events={events}
                  filters={{
                    eventTitle: attendeeFilters.eventTitle,
                    paymentStatus: attendeeFilters.paymentStatus,
                    dateRange: attendeeFilters.dateRange.start && attendeeFilters.dateRange.end 
                      ? attendeeFilters.dateRange 
                      : undefined
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Bulk Upload Learners</h2>
                <button
                  onClick={closeBulkUploadModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {!uploadSuccess ? (
                <>
                  {/* Step 1: Download Template */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Step 1: Download CSV Template</h3>
                    <p className="text-blue-700 mb-3">
                      Download the CSV template with the required columns: firstName, lastName, email, phoneNumber
                    </p>
                    <button
                      onClick={downloadCSVTemplate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Template</span>
                    </button>
                  </div>

                  {/* Step 2: Upload File */}
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Step 2: Upload Your CSV File</h3>
                    <p className="text-green-700 mb-3">
                      Fill out the template with learner data and upload it here.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {uploadFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {uploadFile.name}
                      </p>
                    )}
                  </div>

                  {/* Errors */}
                  {uploadErrors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-800">Validation Errors</h3>
                      </div>
                      <ul className="text-red-700 space-y-1">
                        {uploadErrors.map((error, index) => (
                          <li key={index} className="text-sm">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview */}
                  {uploadPreview.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-secondary-800 mb-3">
                        Preview ({uploadPreview.length} learners)
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-secondary-600">First Name</th>
                              <th className="text-left py-3 px-4 font-medium text-secondary-600">Last Name</th>
                              <th className="text-left py-3 px-4 font-medium text-secondary-600">Email</th>
                              <th className="text-left py-3 px-4 font-medium text-secondary-600">Phone</th>
                              <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadPreview.slice(0, 10).map((learner, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 px-4">{learner.firstName}</td>
                                <td className="py-3 px-4">{learner.lastName}</td>
                                <td className="py-3 px-4">{learner.email}</td>
                                <td className="py-3 px-4">{learner.phoneNumber}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    {learner.academicStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {uploadPreview.length > 10 && (
                          <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                            ... and {uploadPreview.length - 10} more learners
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={closeBulkUploadModal}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={uploadPreview.length === 0 || uploadErrors.length > 0 || isUploading}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Upload {uploadPreview.length} Learners</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-100 p-4 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Upload Successful!</h3>
                  <p className="text-green-700 mb-6">
                    Your learners have been successfully uploaded to the system.
                  </p>
                  <button
                    onClick={closeBulkUploadModal}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-in Confirmation Modal */}
      {checkInModal.isOpen && checkInModal.attendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Check In Attendee</h2>
                <button
                  onClick={closeCheckInModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Attendee Information</h3>
                  <p className="text-blue-700"><strong>Name:</strong> {checkInModal.attendee.name}</p>
                  <p className="text-blue-700"><strong>Email:</strong> {checkInModal.attendee.email}</p>
                  <p className="text-blue-700"><strong>Phone:</strong> {checkInModal.attendee.phone}</p>
                  {checkInModal.event && (
                    <p className="text-blue-700"><strong>Event:</strong> {checkInModal.event.title}</p>
                  )}
                </div>

                {/* Payment Status Check */}
                {checkInModal.attendee.paymentStatus !== 'completed' && 
                 checkInModal.attendee.totalAmountDue && 
                 checkInModal.attendee.totalAmountDue > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">Payment Required</h3>
                    <p className="text-yellow-700">
                      <strong>Amount Due:</strong> KSh {checkInModal.attendee.totalAmountDue.toLocaleString()}
                    </p>
                    <p className="text-yellow-700">
                      <strong>Paid:</strong> KSh {(checkInModal.attendee.totalAmountPaid || 0).toLocaleString()}
                    </p>
                    <p className="text-yellow-700">
                      <strong>Balance:</strong> KSh {((checkInModal.attendee.totalAmountDue || 0) - (checkInModal.attendee.totalAmountPaid || 0)).toLocaleString()}
                    </p>
                  </div>
                )}

                <p className="text-gray-600 mb-4">
                  Are you sure you want to check in this attendee? This will mark them as attended.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={closeCheckInModal}
                  disabled={checkInModal.isProcessing}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                
                {/* Show payment option if payment is pending */}
                {checkInModal.attendee.paymentStatus !== 'completed' && 
                 checkInModal.attendee.totalAmountDue && 
                 checkInModal.attendee.totalAmountDue > 0 && (
                  <button
                    onClick={() => handleCheckIn(true)}
                    disabled={checkInModal.isProcessing}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {checkInModal.isProcessing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Banknote className="h-5 w-5" />
                    )}
                    <span>{checkInModal.isProcessing ? 'Processing...' : 'Check In & Mark Paid'}</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleCheckIn(false)}
                  disabled={checkInModal.isProcessing}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  {checkInModal.isProcessing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <UserCheck className="h-5 w-5" />
                  )}
                  <span>{checkInModal.isProcessing ? 'Processing...' : 'Check In Only'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Results Modal */}
      {showSyncModal && syncResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">
                  {syncResult.success ? '✅ Sync Complete' : '❌ Sync Failed'}
                </h2>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {syncResult.success && syncResult.summary ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Sync Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Total Learners:</span>
                        <span className="ml-2 font-medium">{syncResult.summary.totalLearners}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Contacts Added:</span>
                        <span className="ml-2 font-medium text-green-600">{syncResult.summary.contactsAdded}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Contacts Skipped:</span>
                        <span className="ml-2 font-medium text-yellow-600">{syncResult.summary.contactsSkipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Users Added:</span>
                        <span className="ml-2 font-medium text-green-600">{syncResult.summary.usersAdded}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Users Skipped:</span>
                        <span className="ml-2 font-medium text-yellow-600">{syncResult.summary.usersSkipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Errors:</span>
                        <span className="ml-2 font-medium text-red-600">{syncResult.summary.errors}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>📝 <strong>Note:</strong> Existing contacts and users with the same email were skipped to prevent duplicates.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
                  <p className="text-red-700">{syncResult.error}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Learners;