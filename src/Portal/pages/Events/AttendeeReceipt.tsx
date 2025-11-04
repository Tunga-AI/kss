import React, { forwardRef, useEffect, useState } from 'react';
import { Calendar, User, Building, Phone, Mail, FileText, Download, CheckCircle, Copy, Check } from 'lucide-react';
import Logo from '../../../components/Logo';
import { InvoiceReceiptService } from '../../../services/invoiceReceiptService';

interface AttendeeReceiptProps {
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
  selectedPaymentRecord?: {
    id: string;
    amount: number;
    paymentMethod: string;
    confirmationCode?: string;
    transactionDate: string;
    notes?: string;
  } | null;
  onDownload?: () => void;
}

const AttendeeReceipt = forwardRef<HTMLDivElement, AttendeeReceiptProps>(({ 
  attendeeData, 
  eventData, 
  selectedPaymentRecord,
  onDownload 
}, ref) => {
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate receipt number and save to database
  useEffect(() => {
    const initializeReceipt = async () => {
      // Generate receipt number with event-specific prefix
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 1000);
      const combined = timestamp + randomSuffix;
      const numericPart = (combined % 999) + 1;
      const newReceiptNumber = `RC${numericPart.toString().padStart(3, '0')}`;
      
      setReceiptNumber(newReceiptNumber);
      setPublicUrl(InvoiceReceiptService.getPublicReceiptUrl(newReceiptNumber));
      
      // Save receipt data to database
      const receiptData = {
        receiptNumber: newReceiptNumber,
        paymentData: {
          firstName: attendeeData.name.split(' ')[0] || attendeeData.name,
          lastName: attendeeData.name.split(' ').slice(1).join(' ') || '',
          email: attendeeData.email,
          phoneNumber: attendeeData.phone,
          amountPaid: selectedPaymentRecord?.amount || attendeeData.totalAmountPaid || 0,
          paymentMethod: (selectedPaymentRecord?.paymentMethod || 'other') as any,
          confirmationCode: selectedPaymentRecord?.confirmationCode || '',
          paymentDate: selectedPaymentRecord?.transactionDate || attendeeData.registrationDate,
        },
        programData: eventData ? {
          programName: eventData.title,
          programCode: `EVENT-${attendeeData.eventId}`,
        } : undefined,
      };
      
      await InvoiceReceiptService.saveReceipt(receiptData);
    };
    
    initializeReceipt();
  }, [attendeeData, eventData, selectedPaymentRecord]);

  const handleCopyLink = async () => {
    const success = await InvoiceReceiptService.copyToClipboard(publicUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const currency = eventData?.currency || 'KES';
  
  // If a specific payment record is selected, use it; otherwise use the most recent payment
  const paymentRecord = selectedPaymentRecord || 
    (attendeeData.paymentRecords && attendeeData.paymentRecords.length > 0 
      ? attendeeData.paymentRecords[attendeeData.paymentRecords.length - 1] 
      : null);

  if (!paymentRecord) {
    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-secondary-600">No payment records found to generate receipt.</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-accent-600 mb-2">RECEIPT</h1>
          <div className="text-sm text-secondary-600 space-y-1">
            <p><span className="font-medium">Receipt #:</span> {receiptNumber}</p>
            <p><span className="font-medium">Date:</span> {new Date(paymentRecord.transactionDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Payment Method:</span> {paymentRecord.paymentMethod.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Banner */}
      <div className="bg-accent-100 border border-accent-300 p-6 rounded-lg mb-8">
        <div className="flex items-center justify-center space-x-3">
          <CheckCircle className="h-8 w-8 text-accent-600" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-accent-800">Payment Received</h2>
            <p className="text-accent-600">
              Thank you for your payment of <strong>{currency} {paymentRecord.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Company & Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* From */}
        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <Building className="h-5 w-5 mr-2 text-primary-600" />
            Received By
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
            Paid By
          </h3>
          <div className="bg-primary-50 p-4 rounded-lg">
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

      {/* Payment Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Payment Details</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-accent-600 text-white">
              <tr>
                <th className="text-left p-4 font-semibold">Description</th>
                <th className="text-right p-4 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-secondary-800">
                      Payment for: {eventData?.title || 'Event Registration'}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Payment Method: {paymentRecord.paymentMethod.replace('_', ' ').toUpperCase()}
                    </p>
                    {paymentRecord.confirmationCode && (
                      <p className="text-sm text-secondary-600">
                        Confirmation Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{paymentRecord.confirmationCode}</span>
                      </p>
                    )}
                    <p className="text-sm text-secondary-600">
                      Transaction Date: {new Date(paymentRecord.transactionDate).toLocaleDateString()} at {new Date(paymentRecord.transactionDate).toLocaleTimeString()}
                    </p>
                    {paymentRecord.notes && (
                      <p className="text-sm text-secondary-600 mt-1">
                        Notes: {paymentRecord.notes}
                      </p>
                    )}
                  </div>
                </td>
                <td className="text-right p-4">
                  <p className="text-2xl font-bold text-accent-600">
                    {currency} {paymentRecord.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="mb-8">
        <div className="bg-primary-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Payment Status Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-secondary-600">Total Due</p>
              <p className="text-xl font-bold text-secondary-800">
                {currency} {(attendeeData.totalAmountDue || eventData?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-secondary-600">Total Paid</p>
              <p className="text-xl font-bold text-accent-600">
                {currency} {(attendeeData.totalAmountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-secondary-600">Remaining Balance</p>
              <p className="text-xl font-bold text-red-600">
                {currency} {Math.max(0, (attendeeData.totalAmountDue || eventData?.price || 0) - (attendeeData.totalAmountPaid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Validity */}
      <div className="border border-gray-300 p-4 rounded-lg mb-6 bg-gray-50">
        <h4 className="font-semibold text-secondary-800 mb-2">Receipt Validity</h4>
        <div className="text-sm text-secondary-600 space-y-1">
          <p>• This receipt serves as proof of payment for the above transaction</p>
          <p>• Please keep this receipt for your records</p>
          <p>• For any inquiries regarding this payment, please contact us with receipt number: <strong>{receiptNumber}</strong></p>
          <p>• This receipt is valid and verifiable through our payment system</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="border-t border-secondary-200 pt-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-3">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-secondary-600">
          <div>
            <h4 className="font-medium text-secondary-800 mb-2">Customer Service</h4>
            <ul className="space-y-1">
              <li>• Email: hi@kss.or.ke</li>
              <li>• Phone: 0722257323</li>
              <li>• Website: www.kss.or.ke</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-secondary-800 mb-2">Business Hours</h4>
            <ul className="space-y-1">
              <li>• Monday - Friday: 9:00 AM - 6:00 PM</li>
              <li>• Saturday: 10:00 AM - 4:00 PM</li>
              <li>• Sunday: Closed</li>
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
        <p className="text-secondary-400 text-xs mt-2">
          Receipt generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Action Buttons (only visible when not in PDF) */}
      <div className="mt-6 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onDownload && (
            <button
              onClick={onDownload}
              className="bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
          )}
          
          {receiptNumber && (
            <button
              onClick={handleCopyLink}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
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

AttendeeReceipt.displayName = 'AttendeeReceipt';

export default AttendeeReceipt; 