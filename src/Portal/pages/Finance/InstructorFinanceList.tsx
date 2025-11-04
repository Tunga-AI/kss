import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award
} from 'lucide-react';
import { PaymentService } from '../../../services/paymentService';
import { FirestoreService } from '../../../services/firestore';

interface InstructorFinanceData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  monthlySalary?: number;
  totalEarned: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  paymentStatus: 'up_to_date' | 'pending' | 'overdue';
  joinDate?: string;
  activePrograms?: string[];
}

const InstructorFinanceList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<InstructorFinanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorFinanceData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadInstructorFinances();
  }, []);

  const loadInstructorFinances = async () => {
    setLoading(true);
    try {
      const [instructorsResult, paymentsResult] = await Promise.all([
        FirestoreService.getAll('instructors'),
        PaymentService.getAllPayments({ customerType: 'instructor' })
      ]);

      if (instructorsResult.success && instructorsResult.data) {
        const instructorFinanceData: InstructorFinanceData[] = instructorsResult.data.map((instructor: any) => {
          const instructorPayments = paymentsResult.filter(p => p.customerId === instructor.id);
          const totalPaid = instructorPayments
            .filter(p => p.status === 'verified')
            .reduce((sum, p) => sum + p.amount, 0);

          const monthlySalary = instructor.salary || instructor.monthlySalary || 0;
          const monthsWorked = instructor.joinDate ?
            Math.ceil((Date.now() - new Date(instructor.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
          const totalEarned = monthlySalary * monthsWorked;
          const outstandingBalance = Math.max(0, totalEarned - totalPaid);

          let paymentStatus: 'up_to_date' | 'pending' | 'overdue' = 'up_to_date';
          if (outstandingBalance > 0) {
            const lastPayment = instructorPayments
              .filter(p => p.status === 'verified')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            const daysSinceLastPayment = lastPayment ?
              (Date.now() - new Date(lastPayment.createdAt).getTime()) / (1000 * 60 * 60 * 24) : Infinity;

            paymentStatus = daysSinceLastPayment > 45 ? 'overdue' : 'pending';
          }

          return {
            id: instructor.id,
            name: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.name || 'Unknown',
            email: instructor.email || '',
            phone: instructor.phone,
            employeeId: instructor.employeeId || instructor.staffId || `INS-${instructor.id.substring(0, 6)}`,
            department: instructor.department || 'Academic',
            position: instructor.position || instructor.role || 'Instructor',
            monthlySalary,
            totalEarned,
            totalPaid,
            outstandingBalance,
            lastPaymentDate: instructorPayments.length > 0 ?
              instructorPayments
                .filter(p => p.status === 'verified')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt : undefined,
            paymentStatus,
            joinDate: instructor.joinDate || instructor.hireDate || instructor.createdAt,
            activePrograms: instructor.programs || instructor.assignedPrograms || []
          };
        });

        setInstructors(instructorFinanceData);
      }
    } catch (error) {
      console.error('Error loading instructor finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch =
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || instructor.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'up_to_date': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PaymentModal: React.FC<{ instructor: InstructorFinanceData; onClose: () => void; onSuccess: () => void }> = ({
    instructor,
    onClose,
    onSuccess
  }) => {
    const [paymentData, setPaymentData] = useState({
      amount: instructor.monthlySalary?.toString() || '',
      description: `Salary payment for ${instructor.name}`,
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      notes: '',
      paymentPeriod: new Date().toISOString().slice(0, 7) // YYYY-MM format
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      try {
        const result = await PaymentService.recordPayment({
          customerId: instructor.id,
          customerName: instructor.name,
          customerEmail: instructor.email,
          customerType: 'instructor',
          amount: parseFloat(paymentData.amount),
          description: `${paymentData.description} - ${paymentData.paymentPeriod}`,
          paymentMethod: paymentData.paymentMethod as any,
          status: 'pending',
          referenceNumber: paymentData.referenceNumber || undefined,
          notes: paymentData.notes || undefined,
          category: 'salary'
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Instructor Payment</h3>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{instructor.name}</p>
            <p className="text-xs text-gray-500">{instructor.employeeId} • {instructor.position}</p>
            <p className="text-sm text-red-600 mt-1">
              Outstanding: KES {instructor.outstandingBalance.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Period</label>
              <input
                type="month"
                value={paymentData.paymentPeriod}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentPeriod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash Payment</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
              <input
                type="text"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Transaction reference"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Additional payment notes"
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

  const totalInstructors = instructors.length;
  const totalEarned = instructors.reduce((sum, instructor) => sum + instructor.totalEarned, 0);
  const totalPaid = instructors.reduce((sum, instructor) => sum + instructor.totalPaid, 0);
  const totalOutstanding = instructors.reduce((sum, instructor) => sum + instructor.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Instructor Finances</h1>
            <p className="text-lg text-primary-100">
              Manage instructor salaries and compensation
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Instructors</p>
                <p className="text-2xl font-bold text-white">{totalInstructors}</p>
                <p className="text-sm font-medium text-primary-200">Staff</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Earned</p>
                <p className="text-2xl font-bold text-white">KES {totalEarned.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Compensation</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Amount Paid</p>
                <p className="text-2xl font-bold text-white">KES {totalPaid.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Disbursed</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Outstanding</p>
                <p className="text-2xl font-bold text-white">KES {totalOutstanding.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Pending</p>
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
            placeholder="Search instructors..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Payment Status</option>
          <option value="up_to_date">Up to Date</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Instructors Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Instructor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Employee ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Position</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Monthly Salary</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total Earned</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Amount Paid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Outstanding</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstructors.map((instructor) => (
                <tr key={instructor.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Award className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{instructor.name}</div>
                        <div className="text-sm text-gray-500">{instructor.email}</div>
                        <div className="text-xs text-gray-400">{instructor.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{instructor.employeeId}</td>
                  <td className="py-4 px-4 text-gray-600">{instructor.position}</td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    KES {instructor.monthlySalary?.toLocaleString() || '0'}
                  </td>
                  <td className="py-4 px-4 font-medium text-purple-600">
                    KES {instructor.totalEarned.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-green-600">
                    KES {instructor.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-red-600">
                    KES {instructor.outstandingBalance.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getPaymentStatusColor(instructor.paymentStatus)}`}>
                      {instructor.paymentStatus.replace('_', ' ')}
                    </span>
                    {instructor.lastPaymentDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last: {new Date(instructor.lastPaymentDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedInstructor(instructor);
                          setShowPaymentModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Payment</span>
                      </button>
                      <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInstructors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Instructors Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No instructors have been added yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInstructor && (
        <PaymentModal
          instructor={selectedInstructor}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInstructor(null);
          }}
          onSuccess={loadInstructorFinances}
        />
      )}
    </div>
  );
};

export default InstructorFinanceList;