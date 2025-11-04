import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Filter, Users, GraduationCap, Clock, 
  Mail, Phone, Star, Calendar, Award, BookOpen,
  MoreVertical, Edit, Trash2, Eye, UserCheck, AlertCircle,
  ChevronDown, MapPin, Briefcase
} from 'lucide-react';
import { InstructorService } from '../../../services/instructorService';
import { Instructor } from '../../../types/instructor';
import LoadingSpinner from '../../../components/LoadingSpinner';

const Instructors: React.FC = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_leave' | 'inactive'>('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [allSpecializations, setAllSpecializations] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalInstructors: 0,
    activeInstructors: 0,
    onLeaveInstructors: 0,
    averageRating: 0,
    totalSessionsTaught: 0
  });

  useEffect(() => {
    loadInstructors();
  }, []);

  useEffect(() => {
    filterInstructors();
    calculateStats();
  }, [instructors, searchTerm, statusFilter, specializationFilter, contractFilter]);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const data = await InstructorService.getAllInstructors();
      setInstructors(data);

      // Extract unique specializations
      const specs = new Set<string>();
      data.forEach(instructor => {
        instructor.specializations?.forEach(spec => specs.add(spec));
      });
      setAllSpecializations(Array.from(specs).sort());
    } catch (error) {
      console.error('Error loading instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInstructors = () => {
    let filtered = [...instructors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(instructor =>
        `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.specializations?.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(instructor => instructor.status === statusFilter);
    }

    // Specialization filter
    if (specializationFilter !== 'all') {
      filtered = filtered.filter(instructor => 
        instructor.specializations?.includes(specializationFilter)
      );
    }

    // Contract filter
    if (contractFilter !== 'all') {
      filtered = filtered.filter(instructor => 
        instructor.contractType === contractFilter
      );
    }

    setFilteredInstructors(filtered);
  };

  const calculateStats = () => {
    const active = instructors.filter(i => i.status === 'active').length;
    const onLeave = instructors.filter(i => i.status === 'on_leave').length;
    const totalSessions = instructors.reduce((sum, i) => sum + (i.totalSessionsTaught || 0), 0);
    const avgRating = instructors.reduce((sum, i) => sum + (i.rating || 0), 0) / (instructors.filter(i => i.rating).length || 1);

    setStats({
      totalInstructors: instructors.length,
      activeInstructors: active,
      onLeaveInstructors: onLeave,
      averageRating: avgRating,
      totalSessionsTaught: totalSessions
    });
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    if (window.confirm('Are you sure you want to deactivate this instructor?')) {
      try {
        await InstructorService.deleteInstructor(instructorId);
        loadInstructors();
      } catch (error) {
        console.error('Error deleting instructor:', error);
        alert('Failed to deactivate instructor');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-700',
      on_leave: 'bg-yellow-100 text-yellow-700',
      inactive: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getContractBadge = (contractType: string) => {
    const contractStyles = {
      full_time: 'bg-blue-100 text-blue-700',
      part_time: 'bg-purple-100 text-purple-700',
      contract: 'bg-orange-100 text-orange-700',
      guest: 'bg-gray-100 text-gray-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${contractStyles[contractType as keyof typeof contractStyles] || 'bg-gray-100 text-gray-700'}`}>
        {contractType.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center">
              <GraduationCap className="h-8 w-8 md:h-10 md:w-10 mr-3" />
              Instructors
            </h1>
            <p className="text-lg text-primary-100">Manage your teaching staff and their schedules</p>
          </div>
          <button
            onClick={() => navigate('/portal/instructors/new')}
            className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-200 flex items-center space-x-2 shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Add Instructor</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Total</p>
                <p className="text-2xl font-bold text-white">{stats.totalInstructors}</p>
              </div>
              <Users className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Active</p>
                <p className="text-2xl font-bold text-white">{stats.activeInstructors}</p>
              </div>
              <UserCheck className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">On Leave</p>
                <p className="text-2xl font-bold text-white">{stats.onLeaveInstructors}</p>
              </div>
              <Clock className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Avg Rating</p>
                <p className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)} ⭐</p>
              </div>
              <Star className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Sessions</p>
                <p className="text-2xl font-bold text-white">{stats.totalSessionsTaught}</p>
              </div>
              <BookOpen className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search instructors by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Specializations</option>
            {allSpecializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Contracts</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="guest">Guest</option>
          </select>
        </div>
      </div>

      {/* Instructors List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specializations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstructors.length > 0 ? (
                filteredInstructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {instructor.firstName[0]}{instructor.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {instructor.firstName} {instructor.lastName}
                          </div>
                          {instructor.employeeId && (
                            <div className="text-sm text-gray-500">
                              ID: {instructor.employeeId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          {instructor.email}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {instructor.phoneNumber}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {instructor.specializations?.slice(0, 3).map((spec, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                            {spec}
                          </span>
                        ))}
                        {instructor.specializations && instructor.specializations.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{instructor.specializations.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getContractBadge(instructor.contractType)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(instructor.status)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {instructor.currentLoad || 0}/{instructor.maxSessionsPerWeek || 0}
                        </div>
                        <div className="text-xs text-gray-500">sessions/week</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {instructor.rating ? instructor.rating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === instructor.id ? null : instructor.id!)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showActions === instructor.id && (
                          <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                            <button
                              onClick={() => navigate(`/portal/instructors/${instructor.id}`)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            <button
                              onClick={() => navigate(`/portal/instructors/${instructor.id}/edit`)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInstructor(instructor.id!)}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">No instructors found</p>
                      <button
                        onClick={() => navigate('/portal/instructors/new')}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Add your first instructor
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Instructors;