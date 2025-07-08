import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  UserPlus,
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

interface SidebarProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ expanded, onExpandedChange }) => {
  const location = useLocation();
  const { logout, userProfile, user } = useAuthContext();

  // Define menu items for each role
  const allMenuItems = [
    { path: '/portal/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'staff', 'learner'] },
    { path: '/portal/profile', icon: User, label: 'My Profile', roles: ['admin', 'staff', 'learner', 'applicant'] },
    { path: '/portal/admissions', icon: UserPlus, label: 'Admissions', roles: ['admin', 'staff', 'applicant'] },
    { path: '/portal/programs', icon: BookOpen, label: 'Programs', roles: ['admin', 'staff', 'learner', 'applicant'] },
    { path: '/portal/events', icon: Calendar, label: 'Events', roles: ['admin', 'staff', 'learner', 'applicant'] },
    { path: '/portal/learners', icon: Users, label: 'Learners', roles: ['admin', 'staff', 'learner'] },
    { path: '/portal/staff', icon: UserCheck, label: 'Staff', roles: ['admin', 'staff', 'learner'] },
    { path: '/portal/users', icon: Shield, label: 'Users', roles: ['admin', 'staff'] },
    { path: '/portal/learning', icon: GraduationCap, label: 'Learning', roles: ['admin', 'staff', 'learner'] },
    { path: '/portal/recruitment', icon: Briefcase, label: 'Recruitment', roles: ['admin', 'staff'] },
    { path: '/portal/finance', icon: Wallet, label: 'Finance', roles: ['admin', 'staff', 'learner'] },
    { path: '/portal/communication', icon: MessageSquare, label: 'Communication', roles: ['admin', 'staff', 'learner', 'applicant'] },
    { path: '/portal/settings', icon: Settings, label: 'Settings', roles: ['admin', 'staff', 'learner'] },
  ];

  // Filter menu items based on user role  
  let menuItems: typeof allMenuItems;
  
  if (!user) {
    // No user logged in - show nothing
    menuItems = [];
  } else if (!userProfile) {
    // User is logged in but userProfile hasn't loaded yet - show basic items
    menuItems = allMenuItems.filter(item => 
      ['Dashboard', 'My Profile', 'Programs', 'Events'].includes(item.label)
    );
  } else {
    // User has a profile - filter based on role
    const userRole = userProfile.role;
    
    if (userRole === 'applicant') {
      // Applicant - limited access
      menuItems = allMenuItems.filter(item => 
        ['My Profile', 'Admissions', 'Programs', 'Events', 'Communication'].includes(item.label)
      );
    } else {
      // All other roles (admin, staff, learner) - full access based on role
      menuItems = allMenuItems.filter(item => item.roles.includes(userRole));
    }
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-primary-600 shadow-xl transition-all duration-300 z-40 ${
        expanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      {/* Logo */}
      <div className="p-4 border-b border-primary-500">
        <Logo 
          size={expanded ? "sm" : "xs"}
          showText={false}
          textSize="lg"
          className="text-white"
        />
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
        <div className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-primary-600'
                    : 'text-white hover:bg-primary-500 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-primary-600' : 'text-white group-hover:text-white'
                }`} />
                {expanded && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-primary-500">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-3 w-full text-white hover:bg-primary-500 hover:text-white rounded-lg transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-white group-hover:text-white" />
          {expanded && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;