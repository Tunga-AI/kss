import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, MapPin, Clock, Users, Globe, Eye, Edit, Ticket, CheckCircle, Trash2, Upload, X, Plus } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { ContentResourceService } from '../../../services/contentService';
import { useAuthContext } from '../../../contexts/AuthContext';

interface DiscountOffer {
  id: string;
  type: 'early_bird' | 'discount_code' | 'referral_code' | 'group_discount';
  name: string;
  description: string;
  discountType: 'percentage' | 'amount';
  discountValue: number; // percentage (0-100) or amount
  code?: string; // for discount_code and referral_code
  minGroupSize?: number; // for group_discount
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  isPublic: boolean; // whether to show publicly or require code input
}

interface EventData {
  id?: string;
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
  discountOffers: DiscountOffer[];
  registrationForm: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'checkbox' | 'multiple-choice' | 'email' | 'phone';
    required: boolean;
    options?: string[]; // For multiple choice questions
    allowOther?: boolean; // Allow "Other" option for multiple choice and checkbox
  }>;
  createdAt?: string;
}

const EventPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const isApplicant = userProfile?.role === 'applicant';
  const canManageEvents = userProfile?.role === 'admin' || userProfile?.role === 'staff';
  const [isEditing, setIsEditing] = useState(!id && canManageEvents);

  const [eventData, setEventData] = useState<EventData>({
    title: '',
    description: '',
    slug: '',
    dates: [],
    status: 'upcoming',
    goals: [''],
    targetAudience: [''],
    isPublic: true,
    registrationDeadline: '',
    image: '',
    price: 0,
    currency: 'KES',
    requirements: '',
    discountOffers: [],
    registrationForm: [],
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
  ];

  useEffect(() => {
    if (id) {
      loadEvent();
      checkTicketStatus();
    }
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('events', id!);
      if (result.success) {
        const eventData = result.data as EventData;
        // Ensure arrays have at least one empty item if empty
        setEventData({
          ...eventData,
          goals: eventData.goals && eventData.goals.length > 0 ? eventData.goals : [''],
          targetAudience: eventData.targetAudience && eventData.targetAudience.length > 0 ? eventData.targetAudience : [''],
          discountOffers: eventData.discountOffers || [],
        });
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const checkSlugUniqueness = async (slug: string, currentId?: string) => {
    try {
      const result = await FirestoreService.getWithQuery('events', [
        { field: 'slug', operator: '==', value: slug }
      ]);
      
      if (result.success && result.data) {
        // If editing existing event, exclude current event from check
        const conflictingEvents = currentId 
          ? result.data.filter((event: any) => event.id !== currentId)
          : result.data;
        
        return conflictingEvents.length === 0;
      }
      return true;
    } catch (error) {
      console.error('Error checking slug uniqueness:', error);
      return false;
    }
  };

  const checkTicketStatus = async () => {
    if (!userProfile || !isApplicant) return;
    
    try {
      // Check if user already has a ticket for this event
      // This is a placeholder - you would implement actual ticket checking
    } catch (error) {
      console.error('Error checking ticket status:', error);
    }
  };

  const handleGetTicket = async () => {
    if (!userProfile || !id) return;
    
    setRegistering(true);
    try {
      // Here you would implement the ticket booking logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasTicket(true);
      alert('Ticket booked successfully! You will receive a confirmation email shortly.');
    } catch (error) {
      console.error('Error booking ticket:', error);
      alert('Ticket booking failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleSave = async () => {
    if (!canManageEvents) return;
    
    // Filter out empty goals and target audience
    const filteredGoals = eventData.goals.filter(goal => goal.trim());
    const filteredTargetAudience = eventData.targetAudience.filter(audience => audience.trim());
    
    // Validation
    if (!eventData.title || !eventData.slug || !eventData.dates.length || !eventData.registrationDeadline || 
        filteredGoals.length === 0 || filteredTargetAudience.length === 0) {
      alert('Please fill in all required fields including at least one goal and target audience');
      return;
    }

    // Check slug uniqueness
    const isSlugUnique = await checkSlugUniqueness(eventData.slug, id);
    if (!isSlugUnique) {
      alert('This URL slug is already taken. Please choose a different one.');
      return;
    }

    setSaving(true);
    try {
      let dataToSave = {
        ...eventData,
        goals: filteredGoals,
        targetAudience: filteredTargetAudience,
        createdAt: eventData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let result;
      if (!id) {
        result = await FirestoreService.create('events', dataToSave);
      } else {
        result = await FirestoreService.update('events', id, dataToSave);
      }

      if (result.success) {
        alert(`✅ Event ${isEditing ? 'updated' : 'created'} successfully!`);
        
        if (!id && (result as any).id) {
          navigate(`/portal/events/${(result as any).id}`);
        } else {
          setIsEditing(false);
        }
      } else {
        alert(`❌ Failed to ${isEditing ? 'update' : 'create'} event. ${result.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('❌ Error saving event:', error);
      alert(`❌ Error ${isEditing ? 'updating' : 'creating'} event: ${error instanceof Error ? error.message : 'Please try again.'}`);
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

  const handleArrayChange = (field: string, index: number, value: string) => {
    setEventData(prev => ({
      ...prev,
      [field]: (prev[field as keyof EventData] as any[]).map((item: any, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string, defaultValue: any = '') => {
    setEventData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof EventData] as any[]), defaultValue]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setEventData(prev => ({
      ...prev,
      [field]: (prev[field as keyof EventData] as any[]).filter((_: any, i: number) => i !== index)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await ContentResourceService.uploadFile(file, 'events');
      if (uploadResult.success && uploadResult.url) {
        handleInputChange('image', uploadResult.url);
      } else {
        alert('Failed to upload image: ' + uploadResult.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    handleInputChange('image', '');
  };

  const isEventPast = eventData.dates.length > 0 ? new Date(eventData.dates[eventData.dates.length - 1].date) < new Date() : false;

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
                {id ? (isEditing ? 'Edit Event' : eventData.title || 'Event Details') : 'New Event'}
              </h1>
              <p className="text-lg text-primary-100">
                {isApplicant 
                  ? 'View event details and book your ticket'
                  : (id ? 'Manage event details and settings' : 'Create a new event for your institution')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isApplicant && id && (
              <button
                onClick={handleGetTicket}
                disabled={registering || hasTicket || isEventPast}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  hasTicket 
                    ? 'bg-green-500 text-white cursor-not-allowed' 
                    : isEventPast
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-white text-primary-600 hover:bg-gray-100 disabled:opacity-50'
                }`}
              >
                {registering ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : hasTicket ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Ticket className="h-4 w-4" />
                )}
                <span>
                  {registering 
                    ? 'Booking...' 
                    : hasTicket 
                      ? 'Ticket Booked' 
                      : isEventPast
                        ? 'Event Ended'
                        : 'Get Ticket'
                  }
                </span>
              </button>
            )}
            {canManageEvents && (
              <>
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
              </>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary-800">Event Overview</h2>
                {isApplicant && hasTicket && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Ticket Confirmed</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => {
                      handleInputChange('title', e.target.value);
                      // Auto-generate slug from title if slug is empty
                      if (!eventData.slug && e.target.value) {
                        const generatedSlug = generateSlug(e.target.value);
                        handleInputChange('slug', generatedSlug);
                      }
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    URL Slug *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      /
                    </span>
                    <input
                      type="text"
                      value={eventData.slug}
                      onChange={(e) => handleInputChange('slug', generateSlug(e.target.value))}
                      disabled={!isEditing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="url-friendly-name"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This will be used for the public event URL (domain.com/slug)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Event Image
                  </label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      />
                      {eventData.image && (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={eventData.image}
                              alt="Event thumbnail"
                              className="w-12 h-12 object-cover rounded"
                            />
                            <span className="text-sm text-green-700 font-medium">Image uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {uploading && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      {eventData.image ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={eventData.image}
                            alt="Event thumbnail"
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-gray-700">Image uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No image uploaded</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status *
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    value={eventData.registrationDeadline}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
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

              {/* Pricing Section */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Event Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventData.price || ''}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                      placeholder="Enter price (e.g., 5000)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={eventData.currency || 'KES'}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    >
                      <option value="KES">KES (Kenyan Shilling)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Set the event price. Leave as 0 for "Free Event".
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Event Goals
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('goals', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Goal</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(Array.isArray(eventData.goals) ? eventData.goals : ['']).map((goal, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => handleArrayChange('goals', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Goal ${index + 1}`}
                      />
                      {isEditing && (Array.isArray(eventData.goals) ? eventData.goals.length : 0) > 1 && (
                        <button
                          onClick={() => removeArrayItem('goals', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Target Audience
                  </label>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('targetAudience', '')}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Audience</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(Array.isArray(eventData.targetAudience) ? eventData.targetAudience : ['']).map((audience, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => handleArrayChange('targetAudience', index, e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder={`Target audience ${index + 1}`}
                      />
                      {isEditing && (Array.isArray(eventData.targetAudience) ? eventData.targetAudience.length : 0) > 1 && (
                        <button
                          onClick={() => removeArrayItem('targetAudience', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
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
          )}

          {activeTab === 'details' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Event Details</h2>
              
              {/* Event Dates */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-lg font-semibold text-secondary-800">
                      Event Sessions
                    </label>
                    <p className="text-sm text-secondary-600 mt-1">Define the dates, times and locations for your event</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newDate = {
                          date: '',
                          startTime: '',
                          endTime: '',
                          location: ''
                        };
                        handleInputChange('dates', [...eventData.dates, newDate]);
                      }}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Session</span>
                    </button>
                  )}
                </div>
                
                {/* Table View for Non-editing Mode */}
                {!isEditing && eventData.dates?.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-primary-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-primary-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-primary-700 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-primary-700 uppercase tracking-wider">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(Array.isArray(eventData.dates) ? eventData.dates : []).map((dateItem, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{dateItem.date || 'TBD'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700">{dateItem.startTime && dateItem.endTime ? `${dateItem.startTime} - ${dateItem.endTime}` : 'TBD'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700">{dateItem.location || 'TBD'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Edit Mode - Simple Form */}
                {isEditing && (
                  <div className="space-y-4">
                    {(Array.isArray(eventData.dates) ? eventData.dates : []).map((dateItem, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-secondary-800">Session {index + 1}</h4>
                          {(Array.isArray(eventData.dates) ? eventData.dates.length : 0) > 1 && (
                            <button
                              onClick={() => {
                                const newDates = eventData.dates.filter((_, i) => i !== index);
                                handleInputChange('dates', newDates);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={dateItem.date}
                              onChange={(e) => {
                                const newDates = [...eventData.dates];
                                newDates[index].date = e.target.value;
                                handleInputChange('dates', newDates);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={dateItem.startTime}
                              onChange={(e) => {
                                const newDates = [...eventData.dates];
                                newDates[index].startTime = e.target.value;
                                handleInputChange('dates', newDates);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                            <input
                              type="time"
                              value={dateItem.endTime}
                              onChange={(e) => {
                                const newDates = [...eventData.dates];
                                newDates[index].endTime = e.target.value;
                                handleInputChange('dates', newDates);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={dateItem.location}
                              onChange={(e) => {
                                const newDates = [...eventData.dates];
                                newDates[index].location = e.target.value;
                                handleInputChange('dates', newDates);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              placeholder="e.g., Main Hall, Online"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Offers Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-lg font-semibold text-secondary-800">
                      Discount Offers
                    </label>
                    <p className="text-sm text-secondary-600 mt-1">Create discount codes and special offers for your event</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newOffer: DiscountOffer = {
                          id: Date.now().toString(),
                          type: 'discount_code',
                          name: '',
                          description: '',
                          discountType: 'percentage',
                          discountValue: 0,
                          code: '',
                          expiryDate: '',
                          isActive: true,
                          isPublic: false
                        };
                        handleInputChange('discountOffers', [...eventData.discountOffers, newOffer]);
                      }}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Discount</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {eventData.discountOffers.map((offer, index) => (
                    <div key={offer.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-secondary-800">Discount {index + 1}</h4>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newOffers = eventData.discountOffers.filter(o => o.id !== offer.id);
                              handleInputChange('discountOffers', newOffers);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Offer Name</label>
                          <input
                            type="text"
                            value={offer.name}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].name = e.target.value;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                            placeholder="e.g., Early Bird Discount"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                          <select
                            value={offer.type}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].type = e.target.value as any;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                          >
                            <option value="early_bird">Early Bird</option>
                            <option value="discount_code">Discount Code</option>
                            <option value="referral_code">Referral Code</option>
                            <option value="group_discount">Group Discount</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Value Type</label>
                          <select
                            value={offer.discountType}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].discountType = e.target.value as any;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="amount">Fixed Amount</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Discount Value {offer.discountType === 'percentage' ? '(%)' : `(${eventData.currency || 'KES'})`}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={offer.discountType === 'percentage' ? 100 : undefined}
                            value={offer.discountValue}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].discountValue = parseFloat(e.target.value) || 0;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                            placeholder="Enter value"
                          />
                        </div>

                        {(offer.type === 'discount_code' || offer.type === 'referral_code') && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Discount Code</label>
                            <input
                              type="text"
                              value={offer.code || ''}
                              onChange={(e) => {
                                const newOffers = [...eventData.discountOffers];
                                const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                                newOffers[offerIndex].code = e.target.value;
                                handleInputChange('discountOffers', newOffers);
                              }}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                              placeholder="e.g., EARLY2024"
                            />
                          </div>
                        )}

                        {offer.type === 'group_discount' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Group Size</label>
                            <input
                              type="number"
                              min="2"
                              value={offer.minGroupSize || ''}
                              onChange={(e) => {
                                const newOffers = [...eventData.discountOffers];
                                const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                                newOffers[offerIndex].minGroupSize = parseInt(e.target.value) || 2;
                                handleInputChange('discountOffers', newOffers);
                              }}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                              placeholder="e.g., 5"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={offer.expiryDate}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].expiryDate = e.target.value;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Usage Limit (Optional)</label>
                          <input
                            type="number"
                            min="1"
                            value={offer.usageLimit || ''}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].usageLimit = parseInt(e.target.value) || undefined;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                            placeholder="Leave blank for unlimited"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={offer.description}
                          onChange={(e) => {
                            const newOffers = [...eventData.discountOffers];
                            const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                            newOffers[offerIndex].description = e.target.value;
                            handleInputChange('discountOffers', newOffers);
                          }}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50 resize-none"
                          placeholder="Describe this discount offer..."
                        />
                      </div>

                      <div className="mt-4 flex items-center space-x-6">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={offer.isActive}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].isActive = e.target.checked;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs font-medium text-gray-700">Active</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={offer.isPublic}
                            onChange={(e) => {
                              const newOffers = [...eventData.discountOffers];
                              const offerIndex = newOffers.findIndex(o => o.id === offer.id);
                              newOffers[offerIndex].isPublic = e.target.checked;
                              handleInputChange('discountOffers', newOffers);
                            }}
                            disabled={!isEditing}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs font-medium text-gray-700">Show Publicly</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  {eventData.discountOffers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No discount offers created yet.</p>
                      <p className="text-sm">Add discount codes to encourage early registration.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Form Builder */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-lg font-semibold text-secondary-800">
                      Custom Registration Form
                    </label>
                    <p className="text-sm text-secondary-600 mt-1">Add custom questions for event registration</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newQuestion = {
                          id: Date.now().toString(),
                          question: '',
                          type: 'text' as const,
                          required: false
                        };
                        handleInputChange('registrationForm', [...eventData.registrationForm, newQuestion]);
                      }}
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Question</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {eventData.registrationForm.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-secondary-800">Question {index + 1}</h4>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newForm = eventData.registrationForm.filter(q => q.id !== question.id);
                              handleInputChange('registrationForm', newForm);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => {
                              const newForm = [...eventData.registrationForm];
                              const questionIndex = newForm.findIndex(q => q.id === question.id);
                              newForm[questionIndex].question = e.target.value;
                              handleInputChange('registrationForm', newForm);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                            placeholder="Enter your question"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Answer Type</label>
                          <select
                            value={question.type}
                            onChange={(e) => {
                              const newForm = [...eventData.registrationForm];
                              const questionIndex = newForm.findIndex(q => q.id === question.id);
                              newForm[questionIndex].type = e.target.value as any;
                              handleInputChange('registrationForm', newForm);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50"
                          >
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="multiple-choice">Multiple Choice</option>
                          </select>
                        </div>
                      </div>

                      {question.type === 'multiple-choice' && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Options (one per line)</label>
                          <textarea
                            rows={3}
                            value={question.options?.join('\n') || ''}
                            onChange={(e) => {
                              const newForm = [...eventData.registrationForm];
                              const questionIndex = newForm.findIndex(q => q.id === question.id);
                              newForm[questionIndex].options = e.target.value.split('\n').filter(opt => opt.trim());
                              handleInputChange('registrationForm', newForm);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-50 resize-none"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => {
                              const newForm = [...eventData.registrationForm];
                              const questionIndex = newForm.findIndex(q => q.id === question.id);
                              newForm[questionIndex].required = e.target.checked;
                              handleInputChange('registrationForm', newForm);
                            }}
                            disabled={!isEditing}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs font-medium text-gray-700">Required</span>
                        </label>

                        {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={question.allowOther || false}
                              onChange={(e) => {
                                const newForm = [...eventData.registrationForm];
                                const questionIndex = newForm.findIndex(q => q.id === question.id);
                                newForm[questionIndex].allowOther = e.target.checked;
                                handleInputChange('registrationForm', newForm);
                              }}
                              disabled={!isEditing}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-xs font-medium text-gray-700">Allow "Other"</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}

                  {eventData.registrationForm.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No custom questions added yet.</p>
                      <p className="text-sm">Basic information (name, email) will be collected automatically.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPage;