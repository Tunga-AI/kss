import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Save,
  X,
  DollarSign,
  Receipt,
  FileText,
  Download,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  History,
  Bell,
  Wallet,
  Tag,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import {
  CustomerFinanceService,
  PaymentSchedule,
  PaymentInstallment,
  CustomerFinancialSummary
} from '../../../services/customerFinanceService';
import { PaymentService, PaymentRecord, CustomerBalance } from '../../../services/paymentService';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  studentId?: string;
  programId?: string;
  programName?: string;
  cohortId?: string;
  cohortName?: string;
  enrollmentDate?: string;
  academicStatus?: string;
}

const DetailedCustomerFinancePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [financialSummary, setFinancialSummary] = useState<CustomerFinancialSummary | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance | null>(null);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAgreedPriceModal, setShowAgreedPriceModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    paymentMethod: 'mpesa',
    reference: '',
    notes: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    totalAmount: '',
    scheduleType: 'monthly' as PaymentSchedule['scheduleType'],
    customInstallments: [] as any[]
  });

  const [agreedPriceForm, setAgreedPriceForm] = useState({
    agreedPrice: '',
    notes: ''
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'history' | 'documents'>('overview');

  const scrollToConfiguration = () => {
    const element = document.getElementById('payment-configuration');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      // Load customer data from multiple sources
      let customer = null;

      // Try learners first
      const learnerResult = await FirestoreService.getById('learners', id!);
      if (learnerResult.success && learnerResult.data) {
        customer = { ...learnerResult.data, role: 'learner' };
      } else {
        // Try applicants
        const applicantResult = await FirestoreService.getById('applicants', id!);
        if (applicantResult.success && applicantResult.data) {
          customer = { ...applicantResult.data, role: 'applicant' };
        } else {
          // Try customers
          const customerResult = await FirestoreService.getById('customers', id!);
          if (customerResult.success && customerResult.data) {
            customer = { ...customerResult.data, role: 'customer' };
          }
        }
      }

      if (customer) {
        setCustomerData(customer as CustomerData);

        // Load financial data
        const [summary, schedule, payments, balance] = await Promise.all([
          CustomerFinanceService.getCustomerFinancialSummary(id!),
          CustomerFinanceService.getCustomerPaymentSchedule(id!),
          PaymentService.getCustomerPayments(id!),
          PaymentService.getCustomerBalance(id!)
        ]);

        setFinancialSummary(summary);
        setPaymentSchedule(schedule);
        setPaymentRecords(payments);
        setCustomerBalance(balance);

        // Set agreed price in form if it exists
        if (balance && balance.agreedPrice) {
          setAgreedPriceForm({
            agreedPrice: balance.agreedPrice.toString(),
            notes: balance.agreedPriceNotes || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentSchedule = async () => {
    if (!customerData || !scheduleForm.totalAmount) return;

    try {
      const result = await CustomerFinanceService.createPaymentSchedule(
        customerData.id,
        `${customerData.firstName} ${customerData.lastName}`,
        customerData.role as any,
        parseFloat(scheduleForm.totalAmount),
        scheduleForm.scheduleType,
        customerData.programId ? {
          programId: customerData.programId,
          programName: customerData.programName || ''
        } : undefined
      );

      if (result.success) {
        setShowScheduleModal(false);
        await loadCustomerData();
      } else {
        alert('Error creating payment schedule: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Error creating payment schedule');
    }
  };

  const handleRecordPayment = async () => {
    if (!customerData || !paymentForm.amount) return;

    try {
      if (selectedInstallment) {
        // Record payment against specific installment
        const result = await CustomerFinanceService.recordScheduledPayment(
          customerData.id,
          selectedInstallment.id,
          parseFloat(paymentForm.amount),
          {
            description: paymentForm.description,
            paymentMethod: paymentForm.paymentMethod,
            reference: paymentForm.reference,
            notes: paymentForm.notes
          }
        );

        if (result.success) {
          setShowPaymentModal(false);
          setSelectedInstallment(null);
          await loadCustomerData();
        } else {
          alert('Error recording payment: ' + result.error);
        }
      } else {
        // Record general payment
        const result = await PaymentService.recordPayment({
          customerId: customerData.id,
          customerName: `${customerData.firstName} ${customerData.lastName}`,
          customerEmail: customerData.email,
          customerType: customerData.role as any,
          amount: parseFloat(paymentForm.amount),
          description: paymentForm.description,
          paymentMethod: paymentForm.paymentMethod as any,
          status: 'verified',
          category: 'tuition',
          programId: customerData.programId,
          programName: customerData.programName,
          referenceNumber: paymentForm.reference,
          notes: paymentForm.notes
        });

        if (result.success) {
          setShowPaymentModal(false);
          await loadCustomerData();
        } else {
          alert('Error recording payment: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      description: '',
      paymentMethod: 'mpesa',
      reference: '',
      notes: ''
    });
  };

  const handleSetAgreedPrice = async () => {
    if (!customerData || !agreedPriceForm.agreedPrice) return;

    try {
      const result = await PaymentService.setAgreedPrice(
        customerData.id,
        parseFloat(agreedPriceForm.agreedPrice),
        agreedPriceForm.notes
      );

      if (result.success) {
        setShowAgreedPriceModal(false);
        await loadCustomerData();
      } else {
        alert('Error setting agreed price: ' + result.error);
      }
    } catch (error) {
      console.error('Error setting agreed price:', error);
      alert('Error setting agreed price');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInstallmentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = (installment: PaymentInstallment) => {
    return installment.status === 'pending' && new Date(installment.dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Customer Not Found</h3>
        <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/portal/finance')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Finance
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/finance')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {customerData.firstName} {customerData.lastName}
                  </h1>
                  <p className="text-lg text-primary-100">Detailed Financial Management</p>
                </div>
              </div>

              {/* Customer Info */}
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
                      <Tag className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Student ID:</span>
                      <span className="ml-2 text-white">{customerData.studentId}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-primary-100">Role:</span>
                    <span className="ml-2 text-white capitalize">{customerData.role}</span>
                  </div>
                  {customerData.programName && (
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Program:</span>
                      <span className="ml-2 text-white">{customerData.programName}</span>
                    </div>
                  )}
                  {customerData.enrollmentDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-primary-100">Enrolled:</span>
                      <span className="ml-2 text-white">{formatDate(customerData.enrollmentDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={scrollToConfiguration}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 font-medium"
            >
              <Settings className="h-5 w-5" />
              <span>Configure Payments</span>
            </button>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        {financialSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">
                    {customerBalance?.agreedPrice ? 'Agreed Price' : 'Total Expected'}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {customerBalance?.agreedPrice
                      ? formatCurrency(customerBalance.agreedPrice)
                      : formatCurrency(financialSummary.totalExpected)
                    }
                  </p>
                  {customerBalance?.agreedPrice && customerBalance.agreedPrice !== financialSummary.totalExpected && (
                    <p className="text-xs text-primary-200 mt-1">
                      Original: {formatCurrency(financialSummary.totalExpected)}
                    </p>
                  )}
                </div>
                <Tag className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Total Paid</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(financialSummary.totalPaid)}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Outstanding</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(financialSummary.totalOutstanding)}</p>
                </div>
                <Clock className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Progress</p>
                  <p className="text-xl font-bold text-white">{financialSummary.paymentProgress.toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-6 w-6 text-white opacity-80" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configure Payments CTA */}
      <div className="text-center py-6">
        <button
          onClick={scrollToConfiguration}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl transition-all duration-300 flex items-center space-x-3 mx-auto text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Settings className="h-6 w-6" />
          <span>Configure Payments & Schedules</span>
        </button>
        <p className="text-gray-600 mt-2 text-sm">Set agreed amounts and create payment schedules</p>
      </div>

      {/* Payment Configuration Section */}
      <div id="payment-configuration" className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Configuration</h2>
            <p className="text-gray-600 mt-1">Set agreed amount and payment schedule for this customer</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              customerBalance?.agreedPrice
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {customerBalance?.agreedPrice ? 'Configured' : 'Needs Configuration'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agreed Amount Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <span>Agreed Amount</span>
              </h3>
              <button
                onClick={() => {
                  if (customerBalance) {
                    setAgreedPriceForm({
                      agreedPrice: customerBalance.agreedPrice?.toString() || customerBalance.totalExpected?.toString() || '',
                      notes: customerBalance.agreedPriceNotes || ''
                    });
                  }
                  setShowAgreedPriceModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>{customerBalance?.agreedPrice ? 'Edit' : 'Set'}</span>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              {customerBalance?.agreedPrice ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Agreed Price:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(customerBalance.agreedPrice)}
                    </span>
                  </div>
                  {customerBalance.totalExpected !== customerBalance.agreedPrice && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Original Expected:</span>
                      <span className="text-gray-500 line-through">
                        {formatCurrency(customerBalance.totalExpected)}
                      </span>
                    </div>
                  )}
                  {customerBalance.agreedPriceNotes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {customerBalance.agreedPriceNotes}
                      </p>
                    </div>
                  )}
                  {customerBalance.agreedPriceDate && (
                    <div className="text-xs text-gray-500">
                      Set on {formatDate(customerBalance.agreedPriceDate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No agreed price set</p>
                  <p className="text-sm text-gray-500">
                    Using original expected: {customerBalance ? formatCurrency(customerBalance.totalExpected) : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Payment Schedule</span>
              </h3>
              {!paymentSchedule && (
                <button
                  onClick={() => {
                    // Pre-fill with agreed price if available
                    const amount = customerBalance?.agreedPrice || customerBalance?.totalExpected || 0;
                    setScheduleForm({
                      ...scheduleForm,
                      totalAmount: amount.toString()
                    });
                    setShowScheduleModal(true);
                  }}
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              {paymentSchedule ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Schedule Type:</span>
                    <span className="font-medium capitalize">
                      {paymentSchedule.scheduleType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(paymentSchedule.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Installments:</span>
                    <span className="font-medium">
                      {paymentSchedule.installments.length} payments
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paymentSchedule.status === 'active' ? 'bg-green-100 text-green-800' :
                      paymentSchedule.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {paymentSchedule.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <strong>Next Payment:</strong>
                      {(() => {
                        const nextInstallment = paymentSchedule.installments.find(i => i.status === 'pending');
                        return nextInstallment
                          ? ` ${formatCurrency(nextInstallment.amount)} due ${formatDate(nextInstallment.dueDate)}`
                          : ' All payments completed';
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No payment schedule</p>
                  <p className="text-sm text-gray-500">
                    {customerBalance?.agreedPrice
                      ? 'Create installment plan for the agreed amount'
                      : 'Set agreed price first, then create payment schedule'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Configuration Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                resetPaymentForm();
                setSelectedInstallment(null);
                setShowPaymentModal(true);
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Record Payment</span>
            </button>

            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export Report</span>
            </button>

            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Send Reminder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'schedule', label: 'Payment Schedule', icon: Calendar },
              { id: 'history', label: 'Payment History', icon: History },
              { id: 'documents', label: 'Documents', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && financialSummary && (
            <div className="space-y-6">
              {/* Payment Progress */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Completion</span>
                    <span className="font-semibold">{financialSummary.paymentProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${financialSummary.paymentProgress}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">
                        {customerBalance?.agreedPrice ? 'Agreed Price' : 'Expected'}
                      </p>
                      <p className="font-semibold">
                        {customerBalance?.agreedPrice
                          ? formatCurrency(customerBalance.agreedPrice)
                          : formatCurrency(financialSummary.totalExpected)
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Paid</p>
                      <p className="font-semibold text-green-600">{formatCurrency(financialSummary.totalPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Outstanding</p>
                      <p className="font-semibold text-red-600">{formatCurrency(financialSummary.totalOutstanding)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Payment Due */}
              {financialSummary.nextPaymentAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-yellow-800">Next Payment Due</h4>
                      <p className="text-yellow-700">Due: {formatDate(financialSummary.nextPaymentDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-800">{formatCurrency(financialSummary.nextPaymentAmount)}</p>
                      <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                        Pay Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Overdue Payments */}
              {financialSummary.hasOverduePayments && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-800">Overdue Payments</h4>
                      <p className="text-red-700">Total overdue: {formatCurrency(financialSummary.totalOverdue)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payment Activity</h3>
                <div className="space-y-3">
                  {paymentRecords.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-600">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          payment.status === 'verified' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {paymentSchedule ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
                      <p className="text-gray-600">
                        {paymentSchedule.scheduleType.replace('_', ' ').toUpperCase()} •
                        Total: {formatCurrency(paymentSchedule.totalAmount)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      paymentSchedule.status === 'active' ? 'bg-green-100 text-green-800' :
                      paymentSchedule.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {paymentSchedule.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {paymentSchedule.installments.map((installment, index) => {
                      const overdueStatus = isOverdue(installment);
                      const actualStatus = overdueStatus ? 'overdue' : installment.status;

                      return (
                        <div
                          key={installment.id}
                          className={`border rounded-lg p-4 ${
                            overdueStatus ? 'border-red-200 bg-red-50' :
                            installment.status === 'paid' ? 'border-green-200 bg-green-50' :
                            'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                {getInstallmentStatusIcon(actualStatus)}
                                <span className="font-medium">
                                  Installment {installment.installmentNumber}
                                </span>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${getInstallmentStatusColor(actualStatus)}`}>
                                {actualStatus.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">{formatCurrency(installment.amount)}</p>
                              <p className="text-sm text-gray-600">Due: {formatDate(installment.dueDate)}</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-gray-700">{installment.description}</p>
                            {installment.paidAmount && (
                              <p className="text-sm text-green-600 mt-1">
                                Paid: {formatCurrency(installment.paidAmount)} on {formatDate(installment.paidDate!)}
                              </p>
                            )}
                          </div>

                          {installment.status === 'pending' && (
                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={() => {
                                  setSelectedInstallment(installment);
                                  setPaymentForm({
                                    ...paymentForm,
                                    amount: installment.amount.toString(),
                                    description: `Payment for ${installment.description}`
                                  });
                                  setShowPaymentModal(true);
                                }}
                                className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 transition-colors"
                              >
                                Record Payment
                              </button>
                              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
                                Partial Payment
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Payment Schedule</h3>
                  <p className="text-gray-600 mb-6">Create a payment schedule to track installments and due dates.</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Create Payment Schedule
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="space-y-4">
                {paymentRecords.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-100 p-3 rounded-lg">
                          <CreditCard className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{payment.description}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>ID: {payment.transactionId}</span>
                            <span>Date: {formatDate(payment.createdAt)}</span>
                            {payment.paymentMethod && <span>Method: {payment.paymentMethod}</span>}
                            {payment.referenceNumber && <span>Ref: {payment.referenceNumber}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          payment.status === 'verified' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Receipt className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {paymentRecords.length === 0 && (
                  <div className="text-center py-12">
                    <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Payment History</h3>
                    <p className="text-gray-600">No payments have been recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Financial Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Invoice</h4>
                      <p className="text-sm text-gray-600">Program fee invoice</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
                      View
                    </button>
                    <button className="flex-1 border border-primary-600 text-primary-600 px-4 py-2 rounded hover:bg-primary-50 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <Receipt className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Receipt</h4>
                      <p className="text-sm text-gray-600">Payment confirmation</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                      View
                    </button>
                    <button className="flex-1 border border-green-600 text-green-600 px-4 py-2 rounded hover:bg-green-50 transition-colors">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInstallment(null);
                  resetPaymentForm();
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedInstallment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium text-blue-800">Payment for: {selectedInstallment.description}</p>
                  <p className="text-sm text-blue-600">Due: {formatDate(selectedInstallment.dueDate)}</p>
                  <p className="text-sm text-blue-600">Amount: {formatCurrency(selectedInstallment.amount)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Payment description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirmation code, receipt number, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Additional notes about this payment"
                />
              </div>
            </div>

            <div className="flex space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInstallment(null);
                  resetPaymentForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentForm.amount || !paymentForm.description}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Payment Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer and Amount Info */}
              {customerBalance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Payment Schedule for: {customerBalance.customerName}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {customerBalance.agreedPrice ? (
                      <>
                        <div>
                          <span className="text-blue-600">Agreed Price:</span>
                          <div className="font-semibold text-blue-800">{formatCurrency(customerBalance.agreedPrice)}</div>
                        </div>
                        <div>
                          <span className="text-blue-600">Status:</span>
                          <div className="text-green-600 font-medium">✓ Configured</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-blue-600">Expected Amount:</span>
                          <div className="font-semibold text-blue-800">{formatCurrency(customerBalance.totalExpected)}</div>
                        </div>
                        <div>
                          <span className="text-blue-600">Status:</span>
                          <div className="text-yellow-600 font-medium">⚠ No agreed price set</div>
                        </div>
                      </>
                    )}
                  </div>
                  {!customerBalance.agreedPrice && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700">
                        💡 Consider setting an agreed price first for better payment planning
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount (KES)
                  {customerBalance?.agreedPrice && (
                    <span className="text-green-600 ml-2">• Using Agreed Price</span>
                  )}
                </label>
                <input
                  type="number"
                  value={scheduleForm.totalAmount}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, totalAmount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter total amount"
                />
                {customerBalance?.agreedPrice && parseFloat(scheduleForm.totalAmount) !== customerBalance.agreedPrice && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠ Amount differs from agreed price ({formatCurrency(customerBalance.agreedPrice)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
                <select
                  value={scheduleForm.scheduleType}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="full_payment">Full Payment (Due in 7 days)</option>
                  <option value="monthly">Monthly Installments (3 payments)</option>
                  <option value="quarterly">Quarterly Installments (2 payments)</option>
                  <option value="semester">Semester Payments (2 payments)</option>
                  <option value="custom">Custom Schedule</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Preview</span>
                </h4>
                {scheduleForm.totalAmount && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      {scheduleForm.scheduleType === 'full_payment' &&
                        `Single payment of ${formatCurrency(parseFloat(scheduleForm.totalAmount) || 0)} due in 7 days`
                      }
                      {scheduleForm.scheduleType === 'monthly' &&
                        `3 monthly payments of ${formatCurrency((parseFloat(scheduleForm.totalAmount) || 0) / 3)} each`
                      }
                      {scheduleForm.scheduleType === 'quarterly' &&
                        `2 quarterly payments of ${formatCurrency((parseFloat(scheduleForm.totalAmount) || 0) / 2)} each`
                      }
                      {scheduleForm.scheduleType === 'semester' &&
                        `2 semester payments of ${formatCurrency((parseFloat(scheduleForm.totalAmount) || 0) / 2)} each`
                      }
                      {scheduleForm.scheduleType === 'custom' &&
                        'Custom payment schedule - you can adjust dates and amounts after creation'
                      }
                    </div>
                    {scheduleForm.scheduleType !== 'full_payment' && scheduleForm.scheduleType !== 'custom' && (
                      <div className="text-xs text-gray-500 mt-2">
                        First payment due in 7 days, subsequent payments follow the selected interval
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePaymentSchedule}
                disabled={!scheduleForm.totalAmount}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agreed Price Modal */}
      {showAgreedPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Set Agreed Price</h3>
              <button
                onClick={() => setShowAgreedPriceModal(false)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {customerBalance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium text-blue-800">Customer: {customerBalance.customerName}</p>
                  <p className="text-sm text-blue-600">Original Expected: {formatCurrency(customerBalance.totalExpected)}</p>
                  {customerBalance.agreedPrice && (
                    <p className="text-sm text-blue-600">Current Agreed: {formatCurrency(customerBalance.agreedPrice)}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agreed Price (KES)</label>
                <input
                  type="number"
                  value={agreedPriceForm.agreedPrice}
                  onChange={(e) => setAgreedPriceForm({ ...agreedPriceForm, agreedPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter agreed price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={agreedPriceForm.notes}
                  onChange={(e) => setAgreedPriceForm({ ...agreedPriceForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Reason for price adjustment, discount details, etc."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Important Note</p>
                    <p className="text-sm text-yellow-700">
                      Setting an agreed price will override the original expected amount for payment calculations and outstanding balance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAgreedPriceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetAgreedPrice}
                disabled={!agreedPriceForm.agreedPrice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Set Agreed Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedCustomerFinancePage;