import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  TrendingUp,
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  DollarSign,
  FileText,
  CreditCard as PaymentIcon,
  History,
  Wallet
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface LearnerTransaction {
  id: string;
  transactionId: string;
  learnerId: string;
  type: 'payment' | 'refund' | 'fee' | 'scholarship' | 'penalty';
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  paymentMethod?: string;
  reference?: string;
  programId?: string;
  programName?: string;
  intakeId?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface LearnerFinanceSummary {
  totalPaid: number;
  totalOwing: number;
  totalRefunded: number;
  nextDueAmount: number;
  nextDueDate: string;
  paymentPlan?: {
    totalAmount: number;
    installments: number;
    paidInstallments: number;
    remainingInstallments: number;
  };
}

const LearnerFinance: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<LearnerTransaction[]>([]);
  const [summary, setSummary] = useState<LearnerFinanceSummary>({
    totalPaid: 0,
    totalOwing: 0,
    totalRefunded: 0,
    nextDueAmount: 0,
    nextDueDate: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payment-plan'>('overview');

  useEffect(() => {
    if (userProfile?.id) {
      loadLearnerFinanceData();
    }
  }, [userProfile]);

  const loadLearnerFinanceData = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      // Load learner's transactions
      const transactionsResult = await FirestoreService.getWithQuery('transactions', [
        { field: 'learnerId', operator: '==', value: userProfile.id }
      ], 'createdAt');

      if (transactionsResult.success && transactionsResult.data) {
        const learnerTransactions = transactionsResult.data as LearnerTransaction[];
        setTransactions(learnerTransactions);

        // Calculate summary
        const totalPaid = learnerTransactions
          .filter(t => t.type === 'payment' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalOwing = learnerTransactions
          .filter(t => t.type === 'fee' && t.status === 'pending')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalRefunded = learnerTransactions
          .filter(t => t.type === 'refund' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);

        // Find next due payment
        const pendingPayments = learnerTransactions
          .filter(t => t.type === 'fee' && t.status === 'pending' && t.dueDate)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

        const nextPayment = pendingPayments[0];

        setSummary({
          totalPaid,
          totalOwing,
          totalRefunded,
          nextDueAmount: nextPayment?.amount || 0,
          nextDueDate: nextPayment?.dueDate || '',
        });
      } else {
        // If no transactions found, create mock data for demonstration
        const mockTransactions: LearnerTransaction[] = [
          {
            id: '1',
            transactionId: 'TXN001',
            learnerId: userProfile.id,
            type: 'fee',
            amount: 50000,
            currency: 'KES',
            description: 'Professional Sales Training - Registration Fee',
            status: 'completed',
            paymentMethod: 'M-Pesa',
            reference: 'MP001234567',
            programName: 'Professional Sales Training',
            paidDate: '2024-01-15',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            transactionId: 'TXN002',
            learnerId: userProfile.id,
            type: 'fee',
            amount: 25000,
            currency: 'KES',
            description: 'Professional Sales Training - Installment 2',
            status: 'pending',
            programName: 'Professional Sales Training',
            dueDate: '2024-12-15',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
          }
        ];

        setTransactions(mockTransactions);
        setSummary({
          totalPaid: 50000,
          totalOwing: 25000,
          totalRefunded: 0,
          nextDueAmount: 25000,
          nextDueDate: '2024-12-15',
        });
      }
    } catch (error) {
      console.error('Error loading learner finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-green-600';
      case 'fee':
        return 'text-blue-600';
      case 'refund':
        return 'text-purple-600';
      case 'scholarship':
        return 'text-emerald-600';
      case 'penalty':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Finances</h1>
            <p className="text-lg text-primary-100">
              Track your payments, fees, and financial progress
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Paid</p>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Amount Owing</p>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.totalOwing)}</p>
              </div>
              <Clock className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Next Due</p>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.nextDueAmount)}</p>
                {summary.nextDueDate && (
                  <p className="text-xs text-primary-200">Due: {formatDate(summary.nextDueDate)}</p>
                )}
              </div>
              <Calendar className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Refunded</p>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.totalRefunded)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {[
              { id: 'overview', label: 'Overview', icon: DollarSign },
              { id: 'transactions', label: 'Transaction History', icon: History },
              { id: 'payment-plan', label: 'Payment Plan', icon: PaymentIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Payment Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Progress</span>
                      <span className="font-semibold">
                        {((summary.totalPaid / (summary.totalPaid + summary.totalOwing)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${(summary.totalPaid / (summary.totalPaid + summary.totalOwing)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(summary.totalPaid)} of {formatCurrency(summary.totalPaid + summary.totalOwing)} paid
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payments</h3>
                  {summary.nextDueAmount > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium text-gray-900">Next Installment</p>
                          <p className="text-sm text-gray-600">Due: {formatDate(summary.nextDueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600">{formatCurrency(summary.nextDueAmount)}</p>
                          <button className="text-xs bg-primary-600 text-white px-3 py-1 rounded-full hover:bg-primary-700 transition-colors">
                            Pay Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600">All payments up to date!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getTypeColor(transaction.type).replace('text-', 'bg-').replace('-600', '-100')}`}>
                            {transaction.type === 'payment' ? <CreditCard className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {transaction.transactionId} • {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTypeColor(transaction.type)}`}>
                            {transaction.type === 'refund' ? '+' : transaction.type === 'payment' ? '-' : ''}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">{transaction.status}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
                <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${getTypeColor(transaction.type).replace('text-', 'bg-').replace('-600', '-100')}`}>
                            {transaction.type === 'payment' ? (
                              <CreditCard className="h-5 w-5" />
                            ) : transaction.type === 'refund' ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : (
                              <Receipt className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{transaction.description}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>ID: {transaction.transactionId}</span>
                              <span>Date: {formatDate(transaction.createdAt)}</span>
                              {transaction.paymentMethod && <span>Method: {transaction.paymentMethod}</span>}
                              {transaction.reference && <span>Ref: {transaction.reference}</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-lg font-semibold ${getTypeColor(transaction.type)}`}>
                              {transaction.type === 'refund' ? '+' : transaction.type === 'payment' ? '-' : ''}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1 capitalize">{transaction.status}</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Plan Tab */}
          {activeTab === 'payment-plan' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <PaymentIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Plan</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Your custom payment plan will be displayed here once set up by the finance team.
                </p>
                <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                  Contact Finance Team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerFinance;