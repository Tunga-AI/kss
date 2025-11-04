import React, { useState, useRef } from 'react';
import { X, FileText, Download, Building, Mail, Phone, Hash, User } from 'lucide-react';
import AttendeeInvoice from '../Portal/pages/Events/AttendeeInvoice';
import PDFService from '../services/pdfService';

interface CompanyInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendeeData: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    eventId: string;
    registrationDate: string;
    totalAmountDue?: number;
    totalAmountPaid?: number;
    paymentRecords?: Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      confirmationCode?: string;
      transactionDate: string;
      notes?: string;
    }>;
    customResponses?: Record<string, any>;
  };
  eventData?: {
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
  };
}

interface CompanyInfo {
  companyName: string;
  kraPin: string;
  contactPerson: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
}

const CompanyInvoiceModal: React.FC<CompanyInvoiceModalProps> = ({
  isOpen,
  onClose,
  attendeeData,
  eventData
}) => {
  const [step, setStep] = useState(1); // 1: Company Info, 2: Preview Invoice
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    kraPin: '',
    contactPerson: attendeeData.name || '',
    companyEmail: attendeeData.email || '',
    companyPhone: attendeeData.phone || '',
    companyAddress: ''
  });

  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCompanyInfo = () => {
    const { companyName, kraPin, contactPerson, companyEmail } = companyInfo;
    
    if (!companyName.trim()) {
      alert('Please enter company name');
      return false;
    }
    
    if (!kraPin.trim()) {
      alert('Please enter KRA VAT/PIN');
      return false;
    }
    
    if (!contactPerson.trim()) {
      alert('Please enter contact person');
      return false;
    }
    
    if (!companyEmail.trim()) {
      alert('Please enter company email');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      alert('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateCompanyInfo()) {
      setStep(2);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    
    setLoading(true);
    try {
      const filename = `company-invoice-${companyInfo.companyName.replace(/\s+/g, '-').toLowerCase()}-${eventData?.title?.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      await PDFService.generatePDF(invoiceRef.current, {
        filename,
        format: 'a4',
        margin: 20
      });
    } catch (error) {
      console.error('Error generating company invoice PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (!invoiceRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Company Invoice - ${companyInfo.companyName}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              @media print { 
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          </head>
          <body>
            <div class="invoice-container">
              ${invoiceRef.current.innerHTML}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="background-color: #3B82F6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
              <button onclick="window.close()" style="background-color: #6B7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const enhancedAttendeeData = {
    ...attendeeData,
    // Override with company information
    name: companyInfo.contactPerson,
    email: companyInfo.companyEmail,
    phone: companyInfo.companyPhone,
    // Add company-specific fields
    companyName: companyInfo.companyName,
    kraPin: companyInfo.kraPin,
    companyAddress: companyInfo.companyAddress,
    isCompanyInvoice: true
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary-800">
                {step === 1 ? 'Company Invoice Request' : 'Company Invoice Preview'}
              </h2>
              <p className="text-secondary-600 mt-1">
                {step === 1 ? 'Enter company details for the invoice' : `Invoice for ${companyInfo.companyName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="text-sm font-medium">1</span>
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <span className="text-sm font-medium">2</span>
              </div>
            </div>
          </div>

          {/* Step 1: Company Information Form */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Company Invoice</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This invoice will be addressed to your company for business/tax purposes. All fields marked with * are required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Building className="h-4 w-4 inline mr-1" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Hash className="h-4 w-4 inline mr-1" />
                    KRA VAT/PIN *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.kraPin}
                    onChange={(e) => handleInputChange('kraPin', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., P051234567A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Company Email *
                  </label>
                  <input
                    type="email"
                    value={companyInfo.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="company@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    value={companyInfo.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter company phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company Address
                  </label>
                  <textarea
                    value={companyInfo.companyAddress}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Enter company address"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Event Details</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Event:</strong> {eventData?.title}</p>
                  <p><strong>Attendee:</strong> {attendeeData.name}</p>
                  <p><strong>Amount:</strong> {eventData?.currency || 'KES'} {(attendeeData.totalAmountDue || eventData?.price || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Invoice Preview */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-800">Invoice Preview</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleOpenInNewTab}
                    className="bg-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Open in New Tab</span>
                  </button>
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={loading}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>{loading ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-sm">
                  <AttendeeInvoice
                    ref={invoiceRef}
                    attendeeData={enhancedAttendeeData}
                    eventData={eventData}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Back to Edit
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
              >
                {step === 1 ? 'Cancel' : 'Close'}
              </button>
              {step === 1 && (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <FileText className="h-5 w-5" />
                  <span>Generate Invoice</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInvoiceModal; 