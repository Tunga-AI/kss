import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  Zap, 
  Shield, 
  Globe, 
  Calendar,
  Target,
  Heart,
  Lightbulb,
  Star,
  Briefcase,
  CheckCircle,
  BarChart3,
  Building,
  Headphones,
  FileText,
  Clock
} from 'lucide-react';

const Business: React.FC = () => {
  const { openB2bLeadModal } = useModal();

  const heroStats = [
    { value: '500+', label: 'Corporate Teams Trained', icon: Building },
    { value: '4', label: 'Capability Quadrants', icon: Target },
    { value: '5', label: 'Progressive Tracks', icon: TrendingUp },
    { value: '95%', label: 'Performance Improvement', icon: Award }
  ];

  const capabilityQuadrants = [
    {
      icon: Target,
      title: 'Core Sales Capabilities',
      description: 'Sales techniques, opportunity management, and closing skills that drive consistent results.',
      bgColor: 'bg-primary-600',
      iconBg: 'bg-primary-500',
    },
    {
      icon: Briefcase,
      title: 'Business Acumen',
      description: 'Commercial acumen, CRM usage, and data-driven selling for strategic growth.',
      bgColor: 'bg-secondary-600',
      iconBg: 'bg-secondary-500',
    },
    {
      icon: Users,
      title: 'Leadership Skills',
      description: 'Coaching, decision-making, and team influence for sales leadership development.',
      bgColor: 'bg-accent-600',
      iconBg: 'bg-accent-500',
    },
    {
      icon: Heart,
      title: 'Personal Excellence',
      description: 'Mindset, ethics, resilience, and personal ownership for lasting success.',
      bgColor: 'bg-neutral-700',
      iconBg: 'bg-neutral-600',
    },
  ];

  const transformationOutcomes = [
    {
      icon: CheckCircle,
      title: 'Structured Execution',
      description: 'Consistently perform with structured sales execution and standardized processes.',
      image: '/programs.jpg',
    },
    {
      icon: Users,
      title: 'Unified Language',
      description: 'Speak the same sales language, enabling smoother collaboration and performance visibility.',
      image: '/events.jpeg',
    },
    {
      icon: BarChart3,
      title: 'Data-Driven Decisions',
      description: 'Leverage data to make decisions — not guesswork — for better outcomes.',
      image: '/short ptograms.jpg',
    },
  ];

  const programFeatures = [
    {
      title: 'Tailored Cohorts',
      description: 'Grouped by role and competency level for maximum relevance.',
      benefit: 'Ensures role-specific impact and targeted development.',
      image: '/programs.jpeg',
      icon: Users
    },
    {
      title: 'Capstone Projects',
      description: 'Learners solve real internal sales problems during training.',
      benefit: 'Drives immediate ROI and practical learning application.',
      image: '/contact us.jpg',
      icon: Target
    },
    {
      title: 'Blended Learning',
      description: 'Virtual, in-person, and self-paced options for flexibility.',
      benefit: 'Adapts to hybrid and distributed team structures.',
      image: '/about.jpg',
      icon: Globe
    },
    {
      title: 'Seasoned Facilitators',
      description: 'All commercial leaders with training expertise and real experience.',
      benefit: 'Builds credibility, trust, and delivers practical insights.',
      image: '/home.jpg',
      icon: Star
    }
  ];

  const progressiveTracks = [
    {
      level: 'Track 1',
      title: 'Foundational Sales',
      description: 'Essential sales skills for new team members and frontline staff.',
      duration: '2-3 days',
      focus: 'Core selling techniques and basic CRM usage'
    },
    {
      level: 'Track 2',
      title: 'Frontline Sales Pro',
      description: 'Advanced techniques for experienced sales professionals.',
      duration: '3-4 days',
      focus: 'Opportunity management and value-based selling'
    },
    {
      level: 'Track 3',
      title: 'Sales Mastery',
      description: 'Strategic selling and key account management skills.',
      duration: '4-5 days',
      focus: 'Complex deal management and relationship building'
    },
    {
      level: 'Track 4',
      title: 'Strategic Sales Leadership',
      description: 'Leadership and coaching skills for sales managers.',
      duration: '5-6 days',
      focus: 'Team management and performance optimization'
    },
    {
      level: 'Track 5',
      title: 'Executive Sales & Account Strategy',
      description: 'Strategic account management and commercial leadership.',
      duration: '6-7 days',
      focus: 'Enterprise selling and strategic partnerships'
    }
  ];

  const engagementPathway = [
    {
      phase: 'Discovery Sessions',
      description: 'Audit your current team, deals, and structure to identify key performance barriers.',
      icon: FileText
    },
    {
      phase: 'Program Design',
      description: 'Customized by role, capability quadrant, and industry needs with defined KPIs.',
      icon: Target
    },
    {
      phase: 'Training Delivery',
      description: 'Blended sessions with simulations, roleplays, and real-world coaching.',
      icon: Users
    },
    {
      phase: 'Monitoring & Evaluation',
      description: 'Post-training re-assessment and ROI tracking with manager feedback.',
      icon: BarChart3
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen bg-white pt-20 pb-8 lg:pb-12">
        <div className="px-6 sm:px-8 lg:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[95%] overflow-hidden rounded-md shadow-2xl">
            <img
              src="/about.jpg"
              alt="Corporate Sales Training"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end px-6 sm:px-8 lg:px-12 pb-12">
              <div className="max-w-2xl">
                <div className="text-white">
                  <div className="mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 mb-6">
                      <Building className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-white text-sm font-medium">Corporate Sales Capability Programs</span>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Unlock Scalable Sales
                    <span className="block" style={{ color: '#4590AD' }}>
                      Performance
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    Drive Measurable Growth. Build Future-Ready Sales Teams.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => openB2bLeadModal()}
                      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-semibold"
                    >
                      Start Discovery
                    </button>
                    <button 
                      onClick={() => openB2bLeadModal()}
                      className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-md transition-colors duration-200 font-semibold"
                    >
                      Learn About Audit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Cards */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Mission Card */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md">
              <img
                src="/short ptograms.jpg"
                alt="Our Mission"
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-2 lg:p-3 rounded-md w-fit mb-3 lg:mb-4">
                  <Target className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3">
                  Our Mission
                </h3>
                <p className="text-gray-100 leading-relaxed text-xs lg:text-sm line-clamp-3">
                  Transform sales teams from transactional sellers to trusted commercial advisors who drive consistent results.
                </p>
              </div>
            </div>

            {/* Vision Card */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md">
              <img
                src="/contact us.jpg"
                alt="Our Vision"
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-2 lg:p-3 rounded-md w-fit mb-3 lg:mb-4">
                  <Lightbulb className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3">
                  Our Vision
                </h3>
                <p className="text-gray-100 leading-relaxed text-xs lg:text-sm line-clamp-3">
                  Partner with forward-thinking organizations to build performance-driven, professionalized sales functions.
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {heroStats.slice(0, 2).map((stat, index) => (
              <div key={index} className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <stat.icon className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold mb-2 text-accent-300">
                  {stat.value}
                </div>
                <p className="text-sm lg:text-base text-primary-100 leading-relaxed">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capability Audit Section */}
      <section id="audit" className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/programs.jpg"
                alt="Sales Capability Audit"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Start with Clarity: The KSS Capability Audit
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Before transformation begins, we diagnose where your team is — and what's holding them back. Our Sales Capability Audit provides a 360° diagnostic across four key capability quadrants.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {capabilityQuadrants.map((quadrant, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md ${quadrant.bgColor}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Icon in top left */}
                  <div className="absolute top-6 left-6">
                    <div className={`${quadrant.iconBg} p-3 rounded-md shadow-lg`}>
                      <quadrant.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Text content in lower portion */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                    <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                      {quadrant.title}
                    </h3>
                    <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                      {quadrant.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                What You Get from the Audit
              </h3>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Comprehensive insights that provide a clear map of your sales team's current state — and a prioritized path forward.
              </p>
            </div>

            {/* Audit Deliverables */}
            <div className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
              <div className="mb-3 lg:mb-4">
                <BarChart3 className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
              </div>
              <h4 className="text-sm lg:text-base font-semibold mb-2 text-white">Heatmaps & Analysis</h4>
              <p className="text-xs lg:text-sm text-primary-100 leading-relaxed">
                Team strengths and gaps by role (frontline, key accounts, leadership) with field observations and deal review insights.
              </p>
            </div>

            <div className="bg-secondary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
              <div className="mb-3 lg:mb-4">
                <FileText className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
              </div>
              <h4 className="text-sm lg:text-base font-semibold mb-2 text-white">Individual Reports</h4>
              <p className="text-xs lg:text-sm text-secondary-100 leading-relaxed">
                Role-fit recommendations and team-level development plans with coaching pathways and structural redesign options.
              </p>
            </div>

            <div className="bg-accent-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
              <div className="mb-3 lg:mb-4">
                <Shield className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
              </div>
              <h4 className="text-sm lg:text-base font-semibold mb-2 text-white">Risk Assessment</h4>
              <p className="text-xs lg:text-sm text-accent-100 leading-relaxed">
                Risk indicators for missed revenue, pipeline leakage, or retention challenges with actionable mitigation strategies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Outcomes */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {transformationOutcomes.map((outcome, index) => {
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
                        <outcome.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Text content in lower portion */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                      <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                        {outcome.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                        {outcome.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Fourth card - Additional Outcome */}
              <div className="bg-neutral-700 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white hover:shadow-xl transition-all duration-500">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Accelerated Growth
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm mb-4">
                    Accelerate promotion readiness and create a deep bench of sales leaders for sustainable growth.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/contact us.jpg"
                alt="What Transformation Looks Like"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  What Transformation Looks Like
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  After partnering with KSS, your team will consistently perform with structured sales execution, speak the same sales language, and leverage data to make decisions — not guesswork.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Features */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/about.jpg"
                alt="Program Features"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Program Features: Designed for Output and ROI
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Every feature is designed to drive immediate impact and measurable return on your training investment.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {programFeatures.map((feature, index) => {
                const bgColors = ['bg-primary-600', 'bg-secondary-600', 'bg-accent-600', 'bg-neutral-700'];
                const iconBgColors = ['bg-primary-500', 'bg-secondary-500', 'bg-accent-500', 'bg-neutral-600'];
                return (
                  <div
                    key={index}
                    className={`relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md ${bgColors[index]}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Icon in top left */}
                    <div className="absolute top-6 left-6">
                      <div className={`${iconBgColors[index]} p-3 rounded-md shadow-lg`}>
                        <feature.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Text content in lower portion */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                      <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Progressive Tracks */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                Our Corporate Training Investment
              </h3>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Corporate programs are customized, but typically align with one of our 5 progressive tracks designed for different team levels and needs.
              </p>
            </div>

            {/* Track Cards */}
            {progressiveTracks.slice(0, 3).map((track, index) => (
              <div key={index} className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <div className="bg-primary-500 p-2 rounded-md w-fit">
                    <span className="text-white text-xs font-bold">{track.level}</span>
                  </div>
                </div>
                <h4 className="text-sm lg:text-base font-semibold mb-2 text-white">{track.title}</h4>
                <p className="text-xs lg:text-sm text-primary-100 leading-relaxed mb-2 line-clamp-2">
                  {track.description}
                </p>
                <div className="text-xs text-primary-200">
                  <div className="flex items-center mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {track.duration}
                  </div>
                  <div className="text-xs text-primary-300 line-clamp-2">
                    {track.focus}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-8">
            {progressiveTracks.slice(3).map((track, index) => (
              <div key={index} className="bg-secondary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <div className="bg-secondary-500 p-2 rounded-md w-fit">
                    <span className="text-white text-xs font-bold">{track.level}</span>
                  </div>
                </div>
                <h4 className="text-sm lg:text-base font-semibold mb-2 text-white">{track.title}</h4>
                <p className="text-xs lg:text-sm text-secondary-100 leading-relaxed mb-2 line-clamp-2">
                  {track.description}
                </p>
                <div className="text-xs text-secondary-200">
                  <div className="flex items-center mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {track.duration}
                  </div>
                  <div className="text-xs text-secondary-300 line-clamp-2">
                    {track.focus}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pricing Card */}
            <div className="bg-accent-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
              <h4 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">
                Investment
              </h4>
              <p className="text-sm lg:text-base text-accent-100 leading-relaxed mb-4">
                Starting from KES 350,000 per day, covering up to 30 learners. Final pricing determined after discovery and co-design phase.
              </p>
              <button 
                onClick={() => openB2bLeadModal()}
                className="bg-white text-accent-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Get Custom Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Pathway */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Large Image Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/programs.jpg"
                alt="The KSS Engagement Pathway"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  The KSS Engagement Pathway
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  A structured approach to transforming your sales team from initial discovery to measurable results and ongoing support.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {engagementPathway.map((step, index) => {
                const bgColors = ['bg-primary-600', 'bg-secondary-600', 'bg-accent-600', 'bg-neutral-700'];
                const iconBgColors = ['bg-primary-500', 'bg-secondary-500', 'bg-accent-500', 'bg-neutral-600'];
                return (
                  <div
                    key={index}
                    className={`relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md ${bgColors[index]}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Icon in top left */}
                    <div className="absolute top-6 left-6">
                      <div className={`${iconBgColors[index]} p-3 rounded-md shadow-lg`}>
                        <step.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Text content in lower portion */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                      <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                        {step.phase}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Global Credibility */}
      <section className="py-16 lg:py-24 bg-gray-50 relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center aspect-square">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                Global Credibility
              </h2>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Our programs are certified by KSS and endorsed by the Institute of Sales Professionals (UK), providing your team with recognized credentials.
              </p>
            </div>
            
            {/* Credential Cards */}
            <div className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center aspect-square text-white">
              <div className="mb-3 lg:mb-4">
                <Award className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
              </div>
              <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">KSS Certification</h3>
              <p className="text-xs lg:text-sm text-primary-100 leading-relaxed">
                Industry-recognized certification demonstrating mastery of sales capabilities and professional standards.
              </p>
            </div>

            <div className="bg-secondary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center aspect-square text-white">
              <div className="mb-3 lg:mb-4">
                <Globe className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
              </div>
              <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">ISP Digital Badge</h3>
              <p className="text-xs lg:text-sm text-secondary-100 leading-relaxed">
                ISP-aligned LinkedIn digital badge for professional recognition and career advancement opportunities.
              </p>
            </div>

            <div className="bg-accent-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center aspect-square text-white">
              <div className="mb-3 lg:mb-4">
                <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
              </div>
              <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">Long-term Development</h3>
              <p className="text-xs lg:text-sm text-accent-100 leading-relaxed">
                Pathway into long-term professional development with ongoing learning and career advancement support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/home.jpg"
                alt="Ready to Transform Your Sales Team"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Ready to Transform Your Sales Team?
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  We'd love to explore how we can help. Start with a discovery session or team audit — we'll handle the rest.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <Headphones className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">Discovery Session</h3>
                <p className="text-xs lg:text-sm text-primary-100 leading-relaxed mb-4">
                  Initial consultation to understand your team's needs and explore partnership opportunities.
                </p>
                <button 
                  onClick={() => openB2bLeadModal()}
                  className="bg-white text-primary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Schedule Call
                </button>
              </div>

              <div className="bg-secondary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <BarChart3 className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">Team Audit</h3>
                <p className="text-xs lg:text-sm text-secondary-100 leading-relaxed mb-4">
                  Comprehensive capability assessment to identify gaps and design targeted development programs.
                </p>
                <button 
                  onClick={() => openB2bLeadModal()}
                  className="bg-white text-secondary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Start Audit
                </button>
              </div>

              <div className="bg-accent-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <FileText className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">Custom Proposal</h3>
                <p className="text-xs lg:text-sm text-accent-100 leading-relaxed mb-4">
                  Tailored program design with detailed scope, timeline, and investment for your specific needs.
                </p>
                <button 
                  onClick={() => openB2bLeadModal()}
                  className="bg-white text-accent-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Get Proposal
                </button>
              </div>

              <div className="bg-neutral-700 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
                <div className="mb-3 lg:mb-4">
                  <Users className="h-8 w-8 lg:h-10 lg:w-10 text-accent-300" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 text-white">Success Stories</h3>
                <p className="text-xs lg:text-sm text-neutral-100 leading-relaxed mb-4">
                  Learn from organizations that have transformed their sales teams and achieved measurable results.
                </p>
                <Link to="/about">
                  <button className="bg-white text-neutral-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200">
                    View Cases
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
};

export default Business; 