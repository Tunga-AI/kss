import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Tag, CheckCircle, AlertCircle, Smartphone, CreditCard, User, Mail, Phone, MessageSquare, Target } from 'lucide-react';
import { FirestoreService, EventService } from '../../services/firestore';
import { useAuthContext } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import CustomerLeadModal from '../../components/CustomerLeadModal';
import { darajaService, type STKPushResponse, type MpesaTransactionRecord } from '../../services/darajaService';

interface DiscountOffer {
  id: string;
  type: 'early_bird' | 'discount_code' | 'referral_code' | 'group_discount';
  name: string;
  description: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  code?: string;
  minGroupSize?: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  isPublic: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  slug?: string;
  dates: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  status: string;
  goals: string[];
  targetAudience: string[];
  isPublic: boolean;
  registrationDeadline: string;
  image?: string;
  price?: number;
  currency?: string;
  requirements?: string;
  discountOffers?: DiscountOffer[];
  registrationForm: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'checkbox' | 'multiple-choice' | 'email' | 'phone';
    required: boolean;
    options?: string[];
    allowOther?: boolean;
  }>;
}

const EventDetailPage: React.FC = () => {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  
  // Use either id or slug parameter (slug is used for root-level routes)
  const eventIdentifier = id || slug;
  const { user } = useAuthContext();
  const { showLeadModal, setShowLeadModal, selectedProgramType } = useModal();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Registration section state
  const [showRegistrationSection, setShowRegistrationSection] = useState(false);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    whatsappNumber: string;
    currentRole: string;
    currentOrganization: string;
    learningGoals: string;
    communicationPreference: 'email' | 'whatsapp' | 'phone' | 'any';
    source: 'website' | 'referral' | 'social_media' | 'direct' | 'other';
    referralSource?: string;
    socialMediaPlatform?: string;
    staffStudentName?: string;
    mediaConsent: boolean;
    mediaPrivacy: boolean;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: '',
    currentRole: '',
    currentOrganization: '',
    learningGoals: '',
    communicationPreference: 'any',
    source: 'website',
    mediaConsent: false,
    mediaPrivacy: false
  });
  const [paymentOption, setPaymentOption] = useState<'mpesa' | 'bank' | 'later'>('mpesa');
  const [mpesaCode, setMpesaCode] = useState('');
  
  // M-Pesa STK Push state
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [stkPushLoading, setStkPushLoading] = useState(false);
  const [stkPushResponse, setStkPushResponse] = useState<STKPushResponse | null>(null);
  const [mpesaTransaction, setMpesaTransaction] = useState<MpesaTransactionRecord | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // Discount state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountOffer | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [groupSize, setGroupSize] = useState(1);


  useEffect(() => {
    if (eventIdentifier) {
      loadEvent();
      checkRegistrationStatus();
    }
  }, [eventIdentifier, user]);

  const checkRegistrationStatus = async () => {
    if (!eventIdentifier) return;
    
    // Only check if user is logged in
    if (!user) {
      setIsRegistered(false);
      return;
    }
    
    try {
      const result = await FirestoreService.getWithQuery('event_registrations', [
        { field: 'eventId', operator: '==', value: eventIdentifier },
        { field: 'userId', operator: '==', value: user.uid }
      ]);
      
      if (result.success && result.data && result.data.length > 0) {
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const loadEvent = async () => {
    setLoading(true);
    try {
      let result;
      
      // First try to fetch by slug (new approach)
      const slugResult = await EventService.getBySlug(eventIdentifier!);
      if (slugResult.success) {
        result = slugResult;
      } else {
        // Fall back to fetching by ID (backward compatibility)
        result = await FirestoreService.getById('events', eventIdentifier!);
      }
      
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
    if (!event) {
      alert('Event not found');
      return;
    }

    // Initialize form data with user info if logged in
    const nameParts = user?.displayName?.split(' ') || ['', ''];
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      whatsappNumber: '',
      currentRole: '',
      currentOrganization: '',
      learningGoals: '',
      communicationPreference: 'any',
      source: 'website',
      mediaConsent: false,
      mediaPrivacy: false
    });
    
    // Initialize M-Pesa phone number from user profile if available
    setMpesaPhone(user?.phoneNumber || '');
    
    // Show registration section
    setShowRegistrationSection(true);
    
    // Scroll to registration section with a small delay
    setTimeout(() => {
      const registrationSection = document.getElementById('registration-section');
      if (registrationSection) {
        registrationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSTKPush = async () => {
    if (!event || !mpesaPhone) {
      alert('Please enter your M-Pesa phone number');
      return;
    }

    const priceInfo = getFinalPrice();
    const amount = priceInfo.finalPrice;

    if (amount <= 0) {
      alert('Invalid payment amount');
      return;
    }

    setStkPushLoading(true);
    setPaymentStatus('processing');

    try {
      const reference = `EVENT_${event.id}_${Date.now()}`;
      const response = await darajaService.initiateSTKPush({
        phoneNumber: mpesaPhone,
        amount: amount,
        reference: reference,
        narration: `Payment for ${event.title}`,
        accountReference: event.id
      });

      setStkPushResponse(response);

      if (response.success && response.data) {
        alert(`STK Push sent to ${mpesaPhone}. Please check your phone and enter your M-Pesa PIN to complete payment.`);
        
        // Start polling for payment status
        const checkoutRequestId = response.data.CheckoutRequestID;
        setTimeout(() => checkPaymentStatus(checkoutRequestId), 10000); // Check after 10 seconds
      } else {
        setPaymentStatus('failed');
        alert(`Payment initiation failed: ${response.message}`);
      }
    } catch (error) {
      console.error('STK Push error:', error);
      setPaymentStatus('failed');
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setStkPushLoading(false);
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      // Check transaction status in our database
      const transaction = await darajaService.getTransactionRecord(checkoutRequestId);
      
      if (transaction) {
        setMpesaTransaction(transaction);
        
        if (transaction.status === 'completed') {
          setPaymentStatus('success');
          alert('Payment successful! Your registration will be processed.');
        } else if (transaction.status === 'failed' || transaction.status === 'cancelled' || transaction.status === 'timeout') {
          setPaymentStatus('failed');
          alert('Payment failed or was cancelled. Please try again.');
        } else {
          // Still processing, check again in 5 seconds
          setTimeout(() => checkPaymentStatus(checkoutRequestId), 5000);
        }
      } else {
        // Query Safaricom directly
        const statusResult = await darajaService.querySTKPushStatus(checkoutRequestId);
        
        if (statusResult && statusResult.data) {
          if (statusResult.data.ResultCode === '0') {
            setPaymentStatus('success');
            alert('Payment successful! Your registration will be processed.');
          } else {
            setPaymentStatus('failed');
            alert('Payment failed. Please try again.');
          }
        } else {
          // Still processing, check again
          setTimeout(() => checkPaymentStatus(checkoutRequestId), 5000);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Continue checking in case of temporary errors
      setTimeout(() => checkPaymentStatus(checkoutRequestId), 10000);
    }
  };

  const handleFormSubmit = async () => {
    if (!event) return;

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.whatsappNumber || !formData.learningGoals) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate conditional fields
    if (formData.source === 'social_media' && !formData.socialMediaPlatform) {
      alert('Please specify which social media platform');
      return;
    }

    if ((formData.source === 'referral') && formData.referralSource === 'staff_student' && !formData.staffStudentName) {
      alert('Please provide the name of the staff/student who referred you');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate phone number (basic validation for Kenyan numbers)
    const phoneRegex = /^(\+254|0)[7-9]\d{8}$/;
    if (!phoneRegex.test(formData.whatsappNumber)) {
      alert('Please enter a valid WhatsApp number (e.g., 0712345678 or +254712345678)');
      return;
    }

    // Validate consent checkboxes
    if (!formData.mediaConsent || !formData.mediaPrivacy) {
      alert('Please accept the media consent and privacy notice to continue');
      return;
    }

    // Validate custom form fields
    for (const field of event.registrationForm) {
      if (field.required && !formData[field.id]) {
        alert(`Please fill in the required field: ${field.question}`);
        return;
      }
    }

    // If paid event and payment required, validate payment method
    if (event.price && event.price > 0 && paymentOption !== 'later') {
      if (paymentOption === 'mpesa') {
        // For M-Pesa STK Push, we'll handle payment during registration
        if (!mpesaPhone) {
          alert('Please enter your M-Pesa phone number');
          return;
        }
      } else if (paymentOption === 'bank') {
        // For bank transfer, require transaction code
        if (!mpesaCode) {
          alert('Please enter bank transaction code for payment verification');
          return;
        }
      }
    }

    setRegistering(true);
    try {
      // Prepare custom responses
      const customResponses: Record<string, any> = {};
      event.registrationForm.forEach(field => {
        if (formData[field.id]) {
          customResponses[field.id] = formData[field.id];
        }
      });

      // Calculate final pricing
      const priceInfo = getFinalPrice();

      // Create registration record
      const registrationData = {
        eventId: event.id,
        userId: user?.uid || null,
        // Personal Information
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        currentRole: formData.currentRole.trim(),
        currentOrganization: formData.currentOrganization.trim(),
        learningGoals: formData.learningGoals.trim(),
        communicationPreference: formData.communicationPreference,
        source: formData.source,
        registrationDate: new Date().toISOString(),
        status: 'registered',
        // Payment info with discount
        originalAmount: priceInfo.originalPrice,
        discountAmount: priceInfo.discount,
        paymentAmount: priceInfo.finalPrice,
        appliedDiscount: priceInfo.appliedOffer ? {
          id: priceInfo.appliedOffer.id,
          name: priceInfo.appliedOffer.name,
          type: priceInfo.appliedOffer.type,
          discountValue: priceInfo.appliedOffer.discountValue,
          discountType: priceInfo.appliedOffer.discountType,
          code: priceInfo.appliedOffer.code || null
        } : null,
        groupSize: groupSize,
        paymentStatus: priceInfo.finalPrice > 0 
          ? (paymentOption === 'mpesa' ? (paymentStatus === 'success' ? 'completed' : 'pending') : 
             paymentOption === 'bank' ? 'completed' : 'pending')
          : 'free',
        paymentMethod: priceInfo.finalPrice > 0 
          ? (paymentOption === 'mpesa' ? 'mpesa_stk' : 
             paymentOption === 'bank' ? 'bank_transfer' : 'pay_later')
          : 'none',
        mpesaCode: paymentOption === 'bank' ? mpesaCode : '',
        mpesaPhone: paymentOption === 'mpesa' ? mpesaPhone : '',
        stkPushData: paymentOption === 'mpesa' && stkPushResponse ? {
          merchantRequestId: stkPushResponse.data?.MerchantRequestID,
          checkoutRequestId: stkPushResponse.data?.CheckoutRequestID,
          customerMessage: stkPushResponse.data?.CustomerMessage
        } : null,
        // Source tracking
        referralSource: formData.referralSource || null,
        socialMediaPlatform: formData.socialMediaPlatform || null,
        staffStudentName: formData.staffStudentName || null,
        mediaConsent: formData.mediaConsent,
        mediaPrivacy: formData.mediaPrivacy,
        // Custom form responses
        customResponses: customResponses
      };

      const result = await FirestoreService.create('event_registrations', registrationData);
      if (result.success) {
        // Registration successful - no capacity tracking needed
        
        setIsRegistered(true);
        setShowRegistrationSection(false);
        // Reload event to get updated data
        loadEvent();
        
        const finalPrice = priceInfo.finalPrice;
        let message = 'Registration successful!';
        
        if (finalPrice > 0) {
          if (priceInfo.discount > 0) {
            message += ` You saved ${event.currency || 'USD'} ${priceInfo.discount.toFixed(2)} with ${priceInfo.appliedOffer?.name}!`;
          }
          if (paymentOption === 'now') {
            message += ' Payment will be verified shortly.';
          } else {
            message += ` Please complete payment of ${event.currency || 'USD'} ${finalPrice.toFixed(2)} before the event.`;
          }
        } else if (priceInfo.discount > 0) {
          message += ` You got a 100% discount with ${priceInfo.appliedOffer?.name} - this event is now free for you!`;
        }
        
        alert(message);
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleFormChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Discount utility functions
  const getActiveOffers = () => {
    if (!event?.discountOffers) return [];
    const now = new Date();
    return event.discountOffers.filter(offer => 
      offer.isActive && 
      new Date(offer.expiryDate) > now &&
      (!offer.usageLimit || (offer.usedCount || 0) < offer.usageLimit)
    );
  };

  const getPublicOffers = () => {
    return getActiveOffers().filter(offer => offer.isPublic);
  };

  const getEarlyBirdOffer = () => {
    return getActiveOffers().find(offer => offer.type === 'early_bird');
  };

  const getGroupDiscountOffer = () => {
    return getActiveOffers().find(offer => 
      offer.type === 'group_discount' && 
      groupSize >= (offer.minGroupSize || 2)
    );
  };

  const calculateDiscount = (basePrice: number, offer: DiscountOffer) => {
    if (offer.discountType === 'percentage') {
      return basePrice * (offer.discountValue / 100);
    } else {
      return Math.min(offer.discountValue, basePrice);
    }
  };

  const getFinalPrice = () => {
    const basePrice = event?.price || 0;
    
    if (!basePrice) {
      return {
        originalPrice: 0,
        discount: 0,
        finalPrice: 0,
        appliedOffer: null
      };
    }
    
    let bestDiscount = 0;
    let bestOffer = null;

    // Check applied discount code first
    if (appliedDiscount) {
      bestDiscount = calculateDiscount(basePrice, appliedDiscount);
      bestOffer = appliedDiscount;
    }

    // Check automatic discounts (early bird and group)
    const earlyBird = getEarlyBirdOffer();
    if (earlyBird) {
      const earlyBirdDiscount = calculateDiscount(basePrice, earlyBird);
      if (earlyBirdDiscount > bestDiscount) {
        bestDiscount = earlyBirdDiscount;
        bestOffer = earlyBird;
      }
    }

    const groupDiscount = getGroupDiscountOffer();
    if (groupDiscount) {
      const groupDiscountAmount = calculateDiscount(basePrice, groupDiscount);
      if (groupDiscountAmount > bestDiscount) {
        bestDiscount = groupDiscountAmount;
        bestOffer = groupDiscount;
      }
    }

    return {
      originalPrice: basePrice,
      discount: bestDiscount,
      finalPrice: Math.max(0, basePrice - bestDiscount),
      appliedOffer: bestOffer
    };
  };

  const handleApplyDiscount = () => {
    setDiscountError('');
    
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    const activeOffers = getActiveOffers();
    const offer = activeOffers.find(o => 
      (o.type === 'discount_code' || o.type === 'referral_code') && 
      o.code?.toUpperCase() === discountCode.toUpperCase()
    );

    if (!offer) {
      setDiscountError('Invalid or expired discount code');
      return;
    }

    setAppliedDiscount(offer);
    setDiscountError('');
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };


  const isRegistrationClosed = event ? new Date(event.registrationDeadline) < new Date() : false;
  const isEventPast = event ? (event.dates.length > 0 ? new Date(event.dates[event.dates.length - 1].date) < new Date() : false) : false;

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
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white pt-32 pb-20">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-12">{event.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-primary-200" />
                <div>
                  <p className="text-primary-100 text-sm">
                    {event.dates.length > 1 ? 'Event Dates' : 'Date'}
                  </p>
                  <div className="text-white font-semibold">
                    {event.dates.length > 0 ? (
                      event.dates.length === 1 ? (
                        new Date(event.dates[0].date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      ) : (
                        <div>
                          <p>{event.dates.length} Sessions</p>
                          <p className="text-sm text-primary-200">
                            {new Date(event.dates[0].date).toLocaleDateString()} - {' '}
                            {new Date(event.dates[event.dates.length - 1].date).toLocaleDateString()}
                          </p>
                        </div>
                      )
                    ) : (
                      'TBD'
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-primary-200" />
                <div>
                  <p className="text-primary-100 text-sm">Time</p>
                  <p className="text-white font-semibold">
                    {event.dates.length > 0 && event.dates[0].startTime ? 
                      `${event.dates[0].startTime} - ${event.dates[0].endTime}` : 
                      'TBD'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-primary-200" />
                <div>
                  <p className="text-primary-100 text-sm">Location</p>
                  <p className="text-white font-semibold">
                    {event.dates.length > 0 ? event.dates[0].location : 'TBD'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Tag className="h-6 w-6 text-primary-200" />
                <div>
                  <p className="text-primary-100 text-sm">Price</p>
                  <p className="text-white font-semibold">
                    {event.price && event.price > 0 ? `${event.currency || 'USD'} ${event.price}` : 'Free'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Content */}
      <section className="py-16">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* About Section */}
              <div>
                <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-primary-600" />
                  <span>About This Event</span>
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg text-secondary-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Event Goals */}
              {event.goals && event.goals.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-accent-600" />
                    <span>Event Goals</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.goals.map((goal, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
                        <span className="text-secondary-700">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {event.targetAudience && event.targetAudience.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <Users className="h-8 w-8 text-secondary-600" />
                    <span>Who Should Attend</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.targetAudience.map((audience, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-accent-50 rounded-lg">
                        <Users className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
                        <span className="text-secondary-700">{audience}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Schedule */}
              {event.dates.length > 1 && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-primary-600" />
                    <span>Event Schedule</span>
                  </h2>
                  <div className="space-y-4">
                    {event.dates.map((dateItem, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-secondary-800">Session {index + 1}</h4>
                            <p className="text-secondary-600">
                              {new Date(dateItem.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-secondary-800">
                              {dateItem.startTime} - {dateItem.endTime}
                            </p>
                            <p className="text-sm text-secondary-600">{dateItem.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <span>Requirements</span>
                  </h2>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <p className="text-secondary-700 leading-relaxed">{event.requirements}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Registration Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 mb-8">
                  <h3 className="text-2xl font-bold text-secondary-800 mb-4">Event Registration</h3>
                  
                  {event.price && event.price > 0 && (
                    <div className="mb-6 text-center space-y-3">
                      {(() => {
                        const priceInfo = getFinalPrice();
                        const publicOffers = getPublicOffers();
                        return (
                          <>
                            <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-primary-600">
                              <Tag className="h-8 w-8" />
                              {priceInfo.discount > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-gray-400 line-through text-xl">
                                    {event.currency || 'USD'} {priceInfo.originalPrice}
                                  </div>
                                  <div className="text-primary-600">
                                    {event.currency || 'USD'} {priceInfo.finalPrice}
                                  </div>
                                </div>
                              ) : (
                                <span>{event.currency || 'USD'} {event.price}</span>
                              )}
                            </div>
                            
                            {/* Show active public offers */}
                            {publicOffers.length > 0 && (
                              <div className="space-y-2">
                                {publicOffers.map((offer) => (
                                  <div 
                                    key={offer.id} 
                                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                                  >
                                    {offer.name}: {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `${event.currency || 'USD'} ${offer.discountValue} OFF`}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Show applied discount */}
                            {priceInfo.appliedOffer && (
                              <div className="text-sm text-green-600 font-medium">
                                {priceInfo.appliedOffer.name} applied - Save {event.currency || 'USD'} {priceInfo.discount.toFixed(2)}!
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

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

                {/* Event Details Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Status:</span>
                      <span className="font-medium text-secondary-800 capitalize">{event.status}</span>
                    </div>

                    {event.price && event.price > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Price:</span>
                        <span className="font-medium text-secondary-800">{event.currency || 'USD'} {event.price}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Price:</span>
                        <span className="font-medium text-accent-600">Free Event</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section - Moved to end of page */}
      {showRegistrationSection && (
        <section id="registration-section" className="py-16 bg-gray-50">
          <div className="px-6 sm:px-8 lg:px-12">
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-800">Event Registration</h2>
                <button
                  onClick={() => setShowRegistrationSection(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleFormChange('firstName', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleFormChange('lastName', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter last name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        WhatsApp Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.whatsappNumber}
                          onChange={(e) => handleFormChange('whatsappNumber', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="0712345678 or +254712345678"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Current Role
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.currentRole}
                          onChange={(e) => handleFormChange('currentRole', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g. Software Developer, Student, Manager"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Current Organization/Employer
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.currentOrganization}
                          onChange={(e) => handleFormChange('currentOrganization', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g. Company name, University name, Self-employed"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Preferred Communication
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={formData.communicationPreference}
                        onChange={(e) => handleFormChange('communicationPreference', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="any">Any method</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone Call</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Learning Goals */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Event Interest</h3>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      What are your goals for attending this event? *
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <textarea
                        value={formData.learningGoals}
                        onChange={(e) => handleFormChange('learningGoals', e.target.value)}
                        rows={4}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Tell us about your goals for this event, what you hope to learn, and how it fits into your professional development..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* How did you hear about us */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Source Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-3">
                      How did you hear about us?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: 'website', label: 'Website/Google Search' },
                        { value: 'referral', label: 'Friend/Colleague Referral' },
                        { value: 'social_media', label: 'Social Media' },
                        { value: 'direct', label: 'Direct Contact' },
                        { value: 'other', label: 'Other' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                          <input
                            type="radio"
                            name="source"
                            value={option.value}
                            checked={formData.source === option.value}
                            onChange={(e) => {
                              handleFormChange('source', e.target.value);
                              // Reset conditional fields when source changes
                              handleFormChange('socialMediaPlatform', '');
                              handleFormChange('referralSource', '');
                              handleFormChange('staffStudentName', '');
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-3 text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Conditional Social Media Platform Selection */}
                    {formData.source === 'social_media' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Which social media platform? *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { value: 'facebook', label: 'Facebook' },
                            { value: 'instagram', label: 'Instagram' },
                            { value: 'twitter', label: 'Twitter/X' },
                            { value: 'linkedin', label: 'LinkedIn' },
                            { value: 'tiktok', label: 'TikTok' },
                            { value: 'youtube', label: 'YouTube' }
                          ].map((platform) => (
                            <label key={platform.value} className="flex items-center bg-gray-50 rounded-lg p-2 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                              <input
                                type="radio"
                                name="socialMediaPlatform"
                                value={platform.value}
                                checked={formData.socialMediaPlatform === platform.value}
                                onChange={(e) => handleFormChange('socialMediaPlatform', e.target.value)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <span className="ml-2 text-gray-700 text-sm">{platform.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conditional Referral Type Selection */}
                    {formData.source === 'referral' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Type of referral:
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { value: 'friend_colleague', label: 'Friend or Colleague' },
                            { value: 'staff_student', label: 'Staff or Student' },
                            { value: 'family', label: 'Family Member' },
                            { value: 'other_referral', label: 'Other' }
                          ].map((type) => (
                            <label key={type.value} className="flex items-center bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                              <input
                                type="radio"
                                name="referralSource"
                                value={type.value}
                                checked={formData.referralSource === type.value}
                                onChange={(e) => handleFormChange('referralSource', e.target.value)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <span className="ml-3 text-gray-700">{type.label}</span>
                            </label>
                          ))}
                        </div>

                        {/* Staff/Student Name Input */}
                        {formData.referralSource === 'staff_student' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Name of Staff/Student who referred you: *
                            </label>
                            <input
                              type="text"
                              value={formData.staffStudentName || ''}
                              onChange={(e) => handleFormChange('staffStudentName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter full name of staff/student"
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Consent and Privacy Checkboxes */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Consent & Privacy</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.mediaConsent}
                          onChange={(e) => handleFormChange('mediaConsent', e.target.checked)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          required
                        />
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Media Consent:</span> I consent to the use of my photographs, video footage, or testimonials taken during KSS events for promotional and documentation purposes. I understand this consent is voluntary and can be withdrawn at any time by emailing{' '}
                          <a href="mailto:hello@kss.or.ke" className="text-primary-600 hover:text-primary-700 underline">
                            hello@kss.or.ke
                          </a>
                          .{' '}
                          <a href="/media-consent" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                            Learn more about media consent
                          </a>
                        </div>
                      </label>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.mediaPrivacy}
                          onChange={(e) => handleFormChange('mediaPrivacy', e.target.checked)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          required
                        />
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Privacy Notice:</span> I acknowledge that I have read and understood the KSS Media & Privacy Notice. I understand that photos and videos may be taken during sessions and I can opt out by requesting a badge/sticker at registration.{' '}
                          <a href="/media-privacy" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                            Read the full privacy notice
                          </a>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Custom Form Fields */}
                {event?.registrationForm && event.registrationForm.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      {event.registrationForm.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            {field.question} {field.required && '*'}
                          </label>
                          
                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={formData[field.id] || ''}
                              onChange={(e) => handleFormChange(field.id, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter your answer"
                            />
                          )}
                          
                          {field.type === 'textarea' && (
                            <textarea
                              rows={3}
                              value={formData[field.id] || ''}
                              onChange={(e) => handleFormChange(field.id, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                              placeholder="Enter your answer"
                            />
                          )}
                          
                          {field.type === 'email' && (
                            <input
                              type="email"
                              value={formData[field.id] || ''}
                              onChange={(e) => handleFormChange(field.id, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter email address"
                            />
                          )}
                          
                          {field.type === 'phone' && (
                            <input
                              type="tel"
                              value={formData[field.id] || ''}
                              onChange={(e) => handleFormChange(field.id, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter phone number"
                            />
                          )}
                          
                          {field.type === 'checkbox' && (
                            <div className="space-y-2">
                              {field.options && field.options.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(formData[field.id]) ? formData[field.id].includes(option) : false}
                                    onChange={(e) => {
                                      const currentValues = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                                      if (e.target.checked) {
                                        handleFormChange(field.id, [...currentValues, option]);
                                      } else {
                                        handleFormChange(field.id, currentValues.filter((v: string) => v !== option));
                                      }
                                    }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-secondary-600">{option}</span>
                                </label>
                              ))}
                              {field.allowOther && (
                                <div className="space-y-2">
                                  <label className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={formData[`${field.id}_other_checked`] || false}
                                      onChange={(e) => {
                                        handleFormChange(`${field.id}_other_checked`, e.target.checked);
                                        if (!e.target.checked) {
                                          handleFormChange(`${field.id}_other`, '');
                                          const currentValues = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                                          const otherValue = formData[`${field.id}_other`];
                                          if (otherValue) {
                                            handleFormChange(field.id, currentValues.filter((v: string) => v !== otherValue));
                                          }
                                        }
                                      }}
                                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-secondary-600">Other</span>
                                  </label>
                                  {formData[`${field.id}_other_checked`] && (
                                    <input
                                      type="text"
                                      value={formData[`${field.id}_other`] || ''}
                                      onChange={(e) => {
                                        handleFormChange(`${field.id}_other`, e.target.value);
                                        const currentValues = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                                        const otherValue = formData[`${field.id}_other`];
                                        // Remove old other value if exists
                                        const filteredValues = currentValues.filter((v: string) => !field.options || field.options.includes(v));
                                        // Add new other value
                                        if (e.target.value) {
                                          handleFormChange(field.id, [...filteredValues, e.target.value]);
                                        } else {
                                          handleFormChange(field.id, filteredValues);
                                        }
                                      }}
                                      className="ml-7 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="Please specify..."
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {field.type === 'multiple-choice' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    value={option}
                                    checked={formData[field.id] === option}
                                    onChange={(e) => handleFormChange(field.id, e.target.value)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-secondary-600">{option}</span>
                                </label>
                              ))}
                              {field.allowOther && (
                                <div className="space-y-2">
                                  <label className="flex items-center space-x-3">
                                    <input
                                      type="radio"
                                      name={field.id}
                                      value="__other__"
                                      checked={formData[field.id] === '__other__' || (formData[field.id] && !field.options.includes(formData[field.id]))}
                                      onChange={(e) => {
                                        handleFormChange(field.id, '__other__');
                                        handleFormChange(`${field.id}_other`, '');
                                      }}
                                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-secondary-600">Other</span>
                                  </label>
                                  {(formData[field.id] === '__other__' || (formData[field.id] && !field.options.includes(formData[field.id]))) && (
                                    <input
                                      type="text"
                                      value={formData[`${field.id}_other`] || ''}
                                      onChange={(e) => {
                                        handleFormChange(`${field.id}_other`, e.target.value);
                                        handleFormChange(field.id, e.target.value);
                                      }}
                                      className="ml-7 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="Please specify..."
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount Codes */}
                {event?.price && event.price > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Discounts & Offers</h3>
                    <div className="space-y-4">
                      {/* Group Size for Group Discounts */}
                      {getActiveOffers().some(offer => offer.type === 'group_discount') && (
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Group Size (for group discounts)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={groupSize}
                            onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}

                      {/* Discount Code Input */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Discount or Referral Code (Optional)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                            placeholder="ENTER CODE"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDiscount}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium"
                          >
                            Apply
                          </button>
                        </div>
                        {discountError && (
                          <p className="text-red-600 text-sm mt-1">{discountError}</p>
                        )}
                        {appliedDiscount && (
                          <div className="mt-2 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-green-800 text-sm font-medium">
                              ✅ {appliedDiscount.name} applied
                            </span>
                            <button
                              type="button"
                              onClick={handleRemoveDiscount}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Options */}
                {event?.price && event.price > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Payment Options</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="text-center mb-4">
                        {(() => {
                          const priceInfo = getFinalPrice();
                          return (
                            <>
                              <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-primary-600">
                                <Tag className="h-6 w-6" />
                                {priceInfo.discount > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-gray-400 line-through text-lg">
                                      {event.currency || 'USD'} {priceInfo.originalPrice}
                                    </div>
                                    <div className="text-primary-600">
                                      {event.currency || 'USD'} {priceInfo.finalPrice}
                                    </div>
                                  </div>
                                ) : (
                                  <span>{event.currency || 'USD'} {event.price}</span>
                                )}
                              </div>
                              {priceInfo.appliedOffer && (
                                <div className="text-sm text-green-600 font-medium mt-2">
                                  You save {event.currency || 'USD'} {priceInfo.discount.toFixed(2)} with {priceInfo.appliedOffer.name}!
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <p className="text-sm text-secondary-600 mt-2">Event Registration Fee</p>
                      </div>
                      
                      <div className="space-y-4">
                        {/* M-Pesa STK Push Option */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="pay-mpesa"
                            name="paymentOption"
                            value="mpesa"
                            checked={paymentOption === 'mpesa'}
                            onChange={(e) => setPaymentOption(e.target.value as 'mpesa' | 'bank' | 'later')}
                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                          />
                          <label htmlFor="pay-mpesa" className="text-sm font-medium text-secondary-700 flex items-center space-x-2">
                            <Smartphone className="h-4 w-4 text-green-600" />
                            <span>Pay with M-Pesa (STK Push)</span>
                          </label>
                        </div>
                        
                        {paymentOption === 'mpesa' && (
                          <div className="ml-7 space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2 text-green-800 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              <span>Instant payment via M-Pesa STK Push</span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-2">
                                M-Pesa Phone Number *
                              </label>
                              <input
                                type="tel"
                                value={mpesaPhone}
                                onChange={(e) => setMpesaPhone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., 0712345678"
                              />
                              <p className="text-xs text-secondary-500 mt-1">
                                Enter your M-Pesa registered phone number
                              </p>
                            </div>
                            {paymentStatus === 'processing' && (
                              <div className="flex items-center space-x-2 text-blue-600 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>Processing payment...</span>
                              </div>
                            )}
                            {paymentStatus === 'success' && (
                              <div className="flex items-center space-x-2 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                <span>Payment successful!</span>
                              </div>
                            )}
                            {paymentStatus === 'failed' && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>Payment failed. Please try again.</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={handleSTKPush}
                              disabled={stkPushLoading || !mpesaPhone || paymentStatus === 'success'}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              {stkPushLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Initiating Payment...</span>
                                </>
                              ) : paymentStatus === 'success' ? (
                                <>
                                  <CheckCircle className="h-5 w-5" />
                                  <span>Payment Completed</span>
                                </>
                              ) : (
                                <>
                                  <Smartphone className="h-5 w-5" />
                                  <span>Pay with M-Pesa</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Bank Transfer Option */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="pay-bank"
                            name="paymentOption"
                            value="bank"
                            checked={paymentOption === 'bank'}
                            onChange={(e) => setPaymentOption(e.target.value as 'mpesa' | 'bank' | 'later')}
                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                          />
                          <label htmlFor="pay-bank" className="text-sm font-medium text-secondary-700 flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span>Bank Transfer</span>
                          </label>
                        </div>
                        
                        {paymentOption === 'bank' && (
                          <div className="ml-7 space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-secondary-800">Bank Details:</p>
                              <div className="text-sm text-secondary-600 space-y-1">
                                <p><strong>Bank Name:</strong> I&M BANK LIMITED</p>
                                <p><strong>Account Name:</strong> YUSUDI LIMITED-KENYA SCHOOL OF SALES ACCOUNT</p>
                                <p><strong>Account Number:</strong> 04001938296251</p>
                                <p><strong>Swift Code:</strong> IMBLKENAXXX</p>
                                <p><strong>Account Branch:</strong> DUNGA BRANCH</p>
                                <p><strong>Pay Bill Number:</strong> 542542</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-2">
                                Bank Transaction Code *
                              </label>
                              <input
                                type="text"
                                value={mpesaCode}
                                onChange={(e) => setMpesaCode(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter bank transaction code"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="pay-later"
                            name="paymentOption"
                            value="later"
                            checked={paymentOption === 'later'}
                            onChange={(e) => setPaymentOption(e.target.value as 'now' | 'later')}
                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                          />
                          <label htmlFor="pay-later" className="text-sm font-medium text-secondary-700">
                            Register Now, Pay Later
                          </label>
                        </div>
                        
                        {paymentOption === 'later' && (
                          <div className="ml-7 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              You can complete payment later. Payment must be completed before the event.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => setShowRegistrationSection(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    disabled={registering}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {registering ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <CheckCircle className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Global Modal Integration - This modal is controlled from navbar for short programs */}
      <CustomerLeadModal
        isOpen={showLeadModal && selectedProgramType === 'short'}
        onClose={() => setShowLeadModal(false)}
        programId={event?.id}
        programName={event?.title}
        programType="short"
      />
    </div>
  );
};

export default EventDetailPage; 