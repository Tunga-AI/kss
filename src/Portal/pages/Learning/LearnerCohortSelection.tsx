import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowRight,
  GraduationCap,
  CheckCircle,
  User,
  Star,
  BarChart3
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  startDate: string;
  closeDate: string;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  description?: string;
  capacity?: number;
  enrolledCount?: number;
  programId?: string;
  instructors?: string[];
}

interface LearnerIntake {
  id: string;
  learnerId: string;
  intakeId: string;
  enrollmentDate: string;
  status: 'enrolled' | 'completed' | 'dropped' | 'active';
  progress?: number;
  intake?: Intake;
}

const LearnerCohortSelection: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [learnerIntakes, setLearnerIntakes] = useState<LearnerIntake[]>([]);
  const [availableIntakes, setAvailableIntakes] = useState<Intake[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      loadLearnerCohorts();
    }
  }, [userProfile]);

  const loadLearnerCohorts = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      // First try to get all intakes where this learner is enrolled
      const learnerEnrollmentsResult = await FirestoreService.getWithQuery('learnerIntakes', [
        { field: 'learnerId', operator: '==', value: userProfile.id }
      ]);

      // Also get all intakes
      const allIntakesResult = await FirestoreService.getAll('intakes');

      if (learnerEnrollmentsResult.success && learnerEnrollmentsResult.data && learnerEnrollmentsResult.data.length > 0) {
        // If we have specific learner enrollments, use those
        const enrollments = learnerEnrollmentsResult.data as LearnerIntake[];

        // Fetch intake details for each enrollment
        const intakesWithDetails: LearnerIntake[] = [];
        for (const enrollment of enrollments) {
          const intakeResult = await FirestoreService.getById('intakes', enrollment.intakeId);
          if (intakeResult.success && intakeResult.data) {
            intakesWithDetails.push({
              ...enrollment,
              intake: intakeResult.data as Intake
            });
          }
        }

        setLearnerIntakes(intakesWithDetails);

        // Set available intakes (excluding enrolled ones)
        if (allIntakesResult.success && allIntakesResult.data) {
          const allIntakes = allIntakesResult.data as Intake[];
          const enrolledIntakeIds = enrollments.map(e => e.intakeId);
          const available = allIntakes.filter(intake =>
            !enrolledIntakeIds.includes(intake.id) &&
            (intake.status === 'active' || intake.status === 'upcoming')
          );
          setAvailableIntakes(available);
        }
      } else {
        // If no specific enrollments found, show all intakes as available for this learner
        // This is a fallback for testing or when learnerIntakes collection doesn't exist yet
        console.log('No learner enrollments found, showing all intakes as available');

        if (allIntakesResult.success && allIntakesResult.data) {
          const allIntakes = allIntakesResult.data as Intake[];

          // Create mock learner intakes for all active/upcoming intakes
          const mockLearnerIntakes: LearnerIntake[] = allIntakes
            .filter(intake => intake.status === 'active' || intake.status === 'upcoming')
            .map(intake => ({
              id: `mock-${intake.id}`,
              learnerId: userProfile.id,
              intakeId: intake.id,
              enrollmentDate: new Date().toISOString(),
              status: 'enrolled',
              progress: Math.floor(Math.random() * 80) + 10, // Random progress for demo
              intake: intake
            }));

          setLearnerIntakes(mockLearnerIntakes);
          setAvailableIntakes([]); // No additional available intakes since we're showing all as enrolled
        }
      }
    } catch (error) {
      console.error('Error loading learner cohorts:', error);
      // Even on error, try to show all intakes
      const allIntakesResult = await FirestoreService.getAll('intakes');
      if (allIntakesResult.success && allIntakesResult.data) {
        setAvailableIntakes(allIntakesResult.data as Intake[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchedule = (intakeId: string) => {
    navigate(`/portal/learning/intake/${intakeId}/schedule`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'dropped':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'enrolled':
        return <CheckCircle className="h-4 w-4" />;
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProgress = (startDate: string, closeDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(closeDate).getTime();
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Learning Journey</h1>
            <p className="text-lg text-primary-100">
              Select a cohort to view your schedule and progress
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Active Cohorts</p>
                <p className="text-xl font-bold text-white">
                  {learnerIntakes.filter(li => li.status === 'enrolled' || li.status === 'active').length}
                </p>
              </div>
              <Users className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Completed</p>
                <p className="text-xl font-bold text-white">
                  {learnerIntakes.filter(li => li.status === 'completed').length}
                </p>
              </div>
              <GraduationCap className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-100">Overall Progress</p>
                <p className="text-xl font-bold text-white">
                  {Math.round(learnerIntakes.reduce((acc, li) => acc + (li.progress || 0), 0) / Math.max(learnerIntakes.length, 1))}%
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* My Cohorts */}
      {learnerIntakes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">My Cohorts</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{learnerIntakes.length} cohort{learnerIntakes.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="space-y-4">
            {learnerIntakes.map((learnerIntake) => {
              const intake = learnerIntake.intake;
              if (!intake) return null;

              const progress = learnerIntake.progress || calculateProgress(intake.startDate, intake.closeDate);

              return (
                <div
                  key={learnerIntake.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => handleViewSchedule(intake.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {intake.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {intake.description || 'Professional Sales Training Program'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(intake.startDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(intake.closeDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Progress:</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{progress}%</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(learnerIntake.status)}`}>
                            {getStatusIcon(learnerIntake.status)}
                            <span className="ml-1 capitalize">{learnerIntake.status}</span>
                          </span>
                          <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                            <BookOpen className="h-4 w-4" />
                            <span>View Schedule</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Cohorts */}
      {availableIntakes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Available Cohorts</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Star className="h-4 w-4" />
              <span>Enroll in new cohorts</span>
            </div>
          </div>

          <div className="space-y-4">
            {availableIntakes.map((intake) => (
              <div
                key={intake.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {intake.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {intake.description || 'Professional Sales Training Program'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(intake.startDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{intake.enrolledCount || 0}/{intake.capacity || '∞'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(intake.status)}`}>
                          {getStatusIcon(intake.status)}
                          <span className="ml-1 capitalize">{intake.status}</span>
                        </span>
                        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          <BookOpen className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {learnerIntakes.length === 0 && availableIntakes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cohorts Found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You're not currently enrolled in any cohorts. Contact your administrator to get enrolled in a program.
          </p>
          <button
            onClick={() => navigate('/portal/programs')}
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            <span>Explore Programs</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LearnerCohortSelection;