import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, User, CreditCard, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { FirestoreService } from '../services/firestore';
import LoadingSpinner from './LoadingSpinner';
import Logo from './Logo';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  paymentData: {
    applicationNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    amountPaid: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
    confirmationCode: string;
    paymentDate: string;
  };
  programData?: {
    programName: string;
    programCode?: string;
  };
  createdAt: any;
}

// Payment constants
const BASE_PROGRAM_FEE = 5000;
const VAT_RATE = 0.16;
const VAT_AMOUNT = BASE_PROGRAM_FEE * VAT_RATE;
const TOTAL_PROGRAM_FEE = BASE_PROGRAM_FEE + VAT_AMOUNT;

const PublicReceipt: React.FC = () => {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!receiptNumber) {
        setError('Receipt number not provided');
        setLoading(false);
        return;
      }

      try {
        const result = await FirestoreService.getWithQuery('receipts', [
          { field: 'receiptNumber', operator: '==', value: receiptNumber }
        ]);

        if (result.success && result.data && result.data.length > 0) {
          setReceipt(result.data[0] as ReceiptData);
        } else {
          setError('Receipt not found');
        }
      } catch (err) {
        setError('Failed to fetch receipt');
        console.error('Error fetching receipt:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Receipt Not Found</h1>
          <p className="text-gray-600">{error || 'The requested receipt could not be found.'}</p>
        </div>
      </div>
    );
  }

  const receiptDate = new Date(receipt.paymentData.paymentDate).toLocaleDateString();
  const receiptTime = new Date(receipt.paymentData.paymentDate).toLocaleTimeString();
  
  const remainingBalance = Math.max(0, TOTAL_PROGRAM_FEE - receipt.paymentData.amountPaid);
  const isFullyPaid = remainingBalance <= 0;

  const getPaymentMethodIcon = () => {
    switch (receipt.paymentData.paymentMethod) {
      case 'mpesa':
        return '📱';
      case 'bank_transfer':
        return '🏦';
      case 'cash':
        return '💵';
      default:
        return '💳';
    }
  };

  const getPaymentMethodName = () => {
    switch (receipt.paymentData.paymentMethod) {
      case 'mpesa':
        return 'M-Pesa Mobile Payment';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash Payment';
      default:
        return 'Other Payment Method';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="bg-white p-8 max-w-2xl mx-auto shadow-lg rounded-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={true} textSize="2xl" />
          </div>
          <div className="bg-accent-100 border border-accent-300 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="h-8 w-8 text-accent-600" />
              <h1 className="text-2xl font-bold text-accent-800">PAYMENT RECEIPT</h1>
            </div>
            <p className="text-accent-600 font-medium">Payment Successful</p>
          </div>
          
          <div className="text-sm text-secondary-600 space-y-1">
            <p><span className="font-medium">Receipt #:</span> {receipt.receiptNumber}</p>
            <p><span className="font-medium">Date:</span> {receiptDate} at {receiptTime}</p>
          </div>
        </div>

        {/* Payment Success Banner */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-6 mb-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-accent-800 mb-2">Payment Confirmed</h2>
          <p className="text-accent-600 text-lg font-semibold">
            KES {receipt.paymentData.amountPaid.toLocaleString()}.00
          </p>
          <p className="text-secondary-600 text-sm mt-2">
            Your payment has been successfully processed
          </p>
        </div>

        {/* Customer Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary-600" />
            Customer Information
          </h3>
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-secondary-800">
                  {receipt.paymentData.firstName} {receipt.paymentData.lastName}
                </p>
                <p className="text-secondary-600 text-sm flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  {receipt.paymentData.email}
                </p>
              </div>
              <div>
                <p className="text-secondary-600 text-sm flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {receipt.paymentData.phoneNumber}
                </p>
                <p className="text-secondary-600 text-sm mt-1">
                  <span className="font-medium">Application #:</span> {receipt.paymentData.applicationNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
            Payment Details
          </h3>
          <div className="bg-secondary-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getPaymentMethodIcon()}</span>
                  <div>
                    <p className="font-medium text-secondary-800">{getPaymentMethodName()}</p>
                    <p className="text-secondary-600 text-sm">Payment Method</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-secondary-800">
                  {receipt.paymentData.confirmationCode}
                </p>
                <p className="text-secondary-600 text-sm">Confirmation Code</p>
              </div>
            </div>
          </div>
        </div>

        {/* Program Information */}
        {receipt.programData && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Program Information
            </h3>
            <div className="bg-accent-50 p-4 rounded-lg">
              <p className="font-semibold text-secondary-800">{receipt.programData.programName}</p>
              <p className="text-secondary-600 text-sm">Code: {receipt.programData.programCode}</p>
              <p className="text-secondary-600 text-sm mt-2">Kenya School of Sales Training Program</p>
            </div>
          </div>
        )}

        {/* Payment Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment Breakdown</h3>
          <div className="bg-white border border-secondary-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-secondary-200">
              <div className="p-4 flex justify-between">
                <span className="text-secondary-600">Amount Paid:</span>
                <span className="font-semibold text-accent-600">
                  KES {receipt.paymentData.amountPaid.toLocaleString()}.00
                </span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-secondary-600">Total Program Fee:</span>
                <span className="text-secondary-800">
                  KES {TOTAL_PROGRAM_FEE.toLocaleString()}.00
                </span>
              </div>
              <div className="p-4 bg-secondary-50 flex justify-between">
                <span className="font-medium text-secondary-800">Remaining Balance:</span>
                <span className={`font-bold ${isFullyPaid ? 'text-accent-600' : 'text-yellow-600'}`}>
                  KES {remainingBalance.toLocaleString()}.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className={`p-4 rounded-lg mb-6 text-center ${
          isFullyPaid 
            ? 'bg-accent-100 border border-accent-300' 
            : 'bg-yellow-100 border border-yellow-300'
        }`}>
          <p className={`font-semibold ${isFullyPaid ? 'text-accent-800' : 'text-yellow-800'}`}>
            {isFullyPaid ? 'Payment Complete - Full Access Granted' : 'Partial Payment Received'}
          </p>
          <p className={`text-sm mt-1 ${isFullyPaid ? 'text-accent-600' : 'text-yellow-700'}`}>
            {isFullyPaid 
              ? 'You now have full access to all program features including competency tests.'
              : `Complete the remaining balance of KES ${remainingBalance.toLocaleString()}.00 to unlock all features.`
            }
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="border-t border-secondary-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Transaction Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-secondary-600">Transaction Date:</p>
              <p className="font-medium text-secondary-800">{receiptDate}</p>
            </div>
            <div>
              <p className="text-secondary-600">Transaction Time:</p>
              <p className="font-medium text-secondary-800">{receiptTime}</p>
            </div>
            <div>
              <p className="text-secondary-600">Payment Status:</p>
              <p className="font-medium text-accent-600">Successful</p>
            </div>
            <div>
              <p className="text-secondary-600">Receipt Number:</p>
              <p className="font-medium text-secondary-800">{receipt.receiptNumber}</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Keep this receipt for your records</li>
            <li>• You will receive an email confirmation shortly</li>
            <li>• Contact support if you have any questions about your payment</li>
            <li>• Refunds are subject to our terms and conditions</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="text-center text-sm text-secondary-600 mb-6">
          <p className="font-medium text-secondary-800 mb-2">Questions about your payment?</p>
          <p>Email: hi@kss.or.ke</p>
          <p>Phone: 0722257323</p>
          <p className="mt-2 text-xs">
            Kenya School of Sales - Powered by Commercial Club of Africa & Yusudi
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicReceipt;