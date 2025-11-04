import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  DollarSign,
  Users,
  Building,
  Award,
  Receipt,
  Target,
  RefreshCw,
  Filter
} from 'lucide-react';
import { PaymentService } from '../../../services/paymentService';
import { CustomerFinanceService } from '../../../services/customerFinanceService';

interface ReportData {
  totalRevenue: number;
  monthlyRevenue: { month: string; amount: number; }[];
  categoryBreakdown: { category: string; amount: number; count: number; }[];
  customerTypeBreakdown: { type: string; amount: number; count: number; }[];
  paymentMethodBreakdown: { method: string; amount: number; count: number; }[];
  outstandingByType: { type: string; amount: number; count: number; }[];
  monthlyGrowth: number;
  conversionRates: {
    leadToCustomer: number;
    customerToApplicant: number;
    applicantToLearner: number;
  };
}

const FinanceReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    end: new Date().toISOString().split('T')[0] // Today
  });
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    generateReports();
  }, [dateRange]);

  const generateReports = async () => {
    setLoading(true);
    try {
      const [allPayments, financeOverview] = await Promise.all([
        PaymentService.getAllPayments(),
        CustomerFinanceService.getFinanceOverview()
      ]);

      // Filter payments by date range
      const filteredPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return paymentDate >= startDate && paymentDate <= endDate;
      });

      const verifiedPayments = filteredPayments.filter(p => p.status === 'verified');

      // Calculate monthly revenue
      const monthlyRevenue = [];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const monthPayments = verifiedPayments.filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        const monthAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);

        monthlyRevenue.push({
          month: currentDate.toISOString().slice(0, 7), // YYYY-MM format
          amount: monthAmount
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Category breakdown
      const categoryBreakdown = Object.entries(
        verifiedPayments.reduce((acc: any, payment) => {
          const category = payment.category || 'other';
          if (!acc[category]) acc[category] = { amount: 0, count: 0 };
          acc[category].amount += payment.amount;
          acc[category].count += 1;
          return acc;
        }, {})
      ).map(([category, data]: [string, any]) => ({
        category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount: data.amount,
        count: data.count
      }));

      // Customer type breakdown
      const customerTypeBreakdown = Object.entries(
        verifiedPayments.reduce((acc: any, payment) => {
          const type = payment.customerType || 'general';
          if (!acc[type]) acc[type] = { amount: 0, count: 0 };
          acc[type].amount += payment.amount;
          acc[type].count += 1;
          return acc;
        }, {})
      ).map(([type, data]: [string, any]) => ({
        type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount: data.amount,
        count: data.count
      }));

      // Payment method breakdown
      const paymentMethodBreakdown = Object.entries(
        verifiedPayments.reduce((acc: any, payment) => {
          const method = payment.paymentMethod || 'other';
          if (!acc[method]) acc[method] = { amount: 0, count: 0 };
          acc[method].amount += payment.amount;
          acc[method].count += 1;
          return acc;
        }, {})
      ).map(([method, data]: [string, any]) => ({
        method: method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount: data.amount,
        count: data.count
      }));

      // Outstanding by type
      const allCustomerBalances = await PaymentService.getAllCustomerBalances();
      const outstandingByType = Object.entries(
        allCustomerBalances.reduce((acc: any, balance) => {
          const type = balance.customerType || 'general';
          if (!acc[type]) acc[type] = { amount: 0, count: 0 };
          if (balance.outstandingBalance > 0) {
            acc[type].amount += balance.outstandingBalance;
            acc[type].count += 1;
          }
          return acc;
        }, {})
      ).map(([type, data]: [string, any]) => ({
        type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount: data.amount,
        count: data.count
      }));

      // Calculate monthly growth
      const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.amount || 0;
      const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.amount || 0;
      const monthlyGrowth = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      const report: ReportData = {
        totalRevenue: verifiedPayments.reduce((sum, p) => sum + p.amount, 0),
        monthlyRevenue,
        categoryBreakdown,
        customerTypeBreakdown,
        paymentMethodBreakdown,
        outstandingByType,
        monthlyGrowth,
        conversionRates: financeOverview.conversionRates
      };

      setReportData(report);
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: string) => {
    if (!reportData) return;

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'revenue':
        csvContent = [
          ['Month', 'Revenue'].join(','),
          ...reportData.monthlyRevenue.map(item => [item.month, item.amount].join(','))
        ].join('\n');
        filename = 'revenue_report';
        break;

      case 'categories':
        csvContent = [
          ['Category', 'Amount', 'Count'].join(','),
          ...reportData.categoryBreakdown.map(item => [item.category, item.amount, item.count].join(','))
        ].join('\n');
        filename = 'category_breakdown';
        break;

      case 'outstanding':
        csvContent = [
          ['Customer Type', 'Outstanding Amount', 'Count'].join(','),
          ...reportData.outstandingByType.map(item => [item.type, item.amount, item.count].join(','))
        ].join('\n');
        filename = 'outstanding_balances';
        break;

      default:
        csvContent = [
          ['Metric', 'Value'].join(','),
          ['Total Revenue', reportData.totalRevenue].join(','),
          ['Monthly Growth', `${reportData.monthlyGrowth.toFixed(2)}%`].join(','),
          ['Lead to Customer Conversion', `${reportData.conversionRates.leadToCustomer.toFixed(2)}%`].join(','),
          ['Customer to Applicant Conversion', `${reportData.conversionRates.customerToApplicant.toFixed(2)}%`].join(','),
          ['Applicant to Learner Conversion', `${reportData.conversionRates.applicantToLearner.toFixed(2)}%`].join(','),
        ].join('\n');
        filename = 'financial_summary';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${dateRange.start}_to_${dateRange.end}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to Generate Reports</h3>
        <p className="text-gray-600">Please try again or contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
          <p className="text-gray-600">Generate and view detailed financial reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportReport('overview')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={generateReports}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Report Period:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">KES {reportData.totalRevenue.toLocaleString()}</p>
              <p className={`text-sm ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth.toFixed(1)}% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lead Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.conversionRates.leadToCustomer.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Lead to Customer</p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payment Methods</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.paymentMethodBreakdown.length}</p>
              <p className="text-sm text-gray-500">Active methods</p>
            </div>
            <Receipt className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                KES {reportData.outstandingByType.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {reportData.outstandingByType.reduce((sum, item) => sum + item.count, 0)} customers
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Revenue Trend</h3>
            <button
              onClick={() => exportReport('revenue')}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>
          <div className="space-y-3">
            {reportData.monthlyRevenue.slice(-6).map((item, index) => {
              const maxAmount = Math.max(...reportData.monthlyRevenue.map(m => m.amount));
              const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-16 text-sm text-gray-600">{item.month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-24 text-sm font-medium text-gray-800 text-right">
                    KES {item.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Revenue by Category</h3>
            <button
              onClick={() => exportReport('categories')}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>
          <div className="space-y-3">
            {reportData.categoryBreakdown.map((item, index) => {
              const percentage = reportData.totalRevenue > 0 ? (item.amount / reportData.totalRevenue) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm text-gray-600">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">KES {item.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}% ({item.count} transactions)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Type Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Revenue by Customer Type</h3>
          </div>
          <div className="space-y-3">
            {reportData.customerTypeBreakdown.map((item, index) => {
              const percentage = reportData.totalRevenue > 0 ? (item.amount / reportData.totalRevenue) * 100 : 0;
              const icons = [Users, Building, Award, Receipt];
              const Icon = icons[index % icons.length];

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">KES {item.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}% ({item.count} transactions)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Outstanding Balances</h3>
            <button
              onClick={() => exportReport('outstanding')}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>
          <div className="space-y-3">
            {reportData.outstandingByType.map((item, index) => {
              const totalOutstanding = reportData.outstandingByType.reduce((sum, i) => sum + i.amount, 0);
              const percentage = totalOutstanding > 0 ? (item.amount / totalOutstanding) * 100 : 0;

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-600">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">KES {item.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}% ({item.count} customers)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Customer Conversion Funnel</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Users className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">Leads</p>
            <p className="text-xs text-gray-500">Starting point</p>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">
                {reportData.conversionRates.leadToCustomer.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Target className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">Customers</p>
            <p className="text-xs text-gray-500">Interested</p>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">
                {reportData.conversionRates.customerToApplicant.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 text-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Building className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">Applicants</p>
            <p className="text-xs text-gray-500">Applied</p>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <span className="text-xs text-gray-500">
                {reportData.conversionRates.applicantToLearner.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 text-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Award className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-800">Learners</p>
            <p className="text-xs text-gray-500">Enrolled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceReports;