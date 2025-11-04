import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  Eye,
  Receipt,
  FileText,
  Bell,
  DollarSign,
  PieChart,
  BarChart3,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield
} from 'lucide-react';
import {
  CustomerFinanceService,
  CustomerFinancialSummary,
  PaymentSchedule
} from '../../../services/customerFinanceService';
import { PaymentService, PaymentRecord } from '../../../services/paymentService';
import { useAuthContext } from '../../../contexts/AuthContext';

interface PaymentStats {
  totalPaid: number;
  totalOutstanding: number;
  nextPaymentAmount: number;
  nextPaymentDate: string;
  paymentProgress: number;
  overdueAmount: number;
}

const LearnerFinanceView: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<CustomerFinancialSummary | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'history' | 'documents'>('overview');

  useEffect(() => {
    if (userProfile?.id) {
      loadFinancialData();
    }
  }, [userProfile]);

  const loadFinancialData = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const [summary, schedule, payments] = await Promise.all([
        CustomerFinanceService.getCustomerFinancialSummary(userProfile.id),
        CustomerFinanceService.getCustomerPaymentSchedule(userProfile.id),
        PaymentService.getCustomerPayments(userProfile.id)
      ]);

      setFinancialSummary(summary);
      setPaymentSchedule(schedule);
      setPaymentRecords(payments);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInstallmentStatus = (installment: any) => {
    if (installment.status === 'paid') return 'paid';
    if (installment.status === 'pending' && new Date(installment.dueDate) < new Date()) return 'overdue';
    return installment.status;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!financialSummary) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Financial Data</h3>
        <p className="text-gray-600">Your financial information is not available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Financial Dashboard</h1>
            <p className="text-lg text-primary-100">Track your payments and financial progress</p>
            {financialSummary.programName && (
              <p className="text-primary-200 mt-2">Program: {financialSummary.programName}</p>
            )}
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Expected</p>
                <p className="text-xl font-bold text-white">{formatCurrency(financialSummary.totalExpected)}</p>
              </div>
              <Target className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Amount Paid</p>
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
              <TrendingUp className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>
        </div>

        {/* Payment Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm text-primary-100 mb-2">
            <span>Payment Progress</span>
            <span>{financialSummary.paymentProgress.toFixed(1)}% Complete</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ width: `${financialSummary.paymentProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {financialSummary.hasOverduePayments && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-800">Overdue Payments</h4>
              <p className="text-red-700">
                You have overdue payments totaling {formatCurrency(financialSummary.totalOverdue)}.
                Please make a payment as soon as possible to avoid late fees.
              </p>
            </div>
          </div>
        </div>
      )}

      {financialSummary.nextPaymentAmount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-yellow-800">Next Payment Due</h4>
                <p className="text-yellow-700">
                  {formatCurrency(financialSummary.nextPaymentAmount)} due on {formatDate(financialSummary.nextPaymentDate)}
                </p>
                <p className="text-sm text-yellow-600">
                  {getDaysUntilDue(financialSummary.nextPaymentDate)} days remaining
                </p>
              </div>
            </div>
            <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors">
              Make Payment
            </button>
          </div>
        </div>
      )}

      {financialSummary.isFullyPaid && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-800">Payments Complete!</h4>
              <p className="text-green-700">Congratulations! You have completed all your payments.</p>
            </div>
          </div>
        </div>
      )}

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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Payment Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-semibold">{formatCurrency(financialSummary.totalExpected)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-semibold text-green-600">{formatCurrency(financialSummary.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Outstanding Balance</span>
                      <span className="font-semibold text-red-600">{formatCurrency(financialSummary.totalOutstanding)}</span>
                    </div>
                    {financialSummary.totalOverdue > 0 && (
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-gray-600">Overdue Amount</span>
                        <span className="font-semibold text-red-800">{formatCurrency(financialSummary.totalOverdue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Payment Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Payments Made</span>
                      <span className="font-semibold">{financialSummary.totalPayments}</span>
                    </div>
                    {financialSummary.lastPaymentDate && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Last Payment</span>
                          <span className="font-semibold">{formatCurrency(financialSummary.lastPaymentAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Date</span>
                          <span className="font-semibold">{formatDate(financialSummary.lastPaymentDate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Days Since Last Payment</span>
                          <span className="font-semibold">{financialSummary.daysSinceLastPayment} days</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Payments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
                <div className="space-y-3">
                  {paymentRecords.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <CreditCard className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.createdAt)} • {payment.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {paymentRecords.length === 0 && (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No payments recorded yet</p>
                    </div>
                  )}
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
                      const status = getInstallmentStatus(installment);
                      const daysUntilDue = getDaysUntilDue(installment.dueDate);

                      return (
                        <div
                          key={installment.id}
                          className={`border rounded-lg p-6 ${
                            status === 'overdue' ? 'border-red-200 bg-red-50' :
                            status === 'paid' ? 'border-green-200 bg-green-50' :
                            'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {status === 'paid' ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : status === 'overdue' ? (
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                )}
                                <span className="font-semibold text-lg">
                                  Installment {installment.installmentNumber}
                                </span>
                              </div>
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                status === 'paid' ? 'bg-green-100 text-green-800' :
                                status === 'overdue' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">{formatCurrency(installment.amount)}</p>
                              <p className="text-sm text-gray-600">Due: {formatDate(installment.dueDate)}</p>
                              {status === 'pending' && (
                                <p className="text-xs text-gray-500">
                                  {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : `${Math.abs(daysUntilDue)} days overdue`}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-gray-700">{installment.description}</p>
                            {installment.paidAmount && (
                              <div className="bg-green-100 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-medium">
                                  ✓ Paid: {formatCurrency(installment.paidAmount)} on {formatDate(installment.paidDate!)}
                                </p>
                                {installment.notes && (
                                  <p className="text-xs text-green-600 mt-1">{installment.notes}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {status === 'pending' && (
                            <div className="mt-4 flex space-x-3">
                              <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                                Pay Now
                              </button>
                              <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                Payment Options
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
                  <p className="text-gray-600 mb-6">
                    Your payment schedule hasn't been set up yet. Contact the finance team for assistance.
                  </p>
                  <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                    Contact Finance Team
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
                  <span>Download Statement</span>
                </button>
              </div>

              <div className="space-y-4">
                {paymentRecords.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-100 p-3 rounded-lg">
                          <CreditCard className="h-6 w-6 text-primary-600" />
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
                        <p className="text-xl font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Receipt className="h-5 w-5" />
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
                      <h4 className="font-semibold text-gray-900">Program Invoice</h4>
                      <p className="text-sm text-gray-600">Official program fee invoice</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button className="flex-1 border border-primary-600 text-primary-600 px-4 py-2 rounded hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <Receipt className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Receipts</h4>
                      <p className="text-sm text-gray-600">Payment confirmation receipts</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      disabled={paymentRecords.length === 0}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      disabled={paymentRecords.length === 0}
                      className="flex-1 border border-green-600 text-green-600 px-4 py-2 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                  {paymentRecords.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Available after first payment
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Financial Statement</h4>
                      <p className="text-sm text-gray-600">Detailed payment statement</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button className="flex-1 border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Plan Agreement</h4>
                      <p className="text-sm text-gray-600">Official payment plan terms</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      disabled={!paymentSchedule}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    <button
                      disabled={!paymentSchedule}
                      className="flex-1 border border-purple-600 text-purple-600 px-4 py-2 rounded hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                  {!paymentSchedule && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Available when payment plan is created
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerFinanceView;