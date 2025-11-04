import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Receipt,
  Clock,
  CheckCircle,
  UserPlus,
  GraduationCap,
  Building
} from 'lucide-react';
import { CustomerFinanceService, FinanceOverview } from '../../../services/customerFinanceService';
import { PaymentService } from '../../../services/paymentService';

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewData, payments] = await Promise.all([
        CustomerFinanceService.getFinanceOverview(),
        PaymentService.getAllPayments()
      ]);

      setOverview(overviewData);
      setRecentPayments(
        payments
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600">Unable to load finance dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Finance Dashboard</h1>
            <p className="text-lg text-primary-100">
              Comprehensive financial oversight and customer journey tracking
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Banknote className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                KES {overview.revenue.total.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Collected</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                KES {overview.outstanding.total.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">Pending</span>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Receipt className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Learners</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalLearners}</p>
              <div className="flex items-center mt-1">
                <Users className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Enrolled</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview.conversionRates.leadToCustomer.toFixed(1)}%
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">Lead to Customer</span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Revenue Breakdown</h2>
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Admission Fees</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                KES {overview.revenue.admissionFees.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Tuition Fees</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                KES {overview.revenue.tuitionFees.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Other Fees</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                KES {overview.revenue.otherFees.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Customer Journey</h2>
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Leads</span>
              <span className="text-sm font-medium text-gray-800">{overview.totalLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customers</span>
              <span className="text-sm font-medium text-gray-800">{overview.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Applicants</span>
              <span className="text-sm font-medium text-gray-800">{overview.totalApplicants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Learners</span>
              <span className="text-sm font-medium text-gray-800">{overview.totalLearners}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Graduates</span>
              <span className="text-sm font-medium text-gray-800">{overview.totalGraduates}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Recent Payments</h2>
            <Clock className="h-6 w-6 text-primary-600" />
          </div>
          <div className="space-y-4">
            {recentPayments.length > 0 ? recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{payment.customerName}</p>
                  <p className="text-xs text-gray-500">{payment.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    KES {payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No recent payments</p>
            )}
          </div>
          <button
            onClick={() => navigate('/portal/finance/transactions')}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            View All Transactions
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Quick Actions</h2>
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/portal/finance/admissions')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building className="h-6 w-6 text-primary-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Admissions</p>
              <p className="text-xs text-gray-500">Manage admission payments</p>
            </button>

            <button
              onClick={() => navigate('/portal/finance/learners')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <GraduationCap className="h-6 w-6 text-primary-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Learners</p>
              <p className="text-xs text-gray-500">Track tuition payments</p>
            </button>

            <button
              onClick={() => navigate('/portal/finance/instructors')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-primary-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Instructors</p>
              <p className="text-xs text-gray-500">Manage instructor payments</p>
            </button>

            <button
              onClick={() => navigate('/portal/finance/bills')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Receipt className="h-6 w-6 text-primary-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Bills</p>
              <p className="text-xs text-gray-500">Track expenses & bills</p>
            </button>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-800">Conversion Funnel</h2>
          <TrendingUp className="h-6 w-6 text-primary-600" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <UserPlus className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">{overview.totalLeads}</p>
            <p className="text-xs text-gray-500">Leads</p>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">
                {overview.conversionRates.leadToCustomer.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Users className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">{overview.totalCustomers}</p>
            <p className="text-xs text-gray-500">Customers</p>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">
                {overview.conversionRates.customerToApplicant.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 text-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Building className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">{overview.totalApplicants}</p>
            <p className="text-xs text-gray-500">Applicants</p>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">
                {overview.conversionRates.applicantToLearner.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 text-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <GraduationCap className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">{overview.totalLearners}</p>
            <p className="text-xs text-gray-500">Learners</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;