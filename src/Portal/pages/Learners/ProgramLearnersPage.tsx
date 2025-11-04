import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Filter, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Eye, Banknote } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface Learner {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  programId: string;
  programName?: string;
  intake?: string;
  intakeId?: string;
  intakeName?: string;
  academicStatus: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  enrollmentDate: string;
  totalFees?: number;
  amountPaid?: number;
  outstandingBalance?: number;
}

interface Program {
  id: string;
  programName: string;
}

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  programId: string;
  startDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

const ProgramLearnersPage: React.FC = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [intakeFilter, setIntakeFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  const isLearner = userProfile?.role === 'learner';
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (programId) {
      loadProgram();
      loadProgramLearners();
      loadIntakes();
    }
  }, [programId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, intakeFilter]);

  const loadProgram = async () => {
    try {
      const result = await FirestoreService.getById('programs', programId!);
      if (result.success && result.data) {
        setProgram(result.data as Program);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    }
  };

  const loadProgramLearners = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('learners', [
        { field: 'programId', operator: '==', value: programId! }
      ]);
      if (result.success && result.data) {
        const learnersData = result.data as Learner[];
        // Sort by student ID in descending order
        learnersData.sort((a, b) => {
          const idA = a.studentId.toLowerCase();
          const idB = b.studentId.toLowerCase();
          return idB.localeCompare(idA);
        });
        setLearners(learnersData);
      }
    } catch (error) {
      console.error('Error loading learners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIntakes = async () => {
    try {
      const result = await FirestoreService.getWithQuery('cohorts', [
        { field: 'programId', operator: '==', value: programId! }
      ]);
      if (result.success && result.data) {
        setIntakes(result.data as Intake[]);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  const getIntakeName = (intakeId?: string) => {
    if (!intakeId) return 'No Intake';
    const intake = intakes.find(c => c.id === intakeId);
    return intake?.name || intake?.intakeId || 'Unknown Intake';
  };

  const filteredLearners = learners.filter(learner => {
    const matchesSearch = learner.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || learner.academicStatus === statusFilter;
    const matchesIntake = intakeFilter === 'all' || learner.intakeId === intakeFilter;
    
    return matchesSearch && matchesStatus && matchesIntake;
  });

  // Pagination calculations
  const totalItems = filteredLearners.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLearners = filteredLearners.slice(startIndex, endIndex);

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

  const deleteLearner = async (learnerId: string) => {
    if (window.confirm('Are you sure you want to delete this learner? This action cannot be undone.')) {
      try {
        const result = await FirestoreService.delete('learners', learnerId);
        if (result.success) {
          loadProgramLearners();
        }
      } catch (error) {
        console.error('Error deleting learner:', error);
      }
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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/learners')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {program?.programName || 'Program'} Learners
              </h1>
              <p className="text-gray-600 mt-1">
                {totalItems} learner{totalItems !== 1 ? 's' : ''} enrolled
              </p>
            </div>
          </div>
          <div className="bg-primary-100 p-4 rounded-xl">
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search learners..."
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
              value={intakeFilter}
              onChange={(e) => setIntakeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Intakes</option>
              {intakes.map((intake) => (
                <option key={intake.id} value={intake.id}>
                  {intake.name || intake.intakeId}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <button 
              onClick={() => navigate('/portal/learners/new')}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Learner</span>
            </button>
          )}
        </div>

        {/* Learners Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Intake</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                {!isLearner && <th className="text-left py-3 px-4 font-medium text-gray-600">Outstanding</th>}
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLearners.map((learner) => (
                <tr key={learner.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4 font-medium text-gray-800">{learner.studentId}</td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{learner.firstName} {learner.lastName}</div>
                      <div className="text-sm text-gray-500">{learner.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{learner.intakeName || learner.intake || getIntakeName(learner.intakeId)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(learner.academicStatus)}`}>
                      {learner.academicStatus.charAt(0).toUpperCase() + learner.academicStatus.slice(1)}
                    </span>
                  </td>
                  {!isLearner && (
                    <td className="py-4 px-4">
                      <span className={`font-medium ${learner.outstandingBalance && learner.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        KSh {learner.outstandingBalance?.toLocaleString() || '0'}
                      </span>
                    </td>
                  )}
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => navigate(`/portal/learners/${learner.id}`)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isLearner && (
                        <>
                          <button 
                            onClick={() => navigate(`/portal/learners/${learner.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                            title="Edit Learner"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteLearner(learner.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete Learner"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalItems === 0 && !loading && (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Learners Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || intakeFilter !== 'all'
                  ? 'No learners match your search criteria.' 
                  : 'No learners are enrolled in this program yet.'
                }
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} learners
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramLearnersPage;