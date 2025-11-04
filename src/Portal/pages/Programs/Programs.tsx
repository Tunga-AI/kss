import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Plus, Edit, Trash2, Users, Calendar, Eye, UserCheck, Mail, Phone, UserPlus, CheckCircle, X, Clock, MapPin, Download, FileText, Globe } from 'lucide-react';
import { ProgramService, FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';


interface Event {
  id: string;
  title: string;
  description: string;
  slug: string;
  dates: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  goals: string[];
  targetAudience: string[];
  isPublic: boolean;
  registrationDeadline: string;
  image?: string;
  price?: number;
  currency?: string;
  requirements?: string;
  registrationForm: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'checkbox' | 'multiple-choice' | 'email' | 'phone';
    required: boolean;
    options?: string[];
  }>;
  createdAt?: string;
}

interface Attendee {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'free' | 'partially_paid';
  totalAmountDue?: number;
  totalAmountPaid?: number;
  paymentRecords?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    confirmationCode?: string;
    transactionDate: string;
    notes?: string;
    transactionId?: string;
  }>;
  paymentAmount?: number;
  paymentMethod?: string;
  mpesaCode?: string;
  customResponses: Record<string, any>;
}

const Programs: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('core-programs');
  const [programs, setPrograms] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isApplicant = userProfile?.role === 'applicant';
  const isAdmin = userProfile?.role === 'admin';
  const canManagePrograms = isAdmin; // Only admin can manage programs

  const stats = [
    { title: 'Core Programs', value: programs.length.toString(), change: '+2', icon: BookOpen, color: 'primary' },
    { title: 'Short Programs', value: events.length.toString(), change: '+6', icon: Calendar, color: 'accent' },
    { title: 'Total Attendees', value: attendees.length.toString(), change: '+15', icon: Users, color: 'secondary' },
  ];

  const tabs = [
    { id: 'core-programs', label: 'Core Programs' },
    { id: 'short-programs', label: 'Short Programs' },
  ];

  useEffect(() => {
    loadPrograms();
    loadEvents();
    loadAttendees();
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

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const result = await FirestoreService.getAll('events');
      if (result.success && result.data) {
        setEvents(result.data as Event[]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      const result = await FirestoreService.getAll('event_registrations');
      if (result.success && result.data) {
        setAttendees(result.data as Attendee[]);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
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

  const deleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this short program?')) {
      try {
        const result = await FirestoreService.delete('events', eventId);
        if (result.success) {
          loadEvents(); // Reload events
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };


  const handleRegisterForProgram = async (programId: string) => {
    if (!userProfile) return;
    
    setRegistering(programId);
    try {
      // Here you would implement the registration logic
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // You would typically create a registration record in Firestore
      // await FirestoreService.create('registrations', {
      //   programId,
      //   applicantId: userProfile.uid,
      //   registeredAt: new Date(),
      //   status: 'pending'
      // });
      
      alert('Registration successful! You will be notified about the next steps.');
    } catch (error) {
      console.error('Error registering for program:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(null);
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


  // Sort core programs by level (ascending order)
  const sortedPrograms = programs.length > 0 ? [...programs].sort((a, b) => {
    const levelOrder: { [key: string]: number } = {
      'certificate': 1,
      'diploma': 2,
      'bachelor': 3,
      'bachelors': 3,
      'degree': 3,
      'masters': 4,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };
    
    const levelA = (a && a.level && typeof a.level === 'string') ? a.level.toLowerCase() : '';
    const levelB = (b && b.level && typeof b.level === 'string') ? b.level.toLowerCase() : '';
    
    const orderA = levelOrder[levelA] || 999;
    const orderB = levelOrder[levelB] || 999;
    
    return orderA - orderB;
  }) : [];

  const filteredEvents = events.filter(event => {
    const searchableLocation = event.dates.length > 0 ? event.dates[0].location : '';
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchableLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by event date with complex logic:
    // 1. Upcoming events first (nearest first)
    // 2. Ongoing events next
    // 3. Past/completed events last (longest ago last)
    
    const getEventDate = (event: Event) => {
      if (event.dates.length === 0) return new Date('9999-12-31');
      return new Date(event.dates[0].date);
    };
    
    const now = new Date();
    const dateA = getEventDate(a);
    const dateB = getEventDate(b);
    
    // Categorize events
    const isUpcomingA = dateA > now && a.status === 'upcoming';
    const isUpcomingB = dateB > now && b.status === 'upcoming';
    const isOngoingA = a.status === 'ongoing';
    const isOngoingB = b.status === 'ongoing';
    const isPastA = dateA < now || a.status === 'completed';
    const isPastB = dateB < now || b.status === 'completed';
    
    // Priority order: upcoming, ongoing, past
    if (isUpcomingA && !isUpcomingB) return -1;
    if (!isUpcomingA && isUpcomingB) return 1;
    if (isOngoingA && !isOngoingB && !isUpcomingB) return -1;
    if (!isOngoingA && isOngoingB && !isUpcomingA) return 1;
    
    // Within same category, sort by date
    if (isUpcomingA && isUpcomingB) {
      // Upcoming: nearest first
      return dateA.getTime() - dateB.getTime();
    } else if (isPastA && isPastB) {
      // Past events: most recent first, longest ago last
      return dateB.getTime() - dateA.getTime();
    }
    
    // Default date sorting
    return dateA.getTime() - dateB.getTime();
  });

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-accent-100 text-accent-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {isApplicant ? 'Available Programs' : 'Programs'}
            </h1>
            <p className="text-lg text-primary-100">
              {isApplicant 
                ? 'Discover and register for programs that match your interests.'
                : 'Manage academic programs and facilitators effectively.'
              }
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
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
          {activeTab === 'core-programs' && (
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
                {canManagePrograms && (
                <button 
                  onClick={() => navigate('/portal/programs/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Program</span>
                </button>
                )}
              </div>

              {/* Programs Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Program Details</th>
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Level & Code</th>
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Duration & Format</th>
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Pricing</th>
                        <th className="text-center py-4 px-6 font-semibold text-secondary-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPrograms.map((program) => (
                        <tr key={program.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-5 px-6">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-secondary-900 text-lg">
                                {program.programName || 'Untitled Program'}
                              </h3>
                              <p className="text-sm text-secondary-600 line-clamp-1">
                                {program.shortDescription ? 
                                  (program.shortDescription.length > 80 ? 
                                    program.shortDescription.substring(0, 80) + '...' 
                                    : program.shortDescription
                                  ) : 'No description available'
                                }
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(program.status || 'draft')}`}>
                                  {(program.status || 'draft').charAt(0).toUpperCase() + (program.status || 'draft').slice(1)}
                                </span>
                                {program.programMode && (
                                  <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded-md">
                                    {program.programMode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="space-y-2">
                              <div>
                                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
                                  {program.level || 'N/A'}
                                </span>
                              </div>
                              <div className="text-secondary-600">
                                <span className="font-mono text-sm font-medium">
                                  {program.programCode || 'No Code'}
                                </span>
                              </div>
                              {program.department && (
                                <div className="text-xs text-secondary-500">
                                  {program.department}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="space-y-2">
                              <div className="flex items-center text-secondary-700">
                                <Clock className="h-4 w-4 mr-2" />
                                <span className="font-medium">
                                  {program.programDuration || 'N/A'}
                                </span>
                              </div>
                              {program.totalCredits && (
                                <div className="text-sm text-secondary-600">
                                  {program.totalCredits} Credits
                                </div>
                              )}
                              <div className="text-xs text-secondary-500">
                                {program.intakeFrequency || 'Multiple Intakes'}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="space-y-2">
                              <div className="text-lg font-bold text-secondary-900">
                                {program.price && program.price > 0 
                                  ? `${new Intl.NumberFormat('en-KE', {
                                      style: 'currency',
                                      currency: program.currency || 'KES',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(program.price)}`
                                  : 'Contact for Price'
                                }
                              </div>
                              {program.paymentPlan && (
                                <div className="text-xs text-secondary-500">
                                  {program.paymentPlan}
                                </div>
                              )}
                              {program.scholarshipAvailable && (
                                <div className="text-xs text-accent-600 font-medium">
                                  Scholarships Available
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => navigate(`/portal/programs/${program.id}`)}
                                className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                title="View Program"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canManagePrograms && (
                                <>
                                  <button 
                                    onClick={() => navigate(`/portal/programs/${program.id}`)}
                                    className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                    title="Edit Program"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProgram(program.id)}
                                    className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    title="Delete Program"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {isApplicant && (
                                <button 
                                  onClick={() => handleRegisterForProgram(program.id)}
                                  disabled={registering === program.id}
                                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2 min-w-[100px] justify-center"
                                >
                                  {registering === program.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4" />
                                      <span>Apply</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {programs.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                        {isApplicant ? 'No Programs Available' : 'No Programs Yet'}
                      </h3>
                      <p className="text-secondary-600 mb-6">
                        {isApplicant 
                          ? 'Check back later for new program offerings.'
                          : 'Create your first program to get started.'
                        }
                      </p>
                      {canManagePrograms && (
                        <button 
                          onClick={() => navigate('/portal/programs/new')}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Program</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'short-programs' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search short programs..."
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
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {canManagePrograms && (
                <button 
                  onClick={() => navigate('/portal/events/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Short Program</span>
                </button>
                )}
              </div>

              {/* Short Programs Table */}
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Program Details</th>
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Schedule</th>
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Location</th>
                        <th className="text-left py-4 px-6 font-semibold text-secondary-700">Pricing & Status</th>
                        <th className="text-center py-4 px-6 font-semibold text-secondary-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => {
                        const eventDate = event.dates.length > 0 ? new Date(event.dates[0].date) : null;
                        const isUpcoming = eventDate && eventDate > new Date();
                        const isPast = eventDate && eventDate < new Date();
                        const attendeeCount = attendees.filter(a => a.eventId === event.id).length;
                        
                        return (
                          <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-5 px-6">
                              <div className="space-y-2">
                                <h3 className="font-semibold text-secondary-900 text-lg">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-secondary-600 line-clamp-1">
                                  {event.description.length > 80 ? 
                                    event.description.substring(0, 80) + '...' 
                                    : event.description
                                  }
                                </p>
                                <div className="flex items-center space-x-2">
                                  {event.goals && event.goals.length > 0 && (
                                    <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded-md">
                                      {event.goals[0]}
                                    </span>
                                  )}
                                  {attendeeCount > 0 && (
                                    <div className="flex items-center text-xs text-secondary-500">
                                      <Users className="h-3 w-3 mr-1" />
                                      <span>{attendeeCount} registered</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="space-y-2">
                                <div className="flex items-center text-secondary-700">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span className="font-medium">
                                    {eventDate ? eventDate.toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : 'TBA'}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-secondary-600">
                                  <Clock className="h-3 w-3 mr-2" />
                                  <span>
                                    {event.dates.length > 0 
                                      ? `${event.dates[0].startTime} - ${event.dates[0].endTime}`
                                      : 'Time TBA'
                                    }
                                  </span>
                                </div>
                                {eventDate && (
                                  <div className="text-xs text-secondary-500">
                                    {isUpcoming 
                                      ? `${Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away`
                                      : isPast 
                                        ? `${Math.ceil((new Date().getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                        : 'Today'
                                    }
                                  </div>
                                )}
                                {event.registrationDeadline && (
                                  <div className="text-xs text-amber-600 font-medium">
                                    Reg. Deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-GB')}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="space-y-2">
                                <div className="flex items-center text-secondary-700">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <span className="font-medium">
                                    {event.dates.length > 0 ? event.dates[0].location : 'TBA'}
                                  </span>
                                </div>
                                {event.dates.length > 1 && (
                                  <div className="text-xs text-secondary-500">
                                    +{event.dates.length - 1} more session{event.dates.length > 2 ? 's' : ''}
                                  </div>
                                )}
                                {event.targetAudience && event.targetAudience.length > 0 && (
                                  <div className="text-xs text-secondary-500">
                                    For: {event.targetAudience[0]}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="space-y-2">
                                <div className="text-lg font-bold text-secondary-900">
                                  {event.price && event.price > 0 
                                    ? `${new Intl.NumberFormat('en-KE', {
                                        style: 'currency',
                                        currency: event.currency || 'KES',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                      }).format(event.price)}`
                                    : 'Free'
                                  }
                                </div>
                                <div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventStatusColor(event.status)}`}>
                                    {getEventStatusText(event.status)}
                                  </span>
                                </div>
                                {event.isPublic ? (
                                  <div className="flex items-center text-xs text-accent-600">
                                    <Globe className="h-3 w-3 mr-1" />
                                    <span>Public</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-xs text-secondary-500">
                                    <Eye className="h-3 w-3 mr-1" />
                                    <span>Private</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center justify-center space-x-2">
                                <button 
                                  onClick={() => navigate(`/portal/events/${event.id}`)}
                                  className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                  title="View Short Program"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {canManagePrograms && (
                                  <>
                                    <button 
                                      onClick={() => navigate(`/portal/events/${event.id}`)}
                                      className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                      title="Edit Short Program"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => deleteEvent(event.id)}
                                      className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                      title="Delete Short Program"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                {isApplicant && (
                                  <button 
                                    onClick={() => navigate(`/portal/events/${event.id}`)}
                                    className="bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-700 transition-colors duration-200 flex items-center space-x-2 min-w-[100px] justify-center"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    <span>Register</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredEvents.length === 0 && !eventsLoading && (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'No Short Programs Found' : 'No Short Programs Yet'}
                      </h3>
                      <p className="text-secondary-600 mb-6">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search criteria or filters.'
                          : 'Create your first short program to get started.'
                        }
                      </p>
                      {canManagePrograms && !searchTerm && statusFilter === 'all' && (
                        <button 
                          onClick={() => navigate('/portal/events/new')}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Short Program</span>
                        </button>
                      )}
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