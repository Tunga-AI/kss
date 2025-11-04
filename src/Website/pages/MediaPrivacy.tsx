import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Shield, 
  Users, 
  Mail, 
  CheckCircle, 
  XCircle,
  FileText,
  Eye,
  Heart,
  Mic,
  AlertCircle
} from 'lucide-react';

const MediaPrivacy: React.FC = () => {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 bg-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-md mb-6">
                <Camera className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Media & Privacy Notice</span>
              </div>
              
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Smile, You're in a KSS Experience!
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                We may be recording and taking photos during this session. To keep things transparent and respectful, here's what you need to know.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Key Information Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 text-center">
                <div className="bg-secondary-100 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <Users className="h-6 w-6 text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Who is collecting this data?</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kenya School of Sales (KSS)
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 text-center">
                <div className="bg-accent-100 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <FileText className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why are we doing this?</h3>
                <p className="text-gray-600 leading-relaxed">
                  To celebrate our learners, share impactful moments, and grow a vibrant sales community. Some photos and videos may be used for marketing, training, or reporting.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 text-center">
                <div className="bg-primary-100 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Privacy Matters</h3>
                <p className="text-gray-600 leading-relaxed">
                  We comply with the Kenya Data Protection Act (2019). Your privacy and dignity matter to us.
                </p>
              </div>
            </div>

            {/* Choice Section */}
            <div className="bg-gray-50 rounded-xl p-8 lg:p-12 mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
                What's your choice?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 lg:p-8 border-2 border-green-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">You can opt in (join freely)</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    If you're comfortable with being photographed or recorded, no action is needed. We'll capture the amazing moments of your learning journey.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 lg:p-8 border-2 border-red-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">You can opt out (no problem!)</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Ask for a badge/sticker at the registration desk if you prefer NOT to appear in any photos or videos. We'll respect your choice completely.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-primary-50 rounded-xl p-8 lg:p-12 mb-12">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Need help or have questions?
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Speak to any of our staff members during the session - they're here to help and ensure your comfort.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Email us anytime:{' '}
                    <a href="mailto:hello@kss.or.ke" className="text-primary-600 hover:text-primary-700 font-medium">
                      hello@kss.or.ke
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Verbal Consent Script */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 lg:p-12 mb-12">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-accent-100 p-3 rounded-lg">
                  <Mic className="h-6 w-6 text-accent-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Verbal Consent Script
                </h2>
              </div>
              <p className="text-gray-600 mb-4 font-medium">
                For MC/Facilitator to Say at Start of Session
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 lg:p-8">
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    <strong>"Before we begin today's session, a quick note on privacy and media use:"</strong>
                  </p>
                  
                  <p>
                    At KSS, we like to capture powerful moments from our training—photos, short videos, testimonials—so we can share the amazing stories happening in this room with others who want to build stronger sales teams.
                  </p>
                  
                  <p>
                    <strong>But your consent matters.</strong>
                  </p>
                  
                  <ul className="space-y-2 ml-4">
                    <li>• If you're okay with being in photos or videos, no action is needed.</li>
                    <li>• If you'd prefer NOT to appear in any content, just let our team at the registration desk know, and they'll give you a sticker or badge. We'll make sure our photographers are aware.</li>
                    <li>• Also—if at any point you change your mind, just email us at hello@kss.or.ke and we'll remove anything we've shared.</li>
                  </ul>
                  
                  <p>
                    <strong>Thanks for helping us create a respectful and empowering learning environment.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">What We Do</h3>
                </div>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li>• Capture learning moments and success stories</li>
                  <li>• Share inspiring content with the community</li>
                  <li>• Document program impact and outcomes</li>
                  <li>• Respect your privacy choices completely</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">What We Never Do</h3>
                </div>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li>• Sell your image to third parties</li>
                  <li>• Use content in misleading ways</li>
                  <li>• Ignore your privacy preferences</li>
                  <li>• Share content without proper consent</li>
                </ul>
              </div>
            </div>

            {/* Compliance Statement */}
            <div className="bg-neutral-50 rounded-xl p-8 lg:p-12 mb-12">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-neutral-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-neutral-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Legal Compliance
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Protection Act (2019)</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We fully comply with Kenya's Data Protection Act (2019) and have designed our media practices to be informed, clear, optional, and respectful of your rights.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You have the right to withdraw consent, request deletion of your content, and access any data we hold about you. Contact us at hello@kss.or.ke for any requests.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-8 lg:p-12">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Questions or Concerns?
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Contact our team at{' '}
                  <a href="mailto:hello@kss.or.ke" className="text-primary-600 hover:text-primary-700 font-medium">
                    hello@kss.or.ke
                  </a>
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We're here to ensure your learning experience is comfortable and respectful.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default MediaPrivacy; 