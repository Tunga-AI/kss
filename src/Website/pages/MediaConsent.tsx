import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Shield, 
  Users, 
  Clock, 
  Mail, 
  CheckCircle, 
  XCircle,
  FileText,
  Eye,
  Heart
} from 'lucide-react';

const MediaConsent: React.FC = () => {

  const faqItems = [
    {
      question: "Why does KSS take photos and videos during training?",
      answer: "We document sessions to celebrate our learners, share real stories of transformation, and raise awareness about the power of structured sales capability development. These visuals may appear on our website, social media platforms, brochures, or reports."
    },
    {
      question: "Who controls and processes this data?",
      answer: "All photographs, videos, and testimonials are collected and processed by Kenya School of Sales (KSS), which acts as the Data Controller."
    },
    {
      question: "How long will my photo or video be used?",
      answer: "We use media content for up to 3 years unless you ask us to delete it sooner."
    },
    {
      question: "What will you never do with my image?",
      answer: "We will never sell your image, use it in misleading or inappropriate contexts, or share it with third parties for unrelated advertising."
    },
    {
      question: "Do I have to appear in photos/videos to attend?",
      answer: "No. You can opt out. We'll provide you with a special badge, sticker, or lanyard that lets our media team know to avoid capturing your image."
    },
    {
      question: "How can I withdraw my consent later?",
      answer: "You can email us at hello@kss.or.ke at any time. We'll promptly remove your content from future use and, where possible, archive or delete existing visuals."
    },
    {
      question: "What if I'm not sure yet?",
      answer: "We respect your choice. If you're unsure, choose \"I DO NOT CONSENT\" on the registration form for now. You can always change your preference later."
    },
    {
      question: "Is this compliant with Kenya's Data Protection Act?",
      answer: "Yes. We've aligned our media and data practices with the Data Protection Act (2019) and designed this experience to be informed, clear, optional, and respectful of your rights."
    },
    {
      question: "What other data do you collect about me?",
      answer: "We only collect what's needed for your learning journey—such as your name, contact details, assessments, and training participation. This data is used internally to improve your experience and track program progress."
    },
    {
      question: "Who do I contact with concerns?",
      answer: "Write to us at hello@kss.or.ke and our Data Protection team will get back to you within 5 working days."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 bg-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-md mb-6">
                <Camera className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Media & Data Consent</span>
              </div>
              
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Share the KSS Experience
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                At the Kenya School of Sales (KSS), we capture photos, videos, and testimonials during training sessions to showcase the powerful learning experiences our community creates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-gray-50 rounded-xl p-8 lg:p-12 mb-12">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Eye className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                    Our Commitment to Privacy
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    We are committed to respecting your privacy and complying with the Data Protection Act (2019). 
                    Before proceeding, please read and select your preferred consent option below.
                  </p>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-secondary-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-secondary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Who is collecting this data?</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Kenya School of Sales (KSS), the data controller responsible for the collection and use of your images and likeness for promotional and documentation purposes.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-accent-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-accent-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Why are we collecting this data?</h3>
                </div>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li>• To document the KSS experience for internal and marketing purposes</li>
                  <li>• To inspire other professionals through stories of growth and learning</li>
                  <li>• To demonstrate the impact of structured sales capability programs</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-3">
                  This processing is based on your freely given, informed, and specific consent.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">How long will the photos/videos be used?</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Your images may be used for up to 3 years from the date of capture, unless you withdraw your consent earlier.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-neutral-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-neutral-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Your rights under the DPA include:</h3>
                </div>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li>• Requesting access to or copies of your data (images/videos)</li>
                  <li>• Requesting correction or deletion of your image(s)</li>
                  <li>• Withdrawing consent at any time by emailing: hello@kss.or.ke</li>
                </ul>
              </div>
            </div>

            {/* Consent Options */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 lg:p-12 mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
                Choose one option below
              </h2>
              <p className="text-gray-600 text-center mb-8">
                (Please tick one box during admission)
              </p>

              <div className="space-y-6">
                <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        I CONSENT
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        I consent to the use of my photographs, video footage, or testimonials taken during the KSS program for KSS promotional and documentation purposes, as outlined above. I understand this consent is voluntary and can be withdrawn at any time.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-red-300 transition-colors duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        I DO NOT CONSENT
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        I do not consent to the use of my photographs, video footage, or testimonials. KSS will provide visible badges/stickers during the program to help staff and photographers respect my preference.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Closing Statement */}
            <div className="bg-primary-50 rounded-xl p-8 lg:p-12 mb-12">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Building Trust Together
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                We are proud to build a learning environment that is bold, human-centered, and compliant. 
                Thank you for helping us grow a culture of trust and transparency.
              </p>
            </div>

            {/* FAQ Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 lg:p-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 text-center">
                KSS Privacy & Media Consent FAQ
              </h2>
              
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {index + 1}. {item.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-8 lg:p-12 mt-12">
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
                  Contact our Data Protection team at{' '}
                  <a href="mailto:hello@kss.or.ke" className="text-primary-600 hover:text-primary-700 font-medium">
                    hello@kss.or.ke
                  </a>
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We'll get back to you within 5 working days.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default MediaConsent; 