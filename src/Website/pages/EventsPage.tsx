import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowRight,
  Award
} from 'lucide-react';
import { FirestoreService } from '../../services/firestore';
import Logo from '../../components/Logo';
import { useModal } from '../../contexts/ModalContext';

// Types
type EventType = 'masterclass' | 'workshop' | 'webinar' | 'open_day' | 'info_session' | 'networking' | 'conference' | 'seminar' | 'custom';
type EventFormat = 'virtual' | 'in_person' | 'hybrid';
type CostType = 'free' | 'paid';

interface EventSummary {
  id: string;
  slug?: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  format: EventFormat;
  location: {
    displayText: string;
    address?: string;
    virtualLink?: string;
  };
  pricing: {
    costType: CostType;
    amount?: number;
    currency: string;
  };
  facilitators: Array<{
    name: string;
    title?: string;
  }>;
  thumbnailUrl?: string;
  registrationEnabled: boolean;
  // Additional fields for display
  sessionCount: number;
  timeRange: string;
}



// Loading component
const PublicPageLoader: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Logo size="2xl" showText={true} textSize="3xl" className="justify-center" />
        </div>
        <p className="text-white text-xl">{message}</p>
      </div>
    </div>
  );
};

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { openLeadModal, openB2bLeadModal } = useModal();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // For now, load from Firestore (will be replaced with proper service later)
      const result = await FirestoreService.getWithQuery('events', [
        { field: 'isPublic', operator: '==', value: true }
      ]);
      
      if (result.success && result.data) {
        // Transform the data to match EventSummary interface
        const transformedEvents: EventSummary[] = result.data.map((event: any) => {
          // Safe date conversion - handle different date formats
          let eventDate = new Date();
          if (event.date) {
            const parsedDate = new Date(event.date);
            if (!isNaN(parsedDate.getTime())) {
              eventDate = parsedDate;
            }
          } else if (event.dates && event.dates.length > 0) {
            const parsedDate = new Date(event.dates[0].date);
            if (!isNaN(parsedDate.getTime())) {
              eventDate = parsedDate;
            }
          }

          return {
            id: event.id,
            slug: event.slug,
            title: event.title,
            description: event.description,
            startDate: eventDate,
            endDate: eventDate, // For now, assume single day events
            type: event.category?.toLowerCase() || 'seminar',
            format: 'in_person', // Default for now
            location: {
              displayText: event.location || (event.dates && event.dates.length > 0 ? event.dates[0].location : 'TBA')
            },
            pricing: {
              costType: event.price && event.price > 0 ? 'paid' : 'free',
              amount: event.price || 0,
              currency: event.currency || 'KES'
            },
            facilitators: event.organizer ? [{ name: event.organizer }] : [],
            thumbnailUrl: event.image,
            registrationEnabled: true,
            // Additional fields for display
            sessionCount: event.dates ? event.dates.length : 1,
            timeRange: event.dates && event.dates.length > 0 ? 
              `${event.dates[0].startTime || '09:00'} - ${event.dates[0].endTime || '17:00'}` : 
              '09:00 - 17:00'
          };
        });
        
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeLabel = (type: EventType) => {
    const labels: Record<EventType, string> = {
      masterclass: 'Masterclass',
      workshop: 'Workshop',
      webinar: 'Webinar',
      open_day: 'Open Day',
      info_session: 'Info Session',
      networking: 'Networking',
      conference: 'Conference',
      seminar: 'Seminar',
      custom: 'Special Event'
    };
    return labels[type] || type;
  };

  const getFormatIcon = (format: EventFormat) => {
    switch (format) {
      case 'virtual':
        return '🌐';
      case 'in_person':
        return '📍';
      case 'hybrid':
        return '🔄';
      default:
        return '📅';
    }
  };



  const EventCard: React.FC<{ event: EventSummary }> = ({ event }) => {
    // Default image if no thumbnail
    const imageUrl = event.thumbnailUrl || '/kss7.jpg';
    
    // Grid view - exact ProgramsPage design
    return (
      <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-white">
        <img
          src={imageUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
          <div>
            <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 line-clamp-2">
              {event.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm lg:text-base font-bold text-accent-300">
                {event.pricing.costType === 'free' ? (
                  'Free'
                ) : (
                  `${event.pricing.currency} ${event.pricing.amount?.toLocaleString()}`
                )}
              </span>
              
              <Link to={`/${event.slug || event.id}`}>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded-md text-xs transition-colors duration-200">
                  Details
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-screen">
      {/* Hero Section - exact ProgramsPage design */}
      <section className="relative h-screen bg-white pt-20 pb-8 lg:pb-12">
        <div className="px-6 sm:px-8 lg:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[95%] overflow-hidden rounded-md shadow-2xl">
            <img
              src="/events.jpeg"
              alt="People at networking event"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end px-6 sm:px-8 lg:px-12 pb-12">
              <div className="max-w-2xl">
                <div className="text-white">
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Discover Impactful
                    <span className="block" style={{ color: '#4590AD' }}>
                      Short Programs
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    Join intensive workshops, masterclasses, and short courses designed to boost your skills quickly and effectively.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="#programs" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        Browse Programs
                      </button>
                    </a>
                    <Link to="/programs" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        View Programs
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-16 lg:py-24 bg-white relative">

        <div className="w-full px-6 sm:px-8 lg:px-12">
          {/* Programs Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Logo size="lg" showText={false} />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No programs found</h3>
              <p className="text-gray-600">
                Check back soon for upcoming short programs and workshops!
              </p>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing {events.length} program{events.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Grid View - matching ProgramsPage layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {events.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Our Short Programs */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/short ptograms.jpg"
                alt="Why Choose Our Short Programs"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Why Choose Our Short Programs?
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Fast-track your skills with intensive workshops and masterclasses designed for immediate impact and practical application.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {/* Intensive Learning */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-primary-500 p-3 rounded-md shadow-lg">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Intensive Learning
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                    Concentrated learning experiences that deliver maximum value in minimum time.
                  </p>
                </div>
              </div>

              {/* Practical Application */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-secondary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-secondary-500 p-3 rounded-md shadow-lg">
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Practical Application
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                    Learn by doing with hands-on workshops that you can apply immediately in your work.
                  </p>
                </div>
              </div>

              {/* Quick Skill Boost */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-accent-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-accent-500 p-3 rounded-md shadow-lg">
                    <ArrowRight className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Quick Skill Boost
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                    Accelerate your professional development with focused training that fits your schedule.
                  </p>
                </div>
              </div>

              {/* Expert Facilitation */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-neutral-700">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <Award className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Expert Facilitation
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                    Learn from industry experts who bring real-world experience and proven methodologies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventsPage;