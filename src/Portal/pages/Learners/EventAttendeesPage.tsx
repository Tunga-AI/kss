import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Filter, Plus, Edit, Trash2, Mail, Phone, Eye, UserPlus, X, FileText, Download, Calendar } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import AttendeeModal from '../Events/AttendeeModal';
import AttendeesPDF from '../Events/AttendeesPDF';
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

const EventAttendeesPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Attendee Modal State
  const [attendeeModal, setAttendeeModal] = useState({
    isOpen: false,
    attendee: null as Attendee | null,
    eventId: undefined as string | undefined,
    mode: 'edit' as 'view' | 'edit' | 'create'
  });

  // PDF Export State
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadEventAttendees();
    }
  }, [eventId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentStatusFilter, attendanceStatusFilter, dateRange.start, dateRange.end]);

  const loadEvent = async () => {
    try {
      const result = await FirestoreService.getById('events', eventId!);
      if (result.success && result.data) {
        setEvent(result.data as Event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const loadEventAttendees = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('event_registrations', [
        { field: 'eventId', operator: '==', value: eventId! }
      ]);
      if (result.success && result.data) {
        const attendeesData = result.data as Attendee[];
        // Sort by registration date in descending order (most recent first)
        attendeesData.sort((a, b) => {
          const dateA = new Date(a.registrationDate);
          const dateB = new Date(b.registrationDate);
          return dateB.getTime() - dateA.getTime();
        });
        setAttendees(attendeesData);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendees = attendees.filter(attendee => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        attendee.name.toLowerCase().includes(searchLower) ||
        attendee.email.toLowerCase().includes(searchLower) ||
        attendee.phone.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all' && attendee.paymentStatus !== paymentStatusFilter) {
      return false;
    }

    // Attendance status filter
    if (attendanceStatusFilter !== 'all' && attendee.status !== attendanceStatusFilter) {
      return false;
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const registrationDate = new Date(attendee.registrationDate);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      if (registrationDate < startDate || registrationDate > endDate) {
        return false;
      }
    }

    return true;
  });

  // Pagination calculations
  const totalItems = filteredAttendees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendees = filteredAttendees.slice(startIndex, endIndex);

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
    loadEventAttendees();
    closeAttendeeModal();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('all');
    setAttendanceStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  // Export Functions
  const handleExportCSV = () => {
    try {
      const csvData = filteredAttendees.map(attendee => ({
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
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => {
          const value = row[header] || '';
          const escapedValue = value.toString().replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${event?.title || 'event'}-attendees-${new Date().toISOString().split('T')[0]}.csv`);
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
      const filename = `${event?.title || 'event'}-attendees-${new Date().toISOString().split('T')[0]}.pdf`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/learners')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {event?.title || 'Event'} Attendees
              </h1>
              <p className="text-gray-600 mt-1">
                {totalItems} attendee{totalItems !== 1 ? 's' : ''} registered
              </p>
            </div>
          </div>
          <div className="bg-accent-100 p-4 rounded-xl">
            <Calendar className="h-8 w-8 text-accent-600" />
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Attendees List</h2>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <>
                <button
                  onClick={() => openAttendeeModal(undefined, eventId)}
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
              </>
            )}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
                />
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Payment Status</option>
                <option value="completed">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="free">Free</option>
              </select>
            </div>

            {/* Attendance Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attendance</label>
              <select
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="registered">Registered</option>
                <option value="attended">Attended</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
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
                {paginatedAttendees.map((attendee) => (
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
                        {isAdmin && (
                          <button
                            onClick={() => openAttendeeModal(attendee, undefined, 'edit')}
                            className="text-primary-600 hover:text-primary-800 p-1 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                            title="Edit Attendee"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalItems === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {attendees.length === 0 ? 'No Attendees Yet' : 'No Attendees Match Filters'}
              </h3>
              <p className="text-gray-600">
                {attendees.length === 0 
                  ? 'Attendees will appear here when people register for this short program.'
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
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
                <h2 className="text-2xl font-bold text-gray-800">Attendees Report Preview</h2>
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
                  events={event ? [event] : []}
                  filters={{
                    eventTitle: event?.title,
                    paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
                    dateRange: dateRange.start && dateRange.end ? dateRange : undefined
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

export default EventAttendeesPage;