import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, ArrowRight, Star } from 'lucide-react';
import Logo from '../../components/Logo';

const ContactPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // Simulate loading time for smooth UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Logo size="2xl" showText={true} textSize="3xl" className="justify-center" />
          </div>
          <p className="text-white text-xl">Loading Contact Information...</p>
        </div>
      </div>
    );
  }



  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: ['+254 700 123 456', '+254 711 987 654'],
      description: 'Call us during business hours',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['info@kenyaschoolofsales.com', 'admissions@kenyaschoolofsales.com'],
      description: 'We respond within 24 hours',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: MapPin,
      title: 'Location',
      details: ['Westlands, Nairobi', 'Mombasa Road, Nairobi'],
      description: 'Visit our campuses',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Mon - Fri: 8:00 AM - 6:00 PM', 'Sat: 9:00 AM - 2:00 PM'],
      description: 'Sunday: Closed',
      color: 'bg-orange-100 text-orange-600'
    }
  ];



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
      {/* Full Image Hero Section with Integrated Navigation */}
      <section className="relative h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/kss11.jpg" 
            alt="Contact Kenya School of Sales" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/60 to-primary-700/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-end justify-start h-full px-6 sm:px-8 lg:px-12 pb-24">
          <div className="w-full text-left">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                <MessageSquare className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-white text-sm font-medium">We're Here to Help</span>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Get in
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Touch
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
              Have questions about our courses or need guidance on your sales career? 
              We're here to help you take the next step.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-start">
              <button className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-[3px] hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1">
                <span>Send Message</span>
                <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold backdrop-blur-sm">
                <Phone className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Call Us Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-24 bg-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-[3px] mb-6 mx-auto">
              <Phone className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-primary-700 font-medium">Contact Information</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">How to Reach Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Multiple ways to connect with our team</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => {
              const images = ['/kss7.jpg', '/kss8.jpg', '/kss9.jpg', '/kss10.jpg'];
              return (
                <div key={index} className="group relative h-80 text-center rounded-[3px] shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img 
                      src={images[index]} 
                      alt={info.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-[3px] flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-colors">
                      <info.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-4">{info.title}</h3>
                    <div className="space-y-2 mb-4">
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-200 font-medium text-sm">{detail}</p>
                      ))}
                    </div>
                    <p className="text-xs text-gray-300">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-[3px] mb-6 mx-auto">
              <MessageSquare className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-primary-700 font-medium">FAQ</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Quick answers to common questions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-[3px] p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-[3px] mb-6 mx-auto">
              <Star className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-primary-700 font-medium">Testimonials</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">What Our Clients Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Hear from those who've experienced our service</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-[3px] shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.message}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-primary-600">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-12 max-w-3xl mx-auto">
            Don't wait any longer. Contact us today and take the first step towards transforming your sales career.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="bg-white text-primary-600 px-10 py-4 rounded-[3px] hover:bg-gray-100 transition-colors font-semibold text-lg flex items-center justify-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Call Now</span>
            </button>
            <button className="border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-primary-700 transition-colors text-lg font-semibold flex items-center justify-center space-x-2">
              <ArrowRight className="w-5 h-5" />
              <span>View Courses</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;