import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { PaymentService } from '../../../services/paymentService';
import { FirestoreService } from '../../../services/firestore';

interface AdmissionFinanceData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  programName: string;
  applicationDate: string;
  admissionFee: number;
  amountPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  paymentStatus: 'not_paid' | 'partial' | 'paid';
  applicationStatus: string;
}

const AdmissionFinanceList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<AdmissionFinanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionFinanceData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadAdmissionFinances();
  }, []);

  const loadAdmissionFinances = async () => {
    setLoading(true);
    try {
      const [applicantsResult, balancesResult, programsResult] = await Promise.all([
        FirestoreService.getAll('applicants'),
        PaymentService.getAllCustomerBalances(),
        FirestoreService.getAll('programs')
      ]);

      if (applicantsResult.success && applicantsResult.data) {
        const admissionBalances = balancesResult.filter(b => b.customerType === 'admission');

        // Create a map of program IDs to program names
        const programMap: { [key: string]: string } = {};
        if (programsResult.success && programsResult.data) {
          programsResult.data.forEach((program: any) => {
            programMap[program.id] = program.programName || program.name || 'Unknown Program';
          });
        }

        const admissionFinanceData: AdmissionFinanceData[] = applicantsResult.data.map((applicant: any) => {
          const balance = admissionBalances.find(b => b.customerId === applicant.id);
          const admissionFee = applicant.admissionFee || applicant.expectedAmount || 0;
          const amountPaid = balance?.totalPaid || applicant.amountPaid || 0;
          const outstandingBalance = Math.max(0, admissionFee - amountPaid);

          let paymentStatus: 'not_paid' | 'partial' | 'paid' = 'not_paid';
          if (amountPaid === 0) {
            paymentStatus = 'not_paid';
          } else if (amountPaid >= admissionFee) {
            paymentStatus = 'paid';
          } else {
            paymentStatus = 'partial';
          }

          // Get program name from programId or fall back to programName
          const programName = applicant.programId
            ? programMap[applicant.programId] || 'Unknown Program'
            : applicant.programName || 'Unknown Program';

          return {
            id: applicant.id,
            name: `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Unknown',
            email: applicant.email || '',
            phone: applicant.phone,
            programName,
            applicationDate: applicant.applicationDate || applicant.createdAt || '',
            admissionFee,
            amountPaid,
            outstandingBalance,
            lastPaymentDate: balance?.lastPaymentDate,
            paymentStatus,
            applicationStatus: applicant.status || 'pending'
          };
        });

        setApplicants(admissionFinanceData);
      }
    } catch (error) {
      console.error('Error loading admission finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch =
      applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.programName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || applicant.paymentStatus === filterStatus;

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

  const getApplicationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'interview': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PaymentModal: React.FC<{ applicant: AdmissionFinanceData; onClose: () => void; onSuccess: () => void }> = ({
    applicant,
    onClose,
    onSuccess
  }) => {
    const [paymentData, setPaymentData] = useState({
      amount: applicant.outstandingBalance.toString(),
      description: `Admission fee payment for ${applicant.name}`,
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
          customerId: applicant.id,
          customerName: applicant.name,
          customerEmail: applicant.email,
          customerType: 'admission',
          amount: parseFloat(paymentData.amount),
          description: paymentData.description,
          paymentMethod: paymentData.paymentMethod as any,
          status: 'pending',
          referenceNumber: paymentData.referenceNumber || undefined,
          notes: paymentData.notes || undefined,
          category: 'admission_fee',
          programId: undefined,
          programName: applicant.programName
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Admission Fee Payment</h3>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{applicant.name}</p>
            <p className="text-xs text-gray-500">{applicant.email} • {applicant.programName}</p>
            <p className="text-sm text-red-600 mt-1">
              Outstanding: KES {applicant.outstandingBalance.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={applicant.outstandingBalance}
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
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

  const totalApplicants = applicants.length;
  const totalAdmissionFees = applicants.reduce((sum, applicant) => sum + applicant.admissionFee, 0);
  const totalPaid = applicants.reduce((sum, applicant) => sum + applicant.amountPaid, 0);
  const totalOutstanding = applicants.reduce((sum, applicant) => sum + applicant.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admission Finances</h1>
            <p className="text-lg text-primary-100">
              Track admission fee payments for applicants
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Building className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Applicants</p>
                <p className="text-2xl font-bold text-white">{totalApplicants}</p>
                <p className="text-sm font-medium text-primary-200">Applications</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Fees</p>
                <p className="text-2xl font-bold text-white">KES {totalAdmissionFees.toLocaleString()}</p>
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
            placeholder="Search applicants..."
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

      {/* Applicants Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Applicant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Program</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Application Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Admission Fee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Amount Paid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Outstanding</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Payment Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((applicant) => (
                <tr key={applicant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{applicant.name}</div>
                    <div className="text-sm text-gray-500">{applicant.email}</div>
                    {applicant.phone && (
                      <div className="text-xs text-gray-400">{applicant.phone}</div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-600">{applicant.programName}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getApplicationStatusColor(applicant.applicationStatus)}`}>
                      {applicant.applicationStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    KES {applicant.admissionFee.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-green-600">
                    KES {applicant.amountPaid.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-red-600">
                    KES {applicant.outstandingBalance.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(applicant.paymentStatus)}`}>
                      {applicant.paymentStatus === 'paid' ? 'Fully Paid' :
                       applicant.paymentStatus === 'partial' ? 'Partial' : 'Not Paid'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {applicant.outstandingBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedApplicant(applicant);
                            setShowPaymentModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Payment</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/portal/finance/customer/${applicant.id}`)}
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

          {filteredApplicants.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Applicants Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No admission applications have been submitted yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedApplicant && (
        <PaymentModal
          applicant={selectedApplicant}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedApplicant(null);
          }}
          onSuccess={loadAdmissionFinances}
        />
      )}
    </div>
  );
};

export default AdmissionFinanceList;