import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Eye, BookOpen, Banknote } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface Learner {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  programId: string;
  programName?: string;
  cohort?: string; // Keep for backward compatibility
  cohortId?: string; // New field from cohorts collection
  cohortName?: string; // Cohort name from cohorts collection
  academicStatus: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  currentGPA?: number;
  enrollmentDate: string;
  totalFees?: number;
  amountPaid?: number;
  outstandingBalance?: number;
}

interface Program {
  id: string;
  programName: string;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  programId: string;
  startDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

const Learners: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [learners, setLearners] = useState<Learner[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<Learner[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');

  useEffect(() => {
    loadLearners();
    loadPrograms();
    loadCohorts();
  }, []);

  useEffect(() => {
    filterLearners();
  }, [learners, searchTerm, statusFilter, programFilter, cohortFilter]);

  const loadLearners = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('learners');
      if (result.success && result.data) {
        const learnersData = result.data as Learner[];
        // Sort by enrollment date, newest first
        learnersData.sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime());
        setLearners(learnersData);
      }
    } catch (error) {
      console.error('Error loading learners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await FirestoreService.getAll('programs');
      if (result.success && result.data) {
        setPrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadCohorts = async () => {
    try {
      const result = await FirestoreService.getAll('cohorts');
      if (result.success && result.data) {
        setCohorts(result.data as Cohort[]);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const filterLearners = () => {
    let filtered = learners;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(learner => {
        const cohortName = getCohortName(learner.cohortId);
        return learner.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.cohort?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cohortName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(learner => learner.academicStatus === statusFilter);
    }

    // Filter by program
    if (programFilter !== 'all') {
      filtered = filtered.filter(learner => learner.programId === programFilter);
    }

    // Filter by cohort
    if (cohortFilter !== 'all') {
      filtered = filtered.filter(learner => learner.cohortId === cohortFilter);
    }

    setFilteredLearners(filtered);
  };

  const deleteLearner = async (learnerId: string) => {
    if (window.confirm('Are you sure you want to delete this learner? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('learners', learnerId);
        if (result.success) {
          loadLearners(); // Reload learners list
        }
      } catch (error) {
        console.error('Error deleting learner:', error);
      }
    }
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program?.programName || 'N/A';
  };

  const getCohortName = (cohortId?: string) => {
    if (!cohortId) return 'No Cohort';
    const cohort = cohorts.find(c => c.id === cohortId);
    return cohort?.name || cohort?.cohortId || 'Unknown Cohort';
  };

  // Calculate stats from real data
  const totalLearners = learners.length;
  const activeLearners = learners.filter(l => l.academicStatus === 'active').length;
  const graduates = learners.filter(l => l.academicStatus === 'completed').length;
  const totalOutstanding = learners.reduce((total, learner) => total + (learner.outstandingBalance || 0), 0);
  const totalFees = learners.reduce((total, learner) => total + (learner.totalFees || 0), 0);
  const collectionRate = totalFees > 0 ? Math.round(((totalFees - totalOutstanding) / totalFees) * 100) : 0;

  const stats = [
    { 
      title: 'Total Students', 
      value: totalLearners.toString(), 
      change: `${activeLearners} active`, 
      icon: Users, 
      color: 'primary' 
    },
    { 
      title: 'Active Students', 
      value: activeLearners.toString(), 
      change: `${Math.round((activeLearners / Math.max(totalLearners, 1)) * 100)}% of total`, 
      icon: GraduationCap, 
      color: 'accent' 
    },
    { 
      title: 'Graduates', 
      value: graduates.toString(), 
      change: `${Math.round((graduates / Math.max(totalLearners, 1)) * 100)}% completion rate`, 
      icon: GraduationCap, 
      color: 'secondary' 
    },
    {
      title: 'Outstanding Fees',
      value: `KSh ${totalOutstanding.toLocaleString()}`,
      change: `${collectionRate}% collected`,
      icon: Banknote,
      color: 'primary'
    }
  ];

  const tabs = [
    { id: 'students', label: 'All Students' },
    { id: 'programs', label: 'By Programs' },
    { id: 'performance', label: 'Performance' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGPAColor = (gpa?: number) => {
    if (!gpa) return 'text-gray-500';
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Group learners by program
  const groupLearnersByProgram = () => {
    const programGroups: { [key: string]: Learner[] } = {};
    learners.forEach(learner => {
      const programName = getProgramName(learner.programId);
      if (!programGroups[programName]) {
        programGroups[programName] = [];
      }
      programGroups[programName].push(learner);
    });
    return programGroups;
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
            <h1 className="text-4xl font-bold mb-2">Learners</h1>
            <p className="text-lg text-primary-100">
              Manage student records, performance, and academic progress.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Users className="h-8 w-8 text-white" />
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
                      {stat.change}
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
          {activeTab === 'students' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
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
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => navigate('/portal/learners/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </button>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Student ID</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Cohort</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">GPA</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Outstanding</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLearners.map((learner) => (
                      <tr key={learner.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-secondary-800">{learner.studentId}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-secondary-800">{learner.firstName} {learner.lastName}</div>
                            <div className="text-sm text-secondary-500">{learner.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">{getProgramName(learner.programId)}</td>
                        <td className="py-4 px-4 text-secondary-600">{learner.cohort || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${getGPAColor(learner.currentGPA)}`}>
                            {learner.currentGPA ? learner.currentGPA.toFixed(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(learner.academicStatus)}`}>
                            {learner.academicStatus.charAt(0).toUpperCase() + learner.academicStatus.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${learner.outstandingBalance && learner.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            KSh {learner.outstandingBalance?.toLocaleString() || '0'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate(`/portal/learners/${learner.id}`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/portal/learners/${learner.id}/edit`)}
                              className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                              title="Edit Learner"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteLearner(learner.id)}
                              className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                              title="Delete Learner"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredLearners.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Students Found</h3>
                    <p className="text-secondary-600 mb-6">
                      {searchTerm || statusFilter !== 'all' || programFilter !== 'all' 
                        ? 'No students match your search criteria.' 
                        : 'Start by adding your first student.'
                      }
                    </p>
                    <button 
                      onClick={() => navigate('/portal/learners/new')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Student</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'programs' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Students by Program</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupLearnersByProgram()).map(([programName, programLearners]) => (
                  <div key={programName} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-3 rounded-lg">
                          <BookOpen className="h-6 w-6 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-secondary-800">{programName}</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                        {programLearners.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {programLearners.slice(0, 5).map((learner) => (
                        <div key={learner.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {learner.firstName?.charAt(0)}{learner.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800 text-sm">{learner.firstName} {learner.lastName}</p>
                              <p className="text-xs text-secondary-500">{learner.studentId}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(learner.academicStatus)}`}>
                            {learner.academicStatus}
                          </span>
                        </div>
                      ))}
                      {programLearners.length > 5 && (
                        <p className="text-sm text-secondary-500 text-center pt-2">
                          +{programLearners.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(groupLearnersByProgram()).length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Programs</h3>
                  <p className="text-secondary-600">Add students to see program distribution here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Academic Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* High Performers */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">High Performers (GPA &ge; 3.5)</h3>
                  <div className="space-y-3">
                    {learners
                      .filter(l => l.currentGPA && l.currentGPA >= 3.5)
                      .slice(0, 5)
                      .map((learner) => (
                        <div key={learner.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-medium text-sm">
                                {learner.firstName?.charAt(0)}{learner.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800 text-sm">{learner.firstName} {learner.lastName}</p>
                              <p className="text-xs text-secondary-500">{learner.studentId}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-green-600">
                            {learner.currentGPA?.toFixed(1)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Average Performers */}
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4">Average Performers (GPA 3.0-3.4)</h3>
                  <div className="space-y-3">
                    {learners
                      .filter(l => l.currentGPA && l.currentGPA >= 3.0 && l.currentGPA < 3.5)
                      .slice(0, 5)
                      .map((learner) => (
                        <div key={learner.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 font-medium text-sm">
                                {learner.firstName?.charAt(0)}{learner.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800 text-sm">{learner.firstName} {learner.lastName}</p>
                              <p className="text-xs text-secondary-500">{learner.studentId}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-yellow-600">
                            {learner.currentGPA?.toFixed(1)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* At-Risk Students */}
                <div className="bg-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-4">At-Risk Students (GPA &lt; 3.0)</h3>
                  <div className="space-y-3">
                    {learners
                      .filter(l => l.currentGPA && l.currentGPA < 3.0)
                      .slice(0, 5)
                      .map((learner) => (
                        <div key={learner.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-medium text-sm">
                                {learner.firstName?.charAt(0)}{learner.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-800 text-sm">{learner.firstName} {learner.lastName}</p>
                              <p className="text-xs text-secondary-500">{learner.studentId}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-red-600">
                            {learner.currentGPA?.toFixed(1)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Student Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Enrollment Trends */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Enrollment by Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Active:</span>
                      <span className="font-semibold text-green-600">
                        {learners.filter(l => l.academicStatus === 'active').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Completed:</span>
                      <span className="font-semibold text-blue-600">
                        {learners.filter(l => l.academicStatus === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Suspended:</span>
                      <span className="font-semibold text-red-600">
                        {learners.filter(l => l.academicStatus === 'suspended').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Withdrawn:</span>
                      <span className="font-semibold text-yellow-600">
                        {learners.filter(l => l.academicStatus === 'withdrawn').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Financial Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Total Fees:</span>
                      <span className="font-semibold text-secondary-800">
                        KSh {learners.reduce((total, l) => total + (l.totalFees || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Amount Paid:</span>
                      <span className="font-semibold text-green-600">
                        KSh {learners.reduce((total, l) => total + (l.amountPaid || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Outstanding:</span>
                      <span className="font-semibold text-red-600">
                        KSh {learners.reduce((total, l) => total + (l.outstandingBalance || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Average GPA */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Academic Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Average GPA:</span>
                      <span className="font-semibold text-secondary-800">
                        {learners.filter(l => l.currentGPA).length > 0 
                          ? (learners.reduce((total, l) => total + (l.currentGPA || 0), 0) / 
                             learners.filter(l => l.currentGPA).length).toFixed(2)
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">High Performers:</span>
                      <span className="font-semibold text-green-600">
                        {learners.filter(l => l.currentGPA && l.currentGPA >= 3.5).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">At-Risk Students:</span>
                      <span className="font-semibold text-red-600">
                        {learners.filter(l => l.currentGPA && l.currentGPA < 3.0).length}
                      </span>
                    </div>
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

export default Learners;