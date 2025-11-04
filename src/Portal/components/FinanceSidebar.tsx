import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Receipt,
  Users,
  Building,
  Building2,
  GraduationCap,
  CreditCard,
  FileText,
  TrendingUp,
  Menu,
  X,
  Award,
  LogOut,
  Globe,
  Calculator,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

interface FinanceSidebarProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
  onMobileMenuChange: (open: boolean) => void;
}

const FinanceSidebar: React.FC<FinanceSidebarProps> = ({
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
      console.log('💰 FinanceSidebar mounted for user:', userProfile?.displayName, 'Role:', userProfile?.role);
    }
  }, [userProfile]);

  // Finance-specific menu items
  const financeMenuItems = [
    {
      path: '/portal/finance',
      icon: BarChart3,
      label: 'Dashboard',
      description: 'Financial overview and analytics',
      exact: true
    },
    {
      path: '/portal/finance/admissions',
      icon: Building,
      label: 'Admissions',
      description: 'Admission fees and payments'
    },
    {
      path: '/portal/finance/learners',
      icon: GraduationCap,
      label: 'Learners',
      description: 'Tuition and learner finances'
    },
    {
      path: '/portal/finance/alumni',
      icon: Award,
      label: 'Alumni',
      description: 'Alumni financial records'
    },
    {
      path: '/portal/finance/instructors',
      icon: Users,
      label: 'Instructors',
      description: 'Instructor payments and compensation'
    },
    {
      path: '/portal/finance/bills',
      icon: Receipt,
      label: 'Bills & Expenses',
      description: 'Organizational expenses and bills'
    },
    {
      path: '/portal/finance/corporates',
      icon: Building2,
      label: 'Corporates',
      description: 'Corporate client management and contracts'
    },
    {
      path: '/portal/finance/transactions',
      icon: CreditCard,
      label: 'All Transactions',
      description: 'Complete transaction history'
    },
    {
      path: '/portal/finance/reports',
      icon: FileText,
      label: 'Financial Reports',
      description: 'Reports and analytics'
    }
  ];

  // Quick access items for finance users
  const quickAccessItems = [
    { path: '/portal/finance/transactions', icon: CreditCard, label: 'Recent Transactions' },
    { path: '/portal/finance/reports', icon: PieChart, label: 'Generate Report' },
    { path: '/portal/finance', icon: TrendingUp, label: 'Financial Overview' }
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => onMobileMenuChange(!mobileMenuOpen)}
        className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 lg:hidden bg-primary-600 text-white p-2 sm:p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200"
      >
        {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
      </button>

      {/* Finance Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-primary-600 to-primary-700 shadow-xl ${mounted ? 'transition-all duration-300' : ''} z-40 flex flex-col ${
          mobileMenuOpen ? 'w-64 sm:w-72' : 'w-64 lg:w-16'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          expanded ? 'lg:w-64 xl:w-72' : ''
        }`}
        onMouseEnter={() => window.innerWidth >= 1024 && onExpandedChange(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && onExpandedChange(false)}
      >
        {/* Logo */}
        <div className="p-4 border-b border-primary-500 flex-shrink-0">
          <Logo
            size={mobileMenuOpen || expanded ? "sm" : "xs"}
            showText={mobileMenuOpen || expanded}
            textSize="lg"
            className="text-white"
          />
          {(mobileMenuOpen || expanded) && (
            <div className="mt-2">
              <p className="text-primary-100 text-sm font-medium">Finance Center</p>
              <p className="text-primary-200 text-xs">{userProfile?.displayName}</p>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className="mt-4 sm:mt-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1 px-2 sm:px-3 pb-4">
            {/* Financial Summary (when expanded) */}
            {(mobileMenuOpen || expanded) && (
              <div className="mb-6 px-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calculator className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">Quick Stats</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-primary-100">
                      <span>Monthly Revenue</span>
                      <span className="text-white font-medium">KES 2.5M</span>
                    </div>
                    <div className="flex justify-between text-xs text-primary-100">
                      <span>Outstanding</span>
                      <span className="text-white font-medium">KES 450K</span>
                    </div>
                    <div className="flex justify-between text-xs text-primary-100">
                      <span>Collected Today</span>
                      <span className="text-white font-medium">KES 180K</span>
                    </div>
                    <div className="w-full bg-primary-500 rounded-full h-1.5 mt-2">
                      <div className="bg-white h-1.5 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <div className="text-xs text-primary-200 text-center">72% collection rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Finance Navigation */}
            {financeMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onMobileMenuChange(false)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-white text-primary-600 shadow-lg'
                      : 'text-white hover:bg-primary-500 hover:bg-opacity-50 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                    isActive ? 'text-primary-600' : 'text-white group-hover:text-white'
                  }`} />
                  {(mobileMenuOpen || expanded) && (
                    <div className="flex-1 min-w-0">
                      <span className="text-sm sm:text-base font-medium truncate block">{item.label}</span>
                      {item.description && (
                        <span className={`text-xs truncate block ${
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

            {/* Quick Actions Section */}
            {(mobileMenuOpen || expanded) && (
              <div className="mt-6 px-1">
                <h3 className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {quickAccessItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => onMobileMenuChange(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-500 hover:bg-opacity-30 transition-colors text-sm"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Status Indicators */}
            {(mobileMenuOpen || expanded) && (
              <div className="mt-6 px-1">
                <h3 className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-3">
                  Payment Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-primary-100">Paid Today</span>
                    </div>
                    <span className="text-white font-medium">23</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-yellow-400" />
                      <span className="text-primary-100">Pending</span>
                    </div>
                    <span className="text-white font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      <span className="text-primary-100">Overdue</span>
                    </div>
                    <span className="text-white font-medium">3</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Support & Navigation */}
        <div className="p-3 border-t border-primary-500 flex-shrink-0 space-y-2">
          {/* Finance Help */}
          {(mobileMenuOpen || expanded) && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-3 rounded-lg border border-white border-opacity-20 mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Finance Help</span>
              </div>
              <p className="text-primary-100 text-xs">Need assistance with financial tasks?</p>
              <button className="mt-2 text-xs text-white hover:text-primary-100 underline">
                Contact Finance Team
              </button>
            </div>
          )}

          <Link
            to="/"
            onClick={() => onMobileMenuChange(false)}
            className="flex items-center space-x-3 px-3 py-3 w-full text-white hover:bg-primary-500 hover:bg-opacity-50 hover:text-white rounded-lg transition-all duration-200 group"
          >
            <Globe className="h-5 w-5 flex-shrink-0 text-white group-hover:text-white" />
            {(mobileMenuOpen || expanded) && <span className="font-medium">Main Website</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-3 w-full text-white hover:bg-primary-500 hover:bg-opacity-50 hover:text-white rounded-lg transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-white group-hover:text-white" />
            {(mobileMenuOpen || expanded) && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default FinanceSidebar;