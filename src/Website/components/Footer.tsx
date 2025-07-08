import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import Logo from '../../components/Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white">
      <div className="px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Logo 
                size="md"
                showText={true}
                textSize="2xl"
                className="text-white"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Kenya School of Sales - Empowering Africa's sales professionals with 
              world-class education and industry-recognized qualifications.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: 'About Us', path: '/about' },
                { label: 'Programs', path: '/programs' },
                { label: 'Events', path: '/events' },
                { label: 'Contact', path: '/contact' },
                { label: 'Privacy Policy', path: '#' },
                { label: 'Terms of Service', path: '#' }
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.path} className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2">
              {['Sales Foundation', 'Advanced Leadership', 'Commercial Excellence', 'Coaching & Mentoring', 'Corporate Training', 'Professional Certification'].map((service) => (
                <li key={service}>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-300 text-sm">info@kenyaschoolofsales.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-300 text-sm">+254 700 123 456</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-300 text-sm">Westlands, Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Kenya School of Sales. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Powered by Yusudi - Transforming sales education in Africa
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;