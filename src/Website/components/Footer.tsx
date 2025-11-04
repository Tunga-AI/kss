import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Instagram } from 'lucide-react';
import Logo from '../../components/Logo';

// Custom TikTok icon since Lucide doesn't have it
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-800 text-white">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <Logo
                size="sm"
                showText={false}
                textSize="lg"
                className="text-white sm:text-xl lg:text-2xl"
              />
            </div>
            <p className="text-primary-100 text-xs sm:text-sm leading-relaxed">
              Empowering Africa's sales professionals with
              world-class education and industry-recognized qualifications.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a
                href="https://www.instagram.com/kenyaschoolofsales"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-accent-400 cursor-pointer transition-colors duration-200"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@kenyaschoolofsales"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-accent-400 cursor-pointer transition-colors duration-200"
              >
                <TikTokIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/kenya-school-of-sales/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-accent-400 cursor-pointer transition-colors duration-200"
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: 'Home', path: '/' },
                { label: 'Contact', path: '/contact' },
                { label: 'Portal', path: '/auth' }
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.path} className="text-primary-100 hover:text-accent-400 transition-colors duration-200 text-xs sm:text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Solutions</h3>
            <ul className="space-y-2">
              {[
                { label: 'Framework', path: '/framework' },
                { label: 'Programs', path: '/programs' },
                { label: 'Events', path: '/events' }
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.path} className="text-primary-100 hover:text-accent-400 transition-colors duration-200 text-xs sm:text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Contact Info</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-accent-400 flex-shrink-0" />
                <span className="text-primary-100 text-xs sm:text-sm">kss@cca.co.ke</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-accent-400 flex-shrink-0" />
                <span className="text-primary-100 text-xs sm:text-sm">+254 722 257 323</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-accent-400 flex-shrink-0" />
                <span className="text-primary-100 text-xs sm:text-sm">Westlands, Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4">
              <p className="text-primary-100 text-xs sm:text-sm text-center sm:text-left">
                © 2025 Kenya School of Sales. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                <a href="/media-consent" className="text-primary-100 hover:text-accent-400 transition-colors duration-200 text-xs sm:text-sm">
                  Media & Data Consent
                </a>
                <a href="/media-privacy" className="text-primary-100 hover:text-accent-400 transition-colors duration-200 text-xs sm:text-sm">
                  Media & Privacy Notice
                </a>
              </div>
            </div>
            <p className="text-primary-100 text-xs sm:text-sm text-center lg:text-right">
              Powered by Commercial Club of Africa and Yusudi
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;