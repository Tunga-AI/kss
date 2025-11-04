import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Mail, Phone, Calendar, CreditCard, FileText, Receipt, DollarSign, CheckCircle, Building } from 'lucide-react';
import { FirestoreService } from '../services/firestore';
import { EventFinanceService } from '../services/eventFinanceService';
import AttendeeInvoice from '../Portal/pages/Events/AttendeeInvoice';
import AttendeeReceipt from '../Portal/pages/Events/AttendeeReceipt';
import CompanyInvoiceModal from './CompanyInvoiceModal';
import PDFService from '../services/pdfService';

interface Event {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  dates?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  description?: string;
  registrationForm: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'checkbox' | 'multiple-choice' | 'email' | 'phone';
    required: boolean;
    options?: string[];
  }>;
}

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onRegistrationComplete: (attendeeId: string) => void;
}

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  customResponses: Record<string, any>;
  paymentMethod: string;
  paymentAmount: number;
  confirmationCode: string;
  paymentNotes: string;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  isOpen,
  onClose,
  event,
  onRegistrationComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
    customResponses: {},
    paymentMethod: '',
    paymentAmount: event.price || 0,
    confirmationCode: '',
    paymentNotes: ''
  });
  
  const [completedRegistration, setCompletedRegistration] = useState<{
    attendeeId: string;
    transactionId?: string;
  } | null>(null);

  const [showReceipt, setShowReceipt] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCompanyInvoice, setShowCompanyInvoice] = useState(false);
  
  // PDF refs
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setRegistrationData({
        name: '',
        email: '',
        phone: '',
        customResponses: {},
        paymentMethod: '',
        paymentAmount: event.price || 0,
        confirmationCode: '',
        paymentNotes: ''
      });
      setCompletedRegistration(null);
      setShowReceipt(false);
      setShowInvoice(false);
      setShowCompanyInvoice(false);
    }
  }, [isOpen, event]);

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomResponseChange = (questionId: string, value: any) => {
    setRegistrationData(prev => ({
      ...prev,
      customResponses: {
        ...prev.customResponses,
        [questionId]: value
      }
    }));
  };

  const validateStep1 = () => {
    if (!registrationData.name || !registrationData.email || !registrationData.phone) {
      alert('Please fill in all required personal information');
      return false;
    }

    // Validate custom form responses
    for (const field of event.registrationForm) {
      if (field.required && !registrationData.customResponses[field.id]) {
        alert(`Please answer the required question: ${field.question}`);
        return false;
      }
    }

    return true;
  };

  const validateStep2 = () => {
    if (event.price && event.price > 0) {
      if (!registrationData.paymentMethod) {
        alert('Please select a payment method');
        return false;
      }
      if (registrationData.paymentAmount <= 0) {
        alert('Please enter a valid payment amount');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      if (event.price && event.price > 0) {
        setCurrentStep(2);
      } else {
        // Free event, skip payment and complete registration
        handleCompleteRegistration();
      }
    } else if (currentStep === 2 && validateStep2()) {
      handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      // Create attendee record
      const attendeeData = {
        eventId: event.id,
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        registrationDate: new Date().toISOString(),
        status: 'registered' as const,
        totalAmountDue: event.price || 0,
        totalAmountPaid: registrationData.paymentAmount,
        paymentStatus: (event.price || 0) === 0 ? 'free' as const : 
                      registrationData.paymentAmount >= (event.price || 0) ? 'completed' as const : 'partially_paid' as const,
        customResponses: registrationData.customResponses,
        paymentRecords: registrationData.paymentAmount > 0 ? [{
          id: `payment-${Date.now()}`,
          amount: registrationData.paymentAmount,
          paymentMethod: registrationData.paymentMethod,
          confirmationCode: registrationData.confirmationCode,
          transactionDate: new Date().toISOString(),
          notes: registrationData.paymentNotes
        }] : []
      };

      // Save attendee to database
      const result = await FirestoreService.create('event_registrations', attendeeData);
      
      if (result.success) {
        const attendeeId = (result as any).id;
        let transactionId = undefined;

        // If payment was made, integrate with Finance system
        if (registrationData.paymentAmount > 0) {
          try {
            const updatedAttendeeData = { ...attendeeData, id: attendeeId };
            const financeResult = await EventFinanceService.createCustomerFromAttendee(
              updatedAttendeeData,
              event,
              'Event Registration System'
            );
            
            if (financeResult.success) {
              console.log('Registration integrated with Finance system as customer:', financeResult.customerId);
              
              // Get transaction ID from the payment record
              const attendeeResult = await FirestoreService.getById('event_registrations', attendeeId);
              if (attendeeResult.success && attendeeResult.data) {
                const attendee = attendeeResult.data as any;
                if (attendee.paymentRecords && attendee.paymentRecords.length > 0) {
                  transactionId = attendee.paymentRecords[0].transactionId;
                }
              }
            }
          } catch (financeError) {
            console.error('Error integrating with Finance system:', financeError);
            // Don't fail registration for Finance integration issues
          }
        }

        setCompletedRegistration({ attendeeId, transactionId });
        setCurrentStep(3);
        onRegistrationComplete(attendeeId);
      } else {
        alert('Failed to complete registration. Please try again.');
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current || !completedRegistration) return;
    
    try {
      const filename = `invoice-${registrationData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
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
    if (!receiptRef.current || !completedRegistration) return;
    
    try {
      const filename = `receipt-${registrationData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const renderCustomFormField = (field: any) => {
    const value = registrationData.customResponses[field.id] || '';

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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-800">Event Registration</h2>
                <p className="text-secondary-600 mt-1">{event.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">1</span>
                </div>
                <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">3</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-800">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={registrationData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={registrationData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={registrationData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Custom Form Fields */}
                {event.registrationForm && event.registrationForm.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-6">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {event.registrationForm.map((field) => (
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
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-800">Payment Information</h3>
                
                <div className="bg-primary-50 p-6 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-secondary-800">Event Fee</h4>
                      <p className="text-secondary-600">{event.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {event.currency || 'KES'} {(event.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={registrationData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select payment method</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      value={registrationData.paymentAmount}
                      onChange={(e) => handleInputChange('paymentAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Bank Details:</p>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Bank Name:</strong> I&M BANK LIMITED</p>
                    <p><strong>Account Name:</strong> YUSUDI LIMITED-KENYA SCHOOL OF SALES ACCOUNT</p>
                    <p><strong>Account Number:</strong> 04001938296251</p>
                    <p><strong>Swift Code:</strong> IMBLKENAXXX</p>
                    <p><strong>Account Branch:</strong> DUNGA BRANCH</p>
                    <p><strong>Pay Bill Number:</strong> 542542</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Transaction Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={registrationData.confirmationCode}
                    onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter transaction code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    value={registrationData.paymentNotes}
                    onChange={(e) => handleInputChange('paymentNotes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Additional payment notes"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && completedRegistration && (
              <div className="text-center space-y-6">
                <div className="bg-accent-100 border border-accent-300 p-6 rounded-lg">
                  <CheckCircle className="h-16 w-16 text-accent-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-accent-800 mb-2">Registration Complete!</h3>
                  <p className="text-accent-600">
                    Thank you for registering for {event.title}. Your registration has been confirmed.
                  </p>
                  {completedRegistration.transactionId && (
                    <p className="text-sm text-accent-600 mt-2">
                      Transaction ID: <span className="font-mono bg-white px-2 py-1 rounded">{completedRegistration.transactionId}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setShowInvoice(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <FileText className="h-5 w-5" />
                    <span>View Invoice</span>
                  </button>
                  <button
                    onClick={() => setShowCompanyInvoice(true)}
                    className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Building className="h-5 w-5" />
                    <span>Company Invoice</span>
                  </button>
                  {registrationData.paymentAmount > 0 && (
                    <button
                      onClick={() => setShowReceipt(true)}
                      className="bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Receipt className="h-5 w-5" />
                      <span>View Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              {currentStep < 3 && (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={loading}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    <span>
                      {loading ? 'Processing...' : 
                       currentStep === 1 && (event.price || 0) === 0 ? 'Complete Registration' :
                       currentStep === 1 ? 'Next: Payment' : 'Complete Registration'}
                    </span>
                  </button>
                </>
              )}
              {currentStep === 3 && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && completedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Invoice</h2>
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
                  attendeeData={{
                    name: registrationData.name,
                    email: registrationData.email,
                    phone: registrationData.phone,
                    eventId: event.id,
                    registrationDate: new Date().toISOString(),
                    totalAmountDue: event.price || 0,
                    totalAmountPaid: registrationData.paymentAmount,
                    paymentRecords: registrationData.paymentAmount > 0 ? [{
                      id: `payment-${Date.now()}`,
                      amount: registrationData.paymentAmount,
                      paymentMethod: registrationData.paymentMethod,
                      confirmationCode: registrationData.confirmationCode,
                      transactionDate: new Date().toISOString(),
                      notes: registrationData.paymentNotes
                    }] : []
                  }}
                  eventData={event}
                  onDownload={handleDownloadInvoice}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Invoice Modal */}
      {showCompanyInvoice && completedRegistration && (
        <CompanyInvoiceModal
          isOpen={showCompanyInvoice}
          onClose={() => setShowCompanyInvoice(false)}
          eventData={event}
          attendeeData={{
            name: registrationData.name,
            email: registrationData.email,
            phone: registrationData.phone,
            eventId: event.id,
            registrationDate: new Date().toISOString(),
            totalAmountDue: event.price || 0,
            totalAmountPaid: registrationData.paymentAmount,
            paymentRecords: registrationData.paymentAmount > 0 ? [{
              id: `payment-${Date.now()}`,
              amount: registrationData.paymentAmount,
              paymentMethod: registrationData.paymentMethod,
              confirmationCode: registrationData.confirmationCode,
              transactionDate: new Date().toISOString(),
              notes: registrationData.paymentNotes
            }] : []
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && completedRegistration && registrationData.paymentAmount > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Payment Receipt</h2>
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
                  attendeeData={{
                    name: registrationData.name,
                    email: registrationData.email,
                    phone: registrationData.phone,
                    eventId: event.id,
                    registrationDate: new Date().toISOString(),
                    totalAmountDue: event.price || 0,
                    totalAmountPaid: registrationData.paymentAmount,
                    paymentRecords: [{
                      id: `payment-${Date.now()}`,
                      amount: registrationData.paymentAmount,
                      paymentMethod: registrationData.paymentMethod,
                      confirmationCode: registrationData.confirmationCode,
                      transactionDate: new Date().toISOString(),
                      notes: registrationData.paymentNotes
                    }]
                  }}
                  eventData={event}
                  selectedPaymentRecord={{
                    id: `payment-${Date.now()}`,
                    amount: registrationData.paymentAmount,
                    paymentMethod: registrationData.paymentMethod,
                    confirmationCode: registrationData.confirmationCode,
                    transactionDate: new Date().toISOString(),
                    notes: registrationData.paymentNotes
                  }}
                  onDownload={handleDownloadReceipt}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventRegistrationModal; 