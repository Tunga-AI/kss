import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { JobApplicationService } from '../services/jobApplicationService';
import { FirestoreService } from '../services/firestore';

interface Job {
  id: string;
  title: string;
  organizationName?: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salaryMin?: number;
  salaryMax?: number;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onApplicationSubmitted: () => void;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({ 
  isOpen, 
  onClose, 
  job, 
  onApplicationSubmitted 
}) => {
  const { user, userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const tabs = [
    { id: 'profile', label: 'Profile Review', icon: User },
    { id: 'application', label: 'Application', icon: FileText },
    { id: 'submit', label: 'Submit', icon: Send }
  ];

  useEffect(() => {
    if (isOpen && user?.email) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      if (!user?.email) {
        setMessage({ type: 'error', text: 'User email not found' });
        return;
      }
      
      const result = await JobApplicationService.getLearnerProfileData(user.email);
      if (result.success && result.data) {
        setProfileData(result.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!user || !profileData) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const applicationData = {
        jobId: job.id,
        coverLetter,
        additionalNotes
      };

      const result = await JobApplicationService.createApplication(
        user.uid,
        user.email!,
        profileData.displayName || `${profileData.firstName} ${profileData.lastName}`,
        applicationData,
        profileData
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Application submitted successfully!' });
        onApplicationSubmitted();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to submit application' });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setMessage({ type: 'error', text: 'Failed to submit application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCoverLetter = () => {
    if (!profileData) return;
    
    const organizationName = job.organizationName || 'your organization';

    const template = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${organizationName}. With my background in ${profileData.currentJobTitle || 'professional experience'} and ${profileData.salesExperience ? 'sales experience' : 'diverse skill set'}, I am excited about the opportunity to contribute to your team.

${profileData.keyAchievements ? `Key achievements in my career include:
${profileData.keyAchievements}` : ''}

${profileData.learningGoals ? `My learning goals align with this opportunity:
${profileData.learningGoals}` : ''}

I am particularly drawn to ${organizationName} because of its reputation and the opportunity to grow in ${job.location}. My skills in ${profileData.skills?.slice(0, 3).join(', ') || 'various areas'} would be valuable assets to your team.

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${organizationName}'s continued success.

Thank you for considering my application.

Best regards,
${profileData.firstName} ${profileData.lastName}`;

    setCoverLetter(template);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply for Position</h2>
            <p className="text-gray-600">{job.title} at {job.organizationName || 'Unknown Organization'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 border-l-4 ${
            message.type === 'success' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 pt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6" style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Profile Review Tab */}
              {activeTab === 'profile' && profileData && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Profile Review</h3>
                    <p className="text-blue-800">
                      Please review your profile information that will be included with your application.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profileData.firstName} {profileData.lastName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profileData.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profileData.phoneNumber || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Position</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profileData.currentJobTitle || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Organization</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profileData.currentOrganisation || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profileData.skills?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profileData.skills.map((skill: string, index: number) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            'No skills listed'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
                    <div className="space-y-3">
                      {profileData.workExperience?.length > 0 ? (
                        profileData.workExperience.map((exp: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{exp.jobTitle}</h4>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                              {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}
                            </p>
                            {exp.achievements && (
                              <p className="text-sm text-gray-700 mt-2">{exp.achievements}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-gray-600">
                          No work experience listed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <div className="space-y-3">
                      {profileData.education?.length > 0 ? (
                        profileData.education.map((edu: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                            <p className="text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">
                              {edu.fieldOfStudy} | {edu.startDate} - {edu.isCurrentStudy ? 'Present' : edu.endDate}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-gray-600">
                          No education listed
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setActiveTab('application')}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      Next: Application
                    </button>
                  </div>
                </div>
              )}

              {/* Application Tab */}
              {activeTab === 'application' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Application Details</h3>
                    <p className="text-yellow-800">
                      Write a compelling cover letter and add any additional information to support your application.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                      <button
                        onClick={generateCoverLetter}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Generate Template
                      </button>
                    </div>
                    <textarea
                      rows={12}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Write your cover letter here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                    <textarea
                      rows={4}
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Any additional information you'd like to include..."
                    />
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Back: Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      Next: Submit
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Tab */}
              {activeTab === 'submit' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Submit</h3>
                    <p className="text-green-800">
                      Review your application summary and submit when ready.
                    </p>
                  </div>

                  {/* Application Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                                                 <div>
                           <p className="font-medium text-gray-900">Position</p>
                           <p className="text-gray-600">{job.title} at {job.organizationName || 'Unknown Organization'}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Applicant</p>
                          <p className="text-gray-600">
                            {profileData?.firstName} {profileData?.lastName} ({profileData?.email})
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Cover Letter</p>
                          <p className="text-gray-600">
                            {coverLetter ? `${coverLetter.substring(0, 100)}...` : 'No cover letter provided'}
                          </p>
                        </div>
                      </div>
                      
                      {additionalNotes && (
                        <div className="flex items-start space-x-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Additional Notes</p>
                            <p className="text-gray-600">
                              {additionalNotes.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveTab('application')}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Back: Application
                    </button>
                    <button
                      onClick={handleSubmitApplication}
                      disabled={isSubmitting}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal; 