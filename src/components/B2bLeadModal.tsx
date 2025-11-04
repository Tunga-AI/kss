import React, { useState } from 'react';
import { 
  Building2, User, Mail, Phone, Target, Calendar, 
  X, CheckCircle
} from 'lucide-react';
import { FirestoreService } from '../services/firestore';

interface B2bLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const B2bLeadModal: React.FC<B2bLeadModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    position: '',
    companySize: '',
    industry: '',
    trainingNeeds: '',
    budget: '',
    timeline: '',
    source: 'business_page',
    notes: '',
    mediaConsent: false,
    mediaPrivacy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate B2B lead number
      const generateB2bLeadNumber = async () => {
        try {
          const result = await FirestoreService.getAll('b2bleads');
          let maxId = 0;
          
          if (result.success && result.data) {
            const leads = result.data as any[];
            leads.forEach(lead => {
              if (lead.leadNumber && lead.leadNumber.startsWith('B2B')) {
                const numStr = lead.leadNumber.substring(3);
                const num = parseInt(numStr);
                if (!isNaN(num) && num > maxId) {
                  maxId = num;
                }
              }
            });
          }
          
          const nextId = maxId + 1;
          return `B2B${nextId.toString().padStart(4, '0')}`;
        } catch (error) {
          console.error('Error generating B2B lead number:', error);
          return 'B2B0001';
        }
      };

      // Prepare lead data
      const leadData = {
        ...formData,
        leadNumber: await generateB2bLeadNumber(),
        programType: 'corporate',
        submittedDate: new Date().toISOString(),
        status: 'new',
        priority: 'medium'
      };

      // Save to Firestore
      const result = await FirestoreService.create('b2bleads', leadData);
      
      if (result.success) {
        console.log('B2B Lead saved successfully:', result.id);
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'Failed to save B2B lead');
      }
    } catch (error) {
      console.error('Error submitting B2B lead:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      position: '',
      companySize: '',
      industry: '',
      trainingNeeds: '',
      budget: '',
      timeline: '',
      source: 'business_page',
      notes: '',
      mediaConsent: false,
      mediaPrivacy: false
    });
    setIsSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">
            Thank You!
          </h2>
          
          <p className="text-secondary-600 mb-6">
            Your B2B training inquiry has been submitted successfully. Our team will contact you within 24 hours to discuss your requirements.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-secondary-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• Initial consultation call</li>
              <li>• Team capability assessment</li>
              <li>• Customized proposal</li>
              <li>• Program design & timeline</li>
            </ul>
          </div>
          
          <button
            onClick={handleClose}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Corporate Sales Training Inquiry
              </h2>
              <p className="text-primary-100">
                Tell us about your organization and training needs. We'll get back to you within 24 hours.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <Building2 className="h-6 w-6 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-secondary-800">Company Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Technology, Healthcare, Manufacturing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData(prev => ({ ...prev, companySize: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-secondary-800">Contact Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter contact person name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., HR Manager, Sales Director"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Training Requirements */}
          <div className="mt-8">
            <div className="flex items-center mb-6">
              <Target className="h-6 w-6 text-primary-600 mr-3" />
              <h3 className="text-lg font-semibold text-secondary-800">Training Requirements</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Training Needs
                </label>
                <textarea
                  value={formData.trainingNeeds}
                  onChange={(e) => setFormData(prev => ({ ...prev, trainingNeeds: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe your training needs, challenges, and goals..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Budget Range
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select budget range</option>
                  <option value="Under 100K">Under KES 100,000</option>
                  <option value="100K-500K">KES 100,000 - 500,000</option>
                  <option value="500K-1M">KES 500,000 - 1,000,000</option>
                  <option value="1M-5M">KES 1,000,000 - 5,000,000</option>
                  <option value="5M+">Over KES 5,000,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select timeline</option>
                  <option value="Immediate">Immediate (within 1 month)</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6+ months">6+ months</option>
                  <option value="Planning">Still planning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional information or specific requirements..."
            />
          </div>

          {/* Media Consent and Privacy Checkboxes */}
          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mediaConsent}
                  onChange={(e) => setFormData(prev => ({ ...prev, mediaConsent: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  required
                />
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Media Consent:</span> I consent to the use of my photographs, video footage, or testimonials taken during KSS programs for promotional and documentation purposes. I understand this consent is voluntary and can be withdrawn at any time by emailing{' '}
                  <a href="mailto:hello@kss.or.ke" className="text-primary-600 hover:text-primary-700 underline">
                    hello@kss.or.ke
                  </a>
                  .{' '}
                  <a href="/media-consent" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                    Learn more about media consent
                  </a>
                </div>
              </label>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mediaPrivacy}
                  onChange={(e) => setFormData(prev => ({ ...prev, mediaPrivacy: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  required
                />
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Privacy Notice:</span> I acknowledge that I have read and understood the KSS Media & Privacy Notice. I understand that photos and videos may be taken during sessions and I can opt out by requesting a badge/sticker at registration.{' '}
                  <a href="/media-privacy" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                    Read the full privacy notice
                  </a>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit B2B Training Inquiry'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-4 border border-gray-300 text-secondary-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default B2bLeadModal; 