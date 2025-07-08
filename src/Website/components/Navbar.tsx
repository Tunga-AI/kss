import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../../components/Logo';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/framework', label: 'Framework' },
    { path: '/programs', label: 'Programs' },
    { path: '/events', label: 'Events' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo 
              size="xl"
              showText={false}
              textSize="2xl"
              className="hover:opacity-80 transition-opacity duration-200 scale-150"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold uppercase tracking-wider transition-colors duration-200 hover:text-yellow-400 ${
                  location.pathname === item.path 
                    ? 'text-yellow-400 border-b-2 border-yellow-400 pb-1' 
                    : 'text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/auth"
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-sm font-bold uppercase tracking-wider hover:bg-white/30 transition-colors duration-200 border border-white/30"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-yellow-400 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-md border-t border-white/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 text-base font-bold uppercase tracking-wider transition-colors duration-200 hover:text-yellow-400 hover:bg-white/10 rounded-sm ${
                    location.pathname === item.path 
                      ? 'text-yellow-400 bg-white/20' 
                      : 'text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/auth"
                className="block px-3 py-2 text-base font-bold uppercase tracking-wider bg-white/20 text-white rounded-sm hover:bg-white/30 transition-colors duration-200 mt-4 border border-white/30"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;