import React, { forwardRef, useEffect, useState } from 'react';
import { Calendar, User, Building, Phone, Mail, FileText, Download, Copy, Check } from 'lucide-react';
import Logo from '../../../components/Logo';
import { InvoiceReceiptService } from '../../../services/invoiceReceiptService';

interface AttendeeInvoiceProps {
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
    // Company invoice fields
    companyName?: string;
    kraPin?: string;
    companyAddress?: string;
    isCompanyInvoice?: boolean;
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
  onDownload?: () => void;
}

const AttendeeInvoice = forwardRef<HTMLDivElement, AttendeeInvoiceProps>(({ 
  attendeeData, 
  eventData, 
  onDownload 
}, ref) => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate invoice number and save to database
  useEffect(() => {
    const initializeInvoice = async () => {
      // Generate invoice number with event-specific prefix
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 1000);
      const combined = timestamp + randomSuffix;
      const numericPart = (combined % 999) + 1;
      const prefix = attendeeData.isCompanyInvoice ? 'CI' : 'EV';
      const newInvoiceNumber = `${prefix}${numericPart.toString().padStart(3, '0')}`;
      
      setInvoiceNumber(newInvoiceNumber);
      setPublicUrl(InvoiceReceiptService.getPublicInvoiceUrl(newInvoiceNumber));
      
      // Save invoice data to database
      const invoiceData = {
        invoiceNumber: newInvoiceNumber,
        applicantData: {
          firstName: attendeeData.name.split(' ')[0] || attendeeData.name,
          lastName: attendeeData.name.split(' ').slice(1).join(' ') || '',
          email: attendeeData.email,
          phoneNumber: attendeeData.phone,
          programId: attendeeData.eventId,
          amountPaid: attendeeData.totalAmountPaid || 0,
          paymentMethod: (attendeeData.paymentRecords && attendeeData.paymentRecords[0]?.paymentMethod as any) || 'other',
          confirmationCode: (attendeeData.paymentRecords && attendeeData.paymentRecords[0]?.confirmationCode) || '',
          submittedDate: attendeeData.registrationDate,
        },
        programData: eventData ? {
          programName: eventData.title,
          programCode: `EVENT-${attendeeData.eventId}`,
        } : undefined,
      };
      
      await InvoiceReceiptService.saveInvoice(invoiceData);
    };
    
    initializeInvoice();
  }, [attendeeData, eventData]);

  const handleCopyLink = async () => {
    const success = await InvoiceReceiptService.copyToClipboard(publicUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const invoiceDate = new Date().toLocaleDateString();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
  
  const totalDue = attendeeData.totalAmountDue || eventData?.price || 0;
  const totalPaid = attendeeData.totalAmountPaid || 0;
  const balanceDue = Math.max(0, totalDue - totalPaid);
  const isFullyPaid = balanceDue <= 0;
  const currency = eventData?.currency || 'KES';

  // Calculate VAT (assuming 16% VAT rate)
  const VAT_RATE = 0.16;
  const baseAmount = totalDue / (1 + VAT_RATE);
  const vatAmount = totalDue - baseAmount;

  return (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          <Logo size="xl" showText={true} textSize="2xl" />
          <div>
            <p className="text-secondary-600 text-sm mt-2">
              Kenya School of Sales
            </p>
            <p className="text-secondary-500 text-xs">
              Powered by Commercial Club of Africa & Yusudi
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">INVOICE</h1>
          <div className="text-sm text-secondary-600 space-y-1">
            <p><span className="font-medium">Invoice #:</span> {invoiceNumber}</p>
            <p><span className="font-medium">Date:</span> {invoiceDate}</p>
            <p><span className="font-medium">Due Date:</span> {dueDate}</p>
          </div>
        </div>
      </div>

      {/* Company & Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* From */}
        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <Building className="h-5 w-5 mr-2 text-primary-600" />
            From
          </h3>
          <div className="bg-secondary-50 p-4 rounded-lg">
            <p className="font-semibold text-secondary-800">Kenya School of Sales</p>
            <p className="text-secondary-600 text-sm mt-1">Commercial Club of Africa</p>
            <p className="text-secondary-600 text-sm">Nairobi, Kenya</p>
            <p className="text-secondary-600 text-sm">Email: hi@kss.or.ke</p>
            <p className="text-secondary-600 text-sm">Phone: 0722257323</p>
          </div>
        </div>

        {/* To */}
        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary-600" />
            Bill To
          </h3>
          <div className="bg-primary-50 p-4 rounded-lg">
            {attendeeData.isCompanyInvoice && attendeeData.companyName ? (
              // Company Invoice
              <>
                <p className="font-semibold text-secondary-800 text-lg">
                  {attendeeData.companyName}
                </p>
                {attendeeData.kraPin && (
                  <p className="text-secondary-600 text-sm mt-1">
                    <strong>KRA PIN:</strong> {attendeeData.kraPin}
                  </p>
                )}
                {attendeeData.companyAddress && (
                  <p className="text-secondary-600 text-sm mt-1">
                    {attendeeData.companyAddress}
                  </p>
                )}
                <div className="border-t border-primary-200 mt-3 pt-3">
                  <p className="text-secondary-700 font-medium">
                    Contact Person: {attendeeData.name}
                  </p>
                  <p className="text-secondary-600 text-sm mt-1 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {attendeeData.email}
                  </p>
                  <p className="text-secondary-600 text-sm flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {attendeeData.phone}
                  </p>
                </div>
              </>
            ) : (
              // Individual Invoice
              <>
                <p className="font-semibold text-secondary-800">
                  {attendeeData.name}
                </p>
                <p className="text-secondary-600 text-sm mt-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {attendeeData.email}
                </p>
                <p className="text-secondary-600 text-sm flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {attendeeData.phone}
                </p>
                <p className="text-secondary-600 text-sm mt-2">
                  <span className="font-medium">Registration Date:</span> {new Date(attendeeData.registrationDate).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Details */}
      {eventData && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-600" />
            Event Details
          </h3>
          <div className="bg-accent-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-secondary-800">{eventData.title}</p>
                {eventData.description && (
                  <p className="text-secondary-600 text-sm mt-1">{eventData.description.substring(0, 100)}...</p>
                )}
              </div>
              {eventData.dates && eventData.dates.length > 0 && (
                <div>
                  <p className="font-medium text-secondary-800">Event Schedule</p>
                  <p className="text-secondary-600 text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(eventData.dates[0].date).toLocaleDateString()}
                  </p>
                  <p className="text-secondary-600 text-sm">
                    {eventData.dates[0].startTime} - {eventData.dates[0].endTime}
                  </p>
                  <p className="text-secondary-600 text-sm">
                    {eventData.dates[0].location}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Items */}
      <div className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary-600 text-white">
                <th className="text-left p-4 font-semibold">Description</th>
                <th className="text-center p-4 font-semibold">Quantity</th>
                <th className="text-right p-4 font-semibold">Unit Price</th>
                <th className="text-right p-4 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-secondary-200">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-secondary-800">
                      {eventData?.title || 'Event Registration'}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Event attendance and materials
                    </p>
                  </div>
                </td>
                <td className="text-center p-4 text-secondary-700">1</td>
                <td className="text-right p-4 text-secondary-700">
                  {currency} {baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="text-right p-4 text-secondary-700">
                  {currency} {baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              {vatAmount > 0 && (
                <tr className="border-b border-secondary-200">
                  <td className="p-4">
                    <p className="font-medium text-secondary-800">VAT (16%)</p>
                    <p className="text-sm text-secondary-600">Value Added Tax</p>
                  </td>
                  <td className="text-center p-4 text-secondary-700">1</td>
                  <td className="text-right p-4 text-secondary-700">
                    {currency} {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-4 text-secondary-700">
                    {currency} {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment History</h3>
          <div className="bg-secondary-50 p-4 rounded-lg space-y-2">
            {attendeeData.paymentRecords && attendeeData.paymentRecords.length > 0 ? (
              attendeeData.paymentRecords.map((payment, index) => (
                <div key={payment.id} className="flex justify-between items-center py-2 border-b border-secondary-200 last:border-b-0">
                  <div>
                    <span className="text-secondary-800 font-medium">
                      {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                    </span>
                    {payment.confirmationCode && (
                      <p className="text-sm text-secondary-600">
                        Code: {payment.confirmationCode}
                      </p>
                    )}
                    <p className="text-xs text-secondary-500">
                      {new Date(payment.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-accent-600 font-medium">
                    {currency} {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-secondary-600 text-center py-4">No payments recorded</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment Summary</h3>
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="space-y-2">
              {vatAmount > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Subtotal:</span>
                    <span className="text-secondary-800">{currency} {baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">VAT (16%):</span>
                    <span className="text-secondary-800">{currency} {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : null}
              <div className="border-t border-primary-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-secondary-800">Total:</span>
                  <span className="text-primary-600">{currency} {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Amount Paid:</span>
                <span className="text-accent-600 font-medium">
                  {currency} {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-primary-200 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-800">Balance Due:</span>
                  <span className={`${isFullyPaid ? 'text-accent-600' : 'text-red-600'} font-bold`}>
                    {currency} {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg mb-6 ${
        isFullyPaid 
          ? 'bg-accent-100 border border-accent-300' 
          : 'bg-yellow-100 border border-yellow-300'
      }`}>
        <div className="text-center">
          <p className={`font-semibold text-lg ${
            isFullyPaid ? 'text-accent-800' : 'text-yellow-800'
          }`}>
            {isFullyPaid ? '✓ PAID IN FULL' : '⚠ PAYMENT PENDING'}
          </p>
          <p className={`text-sm ${
            isFullyPaid ? 'text-accent-600' : 'text-yellow-700'
          }`}>
            {isFullyPaid 
              ? 'This invoice has been paid in full. Thank you!'
              : `Outstanding balance of ${currency} ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is due by ${dueDate}`
            }
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border-t border-secondary-200 pt-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-3">Terms & Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-secondary-600">
          <div>
            <ul className="space-y-1">
              <li>• Payment is due within 30 days of invoice date</li>
              <li>• Late payments may incur additional charges</li>
              <li>• All fees are non-refundable once event commences</li>
            </ul>
          </div>
          <div>
            <ul className="space-y-1">
              <li>• Event materials are included in the registration fee</li>
              <li>• Certificate issued upon successful attendance</li>
              <li>• Questions? Contact us at hi@kss.or.ke</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-secondary-200 text-center">
        <p className="text-secondary-500 text-sm">
          <strong>Kenya School of Sales</strong> - Building bold commercial talent for Africa
        </p>
        <p className="text-secondary-400 text-xs mt-1">
          Powered by Commercial Club of Africa (CCA) and Yusudi
        </p>
      </div>

      {/* Action Buttons (only visible when not in PDF) */}
      <div className="mt-6 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onDownload && (
            <button
              onClick={onDownload}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
          )}
          
          {invoiceNumber && (
            <button
              onClick={handleCopyLink}
              className="bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors duration-200 flex items-center space-x-2"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              <span>{copied ? 'Link Copied!' : 'Get Link'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

AttendeeInvoice.displayName = 'AttendeeInvoice';

export default AttendeeInvoice; 