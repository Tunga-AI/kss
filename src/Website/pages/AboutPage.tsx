import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Heart, Award, Globe, Lightbulb, TrendingUp, Star, BookOpen, Briefcase, Clock } from 'lucide-react';

const AboutPage: React.FC = () => {

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
      image: '/programs.jpg',
      gradient: 'from-blue-500/90 to-purple-600/90'
    },
    {
      icon: Globe,
      title: 'Globally Benchmarked',
      description: 'Built on UK Institute of Sales Professionals framework, recognized worldwide.',
      image: '/events.jpeg',
      gradient: 'from-emerald-500/90 to-teal-600/90'
    },
    {
      icon: Award,
      title: 'Certified Excellence',
      description: 'Vocational qualifications aligned to UK Ofqual standards with CPD certification.',
      image: '/short ptograms.jpg',
      gradient: 'from-amber-500/90 to-orange-600/90'
    },
    {
      icon: Heart,
      title: 'African Context',
      description: 'Global best practices adapted for real-world African sales environments.',
      image: '/home.jpg',
      gradient: 'from-rose-500/90 to-pink-600/90'
    }
  ];



  const programHighlights = [
    {
      title: 'Collaborative Learning',
      description: 'Work together on real-world sales challenges and simulations.',
      benefit: 'Builds teamwork and mirrors actual selling environments.',
      image: '/programs.jpeg',
      icon: Users
    },
    {
      title: 'Expert Facilitation',
      description: 'Learn from experienced sales professionals with industry insights.',
      benefit: 'Bridge theory and practice with real-world experience.',
      image: '/contact us.jpg',
      icon: Star
    },
    {
      title: 'Blended Approach',
      description: 'Virtual sessions, physical workshops, and self-paced learning.',
      benefit: 'Flexibility for different schedules and learning styles.',
      image: '/about.jpg',
      icon: Globe
    },
    {
      title: 'Capstone Project',
      description: 'Apply all concepts to solve real business problems.',
      benefit: 'Build portfolio pieces demonstrating job readiness.',
      image: '/home.jpg',
      icon: Award
    }
  ];



  const foundingStory = [
    {
      organization: 'Yusudi',
      role: 'Sales Enablement Pioneer',
      description: 'Founded in 2015, Yusudi pioneered sales enablement in Africa, transforming sales into a respected career path and revolutionizing sales team management.',
      logo: '/yusudi.png',
      background: '/programs.jpg',
      founding: '2015',
      website: 'yusudi.com'
    },
    {
      organization: 'Commercial Club of Africa',
      role: 'Professional Community',
      description: 'Platform of sales leaders shaping the future of African commerce through collaboration.',
      logo: '/commercialclublogo.avif',
      background: '/events.jpeg',
      founding: '2024',
      website: 'commercialclubafrica.com'
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
              alt="Kenya School of Sales"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end px-6 sm:px-8 lg:px-12 pb-12">
              <div className="max-w-2xl">
                <div className="text-white">
                  <div className="mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 mb-6">
                      <Award className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-white text-sm font-medium">First Professional Sales School in Kenya</span>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Kenya School of
                    <span className="block" style={{ color: '#4590AD' }}>
                      Sales
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    Elevating Sales. Empowering Professionals. Transforming Africa.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/programs" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        Start Your Journey
                      </button>
                    </Link>
                    <Link to="/programs" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        Explore Programs
                      </button>
                    </Link>
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
                  To make sales training desirable and simplify sales career development across Africa.
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
                  To nurture bold African commercial superstars who drive economic transformation.
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

      {/* Why Choose KSS */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/about.jpg"
                alt="Why Choose KSS"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Why Choose KSS?
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  The first structured, internationally-recognized sales education platform in Kenya with global standards and proven results.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {whyChooseKSS.map((item, index) => {
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
                        <item.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Text content in lower portion */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                      <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                        {item.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How We Deliver Excellence */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {programHighlights.map((highlight, index) => {
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
                        <highlight.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Text content in lower portion */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                      <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                        {highlight.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                        {highlight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/contact us.jpg"
                alt="How We Deliver Excellence"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  How We Deliver Excellence
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Proven methods and innovative approaches that ensure your learning translates to real results and career transformation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Founding Partners */}
      <section className="py-16 lg:py-24 bg-white relative">        
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-primary-600 rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center aspect-square text-white">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">
                Built by Industry Leaders
              </h2>
              <p className="text-sm lg:text-base text-primary-100 leading-relaxed">
                Founded through the partnership of two pioneering organizations transforming African commerce.
              </p>
            </div>
            
            {/* Two founding partner cards */}
            {foundingStory.map((founder, index) => {
              return (
                <div
                  key={index}
                  className="bg-white aspect-square hover:shadow-xl transition-all duration-500 rounded-md p-4 lg:p-6 flex flex-col justify-between border border-gray-200"
                  style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                >
                  {/* Logo at top */}
                  <div className="flex justify-center pt-4">
                    <img
                      src={founder.logo}
                      alt={`${founder.organization} Logo`}
                      className="h-16 lg:h-20 w-auto object-contain"
                    />
                  </div>
                  
                  {/* Content at bottom */}
                  <div>
                    <h3 className="text-sm lg:text-base font-semibold mb-1 text-gray-900">
                      {founder.organization}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-xs lg:text-sm line-clamp-2 mb-1">
                      {founder.description}
                    </p>
                    <p className="text-primary-600 text-xs font-medium">
                      Founded {founder.founding}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {/* Fourth card - CTA */}
            <div className="bg-secondary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center aspect-square text-white">
              <h3 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">
                Join Our Community
              </h3>
              <p className="text-sm lg:text-base text-secondary-100 leading-relaxed mb-4">
                Be part of Africa's leading sales professional network and transform your career.
              </p>
              <Link to="/programs">
                <button className="bg-white text-secondary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16 lg:py-24 bg-gray-50 relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center aspect-square">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Experienced leaders driving the transformation of sales education across Africa.
              </p>
            </div>
            
            {/* Team member cards */}
            <div className="relative overflow-hidden aspect-square hover:shadow-xl transition-all duration-500 rounded-md">
              <img
                src="/kevlin.png"
                alt="Kelvin Kuria"
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-2 lg:p-3 rounded-md w-fit mb-3 lg:mb-4">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3">
                  Kelvin Kuria
                </h3>
                <p className="text-gray-100 leading-relaxed text-xs lg:text-sm">
                  Co-founder
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden aspect-square hover:shadow-xl transition-all duration-500 rounded-md">
              <img
                src="/kamande.png"
                alt="Olive Kamande"
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-2 lg:p-3 rounded-md w-fit mb-3 lg:mb-4">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3">
                  Olive Kamande
                </h3>
                <p className="text-gray-100 leading-relaxed text-xs lg:text-sm">
                  Co-founder
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden aspect-square hover:shadow-xl transition-all duration-500 rounded-md">
              <img
                src="/alex.png"
                alt="Alex Mahugu"
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
                <div className="bg-white/20 backdrop-blur-sm p-2 lg:p-3 rounded-md w-fit mb-3 lg:mb-4">
                  <Briefcase className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3">
                  Alex Mahugu
                </h3>
                <p className="text-gray-100 leading-relaxed text-xs lg:text-sm">
                  General Manager
                </p>
              </div>
            </div>
          </div>

          
        </div>
      </section>

    </div>
  );
};

export default AboutPage;