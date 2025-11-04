import React, { useState, useEffect } from 'react';
import {
  Receipt,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Zap,
  Car,
  Wifi,
  Coffee,
  Package
} from 'lucide-react';
import { PaymentService } from '../../../services/paymentService';

interface BillExpenseData {
  id: string;
  transactionId: string;
  title: string;
  description: string;
  category: 'utilities' | 'rent' | 'supplies' | 'transport' | 'marketing' | 'technology' | 'other';
  vendor?: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  recurring?: boolean;
  recurringPeriod?: 'monthly' | 'quarterly' | 'yearly';
}

const BillsExpensesList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<BillExpenseData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillExpenseData | null>(null);

  useEffect(() => {
    loadBillsExpenses();
  }, []);

  const loadBillsExpenses = async () => {
    setLoading(true);
    try {
      const billPayments = await PaymentService.getAllPayments({ category: 'bills' });

      const billsData: BillExpenseData[] = billPayments.map((payment: any) => {
        const isOverdue = payment.dueDate && new Date(payment.dueDate) < new Date() && payment.status !== 'verified';

        return {
          id: payment.id || Math.random().toString(36).substr(2, 9),
          transactionId: payment.transactionId,
          title: payment.description || 'Untitled Expense',
          description: payment.description || '',
          category: getCategoryFromDescription(payment.description) as any,
          vendor: payment.notes?.includes('Vendor:') ?
            payment.notes.split('Vendor:')[1]?.split('\n')[0]?.trim() : undefined,
          amount: payment.amount,
          dueDate: payment.dueDate,
          paidDate: payment.status === 'verified' ? payment.verifiedAt || payment.createdAt : undefined,
          status: isOverdue ? 'overdue' : payment.status === 'verified' ? 'paid' : 'pending',
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          notes: payment.notes,
          createdAt: payment.createdAt,
          recurring: payment.notes?.includes('Recurring:') || false,
          recurringPeriod: payment.notes?.includes('Monthly') ? 'monthly' :
                          payment.notes?.includes('Quarterly') ? 'quarterly' :
                          payment.notes?.includes('Yearly') ? 'yearly' : undefined
        };
      });

      setBills(billsData);
    } catch (error) {
      console.error('Error loading bills and expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromDescription = (description: string): string => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas') || desc.includes('utility')) return 'utilities';
    if (desc.includes('rent') || desc.includes('lease')) return 'rent';
    if (desc.includes('office') || desc.includes('supplies') || desc.includes('stationery')) return 'supplies';
    if (desc.includes('transport') || desc.includes('fuel') || desc.includes('travel')) return 'transport';
    if (desc.includes('marketing') || desc.includes('advertising') || desc.includes('promotion')) return 'marketing';
    if (desc.includes('software') || desc.includes('technology') || desc.includes('internet') || desc.includes('hosting')) return 'technology';
    return 'other';
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch =
      bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || bill.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'utilities': return <Zap className="h-4 w-4" />;
      case 'rent': return <Building className="h-4 w-4" />;
      case 'supplies': return <Package className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      case 'marketing': return <Coffee className="h-4 w-4" />;
      case 'technology': return <Wifi className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'utilities': return 'bg-yellow-100 text-yellow-800';
      case 'rent': return 'bg-blue-100 text-blue-800';
      case 'supplies': return 'bg-green-100 text-green-800';
      case 'transport': return 'bg-purple-100 text-purple-800';
      case 'marketing': return 'bg-pink-100 text-pink-800';
      case 'technology': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AddBillModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [billData, setBillData] = useState({
      title: '',
      description: '',
      category: 'other',
      vendor: '',
      amount: '',
      dueDate: '',
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      notes: '',
      recurring: false,
      recurringPeriod: 'monthly'
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      try {
        const notes = `${billData.notes}\n${billData.vendor ? `Vendor: ${billData.vendor}` : ''}\n${billData.recurring ? `Recurring: ${billData.recurringPeriod}` : ''}`.trim();

        const result = await PaymentService.recordPayment({
          customerId: 'organization',
          customerName: 'Kenya School of Sales',
          customerEmail: 'finance@kenyaschoolofsales.com',
          customerType: 'general',
          amount: parseFloat(billData.amount),
          description: billData.title,
          paymentMethod: billData.paymentMethod as any,
          status: 'pending',
          referenceNumber: billData.referenceNumber || undefined,
          notes: notes || undefined,
          category: 'bills',
          dueDate: billData.dueDate || undefined
        });

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          alert('Error recording bill: ' + result.error);
        }
      } catch (error) {
        console.error('Error recording bill:', error);
        alert('Error recording bill');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Bill/Expense</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={billData.title}
                onChange={(e) => setBillData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Electricity Bill - March 2024"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={billData.category}
                  onChange={(e) => setBillData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent/Lease</option>
                  <option value="supplies">Supplies</option>
                  <option value="transport">Transport</option>
                  <option value="marketing">Marketing</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={billData.amount}
                  onChange={(e) => setBillData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Supplier</label>
              <input
                type="text"
                value={billData.vendor}
                onChange={(e) => setBillData(prev => ({ ...prev, vendor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Company or person name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={billData.dueDate}
                  onChange={(e) => setBillData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={billData.paymentMethod}
                  onChange={(e) => setBillData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
              <input
                type="text"
                value={billData.referenceNumber}
                onChange={(e) => setBillData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Invoice number, receipt number, etc."
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={billData.recurring}
                  onChange={(e) => setBillData(prev => ({ ...prev, recurring: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Recurring Bill</span>
              </label>
              {billData.recurring && (
                <select
                  value={billData.recurringPeriod}
                  onChange={(e) => setBillData(prev => ({ ...prev, recurringPeriod: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={billData.notes}
                onChange={(e) => setBillData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Additional notes about this bill or expense"
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
                {saving ? 'Adding...' : 'Add Bill'}
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

  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0);
  const totalPending = bills.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0);
  const totalOverdue = bills.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bills & Expenses</h1>
            <p className="text-lg text-primary-100">
              Track organizational expenses and bills
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Receipt className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Bills</p>
                <p className="text-2xl font-bold text-white">{totalBills}</p>
                <p className="text-sm font-medium text-primary-200">Recorded</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Amount</p>
                <p className="text-2xl font-bold text-white">KES {totalAmount.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">All Bills</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Paid</p>
                <p className="text-2xl font-bold text-white">KES {totalPaid.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Completed</p>
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
                <p className="text-2xl font-bold text-white">KES {(totalPending + totalOverdue).toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Outstanding</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bills and expenses..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Categories</option>
          <option value="utilities">Utilities</option>
          <option value="rent">Rent/Lease</option>
          <option value="supplies">Supplies</option>
          <option value="transport">Transport</option>
          <option value="marketing">Marketing</option>
          <option value="technology">Technology</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Bill/Expense</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{bill.title}</div>
                      <div className="text-sm text-gray-500">{bill.description}</div>
                      <div className="text-xs text-gray-400">ID: {bill.transactionId}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full capitalize ${getCategoryColor(bill.category)}`}>
                      {getCategoryIcon(bill.category)}
                      <span>{bill.category}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{bill.vendor || 'N/A'}</td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    KES {bill.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    {bill.dueDate ? (
                      <div className="text-gray-600">
                        {new Date(bill.dueDate).toLocaleDateString()}
                        {bill.status === 'overdue' && (
                          <div className="text-xs text-red-600">Overdue</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                    {bill.paidDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Paid: {new Date(bill.paidDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                      {bill.status !== 'paid' && (
                        <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors">
                          <CheckCircle className="h-3 w-3" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBills.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bills or Expenses Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No bills or expenses have been recorded yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <AddBillModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadBillsExpenses}
        />
      )}
    </div>
  );
};

export default BillsExpensesList;