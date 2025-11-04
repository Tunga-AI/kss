import React, { forwardRef, useEffect, useState } from 'react';
import { Calendar, User, Building, Phone, Mail, FileText, Download, Share, Copy, Check } from 'lucide-react';
import Logo from '../../../components/Logo';
import { InvoiceReceiptService } from '../../../services/invoiceReceiptService';

interface InvoiceProps {
  applicantData: {
    id?: string;
    applicationNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    programId: string;
    amountPaid: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
    confirmationCode: string;
    submittedDate: string;
  };
  programData?: {
    programName: string;
    programCode?: string;
  };
  cohortData?: {
    name: string;
    startDate: string;
  };
  onDownload?: () => void;
}

// Payment constants
const BASE_PROGRAM_FEE = 5000;
const VAT_RATE = 0.16;
const VAT_AMOUNT = BASE_PROGRAM_FEE * VAT_RATE;
const TOTAL_PROGRAM_FEE = BASE_PROGRAM_FEE + VAT_AMOUNT;

const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ 
  applicantData, 
  programData, 
  cohortData, 
  onDownload 
}, ref) => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Generate invoice number and save to database
  useEffect(() => {
    const initializeInvoice = async () => {
      const newInvoiceNumber = InvoiceReceiptService.generateInvoiceNumber();
      setInvoiceNumber(newInvoiceNumber);
      setPublicUrl(InvoiceReceiptService.getPublicInvoiceUrl(newInvoiceNumber));
      
      // Save invoice data to database
      const invoiceData = {
        invoiceNumber: newInvoiceNumber,
        applicantData,
        programData,
        cohortData,
      };
      
      await InvoiceReceiptService.saveInvoice(invoiceData);
    };
    
    initializeInvoice();
  }, [applicantData, programData, cohortData]);

  const handleCopyLink = async () => {
    const success = await InvoiceReceiptService.copyToClipboard(publicUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoiceNumber} - Kenya School of Sales`,
        text: `Please find your invoice for Kenya School of Sales program`,
        url: publicUrl,
      }).catch(console.error);
    } else {
      setShowShareOptions(!showShareOptions);
    }
  };
  const invoiceDate = new Date().toLocaleDateString();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(); // 30 days from now
  
  const balanceDue = Math.max(0, TOTAL_PROGRAM_FEE - (applicantData.amountPaid || 0));
  const isFullyPaid = balanceDue <= 0;

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
            <p className="font-semibold text-secondary-800">
              {applicantData.firstName} {applicantData.lastName}
            </p>
            <p className="text-secondary-600 text-sm mt-1 flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {applicantData.email}
            </p>
            <p className="text-secondary-600 text-sm flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              {applicantData.phoneNumber}
            </p>
            <p className="text-secondary-600 text-sm mt-2">
              <span className="font-medium">Application #:</span> {applicantData.applicationNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Program Details */}
      {programData && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-600" />
            Program Details
          </h3>
          <div className="bg-accent-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-secondary-800">{programData.programName}</p>
                <p className="text-secondary-600 text-sm">Code: {programData.programCode}</p>
              </div>
              {cohortData && (
                <div>
                  <p className="font-medium text-secondary-800">{cohortData.name}</p>
                  <p className="text-secondary-600 text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Starts: {new Date(cohortData.startDate).toLocaleDateString()}
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
                      {programData?.programName || 'Sales Training Program'}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Professional sales training and certification
                    </p>
                  </div>
                </td>
                <td className="text-center p-4 text-secondary-700">1</td>
                <td className="text-right p-4 text-secondary-700">
                  KES {BASE_PROGRAM_FEE.toLocaleString()}.00
                </td>
                <td className="text-right p-4 text-secondary-700">
                  KES {BASE_PROGRAM_FEE.toLocaleString()}.00
                </td>
              </tr>
              <tr className="border-b border-secondary-200">
                <td className="p-4">
                  <p className="font-medium text-secondary-800">VAT (16%)</p>
                  <p className="text-sm text-secondary-600">Value Added Tax</p>
                </td>
                <td className="text-center p-4 text-secondary-700">1</td>
                <td className="text-right p-4 text-secondary-700">
                  KES {VAT_AMOUNT.toLocaleString()}.00
                </td>
                <td className="text-right p-4 text-secondary-700">
                  KES {VAT_AMOUNT.toLocaleString()}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment Information</h3>
          <div className="bg-secondary-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary-600">Payment Method:</span>
              <span className="text-secondary-800 font-medium capitalize">
                {applicantData.paymentMethod.replace('_', ' ')}
              </span>
            </div>
            {applicantData.confirmationCode && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Confirmation Code:</span>
                <span className="text-secondary-800 font-medium">
                  {applicantData.confirmationCode}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondary-600">Payment Date:</span>
              <span className="text-secondary-800 font-medium">
                {new Date(applicantData.submittedDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment Summary</h3>
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">Subtotal:</span>
                <span className="text-secondary-800">KES {BASE_PROGRAM_FEE.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">VAT (16%):</span>
                <span className="text-secondary-800">KES {VAT_AMOUNT.toLocaleString()}.00</span>
              </div>
              <div className="border-t border-primary-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-secondary-800">Total:</span>
                  <span className="text-primary-600">KES {TOTAL_PROGRAM_FEE.toLocaleString()}.00</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Amount Paid:</span>
                <span className="text-accent-600 font-medium">
                  KES {(applicantData.amountPaid || 0).toLocaleString()}.00
                </span>
              </div>
              <div className="border-t border-primary-200 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-800">Balance Due:</span>
                  <span className={`${isFullyPaid ? 'text-accent-600' : 'text-red-600'} font-bold`}>
                    KES {balanceDue.toLocaleString()}.00
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
              : `Outstanding balance of KES ${balanceDue.toLocaleString()}.00 is due by ${dueDate}`
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
              <li>• All fees are non-refundable once program commences</li>
            </ul>
          </div>
          <div>
            <ul className="space-y-1">
              <li>• Course materials are included in the program fee</li>
              <li>• Certificate issued upon successful completion</li>
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

Invoice.displayName = 'Invoice';

export default Invoice; 