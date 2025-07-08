import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Search, 
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Share2,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { FirestoreService } from '../../services/firestore';
import Logo from '../../components/Logo';

// Types
type ViewMode = 'grid' | 'list' | 'calendar';
type EventType = 'masterclass' | 'workshop' | 'webinar' | 'open_day' | 'info_session' | 'networking' | 'conference' | 'seminar' | 'custom';
type EventFormat = 'virtual' | 'in_person' | 'hybrid';
type CostType = 'free' | 'paid';

interface EventSummary {
  id: string;
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
  capacity: {
    total: number;
    registered: number;
    available: boolean;
  };
  facilitators: Array<{
    name: string;
    title?: string;
  }>;
  thumbnailUrl?: string;
  registrationEnabled: boolean;
}

interface EventFilter {
  search?: string;
  type?: EventType[];
  format?: EventFormat[];
  costType?: CostType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Simple Card component
const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  hover?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${hover ? 'hover:shadow-lg transition-shadow duration-300' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Simple Button component
const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  icon?: any;
  iconPosition?: 'left' | 'right';
}> = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  disabled = false, 
  onClick,
  icon: Icon,
  iconPosition = 'left'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
    </button>
  );
};

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<EventFormat[]>([]);
  const [selectedCostTypes, setSelectedCostTypes] = useState<CostType[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      loadEvents();
    }
  }, [searchTerm, selectedTypes, selectedFormats, selectedCostTypes, dateRange, isInitialLoading]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // For now, load from Firestore (will be replaced with proper service later)
      const result = await FirestoreService.getWithQuery('events', [
        { field: 'isPublic', operator: '==', value: true }
      ]);
      
      if (result.success && result.data) {
        // Transform the data to match EventSummary interface
        const transformedEvents: EventSummary[] = result.data.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: new Date(event.date),
          endDate: new Date(event.date), // Assuming single day events for now
          type: event.category?.toLowerCase() || 'seminar',
          format: 'in_person', // Default for now
          location: {
            displayText: event.location || 'TBA'
          },
          pricing: {
            costType: event.price && event.price > 0 ? 'paid' : 'free',
            amount: event.price || 0,
            currency: 'KES'
          },
          capacity: {
            total: event.maxAttendees || 100,
            registered: event.currentAttendees || 0,
            available: (event.currentAttendees || 0) < (event.maxAttendees || 100)
          },
          facilitators: event.organizer ? [{ name: event.organizer }] : [],
          thumbnailUrl: event.image,
          registrationEnabled: true
        }));
        
        // Apply filters
        let filteredEvents = transformedEvents;
        
        if (searchTerm) {
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedTypes.length > 0) {
          filteredEvents = filteredEvents.filter(event =>
            selectedTypes.includes(event.type)
          );
        }
        
        if (selectedFormats.length > 0) {
          filteredEvents = filteredEvents.filter(event =>
            selectedFormats.includes(event.format)
          );
        }
        
        if (selectedCostTypes.length > 0) {
          filteredEvents = filteredEvents.filter(event =>
            selectedCostTypes.includes(event.pricing.costType)
          );
        }
        
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          filteredEvents = filteredEvents.filter(event =>
            event.startDate >= startDate && event.startDate <= endDate
          );
        }
        
        setEvents(filteredEvents);
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedFormats([]);
    setSelectedCostTypes([]);
    setDateRange({ start: '', end: '' });
  };

  const shareEvent = (event: EventSummary) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: `/events/${event.id}`
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    }
  };

  const EventCard: React.FC<{ event: EventSummary; compact?: boolean }> = ({ event, compact = false }) => {
    // Default image if no thumbnail
    const imageUrl = event.thumbnailUrl || '/kss7.jpg';
    
    if (compact) {
      // List view - horizontal layout
      return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="flex">
            <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden">
              <img 
                src={imageUrl} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20"></div>
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-medium">
                      {getEventTypeLabel(event.type)}
                    </span>
                    <span className="text-xs text-gray-500">{getFormatIcon(event.format)}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <Calendar size={14} className="mr-1 text-primary-600" />
                    <span>{formatDate(event.startDate)}</span>
                    <Clock size={14} className="mr-1 ml-3 text-primary-600" />
                    <span>{formatTime(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin size={14} className="mr-1 text-primary-600" />
                    <span className="line-clamp-1">{event.location.displayText}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className="text-lg font-bold text-gray-900">
                    {event.pricing.costType === 'free' ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <span className="text-sm">{event.pricing.currency} {event.pricing.amount?.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/events/${event.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink size={14} className="mr-1" />
                        Details
                      </Button>
                    </Link>
                    <Link to={`/events/${event.id}`}>
                      <Button 
                        size="sm" 
                        disabled={!event.capacity.available}
                        className={!event.capacity.available ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {event.capacity.available ? 'Register' : 'Full'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }
    
    // Grid view - full image overlay like programs page
    return (
      <Card
        hover
        className="relative overflow-hidden h-96 lg:h-[28rem] transition-all duration-500"
      >
        <img
          src={imageUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
          {/* Top Section - Badges */}
          <div className="flex justify-between items-start">
            <div className="bg-primary-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-sm font-medium">
              {getEventTypeLabel(event.type)}
            </div>
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-sm font-medium">
              {getFormatIcon(event.format)}
            </div>
          </div>
          
          {/* Bottom Section - Content */}
          <div>
            <h3 className="text-lg lg:text-xl font-semibold mb-3">
              {event.title}
            </h3>
            <p className="text-gray-100 mb-4 text-sm lg:text-base leading-relaxed line-clamp-2">
              {event.description}
            </p>
            
            {/* Event Details */}
            <div className="grid grid-cols-1 gap-2 mb-6">
              <div className="flex items-center text-sm text-gray-200">
                <Calendar size={16} className="mr-2 text-accent-300" />
                <span>{formatDate(event.startDate)}</span>
                <Clock size={16} className="mr-2 ml-4 text-accent-300" />
                <span>{formatTime(event.startDate)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-200">
                <MapPin size={16} className="mr-2 text-accent-300" />
                <span className="line-clamp-1">{event.location.displayText}</span>
              </div>
              {event.facilitators.length > 0 && (
                <div className="flex items-center text-sm text-gray-200">
                  <Users size={16} className="mr-2 text-accent-300" />
                  <span>
                    {event.facilitators[0].name}
                    {event.facilitators.length > 1 && ` +${event.facilitators.length - 1} more`}
                  </span>
                </div>
              )}
            </div>
            
            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xl lg:text-2xl font-bold text-accent-300">
                {event.pricing.costType === 'free' ? (
                  'Free'
                ) : (
                  `${event.pricing.currency} ${event.pricing.amount?.toLocaleString()}`
                )}
              </span>
              <div className="flex items-center gap-2">
                <Link to={`/events/${event.id}`}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-primary-600"
                  >
                    Details
                  </Button>
                </Link>
                <Link to={`/events/${event.id}`}>
                  <Button 
                    size="sm" 
                    className="bg-accent-500 hover:bg-accent-600"
                    disabled={!event.capacity.available}
                  >
                    {event.capacity.available ? 'Register' : 'Full'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (isInitialLoading) {
    return <PublicPageLoader message="Loading Events & Experiences..." />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss9.jpg"
            alt="People at networking event"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-secondary-900/90"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative w-full px-6 sm:px-8 lg:px-12 pb-16 lg:pb-20">
          <div className="w-full">
            <div className="text-white">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <Calendar className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">Events & Experiences</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Discover Amazing
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Events
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Join our community of learners and professionals. Explore workshops, masterclasses, and networking events.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-start">
                <Link to="/auth">
                  <button className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-[3px] hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1">
                    <span>Join Community</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/programs">
                  <button className="group border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold backdrop-blur-sm">
                    <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>View Programs</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* View Mode and Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  >
                    <Calendar size={18} />
                  </button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center"
                >
                  <Filter size={18} className="mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Event Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                    <select
                      multiple
                      value={selectedTypes}
                      onChange={(e) => setSelectedTypes(Array.from(e.target.selectedOptions, option => option.value as EventType))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="masterclass">Masterclass</option>
                      <option value="workshop">Workshop</option>
                      <option value="webinar">Webinar</option>
                      <option value="open_day">Open Day</option>
                      <option value="info_session">Info Session</option>
                      <option value="networking">Networking</option>
                    </select>
                  </div>

                  {/* Format Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      multiple
                      value={selectedFormats}
                      onChange={(e) => setSelectedFormats(Array.from(e.target.selectedOptions, option => option.value as EventFormat))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="virtual">Virtual</option>
                      <option value="in_person">In-Person</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  {/* Cost Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
                    <select
                      multiple
                      value={selectedCostTypes}
                      onChange={(e) => setSelectedCostTypes(Array.from(e.target.selectedOptions, option => option.value as CostType))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Events Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Logo size="lg" showText={false} />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedTypes.length > 0 || selectedFormats.length > 0 || selectedCostTypes.length > 0
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Check back soon for upcoming events!'}
              </p>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing {events.length} event{events.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div 
                      key={event.id}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <EventCard event={event} compact />
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="text-center text-gray-600 py-8">
                    <Calendar size={48} className="mx-auto mb-4" />
                    <p>Calendar view coming soon!</p>
                    <p className="text-sm mt-2">Switch to grid or list view to browse events.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;