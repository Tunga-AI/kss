import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Trophy,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Target,
  Play,
  Download,
  Star,
  ArrowRight,
  ChevronRight,
  Activity,
  Award,
  GraduationCap
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { FirestoreService } from '../../../services/firestore';

interface LearnerStats {
  progress: number;
  completedAssignments: number;
  totalAssignments: number;
  upcomingClasses: number;
  currentGrade: string;
  activeCourses: number;
}

interface UpcomingClass {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  type: 'lecture' | 'workshop' | 'project' | 'assessment';
}

interface RecentActivity {
  id: string;
  type: 'assignment' | 'grade' | 'resource' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'overdue';
}

const LearnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LearnerStats>({
    progress: 75,
    completedAssignments: 8,
    totalAssignments: 12,
    upcomingClasses: 3,
    currentGrade: 'A-',
    activeCourses: 2
  });

  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      setUpcomingClasses([
        {
          id: '1',
          title: 'Python Advanced Concepts',
          date: '2024-01-25',
          time: '10:00 AM',
          instructor: 'Dr. Smith',
          type: 'lecture'
        },
        {
          id: '2',
          title: 'Data Analysis Workshop',
          date: '2024-01-26',
          time: '2:00 PM',
          instructor: 'Prof. Johnson',
          type: 'workshop'
        },
        {
          id: '3',
          title: 'Midterm Assessment',
          date: '2024-01-28',
          time: '9:00 AM',
          instructor: 'Dr. Smith',
          type: 'assessment'
        }
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'grade',
          title: 'Assignment 4 Graded',
          description: 'Data Structures Assignment - Grade: 92%',
          timestamp: '2 hours ago',
          status: 'completed'
        },
        {
          id: '2',
          type: 'assignment',
          title: 'New Assignment Posted',
          description: 'Machine Learning Fundamentals - Due Jan 30',
          timestamp: '1 day ago',
          status: 'pending'
        },
        {
          id: '3',
          type: 'resource',
          title: 'New Learning Material',
          description: 'Python Advanced Tutorial Series',
          timestamp: '2 days ago'
        },
        {
          id: '4',
          type: 'announcement',
          title: 'Class Schedule Update',
          description: 'Friday session moved to virtual format',
          timestamp: '3 days ago'
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment': return FileText;
      case 'grade': return Star;
      case 'resource': return BookOpen;
      case 'announcement': return AlertCircle;
      default: return Activity;
    }
  };

  const getClassTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      case 'assessment': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Learner'}!
            </h1>
            <p className="text-lg text-primary-100">
              Ready to continue your learning journey?
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.progress}%</span>
            </div>
            <p className="text-sm text-primary-100">Overall Progress</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.completedAssignments}/{stats.totalAssignments}</span>
            </div>
            <p className="text-sm text-primary-100">Assignments</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.currentGrade}</span>
            </div>
            <p className="text-sm text-primary-100">Current Grade</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.upcomingClasses}</span>
            </div>
            <p className="text-sm text-primary-100">Upcoming Classes</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/portal/learning/schedule')}
                className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl transition-colors group"
              >
                <Calendar className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-blue-900">My Schedule</p>
              </button>

              <button
                onClick={() => navigate('/portal/learning/content')}
                className="bg-green-50 hover:bg-green-100 p-4 rounded-xl transition-colors group"
              >
                <BookOpen className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-green-900">Resources</p>
              </button>

              <button
                onClick={() => navigate('/portal/learning/monitoring')}
                className="bg-purple-50 hover:bg-purple-100 p-4 rounded-xl transition-colors group"
              >
                <CheckCircle className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-purple-900">Assessments</p>
              </button>

              <button
                onClick={() => navigate('/portal/learning/analytics')}
                className="bg-orange-50 hover:bg-orange-100 p-4 rounded-xl transition-colors group"
              >
                <BarChart3 className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-orange-900">Progress</p>
              </button>
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Classes</h2>
              <button
                onClick={() => navigate('/portal/learning/schedule')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {upcomingClasses.map((class_) => (
                <div key={class_.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{class_.title}</h3>
                      <p className="text-sm text-gray-600">{class_.instructor}</p>
                      <p className="text-xs text-gray-500">{new Date(class_.date).toLocaleDateString()} at {class_.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassTypeColor(class_.type)}`}>
                      {class_.type}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>

            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 truncate">{activity.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                    {activity.status && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.status}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievement Summary */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-yellow-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-500 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Achievements</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Assignments Completed</span>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-800">{stats.completedAssignments}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Current Streak</span>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-800">7 days</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/portal/learning/capstone')}
                className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                View Capstone Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;