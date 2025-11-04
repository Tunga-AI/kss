import React from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Award, MessageSquare, Clock, AlertCircle, Loader2, CheckCircle, FileText, Mail, MapPin, Phone, User } from 'lucide-react';
import { useDashboard } from '../../../hooks/useDashboard';
import { useAuthContext } from '../../../contexts/AuthContext';
import RevenueChart from '../../../components/charts/RevenueChart';
import ProgramsChart from '../../../components/charts/ProgramsChart';
import EnrollmentChart from '../../../components/charts/EnrollmentChart';
import ActivityChart from '../../../components/charts/ActivityChart';
import LearnerDashboard from '../Learning/LearnerDashboard';

const Dashboard: React.FC = () => {
  const { stats, activities, charts, loading, error, refetch } = useDashboard();
  const { userProfile } = useAuthContext();

  // Show learner-specific dashboard for learners
  if (userProfile?.role === 'learner') {
    return <LearnerDashboard />;
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Create stats array from real data
  const statsData = stats ? [
    { 
      title: 'Total Students', 
      value: stats.totalStudents.toLocaleString(), 
      change: stats.studentChange, 
      icon: Users, 
      color: 'primary' 
    },
    { 
      title: 'Active Programs', 
      value: stats.activePrograms.toString(), 
      change: stats.programChange, 
      icon: BookOpen, 
      color: 'accent' 
    },
    { 
      title: 'Upcoming Short Programs', 
      value: stats.upcomingEvents.toString(), 
      change: stats.eventChange, 
      icon: Calendar, 
      color: 'secondary' 
    },
    { 
      title: 'Revenue (Month)', 
      value: formatCurrency(stats.monthlyRevenue), 
      change: stats.revenueChange, 
      icon: TrendingUp, 
      color: 'primary' 
    },
  ] : [];



  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-primary-600 text-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mr-2 sm:mr-3" />
            <span className="text-base sm:text-lg">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium">Error loading dashboard: {error}</span>
            </div>
            <button
              onClick={refetch}
              className="sm:ml-auto bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-700 w-fit"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Applicant Dashboard
  if (userProfile?.role === 'applicant') {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Section */}
        <div className="bg-primary-600 text-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Welcome, {userProfile.displayName}</h1>
              <p className="text-sm sm:text-base lg:text-lg text-primary-100">
                Track your application status and next steps
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-lg sm:rounded-xl w-fit">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Application Status */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-800">Application Status</h2>
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          </div>

          <div className="space-y-4">
            {/* Application Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-green-800">Application Submitted</span>
                </div>
                <p className="text-xs sm:text-sm text-green-700">Your application has been received and is under review.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-yellow-800">Under Review</span>
                </div>
                <p className="text-xs sm:text-sm text-yellow-700">Our admissions team is reviewing your application.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-gray-800">Admission Decision</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700">You will receive an email with the admission decision.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Next Steps</h2>
            <Award className="h-6 w-6 text-primary-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-blue-800">Check your email regularly</p>
                <p className="text-sm text-blue-700">We'll send updates about your application status</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-blue-800">Contact admissions if needed</p>
                <p className="text-sm text-blue-700">Call +254 xxx xxx xxx or email admissions@kenyaschoolofsales.co.ke</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Your Application</h2>
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-secondary-700 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{userProfile.organization}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-700 mb-3">Application Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Application ID:</span> APP-{userProfile.uid.slice(-6).toUpperCase()}</p>
                <p><span className="font-medium">Submitted:</span> {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Status:</span> <span className="text-yellow-600 font-medium">Under Review</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Learner Dashboard
  if (userProfile?.role === 'learner') {
    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {userProfile.displayName}</h1>
              <p className="text-lg text-primary-100">
                Continue your learning journey
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-800">Program Progress</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">7 out of 12 modules completed</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-800">Next Session</h3>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-secondary-800">Sales Fundamentals</p>
              <p className="text-sm text-gray-600">Tomorrow, 2:00 PM</p>
              <p className="text-sm text-gray-600">Room: Virtual Classroom A</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-800">Assignments Due</h3>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Customer Analysis</span>
                <span className="text-xs text-orange-600 font-medium">Due in 2 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Sales Pitch</span>
                <span className="text-xs text-red-600 font-medium">Due tomorrow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Recent Activities</h2>
            <MessageSquare className="h-6 w-6 text-primary-600" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">Module 7 Completed</p>
                <p className="text-sm text-green-700">Sales Negotiation Techniques - Score: 85%</p>
                <p className="text-xs text-green-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-blue-800">New Assignment Posted</p>
                <p className="text-sm text-blue-700">Customer Persona Development Workshop</p>
                <p className="text-xs text-blue-600">Yesterday</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600 mt-1" />
              <div>
                <p className="font-medium text-yellow-800">Upcoming Session Reminder</p>
                <p className="text-sm text-yellow-700">Don't forget about tomorrow's live session</p>
                <p className="text-xs text-yellow-600">3 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Quick Access</h2>
            <BookOpen className="h-6 w-6 text-primary-600" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-primary-600 mr-2" />
                <span className="font-medium text-secondary-800">Schedule</span>
              </div>
              <p className="text-sm text-gray-600">View upcoming sessions and events</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-primary-600 mr-2" />
                <span className="font-medium text-secondary-800">Assignments</span>
              </div>
              <p className="text-sm text-gray-600">Submit and track your assignments</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-primary-600 mr-2" />
                <span className="font-medium text-secondary-800">Classmates</span>
              </div>
              <p className="text-sm text-gray-600">Connect with other learners</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-primary-100">
              Welcome back! Here's what's happening at your institution today.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Revenue Trends</h2>
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
          <RevenueChart 
            data={charts?.revenueData || []} 
            loading={loading}
          />
        </div>

        {/* Programs Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Program Enrollment</h2>
            <BookOpen className="h-6 w-6 text-primary-600" />
          </div>
          <ProgramsChart 
            data={charts?.programData || []} 
            loading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Enrollment Trends */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Enrollment Trends</h2>
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <EnrollmentChart 
            data={charts?.enrollmentData || []} 
            loading={loading}
          />
        </div>

        {/* Activity Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Activity Overview</h2>
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
          <ActivityChart 
            data={charts?.activityData || []} 
            loading={loading}
          />
        </div>
      </div>


    </div>
  );
};

export default Dashboard;