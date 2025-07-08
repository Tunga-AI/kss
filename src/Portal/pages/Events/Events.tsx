import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, Plus, MapPin, Clock, Users, Edit, Trash2, Eye } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  category: string;
  organizer: string;
  isPublic: boolean;
  registrationDeadline: string;
  createdAt: string;
}

interface Attendee {
  id: string;
  eventId: string;
  name: string;
  email: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
}

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stats = [
    { title: 'Total Events', value: events.length.toString(), change: '+6', icon: Calendar, color: 'primary' },
    { title: 'This Month', value: events.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length.toString(), change: '+3', icon: Clock, color: 'accent' },
    { title: 'Total Attendees', value: attendees.length.toString(), change: '+234', icon: Users, color: 'secondary' },
  ];

  useEffect(() => {
    loadEvents();
    loadAttendees();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getAll('events');
      if (result.success && result.data) {
        setEvents(result.data as Event[]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      const result = await FirestoreService.getAll('event_attendees');
      if (result.success && result.data) {
        setAttendees(result.data as Attendee[]);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getEventAttendees = (eventId: string) => {
    return attendees.filter(attendee => attendee.eventId === eventId);
  };

  const tabs = [
    { id: 'events', label: 'All Events' },
    { id: 'attendees', label: 'Attendees' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-accent-100 text-accent-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
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
            <h1 className="text-4xl font-bold mb-2">Events</h1>
            <p className="text-lg text-primary-100">
              Plan, organize, and manage institutional events and activities.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Calendar className="h-8 w-8 text-white" />
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
          {activeTab === 'events' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
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
                <button 
                  onClick={() => navigate('/portal/events/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Event</span>
                </button>
              </div>

              {/* Events Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => navigate(`/portal/events/${event.id}`)}
                          className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/portal/events/${event.id}/edit`)}
                          className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                          title="Edit Event"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteEvent(event.id)}
                          className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">{event.title}</h3>
                    <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Calendar className="h-4 w-4 text-primary-600" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Clock className="h-4 w-4 text-primary-600" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <MapPin className="h-4 w-4 text-primary-600" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Users className="h-4 w-4 text-primary-600" />
                        <span>{event.currentAttendees || 0}/{event.maxAttendees} attendees</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-gray-100 text-secondary-800 rounded-full text-xs font-medium">
                        {event.category}
                      </span>
                      {event.isPublic && (
                        <span className="px-2 py-1 bg-accent-100 text-accent-800 rounded text-xs font-medium">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Events Found</h3>
                  <p className="text-secondary-600 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No events match your search criteria.' 
                      : 'Start by creating your first event.'
                    }
                  </p>
                  <button 
                    onClick={() => navigate('/portal/events/new')}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Event</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendees' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Event Attendees</h2>
                <div className="text-sm text-secondary-600">
                  Total: {attendees.length} attendees across all events
                </div>
              </div>

              {/* Attendees List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendees.map((attendee) => {
                        const event = events.find(e => e.id === attendee.eventId);
                        return (
                          <tr key={attendee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                                <div className="text-sm text-gray-500">{attendee.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{event?.title || 'Unknown Event'}</div>
                              <div className="text-sm text-gray-500">{event?.date ? new Date(event.date).toLocaleDateString() : ''}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attendee.registrationDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                attendee.status === 'attended' ? 'bg-green-100 text-green-800' :
                                attendee.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {attendee.status === 'attended' ? 'Attended' :
                                 attendee.status === 'registered' ? 'Registered' : 'No Show'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {attendees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Attendees Yet</h3>
                    <p className="text-secondary-600">Attendees will appear here when people register for events.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;