import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Banknote, 
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  Download, 
  Eye, 
  CreditCard, 
  Receipt as ReceiptIcon,
  Calendar,
  Search,
  Filter,
  Edit,
  Save,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Mail,
  Phone,
  MapPin,
  Tag,
  History
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import Invoice from '../Profile/Invoice';
import ReceiptComponent from '../Profile/Receipt';
import PDFService from '../../../services/pdfService';
import { PaymentService } from '../../../services/paymentService';

/**
 * Enhanced Transaction ID System - Scalable tiered numbering
 * 
 * Tier 1 (First 999 transactions): TS001, TS002, ..., TS999
 * Tier 2 (Next 99,999 transactions): T1, T2, ..., T99999
 * Tier 3 (Next 100,000 transactions): T1B, T2B, ..., T100000B
 * Tier 4 (Next 100,000 transactions): T1C, T2C, ..., T100000C
 * And so on...
 * 
 * This system can handle millions of transactions efficiently:
 * - 999 + 99,999 + (26 × 100,000) = 2,700,998 possible unique IDs
 * - Can be extended further if needed by adding more suffix patterns
 */
const parseTransactionId = (transactionId: string) => {
  // Parse different transaction ID formats
  if (transactionId.startsWith('TS')) {
    // TS001-TS999 format (first 999 transactions)
    const numStr = transactionId.substring(2);
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      return { tier: 'TS', number: num, suffix: '', totalCount: num };
    }
  } else if (transactionId.match(/^T\d+[A-Z]*$/)) {
    // T1-T99999, T1B-T99999B, T1C-T99999C format
    const match = transactionId.match(/^T(\d+)([A-Z]*)$/);
    if (match) {
      const number = parseInt(match[1]);
      const suffix = match[2];
      let totalCount = 999; // TS series count
      
      if (suffix === '') {
        // T1-T99999 (no suffix)
        totalCount += number;
      } else {
        // T1B, T1C, etc.
        totalCount += 99999; // T1-T99999 count
        const suffixIndex = suffix.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
        totalCount += (suffixIndex * 100000) + number;
      }
      
      return { tier: 'T', number, suffix, totalCount };
    }
  }
  return { tier: 'TS', number: 0, suffix: '', totalCount: 0 };
};

const getNextTransactionIdNumber = async () => {
  try {
    // Get all existing transactions to find the highest count
    const [learnersResult, paymentResult] = await Promise.all([
      FirestoreService.getAll('learners'),
      FirestoreService.getAll('payment_records')
    ]);

    let maxTotalCount = 0;

    // Check learner payment records for existing transaction IDs
    if (learnersResult.success && learnersResult.data) {
      learnersResult.data.forEach((learner: any) => {
        if (learner.paymentRecords && Array.isArray(learner.paymentRecords)) {
          learner.paymentRecords.forEach((payment: any) => {
            if (payment.transactionId) {
              const parsed = parseTransactionId(payment.transactionId);
              if (parsed.totalCount > maxTotalCount) {
                maxTotalCount = parsed.totalCount;
              }
            }
          });
        }
      });
    }

    // Check payment records for existing transaction IDs
    if (paymentResult.success && paymentResult.data) {
      paymentResult.data.forEach((payment: any) => {
        if (payment.transactionId) {
          const parsed = parseTransactionId(payment.transactionId);
          if (parsed.totalCount > maxTotalCount) {
            maxTotalCount = parsed.totalCount;
          }
        }
      });
    }

    return maxTotalCount + 1;
  } catch (error) {
    console.error('Error getting next transaction ID number:', error);
    return 1;
  }
};

const generateTransactionId = async () => {
  const nextCount = await getNextTransactionIdNumber();
  
  if (nextCount <= 999) {
    // TS001-TS999 format for first 999 transactions
    return `TS${nextCount.toString().padStart(3, '0')}`;
  } else if (nextCount <= 100999) {
    // T1-T99999 format for next 99,999 transactions (1000-100999)
    const tNumber = nextCount - 999;
    return `T${tNumber}`;
  } else {
    // T1B-T99999B, T1C-T99999C format for subsequent groups of 100,000
    const adjustedCount = nextCount - 100999; // Remove TS and T series
    const suffixIndex = Math.floor(adjustedCount / 100000); // Which letter suffix (0=B, 1=C, etc.)
    const numberInGroup = (adjustedCount % 100000) + 1; // Number within the group (1-100000)
    
    const suffix = String.fromCharCode(66 + suffixIndex); // B=66, C=67, etc.
    return `T${numberInGroup}${suffix}`;
  }
};

interface CustomerData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  studentId?: string;
  programId?: string;
  cohortId?: string;
  cohortName?: string;
  enrollmentDate?: string;
  academicStatus?: string;
  
  // Financial fields
  totalFees: number;
  amountPaid: number;
  outstandingBalance: number;
  expectedAmount: number;
  totalAmountPaid: number;
  remainingBalance: number;
  cohortProgramCost: number;
  paymentPlan?: string;
  paymentRecords: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  transactionId?: string; // Sequential transaction ID (TS001, TS002, etc.)
  date: string;
  amount: number;
  type: 'tuition' | 'fees' | 'materials' | 'other';
  status: 'paid' | 'pending' | 'overdue' | 'verified';
  description: string;
  method?: string;
  confirmationCode?: string;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  fees?: number;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  startDate: string;
  programCost?: number;
}

const CustomerFinancePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState(false);
  const [agreedAmount, setAgreedAmount] = useState('');
  const [agreedAmountNotes, setAgreedAmountNotes] = useState('');
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'learner',
    totalFees: 0,
    amountPaid: 0,
    outstandingBalance: 0,
    expectedAmount: 0,
    totalAmountPaid: 0,
    remainingBalance: 0,
    cohortProgramCost: 0,
    paymentRecords: []
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank_transfer' | 'cash'>('mpesa');
  const [paymentConfirmation, setPaymentConfirmation] = useState('');
  const [paymentType, setPaymentType] = useState<'tuition' | 'fees' | 'materials' | 'other'>('tuition');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Invoice/Receipt modal state
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    type: 'invoice' as 'invoice' | 'receipt'
  });

  // References for PDF generation
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
    loadPrograms();
    loadCohorts();
  }, [id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      // Try to find in learners collection first
      const learnerResult = await FirestoreService.getById('learners', id!);
      if (learnerResult.success && learnerResult.data) {
        const data = learnerResult.data as CustomerData;
        setCustomerData({
          ...data,
          paymentRecords: data.paymentRecords || [],
          expectedAmount: data.expectedAmount || data.totalFees || 0,
          totalAmountPaid: data.totalAmountPaid || data.amountPaid || 0,
          remainingBalance: data.remainingBalance || data.outstandingBalance || 0
        });
      } else {
        // Try applicants collection
        const applicantResult = await FirestoreService.getById('applicants', id!);
        if (applicantResult.success && applicantResult.data) {
          const data = applicantResult.data as any;
          setCustomerData({
            ...data,
            role: 'applicant',
            paymentRecords: data.paymentRecords || [],
            totalFees: data.totalFees || 5800, // Default program fee
            expectedAmount: data.expectedAmount || 5800,
            totalAmountPaid: data.amountPaid || 0,
            amountPaid: data.amountPaid || 0,
            remainingBalance: (data.expectedAmount || 5800) - (data.amountPaid || 0),
            outstandingBalance: (data.expectedAmount || 5800) - (data.amountPaid || 0)
          });
        }
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      setMessage({ type: 'error', text: 'Failed to load customer data' });
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await FirestoreService.getAll('programs');
      if (result.success && result.data) {
        setPrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadCohorts = async () => {
    try {
      const result = await FirestoreService.getAll('cohorts');
      if (result.success && result.data) {
        setCohorts(result.data as Cohort[]);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const collection = customerData.role === 'learner' ? 'learners' : 'applicants';
      const result = await FirestoreService.update(collection, id!, customerData);
      
      if (result.success) {
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Customer data updated successfully!' });
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      setMessage({ type: 'error', text: 'Failed to update customer data' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetAgreedPrice = async () => {
    if (!agreedAmount || isNaN(Number(agreedAmount))) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setSaving(true);
    try {
      const result = await PaymentService.setAgreedPrice(
        id!,
        Number(agreedAmount),
        agreedAmountNotes
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Agreed price set successfully!' });
        setShowPaymentConfigModal(false);
        setAgreedAmount('');
        setAgreedAmountNotes('');
        // Refresh customer balance data
        loadCustomer();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to set agreed price' });
      }
    } catch (error) {
      console.error('Error setting agreed price:', error);
      setMessage({ type: 'error', text: 'Failed to set agreed price' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CustomerData, value: any) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPayment = async () => {
    if (!paymentAmount || !paymentDescription) return;

    setProcessingPayment(true);
    try {
      // Generate sequential transaction ID
      const transactionId = await generateTransactionId();
      
      const newPayment: PaymentRecord = {
        id: Date.now().toString(),
        transactionId: transactionId,
        date: new Date().toISOString(),
        amount: paymentAmount,
        type: paymentType,
        status: 'verified', // Finance team can mark as verified immediately
        description: paymentDescription,
        method: paymentMethod,
        confirmationCode: paymentConfirmation,
        verified: true,
        verifiedBy: userProfile?.displayName || 'Finance Team',
        verifiedAt: new Date().toISOString(),
        notes: `Added by ${userProfile?.displayName || 'Finance Team'}`
      };

      const updatedRecords = [...customerData.paymentRecords, newPayment];
      const newTotalPaid = (customerData.totalAmountPaid || 0) + paymentAmount;
      const newRemaining = Math.max(0, (customerData.expectedAmount || 0) - newTotalPaid);

      const updatedData = {
        ...customerData,
        paymentRecords: updatedRecords,
        totalAmountPaid: newTotalPaid,
        amountPaid: newTotalPaid, // For backward compatibility
        remainingBalance: newRemaining,
        outstandingBalance: newRemaining
      };

      setCustomerData(updatedData);

      // Save to database
      const collection = customerData.role === 'learner' ? 'learners' : 'applicants';
      await FirestoreService.update(collection, id!, updatedData);

      setShowPaymentModal(false);
      resetPaymentForm();
      
      setMessage({ 
        type: 'success', 
        text: `Payment ${transactionId} of KES ${paymentAmount.toLocaleString()} added successfully!` 
      });
      
    } catch (error) {
      console.error('Error adding payment:', error);
      setMessage({ type: 'error', text: 'Failed to add payment. Please try again.' });
    } finally {
      setProcessingPayment(false);
    }
  };

  const removePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to remove this payment record?')) return;

    const paymentToRemove = customerData.paymentRecords.find(p => p.id === paymentId);
    if (!paymentToRemove) return;

    try {
      const updatedRecords = customerData.paymentRecords.filter(p => p.id !== paymentId);
      const newTotalPaid = (customerData.totalAmountPaid || 0) - paymentToRemove.amount;
      const newRemaining = Math.max(0, (customerData.expectedAmount || 0) - newTotalPaid);

      const updatedData = {
        ...customerData,
        paymentRecords: updatedRecords,
        totalAmountPaid: Math.max(0, newTotalPaid),
        amountPaid: Math.max(0, newTotalPaid),
        remainingBalance: newRemaining,
        outstandingBalance: newRemaining
      };

      setCustomerData(updatedData);

      // Save to database
      const collection = customerData.role === 'learner' ? 'learners' : 'applicants';
      await FirestoreService.update(collection, id!, updatedData);

      setMessage({ type: 'success', text: 'Payment record removed successfully!' });
    } catch (error) {
      console.error('Error removing payment:', error);
      setMessage({ type: 'error', text: 'Failed to remove payment record' });
    }
  };

  const verifyPayment = async (paymentId: string) => {
    try {
      const updatedRecords = customerData.paymentRecords.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              status: 'verified' as const,
              verified: true,
              verifiedBy: userProfile?.displayName || 'Finance Team',
              verifiedAt: new Date().toISOString()
            }
          : payment
      );

      const updatedData = { ...customerData, paymentRecords: updatedRecords };
      setCustomerData(updatedData);

      // Save to database
      const collection = customerData.role === 'learner' ? 'learners' : 'applicants';
      await FirestoreService.update(collection, id!, updatedData);

      setMessage({ type: 'success', text: 'Payment verified successfully!' });
    } catch (error) {
      console.error('Error verifying payment:', error);
      setMessage({ type: 'error', text: 'Failed to verify payment' });
    }
  };

  const downloadPaymentReceipt = async (payment: any) => {
    try {
      const paymentData = {
        applicationNumber: customerData.applicationNumber || customerData.id,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        amount: payment.amount,
        date: payment.date,
        method: payment.method || 'N/A',
        description: payment.description,
        transactionId: payment.transactionId,
        confirmationCode: payment.confirmationCode,
        receiptNumber: payment.transactionId || `REC-${payment.id}`,
        paymentType: payment.type || 'tuition'
      };

      const programData = {
        id: customerData.programId,
        name: customerData.programName || 'General Program',
        fee: customerData.expectedAmount || 0
      };

      // Generate and download PDF receipt using PDFService
      await PDFService.generateReceiptPDF(paymentData, programData);

      setMessage({ type: 'success', text: 'Receipt downloaded successfully!' });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setMessage({ type: 'error', text: 'Failed to download receipt' });
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount(0);
    setPaymentConfirmation('');
    setPaymentDescription('');
    setPaymentType('tuition');
    setPaymentMethod('mpesa');
  };

  const openPaymentModal = () => {
    const remainingBalance = (customerData.expectedAmount || 0) - (customerData.totalAmountPaid || 0);
    setPaymentAmount(remainingBalance > 0 ? remainingBalance : 0);
    setShowPaymentModal(true);
    resetPaymentForm();
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    resetPaymentForm();
  };

  // Invoice/Receipt functions
  const openInvoiceModal = () => {
    setInvoiceModal({ isOpen: true, type: 'invoice' });
  };

  const openReceiptModal = () => {
    setInvoiceModal({ isOpen: true, type: 'receipt' });
  };

  const closeInvoiceModal = () => {
    setInvoiceModal({ isOpen: false, type: 'invoice' });
  };

  const downloadInvoicePDF = async () => {
    try {
      if (!customerData.firstName) {
        alert('Customer data not loaded');
        return;
      }

      const invoiceData = {
        ...customerData,
        paymentDate: customerData.enrollmentDate || new Date().toISOString().split('T')[0],
        applicationNumber: customerData.studentId || 'N/A',
        amountPaid: customerData.totalAmountPaid || 0,
        paymentMethod: 'mpesa' as const,
        confirmationCode: customerData.paymentRecords[0]?.confirmationCode || 'N/A',
        submittedDate: customerData.enrollmentDate || new Date().toISOString().split('T')[0],
        programId: customerData.programId || ''
      };

      const selectedProgram = programs.find(p => p.id === customerData.programId);
      const selectedCohort = cohorts.find(c => c.id === customerData.cohortId);

      await PDFService.generateInvoicePDF(
        invoiceData,
        selectedProgram,
        selectedCohort
      );
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    }
  };

  const downloadReceiptPDF = async () => {
    try {
      if (!customerData.firstName || !customerData.totalAmountPaid) {
        alert('No payment data available');
        return;
      }

      const receiptData = {
        ...customerData,
        paymentDate: customerData.enrollmentDate || new Date().toISOString().split('T')[0],
        amountPaid: customerData.totalAmountPaid || 0,
        paymentMethod: (customerData.paymentRecords[0]?.method || 'mpesa') as 'mpesa' | 'bank_transfer' | 'cash' | 'other'
      };

      const selectedProgram = programs.find(p => p.id === customerData.programId);

      await PDFService.generateReceiptPDF(
        receiptData,
        selectedProgram
      );
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      alert('Failed to generate receipt PDF. Please try again.');
    }
  };

  const downloadInvoiceFromModal = async () => {
    if (invoiceRef.current) {
      try {
        await PDFService.generatePDF(invoiceRef.current, {
          filename: `Invoice-${customerData.studentId || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`,
          quality: 0.98,
          format: 'a4',
          orientation: 'portrait',
          margin: 10
        });
      } catch (error) {
        console.error('Error downloading invoice:', error);
        alert('Failed to download invoice. Please try again.');
      }
    }
  };

  const downloadReceiptFromModal = async () => {
    if (receiptRef.current) {
      try {
        await PDFService.generatePDF(receiptRef.current, {
          filename: `Receipt-${customerData.studentId || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`,
          quality: 0.98,
          format: 'a4',
          orientation: 'portrait',
          margin: 10
        });
      } catch (error) {
        console.error('Error downloading receipt:', error);
        alert('Failed to download receipt. Please try again.');
      }
    }
  };

  // Helper functions
  const getSelectedProgram = () => {
    return programs.find(p => p.id === customerData.programId);
  };

  const getSelectedCohort = () => {
    return cohorts.find(c => c.id === customerData.cohortId);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculatePaymentDetails = () => {
    const amountPaid = customerData.totalAmountPaid || 0;
    const expectedAmount = customerData.expectedAmount || 0;
    const balanceDue = Math.max(0, expectedAmount - amountPaid);
    const paymentProgress = expectedAmount > 0 ? (amountPaid / expectedAmount) * 100 : 0;
    
    return {
      amountPaid,
      balanceDue,
      paymentProgress: Math.min(100, paymentProgress),
      isFullyPaid: balanceDue <= 0
    };
  };

  const filteredPayments = customerData.paymentRecords.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesType = filterType === 'all' || payment.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Invoice/Receipt Modal */}
      {invoiceModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {invoiceModal.type === 'invoice' ? (
                  <CreditCard className="h-6 w-6 text-primary-600" />
                ) : (
                  <ReceiptIcon className="h-6 w-6 text-accent-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {invoiceModal.type === 'invoice' ? 'Invoice' : 'Payment Receipt'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {invoiceModal.type === 'invoice' ? 'Program Fee Invoice' : 'Payment Confirmation Receipt'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={invoiceModal.type === 'invoice' ? downloadInvoiceFromModal : downloadReceiptFromModal}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                  title="Download PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={closeInvoiceModal}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {invoiceModal.type === 'invoice' ? (
                <Invoice
                  ref={invoiceRef}
                  applicantData={{
                    ...customerData,
                    applicationNumber: customerData.studentId || 'N/A',
                    amountPaid: customerData.totalAmountPaid || 0,
                    paymentMethod: 'mpesa' as const,
                    confirmationCode: customerData.paymentRecords[0]?.confirmationCode || 'N/A',
                    submittedDate: customerData.enrollmentDate || new Date().toISOString().split('T')[0],
                    programId: customerData.programId || ''
                  }}
                  programData={getSelectedProgram() || undefined}
                  cohortData={getSelectedCohort() ? {
                    name: getSelectedCohort()!.name,
                    startDate: getSelectedCohort()!.startDate
                  } : undefined}
                  onDownload={downloadInvoiceFromModal}
                />
              ) : (
                <ReceiptComponent
                  ref={receiptRef}
                  paymentData={{
                    ...customerData,
                    paymentDate: customerData.enrollmentDate || new Date().toISOString().split('T')[0],
                    amountPaid: customerData.totalAmountPaid || 0,
                    paymentMethod: (customerData.paymentRecords[0]?.method || 'mpesa') as 'mpesa' | 'bank_transfer' | 'cash' | 'other',
                    confirmationCode: customerData.paymentRecords[0]?.confirmationCode || 'N/A'
                  }}
                  programData={getSelectedProgram() || undefined}
                  onDownload={downloadReceiptFromModal}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-full">
                  <Banknote className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
                  <p className="text-sm text-gray-500">Record a new payment</p>
                </div>
              </div>
              <button
                onClick={closePaymentModal}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Amount:</span>
                    <span className="text-gray-900">KES {(customerData.expectedAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-gray-900">KES {(customerData.totalAmountPaid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-gray-600 font-medium">Remaining Balance:</span>
                    <span className="text-red-600 font-bold">
                      KES {Math.max(0, (customerData.expectedAmount || 0) - (customerData.totalAmountPaid || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter amount"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as 'tuition' | 'fees' | 'materials' | 'other')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="tuition">Tuition</option>
                      <option value="fees">Fees</option>
                      <option value="materials">Materials</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'mpesa' | 'bank_transfer' | 'cash')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {paymentMethod === 'mpesa' ? 'M-Pesa Confirmation Code' : 
                     paymentMethod === 'bank_transfer' ? 'Bank Reference Number' : 
                     'Receipt Number'}
                  </label>
                  <input
                    type="text"
                    value={paymentConfirmation}
                    onChange={(e) => setPaymentConfirmation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={
                      paymentMethod === 'mpesa' ? 'Enter M-Pesa confirmation code' :
                      paymentMethod === 'bank_transfer' ? 'Enter bank reference number' :
                      'Enter receipt number'
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Payment description or notes"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={closePaymentModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={addPayment}
                  disabled={processingPayment || !paymentAmount || !paymentDescription}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Add Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Configuration Modal */}
      {showPaymentConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Payment Configuration</h3>
              <button
                onClick={() => setShowPaymentConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{customerData.firstName} {customerData.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{customerData.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expected Amount:</span>
                    <span className="ml-2 font-medium">KES {(customerData.expectedAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="ml-2 font-medium">KES {(customerData.totalAmountPaid || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Set Agreed Amount */}
              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Set Agreed Amount</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agreed Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={agreedAmount}
                      onChange={(e) => setAgreedAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter agreed amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={agreedAmountNotes}
                      onChange={(e) => setAgreedAmountNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Reason for discount, special arrangement, etc."
                    />
                  </div>
                  <button
                    onClick={handleSetAgreedAmount}
                    disabled={!agreedAmount || saving}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Updating...' : 'Set Agreed Amount'}
                  </button>
                </div>
              </div>


              {/* Payment Schedule */}
              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Payment Schedule</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Outstanding Balance</span>
                    <span className="font-semibold text-lg text-red-600">
                      KES {calculatePaymentDetails().balanceDue.toLocaleString()}
                    </span>
                  </div>
                  {customerData.paymentRecords.length > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Last Payment</span>
                      <span className="font-medium text-gray-900">
                        {new Date(customerData.paymentRecords[customerData.paymentRecords.length - 1].date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setShowPaymentConfigModal(false);
                      setShowPaymentModal(true);
                    }}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Payment</span>
                  </button>
                  <button
                    onClick={openInvoiceModal}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FileText className="h-5 w-5" />
                    <span>View Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/finance')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {customerData.firstName} {customerData.lastName}
              </h1>
              <p className="text-lg text-primary-100">
                Customer Finance Management
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-primary-100">Email:</span>
                    <span className="ml-2 text-white">{customerData.email}</span>
                  </div>
                  {customerData.phoneNumber && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Phone:</span>
                      <span className="ml-2 text-white">{customerData.phoneNumber}</span>
                    </div>
                  )}
                  {customerData.studentId && (
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Student ID:</span>
                      <span className="ml-2 text-white">{customerData.studentId}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="text-primary-100">Role:</span>
                    <span className="ml-2 text-white capitalize">{customerData.role}</span>
                  </div>
                  {customerData.enrollmentDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Enrolled:</span>
                      <span className="ml-2 text-white">{new Date(customerData.enrollmentDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {customerData.academicStatus && (
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Status:</span>
                      <span className="ml-2 text-white capitalize">{customerData.academicStatus.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setShowPaymentConfigModal(true)}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Configure Payments</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Banknote className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Expected Amount</p>
                <p className="text-2xl font-bold text-white">KES {(customerData.expectedAmount || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Tag className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Amount Paid</p>
                <p className="text-2xl font-bold text-white">KES {(customerData.totalAmountPaid || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Outstanding Balance</p>
                <p className="text-2xl font-bold text-white">KES {calculatePaymentDetails().balanceDue.toLocaleString()}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Payment Progress</p>
                <p className="text-2xl font-bold text-white">{Math.round(calculatePaymentDetails().paymentProgress)}%</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
      }

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Payment Records */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-800">Payment History</h2>
              <button
                onClick={openPaymentModal}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Payment</span>
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="tuition">Tuition</option>
                <option value="fees">Fees</option>
                <option value="materials">Materials</option>
                <option value="other">Other</option>
              </select>
              <div className="flex items-center text-sm text-gray-500">
                <History className="h-4 w-4 mr-2" />
                {filteredPayments.length} records
              </div>
            </div>

            {/* Payment Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Reference</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        KES {payment.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-xs text-gray-500 capitalize">{payment.type}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 capitalize">
                        {payment.method?.replace('_', ' ') || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                        {payment.transactionId && (
                          <div className="mt-1">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {payment.transactionId}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {payment.confirmationCode || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          {payment.status === 'verified' && (
                            <button
                              onClick={() => downloadPaymentReceipt(payment)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                              title="Download Receipt"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => verifyPayment(payment.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                              title="Verify Payment"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removePayment(payment.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Remove Payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12 text-secondary-500">
                <History className="h-16 w-16 mx-auto mb-4 text-secondary-300" />
                <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Payment Records</h3>
                <p className="text-secondary-600 mb-4">No payment records found matching your criteria</p>
                <button
                  onClick={openPaymentModal}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Payment</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Financial Summary & Actions */}
        <div className="space-y-6">
          {/* Payment Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-secondary-800 mb-4">Payment Progress</h3>
            
            {/* Payment Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(calculatePaymentDetails().paymentProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculatePaymentDetails().paymentProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Amount</span>
                <span className="font-bold text-gray-900">
                  KES {(customerData.expectedAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-green-600">
                  KES {(customerData.totalAmountPaid || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600 font-medium">Remaining Balance</span>
                <span className={`font-bold ${calculatePaymentDetails().isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                  KES {calculatePaymentDetails().balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
            
            {calculatePaymentDetails().isFullyPaid && (
              <div className="mt-4 flex items-center justify-center text-green-600 bg-green-50 rounded-lg py-3">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Payment Complete!</span>
              </div>
            )}
          </div>



        </div>
      </div>
    </div>
  );
};

export default CustomerFinancePage; 