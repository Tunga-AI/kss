import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Plus, Edit, Trash2, Users, Calendar, Eye, UserCheck, Mail, Phone } from 'lucide-react';
import { ProgramService, StaffService } from '../../../services/firestore';

interface Facilitator {
  id: string;
  name?: string;
  displayName?: string;
  email: string;
  phone?: string;
  department?: string;
  designations?: string[];
  qualifications?: string;
  experience?: string;
  assignedPrograms?: string[];
  status: 'active' | 'inactive' | 'on_leave';
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const Programs: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState<any[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [loading, setLoading] = useState(true);
  const [facilitatorsLoading, setFacilitatorsLoading] = useState(true);

  const stats = [
    { title: 'Active Programs', value: programs.length.toString(), change: '+2', icon: BookOpen, color: 'primary' },
    { title: 'Total Students', value: '1,847', change: '+127', icon: Users, color: 'accent' },
    { title: 'Facilitators', value: facilitators.length.toString(), change: '+3', icon: UserCheck, color: 'secondary' },
  ];

  const tabs = [
    { id: 'programs', label: 'Programs' },
    { id: 'facilitators', label: 'Facilitators' },
  ];

  useEffect(() => {
    loadPrograms();
    loadFacilitators();
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const result = await ProgramService.getAll('programs');
      if (result.success && result.data) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacilitators = async () => {
    setFacilitatorsLoading(true);
    try {
      const result = await StaffService.getAll('staff');
      if (result.success && result.data) {
        // Filter to only include staff marked as facilitators/instructors
        const facilitatorData = result.data.filter((staff: any) => 
          staff.type === 'teaching' || staff.designations?.includes('Facilitator') || staff.designations?.includes('Instructor')
        ).map((staff: any) => ({
          ...staff,
          status: staff.status || 'active',
          email: staff.email || '',
          assignedPrograms: staff.assignedPrograms || []
        } as Facilitator));
        setFacilitators(facilitatorData);
      }
    } catch (error) {
      console.error('Error loading facilitators:', error);
    } finally {
      setFacilitatorsLoading(false);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        const result = await ProgramService.delete('programs', programId);
        if (result.success) {
          setPrograms(prevPrograms => prevPrograms.filter(p => p.id !== programId));
        }
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  const handleDeleteFacilitator = async (facilitatorId: string) => {
    if (window.confirm('Are you sure you want to delete this facilitator?')) {
      try {
        const result = await StaffService.delete('staff', facilitatorId);
        if (result.success) {
          setFacilitators(prevFacilitators => prevFacilitators.filter(f => f.id !== facilitatorId));
        }
      } catch (error) {
        console.error('Error deleting facilitator:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent-100 text-accent-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgramCount = (facilitator: Facilitator) => {
    return facilitator.assignedPrograms ? facilitator.assignedPrograms.length : 0;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Programs</h1>
            <p className="text-lg text-primary-100">
              Manage academic programs and facilitators effectively.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
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
                      {stat.change} this semester
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
          {activeTab === 'programs' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search programs..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
                <button 
                  onClick={() => navigate('/portal/programs/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Program</span>
                </button>
              </div>

              {/* Programs Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {programs.map((program) => (
                    <div key={program.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary-100 p-3 rounded-lg">
                          <BookOpen className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => navigate(`/portal/programs/${program.id}`)}
                            className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                            title="View Program"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/portal/programs/${program.id}`)}
                            className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                            title="Edit Program"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProgram(program.id)}
                            className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete Program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                        {program.programName || 'Untitled Program'}
                      </h3>
                      <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
                        {program.shortDescription || 'No description available'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary-500">Code:</span>
                          <span className="text-secondary-800 font-medium">{program.programCode || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary-500">Duration:</span>
                          <span className="text-secondary-800 font-medium">{program.programDuration || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary-500">Level:</span>
                          <span className="text-secondary-800 font-medium">{program.level || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status || 'draft')}`}>
                          {(program.status || 'draft').charAt(0).toUpperCase() + (program.status || 'draft').slice(1)}
                        </span>
                        <button 
                          onClick={() => navigate(`/portal/programs/${program.id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {programs.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Programs Yet</h3>
                      <p className="text-secondary-600 mb-6">Create your first program to get started.</p>
                      <button 
                        onClick={() => navigate('/portal/programs/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Program</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'facilitators' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search facilitators..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
                <button 
                  onClick={() => navigate('/portal/facilitators/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Facilitator</span>
                </button>
              </div>

              {/* Facilitators Cards */}
              {facilitatorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {facilitators.map((facilitator) => (
                    <div key={facilitator.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary-100 p-3 rounded-lg">
                          <UserCheck className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => navigate(`/portal/facilitators/${facilitator.id}`)}
                            className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                            title="View Facilitator"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/portal/facilitators/${facilitator.id}`)}
                            className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                            title="Edit Facilitator"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteFacilitator(facilitator.id)}
                            className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete Facilitator"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                        {facilitator.name || facilitator.displayName}
                      </h3>
                      <p className="text-secondary-600 text-sm mb-4">
                        {facilitator.department}
                      </p>
                      
                      {/* Designations */}
                      {facilitator.designations && facilitator.designations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {facilitator.designations.slice(0, 2).map((designation, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {designation}
                            </span>
                          ))}
                          {facilitator.designations.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{facilitator.designations.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-secondary-600">
                          <Mail className="h-4 w-4 text-primary-600" />
                          <span className="truncate">{facilitator.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-secondary-600">
                          <Phone className="h-4 w-4 text-primary-600" />
                          <span>{facilitator.phone}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary-500">Experience:</span>
                          <span className="text-secondary-800 font-medium">{facilitator.experience || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-secondary-500">Programs:</span>
                          <span className="text-secondary-800 font-medium">{getProgramCount(facilitator)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(facilitator.status)}`}>
                          {facilitator.status.charAt(0).toUpperCase() + facilitator.status.slice(1)}
                        </span>
                        <button 
                          onClick={() => navigate(`/portal/facilitators/${facilitator.id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {facilitators.length === 0 && !facilitatorsLoading && (
                    <div className="col-span-full text-center py-12">
                      <UserCheck className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Facilitators Yet</h3>
                      <p className="text-secondary-600 mb-6">Add your first facilitator to get started.</p>
                      <button 
                        onClick={() => navigate('/portal/facilitators/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Facilitator</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Programs;