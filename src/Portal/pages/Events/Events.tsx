import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, Plus, MapPin, Clock, Users, Edit, Trash2, Eye, Download, UserPlus, X, FileText } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import AttendeeModal from './AttendeeModal';
import AttendeesPDF from './AttendeesPDF';
import PDFService from '../../../services/pdfService';

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
  // Compulsory fields
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'free' | 'partially_paid';
  // Payment information
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
  // Legacy payment fields
  paymentAmount?: number;
  paymentMethod?: string;
  mpesaCode?: string;
  // Custom form responses
  customResponses: Record<string, any>; // Key-value pairs for custom form answers
}

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('events');
  
  // Role-based access control
  const isAdmin = userProfile?.role === 'admin';
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Attendee Modal State
  const [attendeeModal, setAttendeeModal] = useState({
    isOpen: false,
    attendee: null as Attendee | null,
    eventId: undefined as string | undefined,
    mode: 'edit' as 'view' | 'edit' | 'create'
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const stats = [
    { title: 'Total Programs', value: events.length.toString(), change: '+6', icon: Calendar, color: 'primary' },
    { title: 'This Month', value: events.filter(e => 
      e.dates.length > 0 && new Date(e.dates[0].date).getMonth() === new Date().getMonth()
    ).length.toString(), change: '+3', icon: Clock, color: 'accent' },
    { title: 'Total Attendees', value: attendees.length.toString(), change: '+234', icon: Users, color: 'secondary' },
  ];

  useEffect(() => {
    loadEvents();
    loadAttendees();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [attendeeFilters.searchTerm, attendeeFilters.eventTitle, attendeeFilters.paymentStatus, attendeeFilters.attendanceStatus, attendeeFilters.dateRange.start, attendeeFilters.dateRange.end]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('events');
      if (result.success && result.data) {
        setEvents(result.data as Event[]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
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

  const deleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const result = await FirestoreService.delete('events', eventId);
        if (result.success) {
          loadEvents(); // Reload events
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const searchableLocation = event.dates.length > 0 ? event.dates[0].location : '';
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchableLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by event date (nearest/approaching events first)
    const getEventDate = (event: Event) => {
      if (event.dates.length === 0) return new Date('9999-12-31'); // Put events without dates at the end
      return new Date(event.dates[0].date);
    };
    
    const dateA = getEventDate(a);
    const dateB = getEventDate(b);
    
    return dateA.getTime() - dateB.getTime();
  });

  const getEventAttendees = (eventId: string) => {
    return attendees.filter(attendee => attendee.eventId === eventId);
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

  // Filter Functions
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredAttendees.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAttendees = filteredAttendees.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
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

  // CSV Export Functions
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

        // Add custom form responses
        if (attendee.customResponses) {
          Object.entries(attendee.customResponses).forEach(([questionId, response]) => {
            const field = event?.registrationForm?.find(f => f.id === questionId);
            const questionText = field?.question || questionId;
            
            // Handle different response types
            let formattedResponse = '';
            if (field?.type === 'checkbox') {
              formattedResponse = response ? 'Yes' : 'No';
            } else if (Array.isArray(response)) {
              formattedResponse = response.join('; ');
            } else {
              formattedResponse = response?.toString() || '';
            }
            
            baseData[`Custom: ${questionText}`] = formattedResponse;
          });
        }

        // Add payment records details
        if (attendee.paymentRecords && attendee.paymentRecords.length > 0) {
          attendee.paymentRecords.forEach((record: any, index: number) => {
            const prefix = `Payment ${index + 1}`;
            baseData[`${prefix} Amount`] = record.amount;
            baseData[`${prefix} Method`] = record.paymentMethod;
            baseData[`${prefix} Date`] = new Date(record.transactionDate).toLocaleDateString();
            baseData[`${prefix} Confirmation Code`] = record.confirmationCode || '';
            baseData[`${prefix} Notes`] = record.notes || '';
            baseData[`${prefix} Transaction ID`] = (record as any).transactionId || '';
          });
        }

        // Add legacy payment information if exists
        if (attendee.paymentAmount) {
          baseData['Legacy Payment Amount'] = attendee.paymentAmount;
          baseData['Legacy Payment Method'] = attendee.paymentMethod || '';
          baseData['Legacy M-Pesa Code'] = attendee.mpesaCode || '';
        }

        return baseData;
      });

      // Get all unique headers from all records
      const allHeaders = new Set<string>();
      csvData.forEach(record => {
        Object.keys(record).forEach(key => allHeaders.add(key));
      });

      // Sort headers for consistent order
      const sortedHeaders = Array.from(allHeaders).sort((a, b) => {
        // Put basic info first, then custom fields, then payment records
        if (a.startsWith('Custom:')) return 1;
        if (b.startsWith('Custom:')) return -1;
        if (a.startsWith('Payment ')) return 1;
        if (b.startsWith('Payment ')) return -1;
        if (a.startsWith('Legacy ')) return 1;
        if (b.startsWith('Legacy ')) return -1;
        return a.localeCompare(b);
      });

      // Convert to CSV string
      const csvContent = [
        sortedHeaders.join(','),
        ...csvData.map(row => sortedHeaders.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escapedValue = value.toString().replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendees-complete-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please try again.');
    }
  };

  // PDF Export Functions
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

  // Get unique event titles for filter dropdown
  const uniqueEventTitles = Array.from(
    new Set(events.map(event => event.title))
  ).sort();

  const tabs = [
    { id: 'events', label: 'All Programs' },
    ...(isAdmin ? [{ id: 'attendees', label: 'Attendees' }] : []),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-accent-100 text-accent-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
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
            <h1 className="text-4xl font-bold mb-2">Programs</h1>
            <p className="text-lg text-primary-100">
              Plan, organize, and manage institutional programs and activities.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} this month
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
          {activeTab === 'events' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search programs..."
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
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/portal/events/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Program</span>
                  </button>
                )}
              </div>

              {/* Events Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => navigate(`/portal/events/${event.id}`)}
                          className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/portal/events/${event.id}/edit`)}
                          className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                          title="Edit Event"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteEvent(event.id)}
                          className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">{event.title}</h3>
                    <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Calendar className="h-4 w-4 text-primary-600" />
                        <span>{event.dates.length > 0 ? new Date(event.dates[0].date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Clock className="h-4 w-4 text-primary-600" />
                        <span>{event.dates.length > 0 ? `${event.dates[0].startTime} - ${event.dates[0].endTime}` : 'TBD'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <MapPin className="h-4 w-4 text-primary-600" />
                        <span>{event.dates.length > 0 ? event.dates[0].location : 'TBD'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Users className="h-4 w-4 text-primary-600" />
                        <span>Event Registration Open</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-gray-100 text-secondary-800 rounded-full text-xs font-medium">
                        {event.targetAudience.length > 0 ? event.targetAudience[0] : 'All Levels'}
                      </span>
                      {event.isPublic && (
                        <span className="px-2 py-1 bg-accent-100 text-accent-800 rounded text-xs font-medium">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Programs Found</h3>
                  <p className="text-secondary-600 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No programs match your search criteria.' 
                      : 'Start by creating your first program.'
                    }
                  </p>
                  {isAdmin && (
                    <button 
                      onClick={() => navigate('/portal/events/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Program</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendees' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Program Attendees</h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-secondary-600">
                    Showing: {filteredAttendees.length} of {attendees.length} attendees
                  </div>
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

              {/* Enhanced Filters */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary-800">Filters</h3>
                  <button
                    onClick={clearAttendeeFilters}
                    className="text-secondary-500 hover:text-secondary-700 text-sm flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear All</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                      <input
                        type="text"
                        placeholder="Name, email, phone..."
                        value={attendeeFilters.searchTerm}
                        onChange={(e) => setAttendeeFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
                      />
                    </div>
                  </div>

                  {/* Event Title */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Program</label>
                    <select
                      value={attendeeFilters.eventTitle}
                      onChange={(e) => setAttendeeFilters(prev => ({ ...prev, eventTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Programs</option>
                      {uniqueEventTitles.map((title) => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Payment Status</label>
                    <select
                      value={attendeeFilters.paymentStatus}
                      onChange={(e) => setAttendeeFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Payment Status</option>
                      <option value="completed">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="free">Free</option>
                    </select>
                  </div>

                  {/* Attendance Status */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Attendance</label>
                    <select
                      value={attendeeFilters.attendanceStatus}
                      onChange={(e) => setAttendeeFilters(prev => ({ ...prev, attendanceStatus: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Status</option>
                      <option value="registered">Registered</option>
                      <option value="attended">Attended</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Registration Date</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={attendeeFilters.dateRange.start}
                        onChange={(e) => setAttendeeFilters(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Start date"
                      />
                      <input
                        type="date"
                        value={attendeeFilters.dateRange.end}
                        onChange={(e) => setAttendeeFilters(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendees List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Program
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedAttendees.map((attendee) => {
                        const event = events.find(e => e.id === attendee.eventId);
                        return (
                          <tr key={attendee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                                <div className="text-sm text-gray-500">{attendee.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {attendee.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{event?.title || 'Unknown Program'}</div>
                              <div className="text-sm text-gray-500">{event?.dates[0]?.date ? new Date(event.dates[0].date).toLocaleDateString() : ''}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attendee.registrationDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                attendee.status === 'attended' ? 'bg-green-100 text-green-800' :
                                attendee.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {attendee.status === 'attended' ? 'Attended' :
                                 attendee.status === 'registered' ? 'Registered' : 'No Show'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                attendee.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                attendee.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                                attendee.paymentStatus === 'pending' ? 'bg-red-100 text-red-800' :
                                attendee.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {attendee.paymentStatus === 'completed' ? 'Paid' :
                                 attendee.paymentStatus === 'partially_paid' ? 'Partially Paid' :
                                 attendee.paymentStatus === 'pending' ? 'Not Paid' :
                                 attendee.paymentStatus === 'failed' ? 'Payment Failed' : 'Free'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => openAttendeeModal(attendee, undefined, 'view')}
                                  className="text-accent-600 hover:text-accent-800 p-1 rounded-lg hover:bg-accent-50 transition-colors duration-200"
                                  title="View Attendee Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openAttendeeModal(attendee, undefined, 'edit')}
                                  className="text-primary-600 hover:text-primary-800 p-1 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                                  title="Edit Attendee"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredAttendees.length > 0 && (
                  <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredAttendees.length)} of {filteredAttendees.length} results
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {filteredAttendees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                      {attendees.length === 0 ? 'No Attendees Yet' : 'No Attendees Match Filters'}
                    </h3>
                    <p className="text-secondary-600">
                      {attendees.length === 0 
                        ? 'Attendees will appear here when people register for programs.'
                        : 'Try adjusting your filters to see more results.'
                      }
                    </p>
                    {attendees.length === 0 && (
                      <button
                        onClick={() => openAttendeeModal()}
                        className="mt-4 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Add First Attendee</span>
                      </button>
                    )}
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
    </div>
  );
};

export default Events;