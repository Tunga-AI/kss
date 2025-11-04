import React from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, ArrowRight, Star, Users } from 'lucide-react';
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

const ContactPage: React.FC = () => {



  const faqs = [
    {
      question: 'How do I apply for a course?',
      answer: 'You can apply online through our website, visit our campus, or call our admissions team. We\'ll guide you through the entire process.'
    },
    {
      question: 'What are the payment options?',
      answer: 'We accept M-Pesa, bank transfers, and cash payments. We also offer flexible payment plans for most courses.'
    },
    {
      question: 'Do you offer corporate training?',
      answer: 'Yes, we provide customized training programs for organizations. Contact our corporate training team for more information.'
    },
    {
      question: 'Are there any prerequisites for courses?',
      answer: 'Most of our foundational courses have no prerequisites. Advanced courses may require prior sales experience or completion of prerequisite courses.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Wanjiku',
      role: 'Sales Manager',
      company: 'Tech Solutions Ltd',
      message: 'The support team was incredibly helpful throughout my enrollment process. Highly recommend!',
      rating: 5
    },
    {
      name: 'John Kamau',
      role: 'Business Owner',
      company: 'Kamau Enterprises',
      message: 'Quick response time and professional service. They answered all my questions promptly.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen bg-white pt-20 pb-8 lg:pb-12">
        <div className="px-6 sm:px-8 lg:px-12 h-full flex items-center">
          {/* Background Image Container */}
          <div className="relative w-full h-[95%] overflow-hidden rounded-md shadow-2xl">
            <img
              src="/contact us.jpg"
              alt="Contact Kenya School of Sales"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end px-6 sm:px-8 lg:px-12 pb-12">
              <div className="max-w-2xl">
                <div className="text-white">
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Get in
                    <span className="block" style={{ color: '#4590AD' }}>
                      Touch
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    Have questions about our courses or need guidance on your sales career? We're here to help.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                      Send Message
                    </button>
                    <button className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-md transition-colors duration-200 font-semibold">
                      Call Us Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                How to Reach Us
              </h2>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Multiple ways to connect with our team. We're here to help with all your questions.
              </p>
            </div>

            {/* Phone */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-primary-600">
              <div className="absolute top-6 left-6">
                <div className="bg-primary-500 p-3 rounded-md shadow-lg">
                  <Phone className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <h3 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Phone</h3>
                <div className="space-y-1 mb-2">
                  <p className="text-white/90 text-xs lg:text-sm font-medium">+254 722 257 323</p>
                </div>
                <p className="text-white/80 text-xs">Call us during business hours</p>
              </div>
            </div>

            {/* Email */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-secondary-600">
              <div className="absolute top-6 left-6">
                <div className="bg-secondary-500 p-3 rounded-md shadow-lg">
                  <Mail className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <h3 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Email</h3>
                <div className="space-y-1 mb-2">
                  <p className="text-white/90 text-xs lg:text-sm font-medium">kss@cca.co.ke</p>
                </div>
                <p className="text-white/80 text-xs">We respond within 24 hours</p>
              </div>
            </div>

            {/* Location */}
            <div className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-md bg-accent-600">
              <div className="absolute top-6 left-6">
                <div className="bg-accent-500 p-3 rounded-md shadow-lg">
                  <MapPin className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <h3 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Location</h3>
                <div className="space-y-1 mb-2">
                  <p className="text-white/90 text-xs lg:text-sm font-medium">Westlands, Nairobi, Kenya</p>
                </div>
                <p className="text-white/80 text-xs">Visit our campus</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Quick answers to common questions about our courses and services.
              </p>
            </div>
            
            {/* FAQ Cards */}
            {faqs.slice(0, 3).map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 hover:shadow-xl transition-all duration-500">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3 line-clamp-2">
                  {faq.question}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* First card - Text content */}
            <div className="bg-white rounded-md shadow-lg p-6 lg:p-8 flex flex-col justify-center h-64 lg:h-72">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                What Our Clients Say
              </h2>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                Hear from those who've experienced our exceptional service and support.
              </p>
            </div>
            
            {/* Testimonial Cards */}
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-between h-64 lg:h-72 hover:shadow-xl transition-all duration-500">
                <div>
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs lg:text-sm text-gray-700 italic mb-3 line-clamp-3">
                    "{testimonial.message}"
                  </p>
                </div>
                <div>
                  <div className="text-xs lg:text-sm font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-xs text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-primary-600">{testimonial.company}</div>
                </div>
              </div>
            ))}
            
            {/* CTA Card for fourth slot */}
            <div className="bg-primary-600 rounded-md shadow-lg p-4 lg:p-6 flex flex-col justify-center h-64 lg:h-72 text-white">
              <h3 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-sm lg:text-base text-primary-100 leading-relaxed mb-4">
                Join thousands of satisfied students and transform your sales career today.
              </p>
              <button className="bg-white text-primary-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors duration-200">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default ContactPage;