import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Search, Filter, Plus, Edit, Trash2, Mail, Phone, Eye, Shield, UserCheck, GraduationCap, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'staff' | 'learner' | 'applicant';
  organization?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('users');
      if (result.success && result.data) {
        const usersData = result.data as User[];
        // Sort by creation date, newest first
        usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const userStatus = statusFilter === 'verified' ? true : false;
      filtered = filtered.filter(user => user.isEmailVerified === userStatus);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('users', userId);
        if (result.success) {
          loadUsers(); // Reload users list
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const result = await FirestoreService.update('users', userId, { status: newStatus });
      if (result.success) {
        loadUsers(); // Reload users list
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Calculate stats from real data
  const stats = [
    { 
      title: 'Total Users', 
      value: users.length.toString(), 
      change: '+12', 
      icon: UsersIcon, 
      color: 'primary' 
    },
    { 
      title: 'Verified Users', 
      value: users.filter(u => u.isEmailVerified).length.toString(), 
      change: '+8', 
      icon: Shield, 
      color: 'accent' 
    },
    { 
      title: 'Active Admins', 
      value: users.filter(u => u.role === 'admin' && u.status !== 'suspended').length.toString(), 
      change: '+2', 
      icon: Shield, 
      color: 'secondary' 
    },
    { 
      title: 'Active Staff', 
      value: users.filter(u => u.role === 'staff' && u.status !== 'suspended').length.toString(), 
      change: '+5', 
      icon: UserCheck, 
      color: 'primary' 
    },
  ];

  const tabs = [
    { id: 'users', label: 'All Users' },
    { id: 'roles', label: 'By Roles' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-primary-100 text-primary-800';
      case 'learner': return 'bg-accent-100 text-accent-800';
      case 'applicant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isVerified: boolean, status?: string) => {
    if (status === 'suspended') return 'bg-red-100 text-red-800';
    if (!isVerified) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isVerified: boolean, status?: string) => {
    if (status === 'suspended') return 'Suspended';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'staff': return UserCheck;
      case 'learner': return GraduationCap;
      case 'applicant': return UserPlus;
      default: return UsersIcon;
    }
  };

  // Group users by role
  const groupUsersByRole = () => {
    const roles: { [key: string]: User[] } = {};
    users.forEach(user => {
      if (!roles[user.role]) {
        roles[user.role] = [];
      }
      roles[user.role].push(user);
    });
    return roles;
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
            <h1 className="text-4xl font-bold mb-2">Users Management</h1>
            <p className="text-lg text-primary-100">
              Manage all user accounts across the platform - admins, staff, learners, and applicants.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <UsersIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} this month
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
          {activeTab === 'users' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="learner">Learner</option>
                    <option value="applicant">Applicant</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <button 
                  onClick={() => navigate('/portal/users/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Organization</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => {
                      const RoleIcon = getRoleIcon(user.role);
                      return (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary-100 p-2 rounded-lg">
                                <RoleIcon className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <div className="font-medium text-secondary-800">{user.displayName}</div>
                                <div className="text-sm text-secondary-500">{user.email}</div>
                                {user.phoneNumber && (
                                  <div className="text-sm text-secondary-500">{user.phoneNumber}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-secondary-600">{user.organization || 'N/A'}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isEmailVerified, user.status)}`}>
                              {getStatusText(user.isEmailVerified, user.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-secondary-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => navigate(`/portal/users/${user.id}`)}
                                className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => navigate(`/portal/users/${user.id}/edit`)}
                                className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => toggleUserStatus(user.id, user.status || 'active')}
                                className="p-1 text-secondary-400 hover:text-yellow-600 transition-colors duration-200"
                                title={user.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteUser(user.id)}
                                className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-secondary-600">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-secondary-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current page
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                  page === currentPage
                                    ? 'bg-primary-600 text-white'
                                    : 'text-secondary-600 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-2 py-2 text-secondary-400">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-secondary-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <UsersIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Users Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                        ? 'No users match your search criteria.' 
                        : 'Start by adding your first user.'
                      }
                    </p>
                    <button 
                      onClick={() => navigate('/portal/users/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add User</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Users by Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(groupUsersByRole()).map(([role, roleUsers]) => {
                  const RoleIcon = getRoleIcon(role);
                  return (
                    <div key={role} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-lg ${
                            role === 'admin' ? 'bg-red-100' :
                            role === 'staff' ? 'bg-primary-100' :
                            role === 'learner' ? 'bg-accent-100' :
                            'bg-yellow-100'
                          }`}>
                            <RoleIcon className={`h-6 w-6 ${
                              role === 'admin' ? 'text-red-600' :
                              role === 'staff' ? 'text-primary-600' :
                              role === 'learner' ? 'text-accent-600' :
                              'text-yellow-600'
                            }`} />
                          </div>
                          <h3 className="text-lg font-semibold text-secondary-800 capitalize">{role}s</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                          {roleUsers.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {roleUsers.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-medium text-sm">
                                  {user.displayName?.charAt(0) || user.email.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-secondary-800 text-sm">{user.displayName}</p>
                                <p className="text-xs text-secondary-500">{user.organization}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isEmailVerified, user.status)}`}>
                              {getStatusText(user.isEmailVerified, user.status)}
                            </span>
                          </div>
                        ))}
                        {roleUsers.length > 5 && (
                          <p className="text-sm text-secondary-500 text-center pt-2">
                            +{roleUsers.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(groupUsersByRole()).length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Users</h3>
                  <p className="text-secondary-600">Add users to see role distribution here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">User Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Growth */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">User Growth</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">This Month:</span>
                      <span className="font-semibold text-secondary-800">+12 users</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Last Month:</span>
                      <span className="font-semibold text-secondary-800">+8 users</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Growth Rate:</span>
                      <span className="font-semibold text-green-600">+50%</span>
                    </div>
                  </div>
                </div>

                {/* Email Verification */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Email Verification</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Verified:</span>
                      <span className="font-semibold text-green-600">
                        {users.filter(u => u.isEmailVerified).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Unverified:</span>
                      <span className="font-semibold text-yellow-600">
                        {users.filter(u => !u.isEmailVerified).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Verification Rate:</span>
                      <span className="font-semibold text-secondary-800">
                        {users.length > 0 ? Math.round((users.filter(u => u.isEmailVerified).length / users.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Distribution */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Role Distribution</h3>
                  <div className="space-y-4">
                    {Object.entries(groupUsersByRole()).map(([role, roleUsers]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-secondary-600 capitalize">{role}s:</span>
                        <span className="font-semibold text-secondary-800">{roleUsers.length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users; 