import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, User, Building, Phone, Mail, FileText } from 'lucide-react';
import { FirestoreService } from '../services/firestore';
import LoadingSpinner from './LoadingSpinner';
import Logo from './Logo';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  applicantData: {
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
  createdAt: any;
}

// Payment constants
const BASE_PROGRAM_FEE = 5000;
const VAT_RATE = 0.16;
const VAT_AMOUNT = BASE_PROGRAM_FEE * VAT_RATE;
const TOTAL_PROGRAM_FEE = BASE_PROGRAM_FEE + VAT_AMOUNT;

const PublicInvoice: React.FC = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceNumber) {
        setError('Invoice number not provided');
        setLoading(false);
        return;
      }

      try {
        const result = await FirestoreService.getWithQuery('invoices', [
          { field: 'invoiceNumber', operator: '==', value: invoiceNumber }
        ]);

        if (result.success && result.data && result.data.length > 0) {
          setInvoice(result.data[0] as InvoiceData);
        } else {
          setError('Invoice not found');
        }
      } catch (err) {
        setError('Failed to fetch invoice');
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600">{error || 'The requested invoice could not be found.'}</p>
        </div>
      </div>
    );
  }

  const invoiceDate = invoice.createdAt ? new Date(invoice.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString();
  const dueDate = invoice.createdAt 
    ? new Date(invoice.createdAt.toDate().getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
  
  const balanceDue = Math.max(0, TOTAL_PROGRAM_FEE - (invoice.applicantData.amountPaid || 0));
  const isFullyPaid = balanceDue <= 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg rounded-lg">
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
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
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
                {invoice.applicantData.firstName} {invoice.applicantData.lastName}
              </p>
              <p className="text-secondary-600 text-sm mt-1 flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {invoice.applicantData.email}
              </p>
              <p className="text-secondary-600 text-sm flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {invoice.applicantData.phoneNumber}
              </p>
              <p className="text-secondary-600 text-sm mt-2">
                <span className="font-medium">Application #:</span> {invoice.applicantData.applicationNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Program Details */}
        {invoice.programData && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Program Details
            </h3>
            <div className="bg-accent-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-secondary-800">{invoice.programData.programName}</p>
                  <p className="text-secondary-600 text-sm">Code: {invoice.programData.programCode}</p>
                </div>
                {invoice.cohortData && (
                  <div>
                    <p className="font-medium text-secondary-800">{invoice.cohortData.name}</p>
                    <p className="text-secondary-600 text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Starts: {new Date(invoice.cohortData.startDate).toLocaleDateString()}
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
                        {invoice.programData?.programName || 'Sales Training Program'}
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
                  {invoice.applicantData.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              {invoice.applicantData.confirmationCode && (
                <div className="flex justify-between">
                  <span className="text-secondary-600">Confirmation Code:</span>
                  <span className="text-secondary-800 font-medium">
                    {invoice.applicantData.confirmationCode}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-secondary-600">Payment Date:</span>
                <span className="text-secondary-800 font-medium">
                  {new Date(invoice.applicantData.submittedDate).toLocaleDateString()}
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
                    KES {(invoice.applicantData.amountPaid || 0).toLocaleString()}.00
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
      </div>
    </div>
  );
};

export default PublicInvoice;