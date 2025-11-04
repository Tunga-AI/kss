import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Users, BookOpen, Building2 } from 'lucide-react';
import Logo from '../../components/Logo';
import { useModal } from '../../contexts/ModalContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProgramsDropdownOpen, setIsProgramsDropdownOpen] = useState(false);
  const { openLeadModal } = useModal();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProgramsDropdownOpen) {
        const target = event.target as Element;
        // Only close if clicking outside the dropdown container
        const dropdownContainer = target.closest('.programs-dropdown-container');
        if (!dropdownContainer) {
          setIsProgramsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProgramsDropdownOpen]);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/framework', label: 'Framework' },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo
              size="lg"
              showText={false}
              textSize="xl"
              className="hover:opacity-80 transition-opacity duration-200 scale-100 sm:scale-125 lg:scale-150"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs xl:text-sm font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 ${
                  location.pathname === item.path
                    ? 'text-accent-400 border-b-2 border-accent-400 pb-1'
                    : 'text-primary-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* Our Programs Dropdown */}
            <div className="relative programs-dropdown-container">
              <button
                onClick={() => setIsProgramsDropdownOpen(!isProgramsDropdownOpen)}
                className="text-xs xl:text-sm font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 text-primary-600 flex items-center space-x-1"
              >
                <span>Our Programs</span>
                <ChevronDown className="h-3 w-3 xl:h-4 xl:w-4" />
              </button>

              {isProgramsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 xl:w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <Link
                    to="/events"
                    onClick={() => setIsProgramsDropdownOpen(false)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 block"
                  >
                    <Users className="h-5 w-5 text-accent-600" />
                    <p className="font-semibold text-secondary-800">Short Programs</p>
                  </Link>

                  <Link
                    to="/programs"
                    onClick={() => setIsProgramsDropdownOpen(false)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 block"
                  >
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    <p className="font-semibold text-secondary-800">Core Programs</p>
                  </Link>

                  <Link
                    to="/business"
                    onClick={() => setIsProgramsDropdownOpen(false)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 block"
                  >
                    <Building2 className="h-5 w-5 text-secondary-600" />
                    <p className="font-semibold text-secondary-800">Corporate Programs</p>
                  </Link>
                </div>
              )}
            </div>

            {/* Success Stories */}
            <Link
              to="/media"
              className={`text-xs xl:text-sm font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 ${
                location.pathname === '/media'
                  ? 'text-accent-400 border-b-2 border-accent-400 pb-1'
                  : 'text-primary-600'
              }`}
            >
              Success Stories
            </Link>

            {/* Contact */}
            <Link
              to="/contact"
              className={`text-xs xl:text-sm font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 ${
                location.pathname === '/contact'
                  ? 'text-accent-400 border-b-2 border-accent-400 pb-1'
                  : 'text-primary-600'
              }`}
            >
              Contact Us
            </Link>

            {/* Enroll Button */}
            <button
              onClick={() => openLeadModal('core')}
              className="bg-secondary-600 backdrop-blur-sm text-white px-4 xl:px-6 py-2 rounded-sm text-xs xl:text-sm font-bold uppercase tracking-wider hover:bg-secondary-700 transition-colors duration-200 border border-secondary-500"
            >
              Enroll
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-primary-600 hover:text-accent-400 transition-colors duration-200 p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-neutral-900/95 backdrop-blur-md border-t border-white/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 text-sm sm:text-base font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 hover:bg-white/10 rounded-sm ${
                    location.pathname === item.path
                      ? 'text-accent-400 bg-white/20'
                      : 'text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 space-y-2">
                <p className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">Our Programs:</p>

                <Link
                  to="/events"
                  className="block w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold bg-accent-600 text-white rounded-sm hover:bg-accent-700 transition-colors duration-200 border border-accent-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Short Programs
                </Link>

                <Link
                  to="/programs"
                  className="block w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors duration-200 border border-primary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Core Programs
                </Link>

                <Link
                  to="/business"
                  className="block w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold bg-secondary-600 text-white rounded-sm hover:bg-secondary-700 transition-colors duration-200 border border-secondary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Corporate Programs
                </Link>

                <Link
                  to="/media"
                  className="block px-3 py-2 text-sm sm:text-base font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 hover:bg-white/10 rounded-sm text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Success Stories
                </Link>

                <Link
                  to="/contact"
                  className="block px-3 py-2 text-sm sm:text-base font-bold uppercase tracking-wider transition-colors duration-200 hover:text-accent-400 hover:bg-white/10 rounded-sm text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact Us
                </Link>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      openLeadModal('core');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-3 py-2 text-xs sm:text-sm font-semibold bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors duration-200 border border-green-500"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </nav>
  );
};

export default Navbar;