import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Search, Filter, Plus, Edit, Trash2, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  designations: string[];
  employeeId?: string;
  dateJoined?: string;
  status: 'active' | 'inactive' | 'on_leave';
  type: 'teaching' | 'administrative' | 'support';
  assignedPrograms: string[];
  experience?: string;
  createdAt?: string;
}

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('staff');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staffMembers, searchTerm, statusFilter, typeFilter]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('staff');
      if (result.success && result.data) {
        setStaffMembers(result.data as StaffMember[]);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staffMembers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(staff => staff.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(staff => staff.type === typeFilter);
    }

    setFilteredStaff(filtered);
  };

  const deleteStaff = async (staffId: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        const result = await FirestoreService.delete('staff', staffId);
        if (result.success) {
          loadStaff(); // Reload staff list
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  // Calculate stats from real data
  const stats = [
    { 
      title: 'Total Staff', 
      value: staffMembers.length.toString(), 
      change: '+12', 
      icon: UserCheck, 
      color: 'primary' 
    },
    { 
      title: 'Teaching Staff', 
      value: staffMembers.filter(s => s.type === 'teaching').length.toString(), 
      change: '+5', 
      icon: UserCheck, 
      color: 'accent' 
    },
    { 
      title: 'Administrative', 
      value: staffMembers.filter(s => s.type === 'administrative').length.toString(), 
      change: '+7', 
      icon: UserCheck, 
      color: 'secondary' 
    },
  ];

  const tabs = [
    { id: 'staff', label: 'All Staff' },
    { id: 'departments', label: 'Departments' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent-100 text-accent-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'teaching': return 'bg-primary-100 text-primary-800';
      case 'administrative': return 'bg-secondary-100 text-secondary-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group staff by department
  const groupStaffByDepartment = () => {
    const departments: { [key: string]: StaffMember[] } = {};
    staffMembers.forEach(staff => {
      const dept = staff.department || 'Unassigned';
      if (!departments[dept]) {
        departments[dept] = [];
      }
      departments[dept].push(staff);
    });
    return departments;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Staff</h1>
            <p className="text-lg text-primary-100">
              Manage faculty, administrators, and support staff efficiently.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <UserCheck className="h-8 w-8 text-white" />
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
                      {stat.change} this year
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
          {activeTab === 'staff' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search staff..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="teaching">Teaching</option>
                    <option value="administrative">Administrative</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                <button 
                  onClick={() => navigate('/portal/staff/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Staff</span>
                </button>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Employee ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Position</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{staff.employeeId || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{staff.name}</div>
                            <div className="text-sm text-secondary-500">{staff.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{staff.department}</td>
                        <td className="py-4 px-4 text-secondary-600">{staff.position}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(staff.type)}`}>
                            {staff.type.charAt(0).toUpperCase() + staff.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                            {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/staff/${staff.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/staff/${staff.id}/edit`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="Edit Staff"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteStaff(staff.id)}
                              className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                              title="Delete Staff"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredStaff.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <UserCheck className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Staff Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                        ? 'No staff members match your search criteria.' 
                        : 'Start by adding your first staff member.'
                      }
                    </p>
                    <button 
                      onClick={() => navigate('/portal/staff/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Staff Member</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Staff by Department</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupStaffByDepartment()).map(([department, departmentStaff]) => (
                  <div key={department} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-secondary-800">{department}</h3>
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {departmentStaff.length} staff
                      </span>
                    </div>
                    <div className="space-y-3">
                      {departmentStaff.slice(0, 5).map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary-100 p-2 rounded-lg">
                              <UserCheck className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800 text-sm">{staff.name}</p>
                              <p className="text-xs text-secondary-500">{staff.position}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(staff.type)}`}>
                            {staff.type}
                          </span>
                        </div>
                      ))}
                      {departmentStaff.length > 5 && (
                        <p className="text-sm text-secondary-500 text-center pt-2">
                          +{departmentStaff.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(groupStaffByDepartment()).length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Departments</h3>
                  <p className="text-secondary-600">Add staff members to see departments here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff;