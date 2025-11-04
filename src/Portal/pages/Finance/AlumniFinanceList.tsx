import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  GraduationCap,
  Trophy,
  Star
} from 'lucide-react';
import { PaymentService } from '../../../services/paymentService';
import { FirestoreService } from '../../../services/firestore';

interface AlumniFinanceData {
  id: string;
  name: string;
  email: string;
  studentId: string;
  programName: string;
  cohort: string;
  graduationDate: string;
  totalFeesCharged: number;
  totalAmountPaid: number;
  finalBalance: number;
  paymentCompletion: number; // percentage
  lastPaymentDate?: string;
  enrollmentDate: string;
  programDuration: string;
}

const AlumniFinanceList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<AlumniFinanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    loadAlumniFinances();
  }, []);

  const loadAlumniFinances = async () => {
    setLoading(true);
    try {
      const [learnersResult, balancesResult, programsResult] = await Promise.all([
        FirestoreService.getAll('learners'),
        PaymentService.getAllCustomerBalances(),
        FirestoreService.getAll('programs')
      ]);

      if (learnersResult.success && learnersResult.data) {
        // Filter for alumni (learners who have graduated or completed)
        const graduatedLearners = learnersResult.data.filter((learner: any) =>
          learner.academicStatus === 'graduated' ||
          learner.status === 'graduated' ||
          learner.graduationDate ||
          learner.academicStatus === 'completed'
        );

        const learnerBalances = balancesResult.filter(b => b.customerType === 'learner');

        // Create a map of program IDs to program names
        const programMap: { [key: string]: string } = {};
        if (programsResult.success && programsResult.data) {
          programsResult.data.forEach((program: any) => {
            programMap[program.id] = program.programName || program.name || 'Unknown Program';
          });
        }

        const alumniFinanceData: AlumniFinanceData[] = graduatedLearners.map((alumnus: any) => {
          const balance = learnerBalances.find(b => b.customerId === alumnus.id);
          const totalFeesCharged = alumnus.totalFees || alumnus.expectedAmount || 0;
          const totalAmountPaid = balance?.totalPaid || alumnus.amountPaid || alumnus.totalAmountPaid || 0;
          const finalBalance = totalFeesCharged - totalAmountPaid;
          const paymentCompletion = totalFeesCharged > 0 ? (totalAmountPaid / totalFeesCharged) * 100 : 0;

          // Calculate program duration
          const enrollmentDate = new Date(alumnus.enrollmentDate || alumnus.createdAt || Date.now());
          const graduationDate = new Date(alumnus.graduationDate || Date.now());
          const durationMonths = Math.round((graduationDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

          // Get program name from programId or fall back to programName
          const programName = alumnus.programId
            ? programMap[alumnus.programId] || 'Unknown Program'
            : alumnus.programName || 'Unknown Program';

          return {
            id: alumnus.id,
            name: `${alumnus.firstName || ''} ${alumnus.lastName || ''}`.trim() || 'Unknown',
            email: alumnus.email || '',
            studentId: alumnus.studentId || `ALM-${alumnus.id.substring(0, 6)}`,
            programName,
            cohort: alumnus.cohort || alumnus.cohortName || 'N/A',
            graduationDate: alumnus.graduationDate || alumnus.completionDate || '',
            totalFeesCharged,
            totalAmountPaid,
            finalBalance,
            paymentCompletion: Math.min(100, Math.max(0, paymentCompletion)),
            lastPaymentDate: balance?.lastPaymentDate,
            enrollmentDate: alumnus.enrollmentDate || alumnus.createdAt || '',
            programDuration: durationMonths > 0 ? `${durationMonths} months` : 'N/A'
          };
        });

        setAlumni(alumniFinanceData);
      }

      if (programsResult.success && programsResult.data) {
        setPrograms(programsResult.data);
      }
    } catch (error) {
      console.error('Error loading alumni finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter(alumnus => {
    const matchesSearch =
      alumnus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.programName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = filterProgram === 'all' || alumnus.programName === filterProgram;

    return matchesSearch && matchesProgram;
  });

  const getPaymentCompletionColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPaymentCompletionText = (percentage: number) => {
    if (percentage >= 100) return 'Fully Paid';
    if (percentage >= 80) return 'Nearly Complete';
    if (percentage >= 60) return 'Partial Payment';
    if (percentage >= 40) return 'Limited Payment';
    return 'Minimal Payment';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalAlumni = alumni.length;
  const totalFeesCharged = alumni.reduce((sum, alumnus) => sum + alumnus.totalFeesCharged, 0);
  const totalAmountPaid = alumni.reduce((sum, alumnus) => sum + alumnus.totalAmountPaid, 0);
  const averageCompletion = alumni.length > 0 ? alumni.reduce((sum, alumnus) => sum + alumnus.paymentCompletion, 0) / alumni.length : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Alumni Finances</h1>
            <p className="text-lg text-primary-100">
              Financial records of program graduates
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Award className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Alumni</p>
                <p className="text-2xl font-bold text-white">{totalAlumni}</p>
                <p className="text-sm font-medium text-primary-200">Graduates</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total Fees</p>
                <p className="text-2xl font-bold text-white">KES {totalFeesCharged.toLocaleString()}</p>
                <p className="text-sm font-medium text-primary-200">Charged</p>
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
                <p className="text-2xl font-bold text-white">KES {totalAmountPaid.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-primary-100">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{averageCompletion.toFixed(1)}%</p>
                <p className="text-sm font-medium text-primary-200">Average</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
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
            placeholder="Search alumni..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
        <select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Programs</option>
          {programs.map((program) => (
            <option key={program.id} value={program.programName}>
              {program.programName}
            </option>
          ))}
        </select>
      </div>

      {/* Alumni Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Alumni</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Program</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Graduation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fees Charged</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Amount Paid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Payment Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumni.map((alumnus) => (
                <tr key={alumnus.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{alumnus.name}</div>
                        <div className="text-sm text-gray-500">{alumnus.email}</div>
                        <div className="text-xs text-gray-400">Cohort: {alumnus.cohort}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{alumnus.studentId}</td>
                  <td className="py-4 px-4">
                    <div className="text-gray-800">{alumnus.programName}</div>
                    <div className="text-xs text-gray-500">Duration: {alumnus.programDuration}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-gray-800">
                      {alumnus.graduationDate ? new Date(alumnus.graduationDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {alumnus.lastPaymentDate ? `Last payment: ${new Date(alumnus.lastPaymentDate).toLocaleDateString()}` : 'No payments'}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    KES {alumnus.totalFeesCharged.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-medium text-green-600">
                    KES {alumnus.totalAmountPaid.toLocaleString()}
                    {alumnus.finalBalance !== 0 && (
                      <div className={`text-xs ${alumnus.finalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {alumnus.finalBalance > 0 ? 'Outstanding' : 'Overpaid'}: KES {Math.abs(alumnus.finalBalance).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getPaymentCompletionColor(alumnus.paymentCompletion)}`}
                          style={{ width: `${Math.min(100, alumnus.paymentCompletion)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {alumnus.paymentCompletion.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getPaymentCompletionText(alumnus.paymentCompletion)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/portal/finance/customer/${alumnus.id}`)}
                        className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Details</span>
                      </button>
                      {alumnus.paymentCompletion >= 100 && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs">
                          <Star className="h-3 w-3" />
                          <span>Complete</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAlumni.length === 0 && (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Alumni Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterProgram !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No alumni records have been created yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Completion Distribution */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Completion Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { range: '100%', label: 'Fully Paid', color: 'bg-green-500', count: alumni.filter(a => a.paymentCompletion >= 100).length },
            { range: '80-99%', label: 'Nearly Complete', color: 'bg-green-400', count: alumni.filter(a => a.paymentCompletion >= 80 && a.paymentCompletion < 100).length },
            { range: '60-79%', label: 'Partial Payment', color: 'bg-yellow-500', count: alumni.filter(a => a.paymentCompletion >= 60 && a.paymentCompletion < 80).length },
            { range: '40-59%', label: 'Limited Payment', color: 'bg-orange-500', count: alumni.filter(a => a.paymentCompletion >= 40 && a.paymentCompletion < 60).length },
            { range: '0-39%', label: 'Minimal Payment', color: 'bg-red-500', count: alumni.filter(a => a.paymentCompletion < 40).length },
          ].map((item) => (
            <div key={item.range} className="text-center">
              <div className={`w-12 h-12 ${item.color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                {item.count}
              </div>
              <div className="text-sm font-medium text-gray-800">{item.range}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlumniFinanceList;