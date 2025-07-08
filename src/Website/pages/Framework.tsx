import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import Logo from '../../components/Logo';

const Framework: React.FC = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Logo size="2xl" showText={true} textSize="3xl" className="justify-center" />
          </div>
          <p className="text-white text-xl">Loading Sales Capability Framework...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/kss11.jpg"
            alt="Students in learning environment"
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
                  <span className="text-white text-sm font-medium">Sales Capability Framework</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Understanding Sales
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Excellence
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-5xl leading-relaxed">
                Discover the structured framework that defines the skills, knowledge, and behaviors required by sales professionals to perform effectively and ethically.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-start">
                <a href="#framework">
                  <button className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-[3px] hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-1">
                    <span>Explore Framework</span>
                    <BookOpen className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
                <Link to="/programs">
                  <button className="group border-2 border-white text-white px-10 py-4 rounded-[3px] hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center space-x-3 text-lg font-semibold backdrop-blur-sm">
                    <ArrowRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>View Programs</span>
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

      {/* Sales Capability Framework */}
      <section id="framework" className="py-16 lg:py-24 bg-white">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-6 lg:mb-8">
              Understanding the Sales Capability Framework
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg lg:text-xl text-gray-600 mb-6 leading-relaxed">
                The Sales Capability Framework is a structured guide that defines the skills, knowledge, behaviors, and tools required by sales professionals to perform effectively and ethically. It supports personal growth, career advancement, and stronger business performance.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Unlike academic qualifications, which focus on theory and certification, this framework focuses on competence—the ability to apply knowledge and skills effectively in real-world sales situations.
              </p>
            </div>
          </div>

          {/* Competency Levels Table */}
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-8 text-center">
              Competency Levels: What They Mean
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Competency</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Learner Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">Level 1</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Basic</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Foundational skills for new salespeople—following instructions, understanding the sales process, and basic product knowledge.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">New entrants, graduates, solopreneurs (0–1 years' sales experience).</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">Level 2</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Intermediate</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Confidence handling sales independently, communicating value, managing pipeline, adapting to different customer types.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Early-career reps (1–5 years e.g., Telesales, retail, field sales).</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">Level 3</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Advanced</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Leading teams, strategic selling, building long-term accounts, influencing decisions, mentoring others.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Experienced account & relationship managers, BD leads (5–10 years).</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">Level 4</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Strategic</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Leading multi-regional teams, driving commercial strategy, stakeholder engagement, and advanced decision making.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Sales managers, regional leads (10–15 years).</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">Level 5</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Expert</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Designing sales systems, innovation in go-to-market strategies.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Commercial directors, senior executives (15+ years).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Four Quadrants */}
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-8 text-center">
              Four Quadrants of Sales Capability
            </h3>
            <p className="text-lg text-gray-600 text-center mb-10 max-w-3xl mx-auto">
              Each level is built across four capability areas:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 text-center hover:shadow-lg transition-shadow bg-white rounded-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Core</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Selling skills, techniques, planning, execution, strategic problem-solving, consultative selling.
                </p>
              </div>
              <div className="p-6 text-center hover:shadow-lg transition-shadow bg-white rounded-sm border border-gray-200">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-secondary-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Business</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Understanding markets, products, customers, commercial operations, financial acumen, data-driven strategies.
                </p>
              </div>
              <div className="p-6 text-center hover:shadow-lg transition-shadow bg-white rounded-sm border border-gray-200">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-accent-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Leadership</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Leading oneself and others, collaboration, team dynamics, leading teams, matrix management, change leadership.
                </p>
              </div>
              <div className="p-6 text-center hover:shadow-lg transition-shadow bg-white rounded-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Self</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Mindset, values, development, ethics, and resilience.
                </p>
              </div>
            </div>
            <p className="text-center text-gray-600 mt-8 max-w-4xl mx-auto">
              Each of these is broken down into capabilities, which in turn contain competencies specific to the role and level.
            </p>
          </div>

          {/* Program Overview */}
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-8 text-center">
              Overview: Industry-Agnostic Sales Training Programs
            </h3>
            <p className="text-lg text-gray-600 text-center mb-10 max-w-4xl mx-auto leading-relaxed">
              Kenya School of Sales offers industry-agnostic, competency-based training programs, each mapped to ISP-recognized standards. These programs are tailored for various levels of sales professionals, from foundational entrants to seasoned experts, facilitators and coaches. Each program delivers a blend of immersive learning experiences with structured outcomes for behavioral change, aligned with the four sales capability quadrants: Core, Business, Leadership, and Self.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Program Feature</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">What It Entails</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Why It Matters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Collaborative, Task-Based Learning</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Learners work together on real-life or simulated sales tasks such as prospecting, pitching, or pipeline planning.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Encourages peer learning, builds teamwork skills, and simulates real-world selling environments where collaboration is key.</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Strong Facilitation from Experienced Sales Professionals</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Industry-savvy trainers guide discussions, share personal stories, give contextual insights, and coach learners.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Learners benefit from relatable, experience-based advice—bridging the gap between theory and practice.</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Virtual, Physical, and Self-Paced Components</td>
                    <td className="px-6 py-4 text-sm text-gray-700">A blended learning model where learners join physical workshops, access recorded sessions, and complete assignments online.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Provides flexibility for different schedules and learning styles, while ensuring rich, interactive in-person engagement.</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">A Capstone Project that Demonstrates Practical Business Impact</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Final team or individual project applying all learned concepts to solve a business problem or simulate a sales process.</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Consolidates learning, reinforces practical application, and builds a portfolio piece that demonstrates real-world readiness.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary-600 to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full text-center px-6 sm:px-8 lg:px-12">
          <div>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 lg:mb-6">
              Ready to Apply This Framework?
            </h2>
            <p className="text-lg lg:text-xl text-gray-100 mb-8 lg:mb-10 max-w-3xl mx-auto">
              Explore our programs designed around this comprehensive sales capability framework.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
              <Link to="/programs">
                <button className="inline-flex items-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-sm shadow-xl transition-colors duration-200">
                  View Programs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link to="/about">
                <button className="inline-flex items-center border border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-sm shadow-lg transition-colors duration-200">
                  Learn About Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Framework; 