import React from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Award, DollarSign, MessageSquare, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Total Students', value: '2,847', change: '+12%', icon: Users, color: 'primary' },
    { title: 'Active Programs', value: '24', change: '+3', icon: BookOpen, color: 'accent' },
    { title: 'Upcoming Events', value: '8', change: '+2', icon: Calendar, color: 'secondary' },
    { title: 'Revenue (Month)', value: '$48,250', change: '+8%', icon: DollarSign, color: 'primary' },
  ];

  const recentActivities = [
    { type: 'enrollment', message: 'New student enrolled in Computer Science program', time: '2 hours ago' },
    { type: 'event', message: 'Science Fair 2025 scheduled for March 15th', time: '4 hours ago' },
    { type: 'payment', message: 'Payment received from John Doe - $1,250', time: '6 hours ago' },
    { type: 'staff', message: 'Dr. Sarah Johnson added to Biology department', time: '1 day ago' },
    { type: 'communication', message: 'Reminder sent to 150 students about exam schedule', time: '1 day ago' },
  ];

  const quickActions = [
    { title: 'Add New Student', description: 'Enroll a new student', icon: Users, color: 'primary' },
    { title: 'Create Event', description: 'Schedule an event', icon: Calendar, color: 'accent' },
    { title: 'Send Message', description: 'Communicate with students', icon: MessageSquare, color: 'secondary' },
    { title: 'Generate Report', description: 'View analytics', icon: TrendingUp, color: 'primary' },
  ];

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
          {stats.map((stat, index) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-secondary-800 mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'enrollment' ? 'bg-primary-100' :
                  activity.type === 'event' ? 'bg-accent-100' :
                  activity.type === 'payment' ? 'bg-green-100' :
                  activity.type === 'staff' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  {activity.type === 'enrollment' && <Users className="h-4 w-4 text-primary-600" />}
                  {activity.type === 'event' && <Calendar className="h-4 w-4 text-accent-600" />}
                  {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-600" />}
                  {activity.type === 'staff' && <Award className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'communication' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-secondary-800 font-medium">{activity.message}</p>
                  <div className="flex items-center mt-1 text-sm text-secondary-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-secondary-800 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className={`w-full p-4 text-left rounded-lg border-2 border-transparent hover:border-gray-200 transition-all duration-200 group ${
                    action.color === 'primary' ? 'hover:bg-primary-50' :
                    action.color === 'accent' ? 'hover:bg-accent-50' :
                    'hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      action.color === 'primary' ? 'bg-primary-100 group-hover:bg-primary-200' :
                      action.color === 'accent' ? 'bg-accent-100 group-hover:bg-accent-200' :
                      'bg-secondary-100 group-hover:bg-secondary-200'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        action.color === 'primary' ? 'text-primary-600' :
                        action.color === 'accent' ? 'text-accent-600' :
                        'text-secondary-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-800">{action.title}</h3>
                      <p className="text-sm text-secondary-600">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;