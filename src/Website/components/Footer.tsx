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
    <footer className="bg-primary-800 text-white safe-area-bottom">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4 sm:space-y-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <Logo
                size="sm"
                showText={false}
                textSize="lg"
                className="text-white sm:text-xl lg:text-2xl"
              />
            </div>
            <p className="text-primary-100 text-sm sm:text-base leading-relaxed">
              Empowering Africa's sales professionals with
              world-class education and industry-recognized qualifications.
            </p>
            <div className="flex space-x-4 sm:space-x-5">
              <a
                href="https://www.instagram.com/kenyaschoolofsales"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-accent-400 active:text-accent-500 cursor-pointer transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-6 w-6 sm:h-7 sm:w-7" />
              </a>
              <a
                href="https://www.tiktok.com/@kenyaschoolofsales"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-accent-400 active:text-accent-500 cursor-pointer transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Follow us on TikTok"
              >
                <TikTokIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              </a>
              <a
                href="https://www.linkedin.com/company/kenya-school-of-sales/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-accent-400 active:text-accent-500 cursor-pointer transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Connect with us on LinkedIn"
              >
                <Linkedin className="h-6 w-6 sm:h-7 sm:w-7" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: 'Home', path: '/' },
                { label: 'Contact', path: '/contact' },
                { label: 'Portal', path: '/auth' }
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="inline-block text-primary-100 hover:text-accent-400 active:text-accent-500 transition-colors duration-200 text-sm sm:text-base py-1 min-h-[32px] touch-manipulation"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold">Solutions</h3>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: 'Framework', path: '/framework' },
                { label: 'Programs', path: '/programs' },
                { label: 'Events', path: '/events' }
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="inline-block text-primary-100 hover:text-accent-400 active:text-accent-500 transition-colors duration-200 text-sm sm:text-base py-1 min-h-[32px] touch-manipulation"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold">Contact Info</h3>
            <div className="space-y-3 sm:space-y-4">
              <a
                href="mailto:kss@cca.co.ke"
                className="flex items-center space-x-3 text-primary-100 hover:text-accent-400 active:text-accent-500 transition-colors py-1 min-h-[32px] touch-manipulation"
              >
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-accent-400 flex-shrink-0" />
                <span className="text-sm sm:text-base">kss@cca.co.ke</span>
              </a>
              <a
                href="tel:+254722257323"
                className="flex items-center space-x-3 text-primary-100 hover:text-accent-400 active:text-accent-500 transition-colors py-1 min-h-[32px] touch-manipulation"
              >
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-accent-400 flex-shrink-0" />
                <span className="text-sm sm:text-base">+254 722 257 323</span>
              </a>
              <div className="flex items-center space-x-3 py-1 min-h-[32px]">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-accent-400 flex-shrink-0" />
                <span className="text-primary-100 text-sm sm:text-base">Westlands, Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-8 sm:mt-10 pt-6 sm:pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0 gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-5">
              <p className="text-primary-100 text-sm sm:text-base text-center sm:text-left">
                © 2025 Kenya School of Sales. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
                <a
                  href="/media-consent"
                  className="text-primary-100 hover:text-accent-400 active:text-accent-500 transition-colors duration-200 text-sm sm:text-base py-1 min-h-[32px] touch-manipulation"
                >
                  Media & Data Consent
                </a>
                <a
                  href="/media-privacy"
                  className="text-primary-100 hover:text-accent-400 active:text-accent-500 transition-colors duration-200 text-sm sm:text-base py-1 min-h-[32px] touch-manipulation"
                >
                  Media & Privacy Notice
                </a>
              </div>
            </div>
            <p className="text-primary-100 text-sm sm:text-base text-center lg:text-right">
              Powered by Commercial Club of Africa and Yusudi
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;