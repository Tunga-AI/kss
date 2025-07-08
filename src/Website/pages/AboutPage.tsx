import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Heart, Award, Globe, Lightbulb, TrendingUp, Star, CheckCircle, BookOpen, Briefcase, GraduationCap, Clock, Calendar, DollarSign, Shield, Zap, ChevronRight } from 'lucide-react';
import Logo from '../../components/Logo';

const AboutPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(0); // For competency levels stepper

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Logo size="2xl" showText={true} textSize="3xl" className="justify-center" />
          </div>
          <p className="text-white text-xl">Loading About Kenya School of Sales...</p>
        </div>
      </div>
    );
  }

  const heroStats = [
    { value: '1000+', label: 'Sales Professionals Trained', icon: Users },
    { value: '5', label: 'Competency Levels', icon: TrendingUp },
    { value: '12', label: 'Week Programs', icon: Clock },
    { value: '95%', label: 'Career Success Rate', icon: Award }
  ];

  const whyChooseKSS = [
    {
      icon: BookOpen,
      title: 'Structured Learning, Finally',
      description: 'First-of-its-kind structured sales education in Kenya with international standards.',
      image: '/kss.jpg',
      gradient: 'from-blue-500/90 to-purple-600/90'
    },
    {
      icon: Globe,
      title: 'Globally Benchmarked',
      description: 'Built on UK Institute of Sales Professionals framework, recognized worldwide.',
      image: '/kss2.jpg',
      gradient: 'from-emerald-500/90 to-teal-600/90'
    },
    {
      icon: Award,
      title: 'Certified Excellence',
      description: 'Vocational qualifications aligned to UK Ofqual standards with CPD certification.',
      image: '/kss3.jpg',
      gradient: 'from-amber-500/90 to-orange-600/90'
    },
    {
      icon: Heart,
      title: 'African Context',
      description: 'Global best practices adapted for real-world African sales environments.',
      image: '/kss4.jpg',
      gradient: 'from-rose-500/90 to-pink-600/90'
    }
  ];

  const competencyLevels = [
    {
      level: 'Level 1',
      title: 'Foundation',
      experience: '0-1 years',
      description: 'Basic sales skills, process understanding, product knowledge foundation.',
      audience: 'New entrants, graduates, solopreneurs',
      image: '/kss5.jpg',
      color: 'emerald'
    },
    {
      level: 'Level 2',
      title: 'Professional',
      experience: '1-5 years',
      description: 'Independent selling, value communication, pipeline management.',
      audience: 'Early-career reps, telesales, field sales',
      image: '/kss6.jpg',
      color: 'blue'
    },
    {
      level: 'Level 3',
      title: 'Advanced',
      experience: '5-10 years',
      description: 'Team leadership, strategic selling, account management, mentoring.',
      audience: 'Account managers, relationship managers, BD leads',
      image: '/kss7.jpg',
      color: 'purple'
    },
    {
      level: 'Level 4',
      title: 'Strategic',
      experience: '10-15 years',
      description: 'Multi-regional leadership, commercial strategy, stakeholder engagement.',
      audience: 'Sales managers, regional leads',
      image: '/kss8.jpg',
      color: 'orange'
    },
    {
      level: 'Level 5',
      title: 'Expert',
      experience: '15+ years',
      description: 'Sales system design, go-to-market innovation, strategic leadership.',
      audience: 'Commercial directors, senior executives',
      image: '/kss9.jpg',
      color: 'red'
    }
  ];

  const capabilityQuadrants = [
    {
      icon: Target,
      title: 'Core Skills',
      description: 'Selling techniques, planning, execution, consultative approaches.',
      image: '/kss10.jpg',
      items: ['Prospecting', 'Presentation', 'Negotiation', 'Closing']
    },
    {
      icon: Briefcase,
      title: 'Business Acumen',
      description: 'Market understanding, financial literacy, data-driven strategies.',
      image: '/kss11.jpg',
      items: ['Market Analysis', 'Financial Planning', 'ROI Calculation', 'Strategy']
    },
    {
      icon: Users,
      title: 'Leadership',
      description: 'Self-management, team dynamics, change leadership.',
      image: '/kss2.jpg',
      items: ['Team Building', 'Coaching', 'Communication', 'Influence']
    },
    {
      icon: Heart,
      title: 'Personal Excellence',
      description: 'Mindset, values, ethics, resilience, continuous development.',
      image: '/kss4.jpg',
      items: ['Ethics', 'Resilience', 'Growth Mindset', 'Integrity']
    }
  ];

  const programHighlights = [
    {
      title: 'Collaborative Learning',
      description: 'Work together on real-world sales challenges and simulations.',
      benefit: 'Builds teamwork and mirrors actual selling environments.',
      image: '/kss3.jpg',
      icon: Users
    },
    {
      title: 'Expert Facilitation',
      description: 'Learn from experienced sales professionals with industry insights.',
      benefit: 'Bridge theory and practice with real-world experience.',
      image: '/kss5.jpg',
      icon: Star
    },
    {
      title: 'Blended Approach',
      description: 'Virtual sessions, physical workshops, and self-paced learning.',
      benefit: 'Flexibility for different schedules and learning styles.',
      image: '/kss7.jpg',
      icon: Globe
    },
    {
      title: 'Capstone Project',
      description: 'Apply all concepts to solve real business problems.',
      benefit: 'Build portfolio pieces demonstrating job readiness.',
      image: '/kss9.jpg',
      icon: Award
    }
  ];

  const valueProps = [
    {
      icon: TrendingUp,
      title: 'Career Advancement',
      subtitle: 'Professional Recognition',
      description: 'Gain industry-recognized certifications and join a professional community of sales leaders.',
      image: '/kss6.jpg',
      stats: ['95% Job Placement', '40% Salary Increase', '1000+ Alumni Network']
    },
    {
      icon: Shield,
      title: 'Performance Excellence',
      subtitle: 'Results-Driven Training',
      description: 'Apply modern techniques and global best practices to boost your sales performance.',
      image: '/kss8.jpg',
      stats: ['3x Pipeline Growth', '50% Close Rate Improvement', 'Global Techniques']
    },
    {
      icon: Heart,
      title: 'Community & Support',
      subtitle: 'Lifelong Network',
      description: 'Join a vibrant community with mentorship, peer support, and ongoing development.',
      image: '/kss10.jpg',
      stats: ['24/7 Support', 'Peer Mentoring', 'Career Counseling']
    }
  ];

  const foundingStory = [
    {
      organization: 'Yusudi',
      role: 'Sales Enablement Pioneer',
      description: 'Transforming employment in Africa through sales as a dignified profession and life skill.',
      image: '/kss11.jpg',
      founding: '2019'
    },
    {
      organization: 'Commercial Club of Africa',
      role: 'Professional Community',
      description: 'Platform of sales leaders shaping the future of African commerce through collaboration.',
      image: '/kss4.jpg',
      founding: '2020'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/kss.jpg"
            alt="Kenya School of Sales"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-secondary-800/90 to-primary-800/95"></div>
        </div>

        <div className="relative w-full px-6 sm:px-8 lg:px-12 pb-24">
          <div className="w-full">
            <div className="text-white">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <Award className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">First Professional Sales School in Kenya</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Kenya School of
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Sales
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Elevating Sales. Empowering Professionals. Transforming Africa.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-start">
                <Link to="/programs">
                  <button className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-[3px] hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1">
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/programs">
                  <button className="group border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold backdrop-blur-sm">
                    <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Explore Programs</span>
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

      {/* Mission & Vision Cards */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Mission Card */}
            <div className="relative overflow-hidden h-96 group hover:shadow-2xl transition-all duration-500 rounded-sm">
              <img
                src="/kss8.jpg"
                alt="Our Mission"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-800/50 to-transparent"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg leading-relaxed">
                  To make sales training desirable and simplify sales career development across Africa.
                </p>
              </div>
            </div>

            {/* Vision Card */}
            <div className="relative overflow-hidden h-96 group hover:shadow-2xl transition-all duration-500 rounded-sm">
              <img
                src="/kss10.jpg"
                alt="Our Vision"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/90 via-secondary-800/50 to-transparent"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                  <Lightbulb className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-lg leading-relaxed">
                  To nurture bold African commercial superstars who drive economic transformation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose KSS */}
      <section className="py-20">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose KSS?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The first structured, internationally-recognized sales education platform in Kenya
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseKSS.map((item, index) => (
              <div 
                key={index}
                className="relative overflow-hidden h-80 group hover:shadow-2xl transition-all duration-500 rounded-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-90`}></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competency Levels - 3x2 Card Stepper */}
      <section className="py-20 bg-gray-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Sales Competency Framework</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Click through our structured progression from foundation to expertise with globally recognized standards
            </p>
          </div>

          {/* Top Row - First 3 Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {competencyLevels.slice(0, 3).map((level, index) => (
              <div
                key={index}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 group rounded-sm ${
                  selectedLevel === index
                    ? 'ring-4 ring-primary-400 shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                }`}
                onClick={() => setSelectedLevel(index)}
              >
                <div className="relative h-80">
                  {/* Background Image */}
                  <img
                    src={level.image}
                    alt={level.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Color Overlay */}
                  <div className={`absolute inset-0 bg-${level.color}-600/80 ${
                    selectedLevel === index ? 'opacity-90' : 'opacity-75'
                  } transition-opacity duration-300`}></div>
                  
                  {/* Step Indicator */}
                  <div className="absolute top-4 left-4">
                    <div className={`bg-white/90 backdrop-blur-sm px-3 py-1 rounded-sm ${
                      selectedLevel === index ? 'ring-2 ring-white' : ''
                    }`}>
                      <span className={`text-sm font-bold text-${level.color}-600`}>
                        {level.level}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {selectedLevel === index && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-accent-500 p-2 rounded-sm shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <h3 className="text-2xl font-bold mb-2">{level.title}</h3>
                    <p className="text-lg opacity-90 mb-3">{level.experience}</p>
                    <p className="text-sm leading-relaxed mb-4 line-clamp-3">
                      {level.description}
                    </p>
                    
                    {/* Target Audience Badge */}
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-sm w-fit">
                      <p className="text-xs font-medium">{level.audience}</p>
                    </div>
                  </div>

                  {/* Connection Arrow to Next Level */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className={`bg-white rounded-full p-2 shadow-lg border-2 ${
                        selectedLevel > index ? `border-${level.color}-400` : 'border-gray-300'
                      } transition-colors duration-300`}>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row - Last 2 Levels (Centered) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {competencyLevels.slice(3, 5).map((level, index) => (
              <div
                key={index + 3}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 group rounded-sm ${
                  selectedLevel === index + 3
                    ? 'ring-4 ring-primary-400 shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                }`}
                onClick={() => setSelectedLevel(index + 3)}
              >
                <div className="relative h-80">
                  {/* Background Image */}
                  <img
                    src={level.image}
                    alt={level.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Color Overlay */}
                  <div className={`absolute inset-0 bg-${level.color}-600/80 ${
                    selectedLevel === index + 3 ? 'opacity-90' : 'opacity-75'
                  } transition-opacity duration-300`}></div>
                  
                  {/* Step Indicator */}
                  <div className="absolute top-4 left-4">
                    <div className={`bg-white/90 backdrop-blur-sm px-3 py-1 rounded-sm ${
                      selectedLevel === index + 3 ? 'ring-2 ring-white' : ''
                    }`}>
                      <span className={`text-sm font-bold text-${level.color}-600`}>
                        {level.level}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {selectedLevel === index + 3 && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-accent-500 p-2 rounded-sm shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <h3 className="text-2xl font-bold mb-2">{level.title}</h3>
                    <p className="text-lg opacity-90 mb-3">{level.experience}</p>
                    <p className="text-sm leading-relaxed mb-4 line-clamp-3">
                      {level.description}
                    </p>
                    
                    {/* Target Audience Badge */}
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-sm w-fit">
                      <p className="text-xs font-medium">{level.audience}</p>
                    </div>
                  </div>

                  {/* Connection Arrow to Next Level */}
                  {index === 0 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className={`bg-white rounded-full p-2 shadow-lg border-2 ${
                        selectedLevel === 4 ? `border-${level.color}-400` : 'border-gray-300'
                      } transition-colors duration-300`}>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center mt-12 space-x-6">
            <button
              onClick={() => setSelectedLevel(Math.max(0, selectedLevel - 1))}
              disabled={selectedLevel === 0}
              className="px-6 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Level
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {competencyLevels[selectedLevel].title}
              </div>
              <div className="text-sm text-gray-500">
                Level {selectedLevel + 1} of {competencyLevels.length}
              </div>
            </div>

            <button
              onClick={() => setSelectedLevel(Math.min(competencyLevels.length - 1, selectedLevel + 1))}
              disabled={selectedLevel === competencyLevels.length - 1}
              className="px-6 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Level
            </button>
          </div>
        </div>
      </section>

      {/* Capability Quadrants */}
      <section className="py-20">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Four Pillars of Sales Excellence</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive skill development across all dimensions of professional selling
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {capabilityQuadrants.map((quadrant, index) => (
              <div
                key={index}
                className="relative overflow-hidden h-96 group hover:shadow-2xl transition-all duration-500 rounded-sm"
              >
                <img
                  src={quadrant.image}
                  alt={quadrant.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-800/50 to-transparent"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                    <quadrant.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{quadrant.title}</h3>
                  <p className="text-gray-100 mb-4 leading-relaxed">{quadrant.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {quadrant.items.map((item, itemIndex) => (
                      <span 
                        key={itemIndex}
                        className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-sm text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How We Deliver Excellence</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Innovative learning methods designed for maximum impact and practical application
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {programHighlights.map((highlight, index) => (
              <div
                key={index}
                className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-sm bg-white"
              >
                <div className="grid lg:grid-cols-2 gap-0 h-full">
                  <div className="relative">
                    <img
                      src={highlight.image}
                      alt={highlight.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-primary-600/20"></div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-sm">
                        <highlight.icon className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{highlight.title}</h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">{highlight.description}</p>
                    <div className="bg-primary-50 border border-primary-200 rounded-sm p-3">
                      <p className="text-primary-800 text-sm font-medium">{highlight.benefit}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Three Pillars of Value</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive development across career, performance, and personal growth
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-sm"
              >
                <img
                  src={prop.image}
                  alt={prop.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-800/70 to-gray-900/30"></div>
                
                <div className="relative h-96 p-8 flex flex-col justify-end text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                    <prop.icon className="w-8 h-8" />
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold mb-2">{prop.title}</h3>
                    <p className="text-accent-300 font-medium text-sm mb-3">{prop.subtitle}</p>
                    <p className="text-gray-100 leading-relaxed">{prop.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {prop.stats.map((stat, statIndex) => (
                      <div 
                        key={statIndex}
                        className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-sm text-center"
                      >
                        <div className="text-xs font-medium">{stat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Partners */}
      <section className="py-20 bg-gray-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Built by Industry Leaders</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Founded through the partnership of two pioneering organizations transforming African commerce
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {foundingStory.map((founder, index) => (
              <div
                key={index}
                className="relative overflow-hidden h-96 group hover:shadow-2xl transition-all duration-500 rounded-sm"
              >
                <img
                  src={founder.image}
                  alt={founder.organization}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-800/60 to-transparent"></div>
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-sm w-fit mb-4">
                    <span className="text-sm font-medium">Founded {founder.founding}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{founder.organization}</h3>
                  <p className="text-accent-300 font-medium text-sm mb-4">{founder.role}</p>
                  <p className="text-gray-100 leading-relaxed">{founder.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/kss11.jpg"
            alt="Join KSS"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 to-secondary-900/95"></div>
        </div>

        <div className="relative w-full text-center px-6 sm:px-8 lg:px-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Sales Career?
            </h2>
            <p className="text-xl text-gray-100 mb-8 leading-relaxed">
              Join Africa's first professional sales school and become part of the commercial revolution. 
              Your journey to excellence starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/programs">
                <button className="inline-flex items-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-sm shadow-xl transition-colors duration-200">
                  Apply Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link to="/contact">
                <button className="inline-flex items-center border border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-sm shadow-lg transition-colors duration-200">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;