import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, BookOpen, Award, CheckCircle, Calendar, Target, Star } from 'lucide-react';
import { ProgramService } from '../../services/firestore';

interface Program {
  id: string;
  programName: string;
  programCode: string;
  description: string;
  level: string;
  duration: string;
  prerequisites: string[];
  overview: string;
  outline: string[];
  objectives: string[];
  certification: string;
  targetAudience: string;
  status: string;
}

const ProgramDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProgram();
    }
  }, [id]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      const result = await ProgramService.getById('programs', id!);
      if (result.success) {
        setProgram(result.data as Program);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">Program Not Found</h2>
          <p className="text-secondary-600 mb-6">The program you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/programs')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
        <div className="px-6 sm:px-8 lg:px-12">
          <button
            onClick={() => navigate('/programs')}
            className="flex items-center space-x-2 text-primary-200 hover:text-white mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Programs</span>
          </button>
          
          <div className="max-w-4xl">
            <div className="mb-4">
              <span className="bg-primary-500 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">
                {program.programCode}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">{program.programName}</h1>
            <p className="text-xl text-primary-100 leading-relaxed mb-8">
              {program.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Clock className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Duration</h3>
                <p className="text-primary-200">{program.duration}</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Award className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Level</h3>
                <p className="text-primary-200">{program.level}</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl">
                <Users className="h-8 w-8 mb-3 text-primary-200" />
                <h3 className="text-lg font-semibold mb-1">Certification</h3>
                <p className="text-primary-200">{program.certification || 'Certificate of Completion'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Content */}
      <section className="py-16">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Overview Section */}
              <div>
                <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-primary-600" />
                  <span>Program Overview</span>
                </h2>
                <div className="prose prose-lg text-secondary-600">
                  <p className="text-lg leading-relaxed">
                    {program.overview || program.description}
                  </p>
                </div>
              </div>

              {/* Learning Objectives */}
              {program.objectives && program.objectives.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                    <Target className="h-8 w-8 text-accent-600" />
                    <span>Learning Objectives</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {program.objectives.map((objective, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
                        <span className="text-secondary-700">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Program Outline */}
              <div>
                <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-secondary-600" />
                  <span>Program Outline</span>
                </h2>
                {program.outline && program.outline.length > 0 ? (
                  <div className="space-y-4">
                    {program.outline.map((module, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-secondary-800">{module}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Detailed curriculum outline will be provided upon enrollment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Apply Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 mb-8">
                  <h3 className="text-2xl font-bold text-secondary-800 mb-4">Ready to Apply?</h3>
                  <p className="text-secondary-600 mb-6">
                    Take the next step in your learning journey and join this program.
                  </p>
                  <button
                    onClick={() => navigate('/auth/signup')}
                    className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Star className="h-5 w-5" />
                    <span>Apply Now</span>
                  </button>
                  <p className="text-sm text-secondary-500 mt-4 text-center">
                    Create an account to start your application
                  </p>
                </div>

                {/* Prerequisites */}
                {program.prerequisites && program.prerequisites.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Prerequisites</h3>
                    <ul className="space-y-3">
                      {program.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-accent-600 flex-shrink-0 mt-0.5" />
                          <span className="text-secondary-600 text-sm">{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Audience */}
                {program.targetAudience && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Who Should Apply</h3>
                    <p className="text-secondary-600 text-sm">{program.targetAudience}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgramDetailPage; 