import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { PaymentService, CustomerBalance } from '../../../services/paymentService';
import { FirestoreService } from '../../../services/firestore';

interface LearnerFinanceData {
  id: string;
  name: string;
  email: string;
  studentId: string;
  programName: string;
  cohort: string;
  totalFees: number;
  amountPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  paymentStatus: 'not_paid' | 'partial' | 'paid';
  enrollmentDate: string;
}

const LearnerFinanceList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState<LearnerFinanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLearner, setSelectedLearner] = useState<LearnerFinanceData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadLearnerFinances();
  }, []);

  const loadLearnerFinances = async () => {
    setLoading(true);
    try {
      const [learnersResult, balancesResult, programsResult] = await Promise.all([
        FirestoreService.getAll('learners'),
        PaymentService.getAllCustomerBalances(),
        FirestoreService.getAll('programs')
      ]);

      if (learnersResult.success && learnersResult.data) {
        const learnerBalances = balancesResult.filter(b => b.customerType === 'learner');

        // Create a map of program IDs to program names
        const programMap: { [key: string]: string } = {};
        if (programsResult.success && programsResult.data) {
          programsResult.data.forEach((program: any) => {
            programMap[program.id] = program.programName || program.name || 'Unknown Program';
          });
        }

        const learnerFinanceData: LearnerFinanceData[] = learnersResult.data.map((learner: any) => {
          const balance = learnerBalances.find(b => b.customerId === learner.id);
          const totalFees = learner.totalFees || learner.expectedAmount || 0;
          const amountPaid = balance?.totalPaid || learner.amountPaid || learner.totalAmountPaid || 0;
          const outstandingBalance = Math.max(0, totalFees - amountPaid);

          let paymentStatus: 'not_paid' | 'partial' | 'paid' = 'not_paid';
          if (amountPaid === 0) {
            paymentStatus = 'not_paid';
          } else if (amountPaid >= totalFees) {
            paymentStatus = 'paid';
          } else {
            paymentStatus = 'partial';
          }

          // Get program name from programId or fall back to programName
          const programName = learner.programId
            ? programMap[learner.programId] || 'Unknown Program'
            : learner.programName || 'Unknown Program';

          return {
            id: learner.id,
            name: `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || 'Unknown',
            email: learner.email || '',
            studentId: learner.studentId || `STD-${learner.id.substring(0, 6)}`,
            programName,
            cohort: learner.cohort || learner.cohortName || 'N/A',
            totalFees,
            amountPaid,
            outstandingBalance,
            lastPaymentDate: balance?.lastPaymentDate,
            paymentStatus,
            enrollmentDate: learner.enrollmentDate || learner.createdAt || ''
          };
        });

        setLearners(learnerFinanceData);
      }
    } catch (error) {
      console.error('Error loading learner finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLearners = learners.filter(learner => {
    const matchesSearch =
      learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.programName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || learner.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'not_paid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Fully Paid';
      case 'partial': return 'Partial Payment';
      case 'not_paid': return 'Not Paid';
      default: return 'Unknown';
    }
  };

  const PaymentModal: React.FC<{ learner: LearnerFinanceData; onClose: () => void; onSuccess: () => void }> = ({
    learner,
    onClose,
    onSuccess
  }) => {
    const [paymentData, setPaymentData] = useState({
      amount: '',
      description: `Tuition payment for ${learner.name}`,
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      try {
        const result = await PaymentService.recordPayment({
          customerId: learner.id,
          customerName: learner.name,
          customerEmail: learner.email,
          customerType: 'learner',
          amount: parseFloat(paymentData.amount),
          description: paymentData.description,
          paymentMethod: paymentData.paymentMethod as any,
          status: 'pending',
          referenceNumber: paymentData.referenceNumber || undefined,
          notes: paymentData.notes || undefined,
          category: 'tuition',
          programId: undefined,
          programName: learner.programName,
          cohort: learner.cohort
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Tuition Payment</h3>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{learner.name}</p>
            <p className="text-xs text-gray-500">{learner.studentId} • {learner.programName}</p>
            <p className="text-sm text-red-600 mt-1">
              Outstanding: KES {learner.outstandingBalance.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={learner.outstandingBalance}
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
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
                <option value="cash">Cash Payment</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Cheque</option>
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
                placeholder="Receipt/confirmation number"
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

  const totalLearners = learners.length;
  const totalFees = learners.reduce((sum, learner) => sum + learner.totalFees, 0);
  const totalPaid = learners.reduce((sum, learner) => sum + learner.amountPaid, 0);
  const totalOutstanding = learners.reduce((sum, learner) => sum + learner.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Learner Finances</h1>
            <p className="text-lg text-primary-100">
              Track tuition payments and learner balances
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Learners</p>
                <p className="text-2xl font-bold text-white">{totalLearners}</p>
                <p className="text-sm font-medium text-primary-200">Enrolled</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Fees</p>
                <p className="text-2xl font-bold text-white">KES {totalFees.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Expected</p>
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
                <p className="text-sm font-medium text-primary-200">Collected</p>
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
            placeholder="Search learners..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Payment Status</option>
          <option value="paid">Fully Paid</option>
          <option value="partial">Partial Payment</option>
          <option value="not_paid">Not Paid</option>
        </select>
      </div>

      {/* Learners Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Learner</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Program</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total Fees</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Amount Paid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Outstanding</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLearners.map((learner) => (
                <tr key={learner.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{learner.name}</div>
                    <div className="text-sm text-gray-500">{learner.email}</div>
                    <div className="text-xs text-gray-400">Cohort: {learner.cohort}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{learner.studentId}</td>
                  <td className="py-4 px-4 text-gray-600">{learner.programName}</td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    KES {learner.totalFees.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-green-600">
                    KES {learner.amountPaid.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-red-600">
                    KES {learner.outstandingBalance.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(learner.paymentStatus)}`}>
                      {getPaymentStatusText(learner.paymentStatus)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {learner.outstandingBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedLearner(learner);
                            setShowPaymentModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Payment</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/portal/finance/customer/${learner.id}`)}
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

          {filteredLearners.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Learners Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No learners have been enrolled yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedLearner && (
        <PaymentModal
          learner={selectedLearner}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedLearner(null);
          }}
          onSuccess={loadLearnerFinances}
        />
      )}
    </div>
  );
};

export default LearnerFinanceList;