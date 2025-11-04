import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Mail, Phone, Tag, Calendar, CreditCard, Edit, Plus, Eye, FileText, Receipt, DollarSign, History, Building } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { EventFinanceService } from '../../../services/eventFinanceService';
import { useAuthContext } from '../../../contexts/AuthContext';
import AttendeeInvoice from './AttendeeInvoice';
import AttendeeReceipt from './AttendeeReceipt';
import CompanyInvoiceModal from '../../../components/CompanyInvoiceModal';
import PDFService from '../../../services/pdfService';
import WhatsAppButton from '../../../components/WhatsAppButton';

interface Event {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  registrationForm: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'checkbox' | 'multiple-choice' | 'email' | 'phone';
    required: boolean;
    options?: string[];
  }>;
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  confirmationCode?: string;
  transactionDate: string;
  notes?: string;
}

interface Attendee {
  id?: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'free' | 'partially_paid';
  totalAmountDue?: number;
  totalAmountPaid?: number;
  paymentRecords?: PaymentRecord[];
  // Legacy fields for backward compatibility
  paymentAmount?: number;
  paymentMethod?: string;
  mpesaCode?: string;
  customResponses: Record<string, any>;
}

interface AttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendee?: Attendee | null;
  eventId?: string;
  onSave: () => void;
  mode?: 'view' | 'edit' | 'create';
}

const AttendeeModal: React.FC<AttendeeModalProps> = ({
  isOpen,
  onClose,
  attendee,
  eventId,
  onSave,
  mode = 'edit'
}) => {
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCompanyInvoice, setShowCompanyInvoice] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<PaymentRecord | null>(null);
  
  // PDF refs
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    paymentMethod: '',
    confirmationCode: '',
    notes: ''
  });
  const [showAddPayment, setShowAddPayment] = useState(false);

  const [formData, setFormData] = useState<Attendee>({
    eventId: eventId || '',
    name: '',
    email: '',
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
    status: 'registered',
    paymentStatus: 'free',
    totalAmountDue: 0,
    totalAmountPaid: 0,
    paymentRecords: [],
    customResponses: {}
  });

  useEffect(() => {
    if (isOpen) {
      loadEvents();
      if (attendee) {
        // Handle legacy data migration
        const migratedAttendee = migrateAttendeeData(attendee);
        setFormData({
          ...migratedAttendee,
          registrationDate: migratedAttendee.registrationDate.split('T')[0]
        });
      } else {
        // Reset form for new attendee
        setFormData({
          eventId: eventId || '',
          name: '',
          email: '',
          phone: '',
          registrationDate: new Date().toISOString().split('T')[0],
          status: 'registered',
          paymentStatus: 'free',
          totalAmountDue: 0,
          totalAmountPaid: 0,
          paymentRecords: [],
          customResponses: {}
        });
      }
    }
  }, [isOpen, attendee, eventId]);

  useEffect(() => {
    if (formData.eventId) {
      const event = events.find(e => e.id === formData.eventId);
      setSelectedEvent(event || null);
      
      // Update totalAmountDue based on event price when event changes
      if (event?.price && formData.totalAmountDue === 0) {
        setFormData(prev => ({
          ...prev,
          totalAmountDue: event.price || 0
        }));
      }
    }
  }, [formData.eventId, events]);

  // Migrate legacy attendee data to new structure
  const migrateAttendeeData = (attendee: Attendee): Attendee => {
    const migrated = { ...attendee };
    
    // If we have legacy payment data but no payment records, create a record
    if (attendee.paymentAmount && attendee.paymentAmount > 0 && (!attendee.paymentRecords || attendee.paymentRecords.length === 0)) {
      migrated.paymentRecords = [{
        id: `legacy-${Date.now()}`,
        amount: attendee.paymentAmount,
        paymentMethod: attendee.paymentMethod || 'unknown',
        confirmationCode: attendee.mpesaCode || '',
        transactionDate: attendee.registrationDate,
        notes: 'Migrated from legacy data'
      }];
      migrated.totalAmountPaid = attendee.paymentAmount;
    }

    // Ensure payment records exist
    if (!migrated.paymentRecords) {
      migrated.paymentRecords = [];
    }

    // Calculate totals
    migrated.totalAmountPaid = migrated.paymentRecords.reduce((sum, record) => sum + record.amount, 0);
    
    return migrated;
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

  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const handleInputChange = (field: keyof Attendee, value: any) => {
    if (isViewMode) return;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomResponseChange = (questionId: string, value: any) => {
    if (isViewMode) return;
    setFormData(prev => ({
      ...prev,
      customResponses: {
        ...prev.customResponses,
        [questionId]: value
      }
    }));
  };

  const calculatePaymentStatus = (totalDue: number, totalPaid: number): Attendee['paymentStatus'] => {
    if (totalDue === 0) return 'free';
    if (totalPaid === 0) return 'pending';
    if (totalPaid >= totalDue) return 'completed';
    return 'partially_paid';
  };

  const addPaymentRecord = async () => {
    if (newPayment.amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!newPayment.paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const paymentRecord: PaymentRecord = {
        id: `payment-${Date.now()}`,
        amount: newPayment.amount,
        paymentMethod: newPayment.paymentMethod,
        confirmationCode: newPayment.confirmationCode,
        transactionDate: new Date().toISOString(),
        notes: newPayment.notes
      };

      const updatedRecords = [...(formData.paymentRecords || []), paymentRecord];
      const newTotalPaid = updatedRecords.reduce((sum, record) => sum + record.amount, 0);
      const newPaymentStatus = calculatePaymentStatus(formData.totalAmountDue || 0, newTotalPaid);

      const updatedFormData = {
        ...formData,
        paymentRecords: updatedRecords,
        totalAmountPaid: newTotalPaid,
        paymentStatus: newPaymentStatus
      };

      setFormData(updatedFormData);

      // If this is an existing attendee (has ID), integrate with Finance system
      if (attendee?.id && selectedEvent) {
        try {
          // Record payment in Finance system
          const financeResult = await EventFinanceService.recordEventPayment(
            attendee.id,
            paymentRecord,
            selectedEvent,
            userProfile?.displayName || 'Event Admin'
          );

          if (financeResult.success) {
            console.log('Payment integrated with Finance system. Transaction ID:', financeResult.transactionId);
            
            // Update the payment record with the transaction ID
            const updatedRecordsWithTxId = updatedRecords.map(record => 
              record.id === paymentRecord.id 
                ? { ...record, transactionId: financeResult.transactionId }
                : record
            );

            setFormData(prev => ({
              ...prev,
              paymentRecords: updatedRecordsWithTxId
            }));
          } else {
            console.warn('Failed to integrate with Finance system:', financeResult.error);
            // Payment is still recorded locally, just show a warning
            alert('Payment recorded successfully, but there was an issue with Finance integration. Please contact admin.');
          }
        } catch (financeError) {
          console.error('Error integrating with Finance system:', financeError);
          // Don't fail the whole operation, just log the error
        }
      }

      // Reset new payment form
      setNewPayment({
        amount: 0,
        paymentMethod: '',
        confirmationCode: '',
        notes: ''
      });
      setShowAddPayment(false);

      alert('Payment added successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const filename = `invoice-${formData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      await PDFService.generatePDF(invoiceRef.current, {
        filename,
        format: 'a4',
        margin: 20
      });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      const filename = `receipt-${formData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      await PDFService.generatePDF(receiptRef.current, {
        filename,
        format: 'a4',
        margin: 20
      });
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      alert('Failed to generate receipt PDF. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (isViewMode) return;
    
    if (!formData.name || !formData.email || !formData.phone || !formData.eventId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const attendeeData = {
        ...formData,
        registrationDate: new Date(formData.registrationDate).toISOString(),
        // Ensure payment status is calculated correctly
        paymentStatus: calculatePaymentStatus(formData.totalAmountDue || 0, formData.totalAmountPaid || 0)
      };

      let result;
      if (attendee?.id) {
        // Update existing attendee
        result = await FirestoreService.update('event_registrations', attendee.id, attendeeData);
      } else {
        // Create new attendee
        result = await FirestoreService.create('event_registrations', attendeeData);
      }

      if (result.success) {
        // If attendee has payments, integrate with Finance system
        if (selectedEvent && formData.paymentRecords && formData.paymentRecords.length > 0 && (formData.totalAmountPaid || 0) > 0) {
          try {
            const attendeeId = (result as any).id || attendee?.id;
            if (attendeeId) {
              const updatedAttendeeData = { ...attendeeData, id: attendeeId };
              const financeResult = await EventFinanceService.createCustomerFromAttendee(
                updatedAttendeeData,
                selectedEvent,
                userProfile?.displayName || 'Event Admin'
              );
              
              if (financeResult.success) {
                console.log('Attendee successfully integrated with Finance system as customer:', financeResult.customerId);
              } else {
                console.warn('Failed to integrate attendee with Finance system:', financeResult.error);
              }
            }
          } catch (financeError) {
            console.error('Error integrating attendee with Finance system:', financeError);
            // Don't fail the save operation, just log the error
          }
        }

        onSave();
        onClose();
      } else {
        alert('Failed to save attendee. Please try again.');
      }
    } catch (error) {
      console.error('Error saving attendee:', error);
      alert('Error saving attendee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Paid';
      case 'partially_paid': return 'Partially Paid';
      case 'pending': return 'Not Paid';
      case 'failed': return 'Payment Failed';
      case 'free': return 'Free Event';
      default: return status;
    }
  };

  const renderCustomFormField = (field: any) => {
    const value = formData.customResponses[field.id] || '';

    if (isViewMode) {
      // View mode - display read-only values
      return (
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-secondary-800">
            {field.type === 'checkbox' 
              ? (value ? 'Yes' : 'No')
              : (value || 'No response')}
          </span>
        </div>
      );
    }

    // Edit mode - render input fields
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter your answer"
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Enter your answer"
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter email address"
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter phone number"
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleCustomResponseChange(field.id, e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-600">Yes, I agree</span>
          </label>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-600">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const remainingBalance = (formData.totalAmountDue || 0) - (formData.totalAmountPaid || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800 flex items-center space-x-3">
              {isViewMode ? <Eye className="h-6 w-6 text-primary-600" /> : 
               attendee ? <Edit className="h-6 w-6 text-primary-600" /> : 
               <Plus className="h-6 w-6 text-primary-600" />}
              <span>
                {isViewMode ? 'View Attendee' : 
                 attendee ? 'Edit Attendee' : 'Add New Attendee'}
              </span>
            </h2>
            <div className="flex items-center space-x-3">
              {/* Invoice & Receipt buttons */}
              {(attendee || !isCreateMode) && (
                <>
                  <button
                    onClick={() => setShowInvoice(true)}
                    className="text-primary-600 hover:text-primary-800 p-2 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                    title="Generate Invoice"
                  >
                    <FileText className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowCompanyInvoice(true)}
                    className="text-secondary-600 hover:text-secondary-800 p-2 rounded-lg hover:bg-secondary-50 transition-colors duration-200"
                    title="Generate Company Invoice"
                  >
                    <Building className="h-5 w-5" />
                  </button>
                  {formData.paymentRecords && formData.paymentRecords.length > 0 && (
                    <button
                      onClick={() => setShowReceipt(true)}
                      className="text-accent-600 hover:text-accent-800 p-2 rounded-lg hover:bg-accent-50 transition-colors duration-200"
                      title="Generate Receipt"
                    >
                      <Receipt className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}
              {/* WhatsApp Contact Button */}
              {(attendee || !isCreateMode) && formData.phone && (
                <div className="mr-2">
                  <WhatsAppButton
                    customerId={attendee?.id}
                    customerPhone={formData.phone}
                    customerName={formData.name}
                    variant="icon"
                    size="md"
                  />
                </div>
              )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Basic Information */}
            <div className="xl:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold text-secondary-800">Basic Information</h3>
              
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Event *
                </label>
                {isViewMode ? (
                  <div className="bg-gray-50 p-3 rounded-lg text-secondary-800">
                    {selectedEvent?.title || 'Unknown Event'}
                  </div>
                ) : (
                <select
                  value={formData.eventId}
                  onChange={(e) => handleInputChange('eventId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={!!eventId} // Disable if eventId is provided (editing from specific event)
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
                )}
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name *
                  </label>
                  {isViewMode ? (
                    <div className="bg-gray-50 p-3 rounded-lg text-secondary-800">
                      {formData.name}
                    </div>
                  ) : (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter full name"
                  />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Registration Date *
                  </label>
                  {isViewMode ? (
                    <div className="bg-gray-50 p-3 rounded-lg text-secondary-800">
                      {new Date(formData.registrationDate).toLocaleDateString()}
                    </div>
                  ) : (
                  <input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => handleInputChange('registrationDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address *
                  </label>
                  {isViewMode ? (
                    <div className="bg-gray-50 p-3 rounded-lg text-secondary-800">
                      {formData.email}
                    </div>
                  ) : (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter email address"
                  />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number *
                  </label>
                  {isViewMode ? (
                    <div className="bg-gray-50 p-3 rounded-lg text-secondary-800">
                      {formData.phone}
                    </div>
                  ) : (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                  />
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Attendance Status
                </label>
                {isViewMode ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.status === 'attended' ? 'bg-green-100 text-green-800' :
                      formData.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formData.status === 'attended' ? 'Attended' :
                       formData.status === 'registered' ? 'Registered' : 'No Show'}
                    </span>
                  </div>
                ) : (
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="registered">Registered</option>
                  <option value="attended">Attended</option>
                  <option value="no_show">No Show</option>
                </select>
                )}
              </div>

              {/* Custom Form Responses */}
              {selectedEvent?.registrationForm && selectedEvent.registrationForm.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-6">Custom Form Responses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedEvent.registrationForm.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          {field.question} {field.required && '*'}
                        </label>
                        {renderCustomFormField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Payment Information */}
            <div className="space-y-6">
              <div className="bg-primary-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
                  Payment Summary
                </h3>
              
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Total Due:</span>
                    <span className="font-medium text-secondary-800">
                      {selectedEvent?.currency || 'KES'} {(formData.totalAmountDue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Total Paid:</span>
                    <span className="font-medium text-accent-600">
                      {selectedEvent?.currency || 'KES'} {(formData.totalAmountPaid || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-primary-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Balance:</span>
                      <span className={`font-bold ${remainingBalance <= 0 ? 'text-accent-600' : 'text-red-600'}`}>
                        {selectedEvent?.currency || 'KES'} {Math.max(0, remainingBalance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(formData.paymentStatus || 'pending')}`}>
                      {getPaymentStatusText(formData.paymentStatus || 'pending')}
                    </span>
                  </div>
                </div>

                {/* Event pricing controls (only in edit mode) */}
                {!isViewMode && (
                  <div className="mt-4 pt-4 border-t border-primary-200">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Total Amount Due
                  </label>
                  <input
                    type="number"
                      value={formData.totalAmountDue || 0}
                      onChange={(e) => handleInputChange('totalAmountDue', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                )}
              </div>

              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary-800 flex items-center">
                    <History className="h-5 w-5 mr-2 text-primary-600" />
                    Payment History
                  </h3>
                  {!isViewMode && (
                    <button
                      onClick={() => setShowAddPayment(true)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      + Add Payment
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.paymentRecords && formData.paymentRecords.length > 0 ? (
                    formData.paymentRecords.map((record) => (
                      <div key={record.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-secondary-800">
                            {selectedEvent?.currency || 'KES'} {record.amount.toLocaleString()}
                          </span>
                          <span className="text-sm text-secondary-600">
                            {new Date(record.transactionDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-secondary-600">
                          <div>Method: {record.paymentMethod}</div>
                          {record.confirmationCode && (
                            <div>Code: {record.confirmationCode}</div>
                          )}
                          {record.notes && (
                            <div>Notes: {record.notes}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-secondary-500">
                      No payment records found
                    </div>
                  )}
                </div>

                {/* Add Payment Form */}
                {showAddPayment && !isViewMode && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-secondary-800 mb-3">Add New Payment</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                  <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Payment Method
                    </label>
                    <select
                          value={newPayment.paymentMethod}
                          onChange={(e) => setNewPayment(prev => ({...prev, paymentMethod: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select method</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Confirmation Code (Optional)
                    </label>
                    <input
                      type="text"
                          value={newPayment.confirmationCode}
                          onChange={(e) => setNewPayment(prev => ({...prev, confirmationCode: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter confirmation code"
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment(prev => ({...prev, notes: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          rows={2}
                          placeholder="Additional notes"
                        />
                </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={addPaymentRecord}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
                        >
                          Add Payment
                        </button>
                        <button
                          onClick={() => setShowAddPayment(false)}
                          className="text-secondary-600 hover:text-secondary-800 text-sm font-medium"
                        >
                          Cancel
                        </button>
            </div>
          </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>{loading ? 'Saving...' : 'Save Attendee'}</span>
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Invoice Preview</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleDownloadInvoice}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <AttendeeInvoice
                  ref={invoiceRef}
                  attendeeData={formData}
                  eventData={selectedEvent || undefined}
                  onDownload={handleDownloadInvoice}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Receipt Preview</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleDownloadReceipt}
                    className="bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Receipt className="h-5 w-5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <AttendeeReceipt
                  ref={receiptRef}
                  attendeeData={formData}
                  eventData={selectedEvent || undefined}
                  selectedPaymentRecord={selectedPaymentRecord}
                  onDownload={handleDownloadReceipt}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Invoice Modal */}
      {showCompanyInvoice && selectedEvent && (
        <CompanyInvoiceModal
          isOpen={showCompanyInvoice}
          onClose={() => setShowCompanyInvoice(false)}
          eventData={selectedEvent}
          attendeeData={{
            id: formData.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            eventId: formData.eventId,
            registrationDate: formData.registrationDate,
            totalAmountDue: formData.totalAmountDue || 0,
            totalAmountPaid: formData.totalAmountPaid || 0,
            paymentRecords: formData.paymentRecords || [],
            customResponses: formData.customResponses
          }}
        />
      )}
    </div>
  );
};

export default AttendeeModal; 