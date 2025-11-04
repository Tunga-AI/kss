import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  UserPlus,
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Brain,
  Phone,
  MessageCircle,
  Menu,
  X,
  Camera,
  Calendar,
  Library,
  ClipboardList,
  Trophy,
  BarChart3,
  Award,
  Globe,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

interface SidebarProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
  onMobileMenuChange: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ expanded, onExpandedChange, mobileMenuOpen, onMobileMenuChange }) => {
  const location = useLocation();
  const { logout, userProfile, user } = useAuthContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get profile path based on user role
  const getProfilePath = (role: string) => {
    switch (role) {
      case 'applicant':
        return '/portal/admissions/my-application';
      case 'learner':
      case 'facilitator':
        return '/portal/learners/my-profile';
      case 'instructor':
        return '/portal/instructors/my-profile';
      case 'staff':
      case 'admin':
        return '/portal/staff/my-profile';
      default:
        return '/portal/profile'; // Use a unique path to avoid conflicts
    }
  };

  // Check user roles
  const isInstructor = userProfile?.role === 'instructor';
  const isLearner = userProfile?.role === 'learner';
  const isFacilitator = userProfile?.role === 'facilitator';
  const isAdmin = userProfile?.role === 'admin';
  const isStaff = userProfile?.role === 'staff';

  // Define menu items for each role
  const allMenuItems = [
    { path: '/portal/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'staff', 'instructor', 'learner', 'applicant', 'facilitator'] },
    { path: getProfilePath(userProfile?.role || ''), icon: User, label: 'My Profile', roles: ['admin', 'staff', 'instructor', 'learner', 'applicant', 'facilitator'] },
    { path: '/portal/admissions', icon: UserPlus, label: 'Admissions', roles: ['admin', 'staff'] },
    { path: '/portal/programs', icon: BookOpen, label: 'Programs', roles: ['admin', 'staff', 'instructor', 'learner', 'applicant', 'facilitator'] },
    { path: '/portal/learners', icon: Users, label: 'Learners', roles: ['admin', 'staff', 'instructor', 'learner', 'facilitator'] },
    { path: '/portal/customers', icon: Phone, label: 'Sales CRM', roles: ['admin', 'staff'] },
    { path: '/portal/staff', icon: UserCheck, label: 'Our Team', roles: ['admin', 'staff'] },
    { path: '/portal/instructors', icon: Award, label: 'Instructors', roles: ['admin', 'staff'] },
    { path: '/portal/users', icon: Shield, label: 'All Users', roles: ['admin'] },
    { path: '/portal/learning', icon: GraduationCap, label: 'Learning', roles: ['admin', 'staff', 'instructor'] },
    { path: '/portal/learning/schedule', icon: Calendar, label: 'My Schedule', roles: ['instructor'] },
    { path: '/portal/learning/resources', icon: Library, label: 'Content Library', roles: ['instructor'] },
    { path: '/portal/opportunities', icon: Briefcase, label: 'Jobs', roles: ['admin', 'staff', 'instructor', 'learner', 'facilitator'] },
    { path: '/portal/communication', icon: MessageSquare, label: 'Notifications', roles: ['admin', 'staff', 'instructor', 'learner', 'applicant', 'facilitator'] },
    { path: '/portal/whatsapp', icon: MessageCircle, label: 'WhatsApp', roles: ['admin', 'staff'] },
    { path: '/portal/media', icon: Camera, label: 'Media', roles: ['admin', 'staff'] },
    { path: '/portal/ai', icon: Brain, label: 'AI Assistant', roles: ['admin', 'staff'] },
    { path: '/portal/settings', icon: Settings, label: 'Settings', roles: ['admin', 'staff'] },
  ];

  // Filter menu items based on user role  
  let menuItems: typeof allMenuItems;
  
  if (!user) {
    // No user logged in - show nothing
    menuItems = [];
  } else if (!userProfile) {
    // User is logged in but userProfile hasn't loaded yet - show basic items
    menuItems = allMenuItems.filter(item =>
      ['Dashboard', 'My Profile', 'Programs'].includes(item.label)
    );
  } else {
    // User has a profile - filter based on role
    const userRole = userProfile.role;
    
    if (userRole === 'applicant') {
      // Applicant - limited access
      menuItems = allMenuItems.filter(item =>
        ['Dashboard', 'My Profile', 'Programs', 'Notifications'].includes(item.label)
      );
    } else if (isLearner) {
      // Learners should use LearnerSidebar instead, but fallback to basic items
      menuItems = allMenuItems.filter(item =>
        ['Dashboard', 'My Profile', 'Programs', 'Learners', 'Jobs', 'Notifications'].includes(item.label)
      );
    } else if (isFacilitator) {
      // Facilitators should use FacilitatorSidebar instead, but fallback to basic items
      menuItems = allMenuItems.filter(item =>
        ['Dashboard', 'My Profile', 'Programs', 'Learners', 'Jobs', 'Notifications'].includes(item.label)
      );
    } else if (isInstructor) {
      // Instructors - focused on teaching and learner management
      menuItems = allMenuItems.filter(item =>
        ['Dashboard', 'My Profile', 'Learning', 'My Schedule', 'Content Library', 'Programs', 'Learners', 'Jobs', 'Notifications'].includes(item.label)
      );
    } else if (isAdmin) {
      // Admin - full access to everything
      menuItems = allMenuItems.filter(item => item.roles.includes('admin'));
    } else if (isStaff) {
      // Regular staff - access based on role permissions but excluding some admin-only items
      menuItems = allMenuItems.filter(item => item.roles.includes('staff') && !['All Users'].includes(item.label));
    } else {
      // Fallback - use role-based filtering
      menuItems = allMenuItems.filter(item => item.roles.includes(userRole));
    }
  }

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
        className={`fixed left-0 top-0 h-full bg-primary-600 shadow-xl ${mounted ? 'transition-all duration-300' : ''} z-40 flex flex-col ${
          // On mobile: responsive width, on desktop: responsive width based on expanded state
          mobileMenuOpen ? 'w-64 sm:w-72' : 'w-64 lg:w-16'
        } ${
          // On mobile: slide in/out based on mobileMenuOpen, on desktop: always visible
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop responsive width
          expanded ? 'lg:w-64 xl:w-72' : ''
        }`}
        onMouseEnter={() => window.innerWidth >= 1024 && onExpandedChange(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && onExpandedChange(false)}
      >
      {/* Logo */}
      <div className="p-3 sm:p-4 border-b border-primary-500 flex-shrink-0">
        <Logo
          size={mobileMenuOpen || expanded ? "sm" : "xs"}
          showText={false}
          className="text-white sm:text-lg"
        />
      </div>

      {/* Navigation - Scrollable */}
      <nav className="mt-4 sm:mt-6 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <div className="space-y-1 px-3 sm:px-4 pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onMobileMenuChange(false)}
                className={`flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 min-h-[44px] rounded-lg transition-all duration-200 group touch-manipulation ${
                  isActive
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-white hover:bg-primary-500 hover:text-white active:bg-primary-400'
                }`}
              >
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${
                  isActive ? 'text-primary-600' : 'text-white group-hover:text-white'
                }`} />
                {(mobileMenuOpen || expanded) && (
                  <span className="text-sm sm:text-base font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Website & Logout */}
      <div className="p-3 sm:p-4 border-t border-primary-500 flex-shrink-0 space-y-2">
        <Link
          to="/"
          onClick={() => onMobileMenuChange(false)}
          className="flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 w-full min-h-[44px] text-white hover:bg-primary-500 hover:text-white active:bg-primary-400 rounded-lg transition-all duration-200 group touch-manipulation"
        >
          <Globe className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-white group-hover:text-white" />
          {(mobileMenuOpen || expanded) && <span className="text-sm sm:text-base font-medium">Website</span>}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 w-full min-h-[44px] text-white hover:bg-primary-500 hover:text-white active:bg-primary-400 rounded-lg transition-all duration-200 group touch-manipulation"
        >
          <LogOut className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-white group-hover:text-white" />
          {(mobileMenuOpen || expanded) && <span className="text-sm sm:text-base font-medium">Logout</span>}
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;