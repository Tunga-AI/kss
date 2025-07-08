import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, MapPin, Clock, Users, Globe, Eye, Edit } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface EventData {
  id?: string;
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
  image?: string;
  price?: number;
  requirements?: string;
  createdAt?: string;
}

const EventPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id); // New event = editing mode

  const [eventData, setEventData] = useState<EventData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: 100,
    currentAttendees: 0,
    status: 'upcoming',
    category: 'Academic',
    organizer: userProfile?.displayName || '',
    isPublic: true,
    registrationDeadline: '',
    image: '',
    price: 0,
    requirements: '',
  });

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('events', id!);
      if (result.success) {
        setEventData(result.data as EventData);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let result;
      let dataToSave = {
        ...eventData,
        createdAt: eventData.createdAt || new Date().toISOString(),
        organizer: eventData.organizer || userProfile?.displayName || 'Unknown',
      };

      if (!id) {
        result = await FirestoreService.create('events', dataToSave);
      } else {
        result = await FirestoreService.update('events', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/events/${(result as any).id}`);
        } else {
          navigate('/portal/events');
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EventData, value: any) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = [
    'Academic', 'Networking', 'Technology', 'Workshop', 'Conference', 
    'Seminar', 'Training', 'Social', 'Sports', 'Cultural', 'Other'
  ];

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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/events')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {id ? (isEditing ? 'Edit Event' : eventData.title || 'Event Details') : 'Create New Event'}
              </h1>
              <p className="text-lg text-primary-100">
                {id ? 'Manage event details and settings' : 'Set up a new event for your institution'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Event'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info - Only show if editing existing event */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Status</p>
                  <p className="text-2xl font-bold text-white">{eventData.status.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Attendees</p>
                  <p className="text-2xl font-bold text-white">{eventData.currentAttendees}/{eventData.maxAttendees}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Location</p>
                  <p className="text-2xl font-bold text-white truncate">{eventData.location || 'TBD'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Visibility</p>
                  <p className="text-2xl font-bold text-white">{eventData.isPublic ? 'Public' : 'Private'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  {eventData.isPublic ? <Globe className="h-6 w-6 text-white" /> : <Eye className="h-6 w-6 text-white" />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-secondary-800 mb-6">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                value={eventData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category
                </label>
                <select
                  value={eventData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={eventData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Organizer
              </label>
              <input
                type="text"
                value={eventData.organizer}
                onChange={(e) => handleInputChange('organizer', e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Event organizer name"
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-secondary-800 mb-6">Event Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={eventData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={eventData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={eventData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Event location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Max Attendees
                </label>
                <input
                  type="number"
                  value={eventData.maxAttendees}
                  onChange={(e) => handleInputChange('maxAttendees', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={eventData.registrationDeadline}
                  onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Price (Optional)
                </label>
                <input
                  type="number"
                  value={eventData.price || 0}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex items-center space-x-4 pt-8">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={eventData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-secondary-700">Public Event</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Requirements (Optional)
              </label>
              <textarea
                rows={3}
                value={eventData.requirements || ''}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                placeholder="Any special requirements or instructions..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage; 