import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen,
  ArrowRight,
  Target,
  Users,
  TrendingUp,
  Award,
  Briefcase,
  Heart,
  Lightbulb,
  Star,
  Zap,
  CheckCircle
} from 'lucide-react';
import Logo from '../../components/Logo';

const Framework: React.FC = () => {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen bg-white pt-20 pb-8 lg:pb-12">
        <div className="px-6 sm:px-8 lg:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[95%] overflow-hidden rounded-md shadow-2xl">
            <img
              src="/about.jpg"
              alt="Students learning together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end px-6 sm:px-8 lg:px-12 pb-12">
              <div className="max-w-2xl">
                <div className="text-white">
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Your Roadmap to Sales
                    <span className="block" style={{ color: '#4590AD' }}>
                      Mastery
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    Ever wonder what separates good salespeople from great ones? Our proven framework shows you exactly how to get there.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="#framework" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        Explore Framework
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

      {/* Framework Introduction - Split Layout */}
      <section id="framework" className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/programs.jpg"
                alt="Sales Framework Overview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Think of This as Your Career GPS
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Our Sales Capability Framework isn't just theory – it's your personal roadmap to success. Real-world skills that actually help you close deals and advance your career.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-primary-500 p-3 rounded-md shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-lg lg:text-xl font-semibold mb-3 text-white">
                    Structured Progression
                  </h3>
                  <p className="text-white/90 leading-relaxed text-sm lg:text-base">
                    Clear pathway from beginner to sales visionary with defined milestones at every level.
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-secondary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-secondary-500 p-3 rounded-md shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-lg lg:text-xl font-semibold mb-3 text-white">
                    Real-World Application
                  </h3>
                  <p className="text-white/90 leading-relaxed text-sm lg:text-base">
                    Forget boring textbooks. Learn skills that actually help you close deals and build relationships.
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-accent-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-accent-500 p-3 rounded-md shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-lg lg:text-xl font-semibold mb-3 text-white">
                    Competency Based
                  </h3>
                  <p className="text-white/90 leading-relaxed text-sm lg:text-base">
                    Master specific skills and behaviors needed at each stage of your sales journey.
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-neutral-700">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-lg lg:text-xl font-semibold mb-3 text-white">
                    Career Advancement
                  </h3>
                  <p className="text-white/90 leading-relaxed text-sm lg:text-base">
                    Always know what to work on next to reach your professional goals and dreams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Competency Levels */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                Your Journey from Newbie to Sales Superstar
              </h3>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Whether you're just starting out or looking to level up, we've got you covered. Here's how you'll progress through your sales career.
              </p>
            </div>

            {/* Level 1 - Foundation */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-600">
              <div className="absolute top-6 left-6">
                <div className="bg-primary-500 p-3 rounded-md shadow-lg">
                  <Star className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md w-fit mb-3">
                  <span className="text-white text-xs font-bold">Level 1</span>
                </div>
                <h4 className="text-sm lg:text-base font-semibold text-white mb-2">Getting Started</h4>
                <p className="text-white/90 text-xs lg:text-sm leading-relaxed line-clamp-3">
                  Learn the basics that every successful salesperson needs to know. Build confidence for your first sales.
                </p>
              </div>
            </div>

            {/* Level 2 - Professional */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-secondary-600">
              <div className="absolute top-6 left-6">
                <div className="bg-secondary-500 p-3 rounded-md shadow-lg">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md w-fit mb-3">
                  <span className="text-white text-xs font-bold">Level 2</span>
                </div>
                <h4 className="text-sm lg:text-base font-semibold text-white mb-2">Hitting Your Stride</h4>
                <p className="text-white/90 text-xs lg:text-sm leading-relaxed line-clamp-3">
                  Master advanced techniques, sell value not price, and build pipelines that exceed targets.
                </p>
              </div>
            </div>

            {/* Level 3 - Advanced */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-accent-600">
              <div className="absolute top-6 left-6">
                <div className="bg-accent-500 p-3 rounded-md shadow-lg">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md w-fit mb-3">
                  <span className="text-white text-xs font-bold">Level 3</span>
                </div>
                <h4 className="text-sm lg:text-base font-semibold text-white mb-2">Leading Others</h4>
                <p className="text-white/90 text-xs lg:text-sm leading-relaxed line-clamp-3">
                  Strategic selling, key account management, and leadership skills for sales managers.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Level 4 - Strategic */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-neutral-700">
              <div className="absolute top-6 left-6">
                <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                  <Target className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md w-fit mb-3">
                  <span className="text-white text-xs font-bold">Level 4</span>
                </div>
                <h4 className="text-sm lg:text-base font-semibold text-white mb-2">The Big Picture</h4>
                <p className="text-white/90 text-xs lg:text-sm leading-relaxed line-clamp-3">
                  Shape commercial strategy, manage multiple regions, and influence key stakeholders.
                </p>
              </div>
            </div>

            {/* Level 5 - Expert */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-800">
              <div className="absolute top-6 left-6">
                <div className="bg-primary-700 p-3 rounded-md shadow-lg">
                  <Award className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md w-fit mb-3">
                  <span className="text-white text-xs font-bold">Level 5</span>
                </div>
                <h4 className="text-sm lg:text-base font-semibold text-white mb-2">Sales Visionary</h4>
                <p className="text-white/90 text-xs lg:text-sm leading-relaxed line-clamp-3">
                  Design innovative go-to-market strategies and build sales systems that scale.
                </p>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
              <h4 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">
                Ready to Start?
              </h4>
              <p className="text-sm lg:text-base text-primary-100 leading-relaxed mb-4">
                Begin your journey with our structured programs designed to take you from where you are to where you want to be.
              </p>
              <Link to="/programs">
                <button className="bg-white text-primary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1">
                  <span>View Programs</span>
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>

            {/* Learn More About Us Card */}
            <div className="bg-neutral-700 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white hover:shadow-xl transition-all duration-500">
              <div className="absolute top-6 left-6">
                <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                  <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col justify-center h-full">
                <h4 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                  Learn More About Us
                </h4>
                <p className="text-white/90 leading-relaxed text-xs lg:text-sm mb-4">
                  Discover our proven framework and methodology that transforms sales professionals.
                </p>
                <Link to="/about">
                  <button className="bg-white text-neutral-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1">
                    <span>About KSS</span>
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Pillars - Split Layout */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">

              {/* Core Skills */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-primary-500 p-3 rounded-md shadow-lg">
                    <Target className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">The Art of Selling</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed mb-2">
                    Master core skills that turn conversations into sales.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['Prospecting', 'Presentation'].map((skill, index) => (
                      <span key={index} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Business Acumen */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-secondary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-secondary-500 p-3 rounded-md shadow-lg">
                    <Briefcase className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Business Savvy</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed mb-2">
                    Understand how businesses work and speak your clients' language.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['Market Analysis', 'Strategy'].map((skill, index) => (
                      <span key={index} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leadership */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-accent-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-accent-500 p-3 rounded-md shadow-lg">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">People Power</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed mb-2">
                    Build influence and communication skills that make others follow you.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['Team Building', 'Coaching'].map((skill, index) => (
                      <span key={index} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Development */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-neutral-700">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <Heart className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Personal Excellence</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed mb-2">
                    Develop mindset, resilience, and emotional intelligence for lasting success.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['Mindset', 'Resilience'].map((skill, index) => (
                      <span key={index} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/events.jpeg"
                alt="Four Pillars of Excellence"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h3 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  The Four Things Every Great Salesperson Masters
                </h3>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Success in sales isn't just about one thing – it's about excelling in these four key areas. Build strength in each to become truly exceptional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Methods */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                How We Make Learning Actually Work
              </h3>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Forget boring lectures and endless PowerPoints. We use proven methods that actually stick and change how you think and act.
              </p>
            </div>

              {/* Collaborative Learning */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-primary-500 p-3 rounded-md shadow-lg">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Learn With Your Peers</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed line-clamp-3">
                    Practice with real people on actual sales challenges with classmates who understand your journey.
                  </p>
                </div>
              </div>

              {/* Expert Facilitation */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-secondary-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-secondary-500 p-3 rounded-md shadow-lg">
                    <Star className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Learn from the Pros</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed line-clamp-3">
                    Battle-tested sales veterans who've been where you want to go share real solutions that work.
                  </p>
                </div>
              </div>

              {/* Blended Learning */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-accent-600">
                <div className="absolute top-6 left-6">
                  <div className="bg-accent-500 p-3 rounded-md shadow-lg">
                    <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h4 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Learn Your Way</h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed line-clamp-3">
                    Online when busy, in-person for connection. Study at your pace, on your schedule.
                  </p>
                </div>
              </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Framework; 