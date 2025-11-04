import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Zap, Shield, Globe, Calendar, Eye } from 'lucide-react';
import Logo from '../../components/Logo';
import { ProgramService } from '../../services/firestore';
import { FirestoreService } from '../../services/firestore';
import { mediaService } from '../../services/mediaService';

const HomePage: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load programs from Firebase
        const programResult = await ProgramService.getActivePrograms();
        if (programResult.success && programResult.data) {
          // Debug: Log program data to see structure
          console.log('Program data:', programResult.data);
          
          // Debug: Log level values for each program
          programResult.data.forEach((program, index) => {
            console.log(`Program ${index}:`, {
              name: program.programName,
              level: program.level,
              levelType: typeof program.level,
              fees: program.fees,
              price: program.price,
              cost: program.cost
            });
          });
          
          // Sort programs by level in ascending order and get first 3
          const sortedPrograms = [...programResult.data].sort((a, b) => {
            // Safely extract and convert level to string
            const levelA = String(a.level || 'beginner').toLowerCase();
            const levelB = String(b.level || 'beginner').toLowerCase();
            
            // Define level hierarchy for sorting
            const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
            const orderA = levelOrder[levelA] || 1;
            const orderB = levelOrder[levelB] || 1;
            
            return orderA - orderB;
          });
          
          // Debug: Log sorted programs
          console.log('Sorted programs:', sortedPrograms);
          
          setPrograms(sortedPrograms.slice(0, 3));
        }

        // Load upcoming events from Firebase
        const eventResult = await FirestoreService.getWithQuery('events', [
          { field: 'isPublic', operator: '==', value: true }
        ]);

        if (eventResult.success && eventResult.data) {
          // Transform and filter upcoming events
          const transformedEvents = eventResult.data.map((event: any) => {
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
              date: eventDate,
              location: event.location || (event.dates && event.dates.length > 0 ? event.dates[0].location : 'TBA'),
              price: event.price || 0,
              currency: event.currency || 'KES',
              image: event.image,
              sessionCount: event.dates ? event.dates.length : 1,
              timeRange: event.dates && event.dates.length > 0 ?
                `${event.dates[0].startTime || '09:00'} - ${event.dates[0].endTime || '17:00'}` :
                '09:00 - 17:00'
            };
          }).filter((event: any) => event.date >= new Date()).slice(0, 3); // Get 3 upcoming events

          setEvents(transformedEvents);
        }

        // Load published albums from Firebase
        const albumsData = await mediaService.getPublishedMedia('album', 6);
        setAlbums(albumsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Learn from the Best',
      description: 'Our instructors aren\'t just teachers – they\'re successful sales professionals who bring real stories and proven strategies to every class.',
      bgColor: 'bg-primary-600',
      iconBg: 'bg-primary-500',
    },
    {
      icon: Users,
      title: 'Build Your Network',
      description: 'Make lifelong connections with ambitious professionals just like you. Your classmates today could be your business partners tomorrow.',
      bgColor: 'bg-secondary-600',
      iconBg: 'bg-secondary-500',
    },
    {
      icon: Award,
      title: 'Credentials That Open Doors',
      description: 'Walk into any interview with confidence. Our certifications are recognized and respected by top employers across Kenya and East Africa.',
      bgColor: 'bg-accent-600',
      iconBg: 'bg-accent-500',
    },
    {
      icon: TrendingUp,
      title: 'We\'ve Got Your Back',
      description: 'From day one to your dream job and beyond – our career support team is here to help you succeed every step of the way.',
      bgColor: 'bg-neutral-700',
      iconBg: 'bg-neutral-600',
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  const benefits = [
    {
      icon: Zap,
      title: 'Results in Weeks, Not Years',
      description: 'Why wait? Our intensive programs are designed to get you job-ready fast, so you can start earning sooner.',
      image: '/kevlin.png',
    },
    {
      icon: Shield,
      title: 'We Believe in You',
      description: 'We\'re so confident you\'ll succeed that we provide ongoing support until you land the role you want. Your success is our success.',
      image: '/alex.png',
    },
    {
      icon: Globe,
      title: 'World-Class Training',
      description: 'Learn using the same methods trusted by Fortune 500 companies worldwide. You\'ll graduate with skills that are valued anywhere.',
      image: '/stephen.png',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-white pt-20 pb-8 lg:pb-12">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)] overflow-hidden rounded-md shadow-2xl">
            <img
              src="/home.jpg"
              alt="Students learning together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center lg:items-end px-4 sm:px-6 lg:px-12 py-8 lg:pb-12">
              <div className="max-w-2xl lg:max-w-3xl">
                <div className="text-white">
                  <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                    Launch Your Dream
                    <span className="block" style={{ color: '#4590AD' }}>
                      Sales Career in Kenya
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 lg:mb-8 leading-relaxed max-w-xl">
                    Join thousands who've transformed their careers with Kenya's most trusted sales training institute in Nairobi and across East Africa.
                  </p>

                  <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
                    <Link to="/programs" className="w-full xs:w-auto">
                      <button className="w-full xs:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md transition-colors duration-200 font-semibold text-sm sm:text-base">
                        Explore Programs
                      </button>
                    </Link>
                    <Link to="/lead" className="w-full xs:w-auto">
                      <button className="w-full xs:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-md transition-colors duration-200 font-semibold text-sm sm:text-base">
                        I'm Interested
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white relative">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[400px] sm:min-h-[500px] lg:min-h-[624px]">
              <img
                src="/programs.jpeg"
                alt="Students learning together"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>

              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
                <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 leading-tight">
                  Why Kenyan Professionals Choose KSS for Sales Training
                </h2>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-200 leading-relaxed">
                  We're not just another training provider – we're Kenya's premier sales training institute, committed to building the sales career you've always dreamed of.
                  Here's what makes us different in the Kenyan market.
                </p>
              </div>
            </div>

            {/* Right side - Feature Grid - responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden h-48 sm:h-56 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md ${feature.bgColor}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Icon in top left */}
                  <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
                    <div className={`${feature.iconBg} p-2 sm:p-3 rounded-md shadow-lg`}>
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>

                  {/* Text content in lower portion */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 text-white leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-white/90 leading-relaxed text-xs sm:text-sm lg:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs & Events Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white relative">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            {/* Left Side - Core Programs */}
            <div>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Core Programs</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First 3 program cards */}
                {programs && programs.length > 0 ? programs.slice(0, 3).map((program, index) => (
                  <div
                    key={program.id || index}
                    className="relative overflow-hidden h-48 sm:h-56 lg:h-64 xl:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-white"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img
                      src={program.image || '/kss5.jpg'}
                      alt={program.programName}
                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end text-white">
                      <div>
                        <h4 className="text-xs sm:text-sm lg:text-base font-semibold mb-2 line-clamp-2 leading-tight">
                          {program.programName}
                        </h4>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm lg:text-base font-bold text-accent-300">
                            {(() => {
                              // Handle different fee structures
                              if (program.fees !== undefined && program.fees !== null && program.fees !== '') {
                                return formatPrice(program.fees);
                              } else if (program.price !== undefined && program.price !== null && program.price !== '') {
                                return formatPrice(program.price);
                              } else if (program.cost !== undefined && program.cost !== null && program.cost !== '') {
                                return formatPrice(program.cost);
                              } else {
                                return 'Contact';
                              }
                            })()}
                          </span>
                          <Link to={`/${program.slug || program.id}`}>
                            <button className="bg-primary-600 hover:bg-primary-700 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm transition-colors duration-200">
                              Details
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="relative overflow-hidden h-64 lg:h-72 rounded-md bg-gray-200 animate-pulse">
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <div className="bg-gray-300 h-4 rounded mb-2"></div>
                        <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Fourth card - Text with link */}
                <div className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                  <h4 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">
                    Core Programs
                  </h4>
                  <p className="text-sm lg:text-base text-primary-100 leading-relaxed mb-4">
                    Comprehensive sales training programs designed to transform your career. From fundamentals to advanced techniques.
                  </p>
                  <Link to="/programs">
                    <button className="bg-white text-primary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1">
                      <span>View All Programs</span>
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side - Short Programs/Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Short Programs</h3>
                <Link to="/events">
                  <button className="text-accent-600 hover:text-accent-700 font-semibold flex items-center space-x-1">
                    <span>View All</span>
                    <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {/* First 3 event cards */}
                {events && events.length > 0 ? events.slice(0, 3).map((event, index) => (
                  <div
                    key={event.id || index}
                    className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-white"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img
                      src={event.image || '/kss12.jpg'}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                      <div className="bg-white/20 backdrop-blur-sm p-2 rounded-md w-fit mb-2">
                        <Calendar size={16} className="text-white" />
                      </div>
                      <h4 className="text-sm lg:text-base font-semibold mb-2 line-clamp-2">
                        {event.title}
                      </h4>
                      <p className="text-gray-100 text-xs lg:text-sm line-clamp-1">
                        {formatEventDate(event.date)}
                      </p>
                    </div>
                  </div>
                )) : (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="relative overflow-hidden h-64 lg:h-72 rounded-md bg-gray-200 animate-pulse">
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <div className="bg-gray-300 h-4 rounded mb-2"></div>
                        <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Fourth card - Text with link */}
                <div className="bg-secondary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                  <h4 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">
                    Short Programs
                  </h4>
                  <p className="text-sm lg:text-base text-secondary-100 leading-relaxed mb-4">
                    Quick-impact training sessions and workshops designed to boost specific skills and knowledge areas.
                  </p>
                  <Link to="/events">
                    <button className="bg-white text-secondary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1">
                      <span>More Short Programs</span>
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Albums Section - Social Proof */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gray-50 relative">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Experience Our Community in Action
            </h2>
            <Link to="/media">
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 flex items-center space-x-2 w-fit">
                <span>View All Albums</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </Link>
          </div>

          {albums && albums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {albums.slice(0, 4).map((album, index) => (
                <Link
                  key={album.id}
                  to={`/media/albums/${album.id}`}
                  className="group block"
                >
                  <div
                    className="relative overflow-hidden h-48 sm:h-56 lg:h-64 xl:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-white"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img
                      src={album.featuredImage || (album.images && album.images[0]?.thumbnailUrl) || '/programs.jpeg'}
                      alt={album.title}
                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                    {/* Photo Count Badge */}
                    {album.images && album.images.length > 0 && (
                      <div className="absolute top-3 right-3 bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-md">
                        <span className="text-white text-xs font-medium">{album.images.length} photos</span>
                      </div>
                    )}

                    <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end text-white">
                      <div>
                        <h4 className="text-xs sm:text-sm lg:text-base font-semibold mb-2 line-clamp-2 leading-tight">
                          {album.title}
                        </h4>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-200">
                            {album.eventDate && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {album.eventDate.seconds
                                    ? new Date(album.eventDate.seconds * 1000).toLocaleDateString()
                                    : new Date(album.eventDate).toLocaleDateString()
                                  }
                                </span>
                              </span>
                            )}
                          </div>
                          <span className="bg-primary-600 hover:bg-primary-700 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm transition-colors duration-200">
                            View Album
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Loading state
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="relative overflow-hidden h-48 sm:h-56 lg:h-64 xl:h-72 rounded-md bg-gray-200 animate-pulse">
                  <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end">
                    <div className="bg-gray-300 h-4 rounded mb-2"></div>
                    <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/contact us.jpg"
                alt="What Makes Us Special"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  What Makes Us Special
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  We could tell you we're different, but we'd rather show you. Here's what you can expect when you join our community.
                </p>
              </div>
            </div>

            {/* Right side - Benefits Grid - 1 col on mobile, 2x2 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {benefits.map((benefit, index) => {
                const bgColors = ['bg-primary-600', 'bg-secondary-600', 'bg-accent-600'];
                const iconBgColors = ['bg-primary-500', 'bg-secondary-500', 'bg-accent-500'];
                return (
                  <div
                    key={index}
                    className={`relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md ${bgColors[index]}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Icon in top left */}
                    <div className="absolute top-6 left-6">
                      <div className={`${iconBgColors[index]} p-3 rounded-md shadow-lg`}>
                        <benefit.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Text content in lower portion */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                      <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                        {benefit.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Fourth card - Learn More About Us */}
              <div className="bg-neutral-700 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white hover:shadow-xl transition-all duration-500">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Learn More About Us
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm mb-4">
                    Discover our proven framework and methodology that transforms sales professionals.
                  </p>
                  <Link to="/framework">
                    <button className="bg-white text-neutral-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1">
                      <span>Explore Framework</span>
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>




    </div>
  );
};

export default HomePage;