import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  Calendar,
  BookOpen,
  ClipboardList,
  Trophy,
  BarChart3,
  Banknote,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Globe,
  GraduationCap,
  FileText,
  CheckCircle,
  Award,
  Users,
  Phone,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

interface LearnerSidebarProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
  onMobileMenuChange: (open: boolean) => void;
}

const LearnerSidebar: React.FC<LearnerSidebarProps> = ({
  expanded,
  onExpandedChange,
  mobileMenuOpen,
  onMobileMenuChange
}) => {
  const location = useLocation();
  const { logout, userProfile } = useAuthContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  React.useEffect(() => {
    if (userProfile) {
      console.log('🎓 LearnerSidebar mounted for user:', userProfile?.displayName, 'Role:', userProfile?.role);
      console.log('🎓 LearnerSidebar: Confirmed learner role detected');
    }
  }, [userProfile]);

  // Learner-specific menu items
  const menuItems = [
    { path: '/portal/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/portal/learners/my-profile', icon: User, label: 'My Profile' },
    {
      path: '/portal/learning/cohorts',
      icon: Calendar,
      label: 'My Schedule',
      description: 'Class schedules and sessions'
    },
    {
      path: '/portal/learning/content',
      icon: FileText,
      label: 'Content Library',
      description: 'Learning resources and materials'
    },
    {
      path: '/portal/learning/monitoring',
      icon: ClipboardList,
      label: 'Assessments',
      description: 'Quizzes, assignments, and evaluations'
    },
    {
      path: '/portal/learning/capstone',
      icon: Trophy,
      label: 'Capstone Projects',
      description: 'Final competency projects'
    },
    {
      path: '/portal/learning/analytics',
      icon: BarChart3,
      label: 'My Progress',
      description: 'Performance tracking and analytics'
    },
    { path: '/portal/programs', icon: BookOpen, label: 'Programs' },
    { path: '/portal/learners', icon: Users, label: 'My Cohort' },
    { path: '/portal/opportunities', icon: GraduationCap, label: 'Job Opportunities' },
    { path: '/portal/finance/my-finances', icon: Banknote, label: 'My Finances' },
    { path: '/portal/communication', icon: MessageSquare, label: 'Notifications' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile Menu Button - Touch optimized */}
      <button
        onClick={() => onMobileMenuChange(!mobileMenuOpen)}
        className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 lg:hidden bg-primary-600 text-white min-w-[44px] min-h-[44px] p-3 sm:p-3.5 rounded-full shadow-lg hover:bg-primary-700 active:scale-95 transition-all duration-200 flex items-center justify-center touch-manipulation"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => onMobileMenuChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-primary-600 to-primary-700 shadow-xl ${mounted ? 'transition-all duration-300' : ''} z-40 flex flex-col ${
          // On mobile: always full width when open, on desktop: responsive width based on expanded state
          mobileMenuOpen ? 'w-72' : 'w-72 lg:w-16'
        } ${
          // On mobile: slide in/out based on mobileMenuOpen, on desktop: always visible
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop responsive width
          expanded ? 'lg:w-72' : ''
        }`}
        onMouseEnter={() => window.innerWidth >= 1024 && onExpandedChange(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && onExpandedChange(false)}
      >
        {/* Logo */}
        <div className="p-3 sm:p-4 border-b border-primary-500 flex-shrink-0">
          <Logo
            size={mobileMenuOpen || expanded ? "sm" : "xs"}
            showText={mobileMenuOpen || expanded}
            textSize="lg"
            className="text-white"
          />
          {(mobileMenuOpen || expanded) && (
            <div className="mt-2">
              <p className="text-primary-100 text-sm sm:text-base font-medium">Learning Portal</p>
              <p className="text-primary-200 text-xs sm:text-sm">{userProfile?.displayName}</p>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className="mt-4 sm:mt-6 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className="space-y-1 px-3 sm:px-4 pb-4">
            {/* Quick Stats Section */}
            {(mobileMenuOpen || expanded) && (
              <div className="mb-6 px-3">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
                  <h3 className="text-white text-sm font-semibold mb-3">Quick Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-primary-100">Progress</span>
                      <span className="text-white font-medium">75%</span>
                    </div>
                    <div className="w-full bg-primary-500 rounded-full h-1.5">
                      <div className="bg-white h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-primary-100">Assignments</span>
                      <span className="text-white font-medium">8/12</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Navigation */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                             (item.path.includes('/learning/') && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onMobileMenuChange(false)}
                  className={`flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 min-h-[44px] rounded-lg transition-all duration-200 group touch-manipulation ${
                    isActive
                      ? 'bg-white text-primary-600 shadow-lg'
                      : 'text-white hover:bg-primary-500 hover:bg-opacity-50 hover:text-white active:bg-primary-400'
                  }`}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${
                    isActive ? 'text-primary-600' : 'text-white group-hover:text-white'
                  }`} />
                  {(mobileMenuOpen || expanded) && (
                    <div className="flex-1 min-w-0">
                      <span className="text-sm sm:text-base font-medium truncate block">{item.label}</span>
                      {item.description && (
                        <span className={`text-xs sm:text-sm truncate block ${
                          isActive ? 'text-primary-500' : 'text-primary-200 group-hover:text-primary-100'
                        }`}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  )}
                  {isActive && (mobileMenuOpen || expanded) && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                  )}
                </Link>
              );
            })}

            {/* Learning Resources Section */}
            {(mobileMenuOpen || expanded) && (
              <div className="mt-6 px-3">
                <h3 className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-3">
                  Learning Tools
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/portal/learning/resources"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-500 hover:bg-opacity-30 transition-colors text-sm"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Resource Library</span>
                  </Link>
                  <Link
                    to="/portal/learning/cohorts"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-500 hover:bg-opacity-30 transition-colors text-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Class Calendar</span>
                  </Link>
                  <Link
                    to="/portal/learning/monitoring"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-500 hover:bg-opacity-30 transition-colors text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Quick Assessment</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Support & Logout */}
        <div className="p-3 sm:p-4 border-t border-primary-500 flex-shrink-0 space-y-2">
          {/* Support Contact */}
          {(mobileMenuOpen || expanded) && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-white border-opacity-20 mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                <span className="text-white text-sm sm:text-base font-medium">Need Help?</span>
              </div>
              <p className="text-primary-100 text-xs sm:text-sm">Contact support for assistance</p>
              <button className="mt-2 text-xs sm:text-sm text-white hover:text-primary-100 underline min-h-[32px] touch-manipulation">
                Get Support
              </button>
            </div>
          )}

          <Link
            to="/"
            onClick={() => onMobileMenuChange(false)}
            className="flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 w-full min-h-[44px] text-white hover:bg-primary-500 hover:bg-opacity-50 hover:text-white active:bg-primary-400 rounded-lg transition-all duration-200 group touch-manipulation"
          >
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-white group-hover:text-white" />
            {(mobileMenuOpen || expanded) && <span className="text-sm sm:text-base font-medium">Main Website</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 w-full min-h-[44px] text-white hover:bg-primary-500 hover:bg-opacity-50 hover:text-white active:bg-primary-400 rounded-lg transition-all duration-200 group touch-manipulation"
          >
            <LogOut className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-white group-hover:text-white" />
            {(mobileMenuOpen || expanded) && <span className="text-sm sm:text-base font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default LearnerSidebar;