import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { ProgramService } from '../../services/firestore';
import Logo from '../../components/Logo';

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      loadPrograms();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const result = await ProgramService.getActivePrograms();
      if (result.success && result.data) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const ProgramCard: React.FC<{ program: any }> = ({ program }) => (
    <div className="relative overflow-hidden h-96 lg:h-[28rem] hover:shadow-xl transition-all duration-500 rounded-sm bg-white">
      <img
        src={program.image || '/kss.jpg'}
        alt={program.programName}
        className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
        <div className="flex justify-between items-start">
          <div className="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-sm font-medium">
            {program.category || 'Professional Development'}
          </div>
          <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-sm font-medium">
            {program.duration || '12 weeks'}
          </div>
        </div>
        <div>
          <h3 className="text-lg lg:text-xl font-semibold mb-3">
            {program.programName}
          </h3>
          <p className="text-gray-100 mb-4 text-sm lg:text-base leading-relaxed line-clamp-2">
            {program.description || 'Comprehensive program designed to advance your professional skills.'}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(program.learningOutcomes || program.prerequisites || ['Professional Skills', 'Industry Knowledge', 'Practical Application', 'Career Growth']).slice(0, 4).map((outcome: string, index: number) => (
              <div key={index} className="flex items-center text-sm text-gray-200">
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mr-2"></div>
                <span className="line-clamp-1">{outcome}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl lg:text-2xl font-bold text-accent-300">
              {program.fees ? formatPrice(program.fees) : 'Contact for Pricing'}
            </span>
            <div className="flex items-center gap-2">
              <Link to={`/programs/${program.id}`}>
                <button className="border border-white text-white hover:bg-white hover:text-primary-600 px-4 py-2 rounded-sm text-sm transition-colors duration-200">
                  Learn More
                </button>
              </Link>
              <Link to={`/programs?enroll=${program.id}`}>
                <button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-sm text-sm transition-colors duration-200">
                  Enroll
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Logo size="2xl" showText={true} textSize="3xl" className="justify-center" />
          </div>
          <p className="text-white text-xl">Loading Program Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss11.jpg"
            alt="Students in learning environment"
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
                  <BookOpen className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">Comprehensive Learning Catalog</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Choose Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Perfect Program
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Browse our expertly designed sales training programs. Find the right level for your experience and start advancing your career today.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-start">
                <a href="#programs">
                  <button className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-[3px] hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1">
                    <span>Browse Programs</span>
                    <BookOpen className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
                <Link to="/framework">
                  <button className="group border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold backdrop-blur-sm">
                    <ArrowRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Learn Framework</span>
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



      {/* Program Introduction */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-6">
              Professional Sales Training Programs
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg lg:text-xl text-gray-600 mb-6 leading-relaxed">
                Our programs are built on the Sales Capability Framework—a structured approach that develops the skills, knowledge, and behaviors needed for sales excellence. Whether you're just starting out or looking to advance to leadership, we have the right program for your career stage.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-4">
                  <div className="text-2xl font-bold text-primary-600 mb-2">5 Levels</div>
                  <div className="text-sm text-gray-600">From Basic to Expert</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-primary-600 mb-2">12 Weeks</div>
                  <div className="text-sm text-gray-600">Comprehensive Training</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-primary-600 mb-2">Blended</div>
                  <div className="text-sm text-gray-600">Online & In-Person</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Catalog */}
      <section id="programs" className="py-16 lg:py-24 bg-gray-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
              Available Programs
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {programs.map((program, index) => (
                <div 
                  key={program.id} 
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ProgramCard program={program} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary-600 to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full text-center px-6 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-lg lg:text-xl text-gray-100 mb-8 lg:mb-10 max-w-3xl mx-auto">
              Join thousands of learners who have transformed their careers with our programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
              <Link to="/auth/signup">
                <button className="inline-flex items-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-sm shadow-xl transition-colors duration-200">
                  Enroll Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link to="/framework">
                <button className="inline-flex items-center border border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-sm shadow-lg transition-colors duration-200">
                  Learn Framework
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgramsPage;