import React, { useState } from 'react';
import { Tag, TrendingUp, CreditCard, Receipt, Calendar, Search, Filter, Banknote } from 'lucide-react';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Total Revenue', value: 'KES 284,750', change: '+12%', icon: Banknote, color: 'primary' },
    { title: 'Monthly Revenue', value: 'KES 48,250', change: '+8%', icon: TrendingUp, color: 'accent' },
    { title: 'Outstanding', value: 'KES 12,340', change: '-5%', icon: Receipt, color: 'secondary' },
  ];

  const transactions = [
    {
      id: 'TXN001',
      student: 'Alice Johnson',
      type: 'tuition',
      amount: 2500,
      status: 'completed',
      date: '2025-01-15',
      description: 'Semester tuition fee',
    },
    {
      id: 'TXN002',
      student: 'Bob Smith',
      type: 'fee',
      amount: 150,
      status: 'pending',
      date: '2025-01-14',
      description: 'Laboratory fee',
    },
    {
      id: 'TXN003',
      student: 'Carol Davis',
      type: 'tuition',
      amount: 2500,
      status: 'overdue',
      date: '2025-01-10',
      description: 'Semester tuition fee',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'billing', label: 'Billing' },
    { id: 'reports', label: 'Reports' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-accent-100 text-accent-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tuition': return 'bg-primary-100 text-primary-800';
      case 'fee': return 'bg-secondary-100 text-secondary-800';
      case 'donation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Finance</h1>
            <p className="text-lg text-primary-100">
              Manage institutional finances, billing, and financial reporting.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Banknote className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div>
              {/* Revenue Chart Placeholder */}
              <div className="bg-gray-50 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-semibold text-secondary-800 mb-4">Revenue Trend</h3>
                <div className="h-64 flex items-center justify-center text-secondary-500">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-secondary-300" />
                    <p>Revenue chart would be displayed here</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Paid This Month', value: 'KES 45,230', icon: CreditCard, color: 'accent' },
                  { title: 'Pending Payments', value: 'KES 8,750', icon: Calendar, color: 'yellow' },
                  { title: 'Overdue Payments', value: 'KES 3,590', icon: Receipt, color: 'red' },
                  { title: 'Refunds Issued', value: 'KES 1,200', icon: Tag, color: 'secondary' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="p-6 border border-gray-200 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          item.color === 'accent' ? 'bg-accent-100' :
                          item.color === 'yellow' ? 'bg-yellow-100' :
                          item.color === 'red' ? 'bg-red-100' :
                          'bg-secondary-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            item.color === 'accent' ? 'text-accent-600' :
                            item.color === 'yellow' ? 'text-yellow-600' :
                            item.color === 'red' ? 'text-red-600' :
                            'text-secondary-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm text-secondary-600">{item.title}</p>
                          <p className="text-xl font-bold text-secondary-800">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{transaction.id}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{transaction.student}</div>
                            <div className="text-sm text-secondary-500">{transaction.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-secondary-800">KES {transaction.amount.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{new Date(transaction.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-2">Billing Management</h3>
              <p className="text-secondary-600">Manage billing cycles and invoice generation here.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-2">Financial Reports</h3>
              <p className="text-secondary-600">Generate and view detailed financial reports here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Finance;