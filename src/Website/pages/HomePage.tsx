import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star, Zap, Shield, Globe } from 'lucide-react';
import Logo from '../../components/Logo';

const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          <p className="text-white text-xl">Loading Kenya School of Sales...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Expert-Led Programs',
      description: 'Learn from industry professionals with real-world experience and cutting-edge knowledge.',
      image: '/kss.jpg',
    },
    {
      icon: Users,
      title: 'Collaborative Learning',
      description: 'Connect with peers, engage in group projects, and build lasting professional networks.',
      image: '/kss2.jpg',
    },
    {
      icon: Award,
      title: 'Industry Recognition',
      description: 'Earn certificates and badges recognized by leading companies and institutions.',
      image: '/kss3.jpg',
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Access career services, job placement assistance, and ongoing professional development.',
      image: '/kss4.jpg',
    },
  ];

  const programs = [
    {
      title: 'Sales Foundation Level',
      category: 'Professional Development',
      duration: '12 weeks',
      price: 'KSh 45,000',
      image: '/kss5.jpg',
      description: 'Master the fundamentals of professional selling with globally recognized methodologies.',
      features: ['Sales Process', 'Customer Psychology', 'Negotiation Skills', 'Portfolio Building'],
    },
    {
      title: 'Advanced Sales Leadership',
      category: 'Leadership',
      duration: '16 weeks',
      price: 'KSh 75,000',
      image: '/kss6.jpg',
      description: 'Develop strategic selling capabilities and team leadership skills for management roles.',
      features: ['Strategic Selling', 'Team Management', 'Sales Analytics', 'Change Leadership'],
    },
    {
      title: 'Commercial Excellence',
      category: 'Executive',
      duration: '20 weeks',
      price: 'KSh 125,000',
      image: '/kss7.jpg',
      description: 'Executive-level program for commercial strategy and organizational transformation.',
      features: ['Commercial Strategy', 'Market Analysis', 'Executive Presence', 'ROI Optimization'],
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Ochieng',
      role: 'Sales Manager at Safaricom',
      image: '/kss8.jpg',
      quote: 'Kenya School of Sales transformed my career completely. The structured approach and expert mentorship helped me advance to management level.',
      rating: 5,
    },
    {
      name: 'Michael Wanjiku',
      role: 'Business Development Lead',
      image: '/kss9.jpg',
      quote: 'The practical skills I learned at KSS directly contributed to a 60% increase in our sales performance within 6 months.',
      rating: 5,
    },
    {
      name: 'Grace Muthoni',
      role: 'Commercial Director at KCB Bank',
      image: '/kss10.jpg',
      quote: 'The supportive community and world-class curriculum at KSS gave me the confidence to lead commercial transformation.',
      rating: 5,
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Fast-Track Learning',
      description: 'Accelerated programs designed to get you sales-ready in weeks, not years.',
      image: '/kss11.jpg',
    },
    {
      icon: Shield,
      title: 'Career Guarantee',
      description: 'We\'re so confident in our training that we offer career advancement support.',
      image: '/kss2.jpg',
    },
    {
      icon: Globe,
      title: 'Global Standards',
      description: 'Join a worldwide community of sales professionals with internationally recognized qualifications.',
      image: '/kss4.jpg',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss.jpg"
            alt="Students learning together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-secondary-900/90"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative w-full px-6 sm:px-8 lg:px-12 pb-16 lg:pb-20">
          <div className="w-full">
            <div className="text-white">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-[3px] border border-white/20 mb-6">
                  <BookOpen className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">Africa's Premier Sales School</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Sales Career
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Join Africa's first professional sales school and achieve your commercial goals with globally recognized qualifications.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-start">
                <Link to="/programs">
                  <button className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-[3px] hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1">
                    <span>Get Started</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/programs">
                  <button className="group border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold backdrop-blur-sm">
                    <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Explore Programs</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
              Why Choose Kenya School of Sales?
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto">
              We're committed to providing exceptional sales education that prepares you for success 
              in today's competitive commercial landscape.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-100 leading-relaxed text-sm lg:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
              Featured Programs
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto">
              Discover our most popular programs designed to give you the sales skills 
              employers are looking for.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-8 lg:mb-12">
            {programs.map((program, index) => (
              <div 
                key={index} 
                className="relative overflow-hidden h-96 lg:h-[28rem] hover:shadow-xl transition-all duration-500 rounded-sm bg-white"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={program.image}
                  alt={program.title}
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-sm font-medium">
                      {program.category}
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-sm font-medium">
                      {program.duration}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-3">
                      {program.title}
                    </h3>
                    <p className="text-gray-100 mb-4 text-sm lg:text-base leading-relaxed">
                      {program.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {program.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-200">
                          <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl lg:text-2xl font-bold text-accent-300">{program.price}</span>
                      <button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-sm text-sm transition-colors duration-200">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/programs">
              <button className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-sm transition-colors duration-200">
                View All Programs
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
              The KSS Advantage
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto">
              Experience the difference that sets us apart from other educational platforms.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="relative overflow-hidden h-64 lg:h-72 hover:shadow-xl transition-all duration-500 rounded-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={benefit.image}
                  alt={benefit.title}
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-sm w-fit mb-4">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-100 leading-relaxed text-sm lg:text-base">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
              Success Stories
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto">
              Hear from our graduates who have transformed their careers and achieved their commercial dreams.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative overflow-hidden h-80 lg:h-96 hover:shadow-xl transition-all duration-500 rounded-sm bg-white"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/40 to-transparent"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                  <div className="flex justify-end">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-accent-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-100 leading-relaxed text-sm lg:text-base italic mb-4">
                      "{testimonial.quote}"
                    </p>
                    <h3 className="text-lg font-semibold mb-1">{testimonial.name}</h3>
                    <p className="text-sm text-primary-200">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary-600 to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full text-center px-6 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
              Ready to Start Your Sales Journey?
            </h2>
            <p className="text-lg lg:text-xl text-gray-100 mb-8 lg:mb-10 max-w-3xl mx-auto">
              Join thousands of successful graduates who have transformed their careers with Kenya School of Sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
              <Link to="/programs">
                <button className="inline-flex items-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-sm shadow-xl transition-colors duration-200">
                  Enroll Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link to="/contact">
                <button className="inline-flex items-center border border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-sm shadow-lg transition-colors duration-200">
                  Schedule a Call
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;