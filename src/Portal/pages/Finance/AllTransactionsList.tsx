import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Users,
  Building,
  Award
} from 'lucide-react';
import { PaymentService, PaymentRecord } from '../../../services/paymentService';
import { FirestoreService } from '../../../services/firestore';

const AllTransactionsList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadAllTransactions();
  }, []);

  const loadAllTransactions = async () => {
    setLoading(true);
    try {
      const [allTransactions, customersResult, applicantsResult, learnersResult, instructorsResult, alumniResult] = await Promise.all([
        PaymentService.getAllPayments(),
        FirestoreService.getAll('customers'),
        FirestoreService.getAll('applicants'),
        FirestoreService.getAll('learners'),
        FirestoreService.getAll('instructors'),
        FirestoreService.getAll('alumni')
      ]);

      // Create a customer lookup map
      const customerMap: { [key: string]: { name: string; email: string } } = {};

      console.log('AllTransactions Debug - Raw data counts:', {
        transactions: allTransactions.length,
        customers: customersResult.success ? customersResult.data?.length : 'failed',
        applicants: applicantsResult.success ? applicantsResult.data?.length : 'failed',
        learners: learnersResult.success ? learnersResult.data?.length : 'failed',
        instructors: instructorsResult.success ? instructorsResult.data?.length : 'failed',
        alumni: alumniResult.success ? alumniResult.data?.length : 'failed'
      });

      // Add customers
      if (customersResult.success && customersResult.data) {
        customersResult.data.forEach((customer: any) => {
          const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || 'Unknown';
          customerMap[customer.id] = {
            name,
            email: customer.email || 'N/A'
          };
        });
      }

      // Add applicants
      if (applicantsResult.success && applicantsResult.data) {
        applicantsResult.data.forEach((applicant: any) => {
          const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Unknown';
          customerMap[applicant.id] = {
            name,
            email: applicant.email || 'N/A'
          };
        });
      }

      // Add learners
      if (learnersResult.success && learnersResult.data) {
        learnersResult.data.forEach((learner: any) => {
          const name = `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || 'Unknown';
          customerMap[learner.id] = {
            name,
            email: learner.email || 'N/A'
          };
        });
      }

      // Add instructors
      if (instructorsResult.success && instructorsResult.data) {
        instructorsResult.data.forEach((instructor: any) => {
          const name = `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.name || 'Unknown';
          customerMap[instructor.id] = {
            name,
            email: instructor.email || 'N/A'
          };
        });
      }

      // Add alumni
      if (alumniResult.success && alumniResult.data) {
        alumniResult.data.forEach((alumni: any) => {
          const name = `${alumni.firstName || ''} ${alumni.lastName || ''}`.trim() || alumni.name || 'Unknown';
          customerMap[alumni.id] = {
            name,
            email: alumni.email || 'N/A'
          };
        });
      }

      console.log('AllTransactions Debug - Customer map size:', Object.keys(customerMap).length);
      console.log('AllTransactions Debug - Sample transactions:', allTransactions.slice(0, 3).map(t => ({
        id: t.transactionId,
        customerId: t.customerId,
        existingName: t.customerName,
        existingEmail: t.customerEmail
      })));
      console.log('AllTransactions Debug - Sample customer map entries:', Object.entries(customerMap).slice(0, 3));

      // Enhance transactions with customer names
      const enhancedTransactions = allTransactions.map(transaction => {
        const resolvedName = transaction.customerName || customerMap[transaction.customerId]?.name || 'Unknown';
        const resolvedEmail = transaction.customerEmail || customerMap[transaction.customerId]?.email || 'N/A';

        return {
          ...transaction,
          customerName: resolvedName,
          customerEmail: resolvedEmail
        };
      });

      console.log('AllTransactions Debug - Sample enhanced transactions:', enhancedTransactions.slice(0, 3).map(t => ({
        id: t.transactionId,
        customerId: t.customerId,
        resolvedName: t.customerName,
        resolvedEmail: t.customerEmail
      })));

      setTransactions(enhancedTransactions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading all transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      (transaction.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesType = filterType === 'all' || transaction.customerType === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

    const transactionDate = new Date(transaction.createdAt);
    const matchesDateRange =
      (!dateRange.start || transactionDate >= new Date(dateRange.start)) &&
      (!dateRange.end || transactionDate <= new Date(dateRange.end));

    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesDateRange;
  });

  // Pagination
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'learner': return 'bg-blue-100 text-blue-800';
      case 'admission': return 'bg-purple-100 text-purple-800';
      case 'instructor': return 'bg-green-100 text-green-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'learner': return <Users className="h-4 w-4" />;
      case 'admission': return <Building className="h-4 w-4" />;
      case 'instructor': return <Award className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleVerifyTransaction = async (transactionId: string, verify: boolean) => {
    try {
      const result = await PaymentService.updatePaymentStatus(
        transactionId,
        verify ? 'verified' : 'rejected',
        'Finance Team',
        verify ? 'Payment verified by finance team' : 'Payment rejected by finance team'
      );

      if (result.success) {
        await loadAllTransactions();
        alert(`Transaction ${verify ? 'verified' : 'rejected'} successfully!`);
      } else {
        alert('Error updating transaction: ' + result.error);
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      alert('Error processing verification');
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'Customer', 'Type', 'Category', 'Amount', 'Status', 'Method', 'Date', 'Description'].join(','),
      ...filteredTransactions.map(t => [
        t.transactionId || '',
        t.customerName || '',
        t.customerType || '',
        t.category || '',
        t.amount || 0,
        t.status || '',
        t.paymentMethod || '',
        new Date(t.createdAt).toLocaleDateString(),
        `"${(t.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const TransactionDetailsModal: React.FC<{ transaction: PaymentRecord; onClose: () => void }> = ({
    transaction,
    onClose
  }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Details</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Transaction ID</label>
              <p className="text-gray-800 font-mono">{transaction.transactionId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Customer</label>
            <p className="text-gray-800">{transaction.customerName || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{transaction.customerEmail || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Type</label>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getTypeColor(transaction.customerType)}`}>
                {getTypeIcon(transaction.customerType)}
                <span className="capitalize">{transaction.customerType}</span>
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Category</label>
              <p className="text-gray-800 capitalize">{transaction.category.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Amount</label>
              <p className="text-lg font-semibold text-gray-800">KES {transaction.amount.toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Payment Method</label>
              <p className="text-gray-800 capitalize">{(transaction.paymentMethod || 'other').replace('_', ' ')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Description</label>
            <p className="text-gray-800">{transaction.description || 'No description'}</p>
          </div>

          {transaction.referenceNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Reference Number</label>
              <p className="text-gray-800 font-mono">{transaction.referenceNumber}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Created</label>
              <p className="text-gray-800">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Updated</label>
              <p className="text-gray-800">{new Date(transaction.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {transaction.verifiedBy && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Verified By</label>
                <p className="text-gray-800">{transaction.verifiedBy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Verified At</label>
                <p className="text-gray-800">{transaction.verifiedAt ? new Date(transaction.verifiedAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          )}

          {transaction.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Notes</label>
              <p className="text-gray-800">{transaction.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const verifiedAmount = filteredTransactions.filter(t => t.status === 'verified').reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = filteredTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">All Transactions</h1>
            <p className="text-lg text-primary-100">
              Complete transaction history and management
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
                <p className="text-sm font-medium text-primary-200">All Records</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Amount</p>
                <p className="text-2xl font-bold text-white">KES {totalAmount.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">All Transactions</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Verified</p>
                <p className="text-2xl font-bold text-white">KES {verifiedAmount.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Confirmed</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Pending</p>
                <p className="text-2xl font-bold text-white">KES {pendingAmount.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Awaiting Review</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="learner">Learner</option>
              <option value="admission">Admission</option>
              <option value="instructor">Instructor</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="admission_fee">Admission Fee</option>
              <option value="tuition">Tuition</option>
              <option value="salary">Salary</option>
              <option value="bills">Bills</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.transactionId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-mono text-sm text-gray-800">{transaction.transactionId || 'N/A'}</td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{transaction.customerName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{transaction.customerEmail || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getTypeColor(transaction.customerType || 'general')}`}>
                      {getTypeIcon(transaction.customerType || 'general')}
                      <span className="capitalize">{transaction.customerType || 'general'}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="capitalize text-gray-600">{(transaction.category || 'other').replace('_', ' ')}</span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800">KES {(transaction.amount || 0).toLocaleString()}</td>
                  <td className="py-4 px-4 capitalize text-gray-600">{(transaction.paymentMethod || 'other').replace('_', ' ')}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                      {transaction.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerifyTransaction(transaction.transactionId, true)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => handleVerifyTransaction(transaction.transactionId, false)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedTransactions.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterCategory !== 'all' || dateRange.start || dateRange.end
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No transactions have been recorded yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions} transactions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default AllTransactionsList;