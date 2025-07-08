import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { FirestoreService } from '../../services/firestore';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  status: string;
  category: string;
  organizer: string;
  isPublic: boolean;
  registrationDeadline: string;
  image?: string;
  price?: number;
  requirements?: string;
}

const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

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
        setEvent(result.data as Event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;
    
    setRegistering(true);
    try {
      // Create a registration record
      const registrationData = {
        eventId: event.id,
        name: 'Guest User', // This would come from a form in a real app
        email: 'guest@example.com', // This would come from a form in a real app
        registrationDate: new Date().toISOString(),
        status: 'registered'
      };

      const result = await FirestoreService.create('event_attendees', registrationData);
      if (result.success) {
        // Update event attendee count
        await FirestoreService.update('events', event.id, {
          currentAttendees: (event.currentAttendees || 0) + 1
        });
        
        setIsRegistered(true);
        // Reload event to get updated data
        loadEvent();
      }
    } catch (error) {
      console.error('Error registering for event:', error);
    } finally {
      setRegistering(false);
    }
  };

  const isEventFull = event ? (event.currentAttendees >= event.maxAttendees) : false;
  const isRegistrationClosed = event ? new Date(event.registrationDeadline) < new Date() : false;
  const isEventPast = event ? new Date(event.date) < new Date() : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">Event Not Found</h1>
          <p className="text-secondary-600 mb-6">The event you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/events')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="px-6 sm:px-8 lg:px-12">
          <button
            onClick={() => navigate('/events')}
            className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {event.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                  event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                  event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
              
              <h1 className="text-5xl font-bold mb-6">{event.title}</h1>
              <p className="text-xl text-primary-100 leading-relaxed mb-8">
                {event.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-primary-200" />
                  <div>
                    <p className="text-primary-100 text-sm">Date</p>
                    <p className="text-white font-semibold">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-primary-200" />
                  <div>
                    <p className="text-primary-100 text-sm">Time</p>
                    <p className="text-white font-semibold">{event.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6 text-primary-200" />
                  <div>
                    <p className="text-primary-100 text-sm">Location</p>
                    <p className="text-white font-semibold">{event.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-primary-200" />
                  <div>
                    <p className="text-primary-100 text-sm">Attendees</p>
                    <p className="text-white font-semibold">
                      {event.currentAttendees} / {event.maxAttendees}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-secondary-800 mb-2">Event Registration</h3>
                {event.price && event.price > 0 ? (
                  <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-primary-600">
                    <DollarSign className="h-8 w-8" />
                    <span>{event.price}</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-accent-600">Free Event</p>
                )}
              </div>

              {isRegistered ? (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-secondary-800 mb-2">You're Registered!</h4>
                  <p className="text-secondary-600 mb-6">
                    You'll receive a confirmation email with event details.
                  </p>
                </div>
              ) : isEventPast ? (
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-secondary-800 mb-2">Event Has Ended</h4>
                  <p className="text-secondary-600">This event has already taken place.</p>
                </div>
              ) : isEventFull ? (
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-secondary-800 mb-2">Event Full</h4>
                  <p className="text-secondary-600">This event has reached maximum capacity.</p>
                </div>
              ) : isRegistrationClosed ? (
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-secondary-800 mb-2">Registration Closed</h4>
                  <p className="text-secondary-600">
                    Registration deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Available Spots:</span>
                      <span className="font-semibold text-secondary-800">
                        {event.maxAttendees - event.currentAttendees}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Registration Deadline:</span>
                      <span className="font-semibold text-secondary-800">
                        {new Date(event.registrationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {registering ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span>Register Now</span>
                        <CheckCircle className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-20">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-secondary-800 mb-6">About This Event</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-secondary-600 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {event.requirements && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-secondary-800 mb-4">Requirements</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-secondary-600">{event.requirements}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-secondary-800 mb-4">Event Organizer</h3>
                <p className="text-secondary-600">{event.organizer}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-secondary-800 mb-4">Quick Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Category:</span>
                    <span className="font-medium text-secondary-800">{event.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Duration:</span>
                    <span className="font-medium text-secondary-800">
                      {event.time.includes('-') ? event.time : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Status:</span>
                    <span className="font-medium text-secondary-800 capitalize">{event.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetailPage; 