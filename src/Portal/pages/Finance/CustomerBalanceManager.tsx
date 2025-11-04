import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Search,
  Filter,
  Edit,
  Eye,
  Plus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { PaymentService, CustomerBalance } from '../../../services/paymentService';
import { CustomerFinanceService } from '../../../services/customerFinanceService';

const CustomerBalanceManager: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<CustomerBalance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadCustomerBalances();
  }, []);

  const loadCustomerBalances = async () => {
    setLoading(true);
    try {
      const balanceData = await PaymentService.getAllCustomerBalances();
      setBalances(balanceData);
    } catch (error) {
      console.error('Error loading customer balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBalances = balances.filter(balance => {
    const matchesSearch =
      balance.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.customerId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || balance.customerType === filterType;

    return matchesSearch && matchesType;
  });

  const getPaymentStatusColor = (balance: CustomerBalance) => {
    if (balance.outstandingBalance === 0) return 'text-green-600 bg-green-100';
    if (balance.totalPaid > 0) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPaymentStatusText = (balance: CustomerBalance) => {
    if (balance.outstandingBalance === 0) return 'Fully Paid';
    if (balance.totalPaid > 0) return 'Partial Payment';
    return 'Not Paid';
  };

  const PaymentModal: React.FC<{ customer: CustomerBalance; onClose: () => void; onSuccess: () => void }> = ({
    customer,
    onClose,
    onSuccess
  }) => {
    const [paymentData, setPaymentData] = useState({
      amount: '',
      description: '',
      paymentMethod: 'cash',
      category: 'tuition',
      referenceNumber: '',
      notes: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      try {
        const result = await PaymentService.recordPayment({
          customerId: customer.customerId,
          customerName: customer.customerName,
          customerEmail: '', // Would need to get this from customer data
          customerType: customer.customerType,
          amount: parseFloat(paymentData.amount),
          description: paymentData.description,
          paymentMethod: paymentData.paymentMethod as any,
          status: 'pending',
          referenceNumber: paymentData.referenceNumber || undefined,
          notes: paymentData.notes || undefined,
          category: paymentData.category as any,
          programId: customer.programId,
          programName: customer.programName
        });

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          alert('Error recording payment: ' + result.error);
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        alert('Error recording payment');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Payment</h3>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{customer.customerName}</p>
            <p className="text-xs text-gray-500">{customer.customerType} • {customer.programName}</p>
            <p className="text-sm text-red-600 mt-1">
              Outstanding: KES {customer.outstandingBalance.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={customer.outstandingBalance}
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={paymentData.description}
                onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Payment description"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={paymentData.category}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="admission_fee">Admission Fee</option>
                  <option value="tuition">Tuition</option>
                  <option value="materials">Materials</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (Optional)</label>
              <input
                type="text"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Receipt number, confirmation code, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Additional notes about this payment"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer Balances</h2>
          <p className="text-gray-600">Track and manage customer payment balances</p>
        </div>
        <button
          onClick={() => loadCustomerBalances()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Types</option>
          <option value="lead">Leads</option>
          <option value="admission">Admissions</option>
          <option value="learner">Learners</option>
          <option value="instructor">Instructors</option>
        </select>
      </div>

      {/* Balances Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Program</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Expected</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Paid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Outstanding</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.map((balance) => (
                <tr key={balance.customerId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{balance.customerName}</div>
                    <div className="text-sm text-gray-500">{balance.customerId}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                      {balance.customerType}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{balance.programName || 'N/A'}</td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    KES {balance.totalExpected.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-green-600">
                    KES {balance.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-red-600">
                    KES {balance.outstandingBalance.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(balance)}`}>
                      {getPaymentStatusText(balance)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(balance);
                          setShowPaymentModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Payment</span>
                      </button>
                      <button
                        onClick={() => navigate(`/portal/finance/customer/${balance.customerId}`)}
                        className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBalances.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Customer Balances Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No customer balances have been recorded yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <PaymentModal
          customer={selectedCustomer}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomer(null);
          }}
          onSuccess={loadCustomerBalances}
        />
      )}
    </div>
  );
};

export default CustomerBalanceManager;