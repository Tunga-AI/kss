import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  FileText,
  Phone,
  Mail,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  MoreVertical
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface Corporate {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  totalRevenue: number;
  outstandingAmount: number;
  lastPaymentDate: string;
  status: 'active' | 'inactive' | 'pending';
  contractStartDate: string;
  contractEndDate: string;
  employeesCount: number;
  trainingPrograms: string[];
  paymentTerms: number; // days
  createdAt: string;
  updatedAt: string;
}

const CorporatesFinanceList: React.FC = () => {
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCorporates();
  }, []);

  const loadCorporates = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since the corporates collection might not exist yet
      const mockCorporates: Corporate[] = [
        {
          id: '1',
          companyName: 'Safaricom PLC',
          contactPerson: 'John Kimani',
          email: 'j.kimani@safaricom.co.ke',
          phone: '+254722123456',
          address: 'Westlands, Nairobi',
          industry: 'Telecommunications',
          totalRevenue: 2500000,
          outstandingAmount: 150000,
          lastPaymentDate: '2024-10-15',
          status: 'active',
          contractStartDate: '2024-01-01',
          contractEndDate: '2024-12-31',
          employeesCount: 250,
          trainingPrograms: ['Sales Excellence', 'Customer Service'],
          paymentTerms: 30,
          createdAt: '2024-01-01',
          updatedAt: '2024-10-15'
        },
        {
          id: '2',
          companyName: 'KCB Bank',
          contactPerson: 'Mary Wanjiku',
          email: 'm.wanjiku@kcb.co.ke',
          phone: '+254733987654',
          address: 'CBD, Nairobi',
          industry: 'Banking',
          totalRevenue: 1800000,
          outstandingAmount: 0,
          lastPaymentDate: '2024-10-30',
          status: 'active',
          contractStartDate: '2024-03-01',
          contractEndDate: '2025-02-28',
          employeesCount: 180,
          trainingPrograms: ['Financial Sales', 'Leadership'],
          paymentTerms: 15,
          createdAt: '2024-03-01',
          updatedAt: '2024-10-30'
        },
        {
          id: '3',
          companyName: 'East African Breweries',
          contactPerson: 'Peter Mwangi',
          email: 'p.mwangi@eabl.com',
          phone: '+254711456789',
          address: 'Industrial Area, Nairobi',
          industry: 'Manufacturing',
          totalRevenue: 950000,
          outstandingAmount: 75000,
          lastPaymentDate: '2024-09-20',
          status: 'pending',
          contractStartDate: '2024-06-01',
          contractEndDate: '2024-11-30',
          employeesCount: 120,
          trainingPrograms: ['Sales Fundamentals'],
          paymentTerms: 45,
          createdAt: '2024-06-01',
          updatedAt: '2024-09-20'
        }
      ];
      setCorporates(mockCorporates);
    } catch (error) {
      console.error('Error loading corporates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCorporates = corporates.filter(corporate => {
    const matchesSearch = corporate.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corporate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corporate.industry.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || corporate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = corporates.reduce((sum, corp) => sum + corp.totalRevenue, 0);
  const totalOutstanding = corporates.reduce((sum, corp) => sum + corp.outstandingAmount, 0);
  const activeCorporates = corporates.filter(corp => corp.status === 'active').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (corporate: Corporate) => {
    setSelectedCorporate(corporate);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corporate Finance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage corporate client finances and contracts
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Corporate</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Corporates</p>
              <p className="text-2xl font-bold text-gray-900">{activeCorporates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company name, contact person, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Corporates Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCorporates.map((corporate) => (
                <tr key={corporate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 rounded-lg mr-3">
                        <Building2 className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{corporate.companyName}</div>
                        <div className="text-sm text-gray-500">{corporate.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{corporate.contactPerson}</div>
                    <div className="text-sm text-gray-500">{corporate.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(corporate.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${corporate.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(corporate.outstandingAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(corporate.status)}`}>
                      {getStatusIcon(corporate.status)}
                      <span className="ml-1 capitalize">{corporate.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(corporate)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Details Modal */}
      {showDetails && selectedCorporate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Corporate Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCorporate.companyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCorporate.industry}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCorporate.contactPerson}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employees</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCorporate.employeesCount}</p>
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Total Revenue</div>
                  <div className="text-lg font-bold text-green-900">{formatCurrency(selectedCorporate.totalRevenue)}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-red-600">Outstanding</div>
                  <div className="text-lg font-bold text-red-900">{formatCurrency(selectedCorporate.outstandingAmount)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Payment Terms</div>
                  <div className="text-lg font-bold text-blue-900">{selectedCorporate.paymentTerms} days</div>
                </div>
              </div>

              {/* Programs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Training Programs</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCorporate.trainingPrograms.map((program, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {program}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  Edit Details
                </button>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporatesFinanceList;