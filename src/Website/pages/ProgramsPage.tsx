import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen,
  ArrowRight,
  Award,
  Target,
  Users,
  TrendingUp,
  Globe,
  MessageSquare
} from 'lucide-react';
import { ProgramService } from '../../services/firestore';
import Logo from '../../components/Logo';
import { useModal } from '../../contexts/ModalContext';

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openLeadModal, openB2bLeadModal } = useModal();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const result = await ProgramService.getActivePrograms();
      if (result.success && result.data) {
        // Sort programs by level in ascending order (1, 2, 3, etc.)
        const sortedPrograms = result.data.sort((a: any, b: any) => {
          const levelA = parseInt(a.level) || 1;
          const levelB = parseInt(b.level) || 1;
          return levelA - levelB;
        });
        setPrograms(sortedPrograms);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency || 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const whyChoosePrograms = [
    {
      icon: Target,
      title: 'Results-Focused',
      description: 'Programs designed to deliver measurable improvements in your sales performance and career prospects.',
    },
    {
      icon: Users,
      title: 'Expert Instructors',
      description: 'Learn from experienced sales professionals who have succeeded in real-world environments.',
    },
    {
      icon: Award,
      title: 'Industry Recognition',
      description: 'Gain certifications that are valued and recognized by top employers across Africa.',
    },
  ];

  const programBenefits = [
    {
      icon: BookOpen,
      title: 'Practical Learning',
      description: 'Every lesson includes real-world applications and hands-on practice with actual sales scenarios.',
    },
    {
      icon: Award,
      title: 'Lifetime Career Support',
      description: 'Get ongoing guidance and support even after graduation to help you advance your career.',
    },
    {
      icon: Users,
      title: 'Proven Success',
      description: 'Join thousands of graduates who have successfully transformed their sales careers with our programs.',
    },
  ];

  const ProgramCard: React.FC<{ program: any }> = ({ program }) => {
    const getProgramPath = (program: any) => {
      // Use slug if available, otherwise use ID
      return program.slug ? `/programs/${program.slug}` : `/programs/${program.id}`;
    };

    return (
      <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-white">
        <img
          src={program.image || '/kss.jpg'}
          alt={program.programName}
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-white">
          <div>
            <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 line-clamp-2">
              {program.programName}
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm lg:text-base font-bold text-accent-300">
                {program.price && program.price > 0 ? formatPrice(program.price, program.currency) : 'Contact'}
              </span>
              
              <Link to={getProgramPath(program)}>
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen bg-white pt-20 pb-8 lg:pb-12">
        <div className="px-6 sm:px-8 lg:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[95%] overflow-hidden rounded-md shadow-2xl">
            <img
              src="/programs.jpg"
              alt="Students learning together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end px-6 sm:px-8 lg:px-12 pb-12">
              <div className="max-w-2xl">
                <div className="text-white">
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Choose Your Perfect
                    <span className="block" style={{ color: '#4590AD' }}>
                      Sales Program
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    Browse our expertly designed sales training programs and find the right level for your experience.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="#programs" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        Browse Programs
                      </button>
                    </a>
                    <Link to="/framework" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                        Learn Framework
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Programs Catalog */}
      <section id="programs" className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
              Available Programs
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              Choose the program that matches your experience level and career goals.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Logo size="lg" showText={false} />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No programs available</h3>
              <p className="text-gray-600 mb-4">
                Check back soon for new programs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {programs.map((program, index) => (
                <div 
                  key={program.id} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProgramCard program={program} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What You'll Get - Split Layout */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {programBenefits.map((benefit, index) => {
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
              
              {/* Fourth card - Additional benefit */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-neutral-700">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <Globe className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Global Standards
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                    Training programs that meet international standards and are recognized globally.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/programs.jpeg"
                alt="What You'll Get"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  What You'll Get
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  More than just training - comprehensive support for your entire sales career journey with real-world applications and ongoing guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Programs - Split Layout */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            {/* Left side - Text Content Card */}
            <div className="relative overflow-hidden rounded-md shadow-lg min-h-[600px] lg:min-h-[624px]">
              <img
                src="/about.jpg"
                alt="Why Choose Our Programs"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
              
              {/* Text content in lower left */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
                  Why Choose Our Programs?
                </h2>
                <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
                  Expertly designed programs that deliver real results and transform your sales career with proven methodologies and industry expertise.
                </p>
              </div>
            </div>

            {/* Right side - 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {whyChoosePrograms.map((item, index) => {
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
              
              {/* Fourth card - Additional benefit */}
              <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-neutral-700">
                <div className="absolute top-6 left-6">
                  <div className="bg-neutral-600 p-3 rounded-md shadow-lg">
                    <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 text-white">
                    Career Growth
                  </h3>
                  <p className="text-white/90 leading-relaxed text-xs lg:text-sm line-clamp-3">
                    Programs designed to accelerate your career progression and open new opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Sales Career?
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Get in touch with our admissions team to learn more about our programs and find the perfect fit for your career goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => openLeadModal('core')}
                className="w-full sm:w-auto bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Individual Programs</span>
              </button>
              <button
                onClick={() => openB2bLeadModal()}
                className="w-full sm:w-auto bg-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-secondary-700 transition-colors duration-200 flex items-center justify-center space-x-2 border border-secondary-500"
              >
                <Users className="h-5 w-5" />
                <span>Corporate Training</span>
              </button>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
};

export default ProgramsPage;