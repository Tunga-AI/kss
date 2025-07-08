import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter, Plus, Eye, CheckCircle, XCircle, Clock, Users, TrendingUp, Edit, X, FileText, Copy, Trash2, Download, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { FirestoreService, ProgramService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface Applicant {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  programId: string;
  currentJobTitle?: string;
  currentOrganisation?: string;
  salesExperience?: string;
  keyAchievements?: string;
  learningGoals?: string;
  spokenToRep?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'not_paid';
  amountPaid?: number;
  confirmationCode?: string;
  paymentMethod?: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
  submittedDate: string;
  feedback?: { date: string; message: string; author: string }[];
  cohort?: string;
  admittedProgram?: string;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  type: 'approve' | 'reject';
  applicant: Applicant | null;
}

interface LetterTemplate {
  id: string;
  title: string;
  type: 'acceptance' | 'rejection' | 'payment_reminder' | 'interview_invitation' | 'document_request' | 'custom';
  subject: string;
  content: string;
  variables: string[];
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
}

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<LetterTemplate>) => void;
  template: LetterTemplate | null;
  isEditing: boolean;
}

interface CommitteeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  specialization?: string;
  status: 'active' | 'inactive';
  committeeRole: 'chair' | 'senior_reviewer' | 'reviewer' | 'junior_reviewer';
  reviewedApplications: number;
  averageScore: number;
  joinedDate: string;
}

interface ApplicationFeedback {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName: string;
  score: number; // 1-10 scale
  comments: string;
  recommendation: 'approve' | 'reject' | 'needs_improvement';
  reviewDate: string;
  criteria: {
    academicBackground: number;
    workExperience: number;
    salesExperience: number;
    communication: number;
    motivation: number;
  };
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<ApplicationFeedback>) => void;
  applicant: Applicant | null;
  existingFeedback: ApplicationFeedback | null;
}

interface TestQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number; // Index of correct option
  points: number;
  explanation?: string;
  order: number;
}

interface CompetencyTest {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number; // Minutes
  passingScore: number; // Percentage
  questions: TestQuestion[];
  status: 'draft' | 'active' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalPoints: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface TestAttempt {
  id: string;
  testId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  startTime: string;
  endTime?: string;
  timeSpent: number; // Minutes
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    points: number;
  }[];
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
  submittedAt?: string;
}

interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  attempts: TestAttempt[];
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  createdAt: string;
}

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (test: Partial<CompetencyTest>) => void;
  test: CompetencyTest | null;
  isEditing: boolean;
}

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<TestQuestion>) => void;
  question: TestQuestion | null;
  isEditing: boolean;
  questionNumber: number;
}

interface ResultDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: TestAttempt | null;
  test: CompetencyTest | null;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onConfirm, type, applicant }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-secondary-800">
              {type === 'approve' ? 'Approve Application' : 'Reject Application'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-secondary-600 mb-2">
              Applicant: <span className="font-medium">{applicant?.firstName} {applicant?.lastName}</span>
            </p>
            <p className="text-secondary-600">
              Application: <span className="font-medium">{applicant?.applicationNumber}</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {type === 'approve' ? 'Approval Reason/Notes' : 'Rejection Reason'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={
                type === 'approve' 
                  ? 'Enter approval notes, cohort information, or additional instructions...'
                  : 'Enter the reason for rejection...'
              }
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-secondary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || loading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 ${
                type === 'approve'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : type === 'approve' ? 'Approve & Convert to Learner' : 'Reject Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LetterModal: React.FC<LetterModalProps> = ({ isOpen, onClose, onSave, template, isEditing }) => {
  const [formData, setFormData] = useState<Partial<LetterTemplate>>({
    title: '',
    type: 'custom',
    subject: '',
    content: '',
    variables: [],
    status: 'draft'
  });

  useEffect(() => {
    if (template && isEditing) {
      setFormData(template);
    } else if (!isEditing) {
      setFormData({
        title: '',
        type: 'custom',
        subject: '',
        content: '',
        variables: [],
        status: 'draft'
      });
    }
  }, [template, isEditing]);

  const predefinedTemplates = {
    acceptance: {
      title: 'Acceptance Letter',
      subject: 'Admission to KSS {{program_level}}',
      content: `[KSS Letterhead]

Date: {{current_date}}

To: {{applicant_name}}
Subject: Admission to KSS {{program_level}}

Dear {{applicant_name}},

Congratulations!

We are pleased to inform you that your application to the KSS {{program_name}} has been successful. Your experience in {{applicant_role}} and demonstrated competency in {{key_skill}} align strongly with this program's objectives.

Next Steps:
• Confirm your participation by {{confirmation_date}} via {{contact_method}}.
• Review the program schedule and pre-course materials attached.
• Payment of the program fee (KES {{program_fee}}) is due by {{payment_due_date}}.

We look forward to supporting your journey toward becoming a certified {{program_level}} professional.

Best regards,

{{sender_name}}
Admissions Committee Chair
Kenya School of Sales`,
      variables: ['applicant_name', 'program_level', 'program_name', 'applicant_role', 'key_skill', 'confirmation_date', 'contact_method', 'program_fee', 'payment_due_date', 'sender_name', 'current_date']
    },
    rejection: {
      title: 'Rejection Letter with Alternative Recommendation',
      subject: 'Application Outcome for KSS {{program_level}}',
      content: `[KSS Letterhead]

Date: {{current_date}}

To: {{applicant_name}}
Subject: Application Outcome for KSS {{program_level}}

Dear {{applicant_name}},

Thank you for applying to the KSS {{program_name}}. After careful review, we regret to inform you that your application has not been successful at this time.

Key Feedback:
• Your current experience ({{applicant_experience}} years) falls short of the {{program_level}} requirement ({{required_experience}} years).
• The assessment highlighted strengths in {{applicant_strengths}}, but gaps in {{improvement_areas}}.

Alternative Pathway:
We encourage you to apply for the {{alternative_program}}, which better matches your profile. This program will equip you with {{alternative_skills}} to prepare for future advancement.

To proceed, please confirm your interest by {{response_date}}.

Thank you for your understanding.

Best regards,

{{sender_name}}
Admissions Committee Chair
Kenya School of Sales`,
      variables: ['applicant_name', 'program_level', 'program_name', 'applicant_experience', 'required_experience', 'applicant_strengths', 'improvement_areas', 'alternative_program', 'alternative_skills', 'response_date', 'sender_name', 'current_date']
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type: type as any }));
    
    if (type in predefinedTemplates) {
      const template = predefinedTemplates[type as keyof typeof predefinedTemplates];
      setFormData(prev => ({
        ...prev,
        title: template.title,
        subject: template.subject,
        content: template.content,
        variables: template.variables
      }));
    }
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(match => match.slice(2, -2)))];
  };

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content + ' ' + formData.subject);
    setFormData(prev => ({ ...prev, content, variables }));
  };

  const handleSubjectChange = (subject: string) => {
    const variables = extractVariables(formData.content + ' ' + subject);
    setFormData(prev => ({ ...prev, subject, variables }));
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      variables: extractVariables(formData.content + ' ' + formData.subject)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-secondary-800">
            {isEditing ? 'Edit Letter Template' : 'Create New Letter Template'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Template Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="acceptance">Acceptance Letter</option>
                  <option value="rejection">Rejection Letter</option>
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="interview_invitation">Interview Invitation</option>
                  <option value="document_request">Document Request</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter template title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {/* Variables Section */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Available Variables
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {formData.variables && formData.variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No variables detected. Use {`{{variable_name}}`} syntax.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Letter Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                                 placeholder="Enter letter content. Use double curly braces for dynamic content."
              />
                             <p className="text-xs text-gray-500 mt-1">
                 Use double curly braces for variables: {`{{applicant_name}}, {{program_name}}, etc.`}
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            {isEditing ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, applicant, existingFeedback }) => {
  const { user } = useAuthContext();
  const [formData, setFormData] = useState<Partial<ApplicationFeedback>>({
    score: 5,
    comments: '',
    recommendation: 'needs_improvement',
    criteria: {
      academicBackground: 5,
      workExperience: 5,
      salesExperience: 5,
      communication: 5,
      motivation: 5
    }
  });

  useEffect(() => {
    if (existingFeedback) {
      setFormData(existingFeedback);
    } else {
      setFormData({
        score: 5,
        comments: '',
        recommendation: 'needs_improvement',
        criteria: {
          academicBackground: 5,
          workExperience: 5,
          salesExperience: 5,
          communication: 5,
          motivation: 5
        }
      });
    }
  }, [existingFeedback, isOpen]);

  const handleCriteriaChange = (criterion: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria!,
        [criterion]: value
      }
    }));

    // Update overall score based on criteria average
    const newCriteria = { ...formData.criteria!, [criterion]: value };
    const average = Object.values(newCriteria).reduce((a, b) => a + b, 0) / Object.values(newCriteria).length;
    setFormData(prev => ({ ...prev, score: Math.round(average * 10) / 10 }));
  };

  const handleSubmit = () => {
    if (!formData.comments?.trim()) {
      alert('Please provide comments for your review');
      return;
    }

    const feedback = {
      ...formData,
      applicationId: applicant?.id || '',
      reviewerId: user?.uid || '',
      reviewerName: user?.displayName || user?.email || 'Anonymous',
      reviewDate: new Date().toISOString()
    };

    onSubmit(feedback);
    onClose();
  };

  if (!isOpen || !applicant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-secondary-800">
              Review Application: {applicant.firstName} {applicant.lastName}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">
              Program: {applicant.programId} • Applied: {new Date(applicant.submittedDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-secondary-800">Applicant Information</h4>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-secondary-600">Contact</label>
                  <div className="text-sm text-secondary-800">
                    <p>{applicant.email}</p>
                    <p>{applicant.phoneNumber}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-secondary-600">Current Position</label>
                  <p className="text-sm text-secondary-800">{applicant.currentJobTitle || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-secondary-600">Organization</label>
                  <p className="text-sm text-secondary-800">{applicant.currentOrganisation || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-secondary-600">Sales Experience</label>
                  <p className="text-sm text-secondary-800">{applicant.salesExperience || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-secondary-600">Key Achievements</label>
                  <p className="text-sm text-secondary-800">{applicant.keyAchievements || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-secondary-600">Learning Goals</label>
                  <p className="text-sm text-secondary-800">{applicant.learningGoals || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-secondary-800">Your Review</h4>
              
              {/* Evaluation Criteria */}
              <div className="space-y-4">
                <h5 className="font-medium text-secondary-700">Evaluation Criteria (1-10 scale)</h5>
                
                {[
                  { key: 'academicBackground', label: 'Academic Background' },
                  { key: 'workExperience', label: 'Work Experience' },
                  { key: 'salesExperience', label: 'Sales Experience' },
                  { key: 'communication', label: 'Communication Skills' },
                  { key: 'motivation', label: 'Motivation & Goals' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-secondary-600">{label}</label>
                      <span className="text-sm font-medium text-secondary-800">
                        {formData.criteria?.[key as keyof typeof formData.criteria] || 5}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.criteria?.[key as keyof typeof formData.criteria] || 5}
                      onChange={(e) => handleCriteriaChange(key, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-secondary-700">Overall Score</span>
                  <span className="text-2xl font-bold text-blue-600">{formData.score}/10</span>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Recommendation
                </label>
                <select
                  value={formData.recommendation}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="approve">Approve</option>
                  <option value="needs_improvement">Needs Improvement</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Comments & Feedback *
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Provide detailed feedback on the application..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            {existingFeedback ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionModal: React.FC<QuestionModalProps> = ({ isOpen, onClose, onSave, question, isEditing, questionNumber }) => {
  const [formData, setFormData] = useState<Partial<TestQuestion>>({
    questionText: '',
    questionType: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
    explanation: ''
  });

  useEffect(() => {
    if (question && isEditing) {
      setFormData(question);
    } else if (!isEditing) {
      setFormData({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1,
        explanation: ''
      });
    }
  }, [question, isEditing, isOpen]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const removeOption = (index: number) => {
    if ((formData.options?.length || 0) <= 2) return;
    
    const newOptions = formData.options?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({
      ...prev,
      options: newOptions,
      correctAnswer: (prev.correctAnswer || 0) >= index ? Math.max(0, (prev.correctAnswer || 0) - 1) : (prev.correctAnswer || 0)
    }));
  };

  const handleSave = () => {
    if (!formData.questionText?.trim()) {
      alert('Please enter a question');
      return;
    }

    if (formData.questionType === 'multiple_choice') {
      if (!formData.options || formData.options.length < 2) {
        alert('Please add at least 2 options');
        return;
      }
      if (formData.options.some(opt => !opt.trim())) {
        alert('Please fill in all options');
        return;
      }
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-secondary-800">
            {isEditing ? 'Edit Question' : `Add Question ${questionNumber}`}
          </h3>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your question..."
              />
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Question Type
              </label>
              <select
                value={formData.questionType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  questionType: e.target.value as TestQuestion['questionType'],
                  options: e.target.value === 'true_false' ? ['True', 'False'] : prev.options
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
              </select>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Answer Options
              </label>
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswer === index}
                      onChange={() => setFormData(prev => ({ ...prev, correctAnswer: index }))}
                      className="mt-1"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={formData.questionType === 'true_false'}
                    />
                    {formData.questionType === 'multiple_choice' && formData.options!.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {formData.questionType === 'multiple_choice' && (
                  <button
                    onClick={addOption}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Points
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Explain why this is the correct answer..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            {isEditing ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TestModal: React.FC<TestModalProps> = ({ isOpen, onClose, onSave, test, isEditing }) => {
  const [formData, setFormData] = useState<Partial<CompetencyTest>>({
    title: '',
    description: '',
    category: '',
    timeLimit: 30,
    passingScore: 70,
    status: 'draft',
    difficulty: 'intermediate',
    tags: [],
    questions: []
  });

  useEffect(() => {
    if (test && isEditing) {
      setFormData(test);
    } else if (!isEditing) {
      setFormData({
        title: '',
        description: '',
        category: '',
        timeLimit: 30,
        passingScore: 70,
        status: 'draft',
        difficulty: 'intermediate',
        tags: [],
        questions: []
      });
    }
  }, [test, isEditing, isOpen]);

  const handleSave = () => {
    if (!formData.title?.trim()) {
      alert('Please enter a test title');
      return;
    }
    if (!formData.description?.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!formData.category?.trim()) {
      alert('Please enter a category');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-secondary-800">
            {isEditing ? 'Edit Competency Test' : 'Create New Competency Test'}
          </h3>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter test title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Sales Skills, Communication"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Time Limit (minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Passing Score (%) *
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as CompetencyTest['difficulty'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CompetencyTest['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="sales, communication, negotiation"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe what this test evaluates..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            {isEditing ? 'Update Test' : 'Create Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultDetailModal: React.FC<ResultDetailModalProps> = ({ isOpen, onClose, attempt, test }) => {
  if (!isOpen || !attempt || !test) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-secondary-800">Test Result Details</h3>
            <p className="text-secondary-600">{attempt.applicantName} - {test.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-blue-600 mb-1">Final Score</p>
              <p className="text-2xl font-bold text-blue-800">{attempt.percentage}%</p>
              <p className="text-xs text-blue-600">({attempt.totalScore}/{test.totalPoints} points)</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${attempt.passed ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium mb-1 ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>Result</p>
              <p className={`text-2xl font-bold ${attempt.passed ? 'text-green-800' : 'text-red-800'}`}>
                {attempt.passed ? 'PASSED' : 'FAILED'}
              </p>
              <p className={`text-xs ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                Required: {test.passingScore}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-purple-600 mb-1">Time Spent</p>
              <p className="text-2xl font-bold text-purple-800">{attempt.timeSpent}m</p>
              <p className="text-xs text-purple-600">Limit: {test.timeLimit}m</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Completion</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.round((attempt.answers.length / test.questions.length) * 100)}%
              </p>
              <p className="text-xs text-gray-600">{attempt.answers.length}/{test.questions.length} answered</p>
            </div>
          </div>

          {/* Questions and Answers */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-secondary-800 mb-4">Question by Question Analysis</h4>
            
            {test.questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => {
                const answer = attempt.answers.find(a => a.questionId === question.id);
                const isCorrect = answer?.isCorrect || false;
                const selectedIndex = answer?.selectedAnswer ?? -1;
                
                return (
                  <div key={question.id} className={`border rounded-lg p-6 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h5 className="font-medium text-secondary-800 mb-2">
                          Question {index + 1} ({question.points} point{question.points !== 1 ? 's' : ''})
                        </h5>
                        <p className="text-secondary-700 mb-4">{question.questionText}</p>
                      </div>
                      <div className={`flex items-center space-x-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        <span className="font-medium text-sm">
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isSelected = selectedIndex === optIndex;
                        const isCorrectOption = question.correctAnswer === optIndex;
                        
                        let className = "p-3 border rounded-lg ";
                        if (isSelected && isCorrectOption) {
                          className += "border-green-500 bg-green-100 text-green-800";
                        } else if (isSelected && !isCorrectOption) {
                          className += "border-red-500 bg-red-100 text-red-800";
                        } else if (!isSelected && isCorrectOption) {
                          className += "border-green-300 bg-green-50 text-green-700";
                        } else {
                          className += "border-gray-200 bg-gray-50 text-gray-700";
                        }
                        
                        return (
                          <div key={optIndex} className={className}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-current' : 'border-gray-300'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-current"></div>}
                              </div>
                              <span className="flex-1">{option}</span>
                              {isSelected && (
                                <span className="text-xs font-medium">
                                  Selected
                                </span>
                              )}
                              {isCorrectOption && (
                                <span className="text-xs font-medium">
                                  Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-700">{question.explanation}</p>
                      </div>
                    )}

                    {/* Points Earned */}
                    <div className="mt-3 text-right">
                      <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        Points Earned: {answer?.points || 0}/{question.points}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Performance Summary */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-secondary-800 mb-4">Performance Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-secondary-700 mb-2">Strengths</h5>
                <ul className="text-sm text-secondary-600 space-y-1">
                  {attempt.answers.filter(a => a.isCorrect).length > 0 ? (
                    <>
                      <li>• Answered {attempt.answers.filter(a => a.isCorrect).length} questions correctly</li>
                      <li>• Scored {attempt.percentage}% overall</li>
                      {attempt.timeSpent < test.timeLimit && (
                        <li>• Completed test efficiently ({attempt.timeSpent}/{test.timeLimit} minutes)</li>
                      )}
                    </>
                  ) : (
                    <li>• Review study materials and retake when ready</li>
                  )}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-secondary-700 mb-2">Areas for Improvement</h5>
                <ul className="text-sm text-secondary-600 space-y-1">
                  {attempt.answers.filter(a => !a.isCorrect).length > 0 ? (
                    <>
                      <li>• {attempt.answers.filter(a => !a.isCorrect).length} questions answered incorrectly</li>
                      {attempt.percentage < test.passingScore && (
                        <li>• Need {test.passingScore - attempt.percentage}% more to pass</li>
                      )}
                      {attempt.timeSpent > test.timeLimit * 0.9 && (
                        <li>• Consider time management strategies</li>
                      )}
                    </>
                  ) : (
                    <li>• Excellent performance across all areas!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Admissions: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Letter templates state
  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [letterModal, setLetterModal] = useState({
    isOpen: false,
    template: null as LetterTemplate | null,
    isEditing: false
  });
  const [letterSearchTerm, setLetterSearchTerm] = useState('');
  const [letterTypeFilter, setLetterTypeFilter] = useState('all');
  
  // Committee members state
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [applicationFeedback, setApplicationFeedback] = useState<ApplicationFeedback[]>([]);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    applicant: null as Applicant | null,
    existingFeedback: null as ApplicationFeedback | null
  });
  const [committeeSearchTerm, setCommitteeSearchTerm] = useState('');
  const [committeeStatusFilter, setCommitteeStatusFilter] = useState('all');
  
  // Competency tests state
  const [competencyTests, setCompetencyTests] = useState<CompetencyTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [testModal, setTestModal] = useState({
    isOpen: false,
    test: null as CompetencyTest | null,
    isEditing: false
  });
  const [questionModal, setQuestionModal] = useState({
    isOpen: false,
    question: null as TestQuestion | null,
    isEditing: false,
    questionNumber: 1
  });
  const [resultDetailModal, setResultDetailModal] = useState({
    isOpen: false,
    attempt: null as TestAttempt | null,
    test: null as CompetencyTest | null
  });
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [testStatusFilter, setTestStatusFilter] = useState('all');
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [currentEditingTest, setCurrentEditingTest] = useState<CompetencyTest | null>(null);
  
  // Modal state
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'approve' as 'approve' | 'reject',
    applicant: null as Applicant | null
  });
  
  // Applicant-specific state
  const [userApplication, setUserApplication] = useState<Applicant | null>(null);
  const [hasApplication, setHasApplication] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    applications: { currentPage: 1, itemsPerPage: 10 },
    cohorts: { currentPage: 1, itemsPerPage: 10 },
    letters: { currentPage: 1, itemsPerPage: 10 },
    committee: { currentPage: 1, itemsPerPage: 10 },
    tests: { currentPage: 1, itemsPerPage: 10 }
  });

  const stats = [
    { title: 'Total Applications', value: applications.length.toString(), change: '+23%', icon: UserPlus, color: 'primary' },
    { title: 'Active Cohorts', value: cohorts.filter(cohort => cohort.status === 'active').length.toString(), change: '+12%', icon: Users, color: 'secondary' },
    { title: 'Approved', value: applications.filter(app => app.status === 'approved').length.toString(), change: '+18%', icon: CheckCircle, color: 'accent' },
    { title: 'Pending Review', value: applications.filter(app => app.status === 'pending' || app.status === 'under_review').length.toString(), change: '+8', icon: Clock, color: 'yellow' },
  ];

  useEffect(() => {
    if (userProfile?.role === 'applicant') {
      checkUserApplication();
    } else {
      loadData();
      loadLetterTemplates();
      loadCommitteeMembers();
      loadApplicationFeedback();
      loadCompetencyTests();
      loadTestAttempts();
    }
  }, [userProfile, user]);

  const checkUserApplication = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('applicants', [
        { field: 'email', operator: '==', value: user.email }
      ]);
      
      if (result.success && result.data && result.data.length > 0) {
        setUserApplication(result.data[0] as Applicant);
        setHasApplication(true);
      }
    } catch (error) {
      console.error('Error checking user application:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications, programs, and cohorts
      const [applicationsResult, programsResult, cohortsResult] = await Promise.all([
        FirestoreService.getAll('applicants'),
        ProgramService.getAll('programs'),
        FirestoreService.getAll('cohorts')
      ]);
      
      if (applicationsResult.success && applicationsResult.data) {
        setApplications(applicationsResult.data);
      }
      
      if (programsResult.success && programsResult.data) {
        setPrograms(programsResult.data);
      }
      
      if (cohortsResult.success && cohortsResult.data) {
        setCohorts(cohortsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLetterTemplates = async () => {
    try {
      const result = await FirestoreService.getAll('letterTemplates');
      if (result.success && result.data) {
        setLetterTemplates(result.data as LetterTemplate[]);
      }
    } catch (error) {
      console.error('Error loading letter templates:', error);
    }
  };

  const saveLetterTemplate = async (templateData: Partial<LetterTemplate>) => {
    try {
      const isEditing = letterModal.isEditing && letterModal.template?.id;
      
      if (isEditing) {
        const result = await FirestoreService.update('letterTemplates', letterModal.template!.id, {
          ...templateData,
          updatedAt: new Date().toISOString()
        });
        
        if (result.success) {
          setLetterTemplates(prev => 
            prev.map(template => 
              template.id === letterModal.template!.id 
                ? { ...template, ...templateData, updatedAt: new Date().toISOString() }
                : template
            )
          );
          alert('Template updated successfully!');
        }
      } else {
        const newTemplate: Omit<LetterTemplate, 'id'> = {
          ...templateData as LetterTemplate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user?.uid || '',
          usageCount: 0
        };
        
        const result = await FirestoreService.create('letterTemplates', newTemplate);
        
        if (result.success && result.id) {
          setLetterTemplates(prev => [...prev, { ...newTemplate, id: result.id }]);
          alert('Template created successfully!');
        }
      }
      
      setLetterModal({ isOpen: false, template: null, isEditing: false });
    } catch (error) {
      console.error('Error saving letter template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  const deleteLetterTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const result = await FirestoreService.delete('letterTemplates', templateId);
      
      if (result.success) {
        setLetterTemplates(prev => prev.filter(template => template.id !== templateId));
        alert('Template deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting letter template:', error);
      alert('Error deleting template. Please try again.');
    }
  };

  const duplicateLetterTemplate = async (template: LetterTemplate) => {
    try {
      const newTemplate: Omit<LetterTemplate, 'id'> = {
        ...template,
        title: `${template.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || '',
        usageCount: 0
      };
      
      const result = await FirestoreService.create('letterTemplates', newTemplate);
      
      if (result.success && result.id) {
        setLetterTemplates(prev => [...prev, { ...newTemplate, id: result.id }]);
        alert('Template duplicated successfully!');
      }
    } catch (error) {
      console.error('Error duplicating letter template:', error);
      alert('Error duplicating template. Please try again.');
    }
  };

  const loadCommitteeMembers = async () => {
    try {
      const result = await FirestoreService.getAll('staff');
      if (result.success && result.data) {
        // Transform staff data to committee members format
        const members: CommitteeMember[] = result.data.map((staff: any) => ({
          id: staff.id,
          firstName: staff.firstName || '',
          lastName: staff.lastName || '',
          email: staff.email || '',
          department: staff.department || '',
          position: staff.position || '',
          specialization: staff.specialization || '',
          status: staff.status || 'active',
          committeeRole: determineCommitteeRole(staff.position),
          reviewedApplications: 0, // Will be calculated from feedback
          averageScore: 0, // Will be calculated from feedback
          joinedDate: staff.createdAt || new Date().toISOString()
        }));
        
        setCommitteeMembers(members);
        
        // Update review statistics
        await updateCommitteeStatistics(members);
      }
    } catch (error) {
      console.error('Error loading committee members:', error);
    }
  };

  const determineCommitteeRole = (position: string): CommitteeMember['committeeRole'] => {
    const pos = position.toLowerCase();
    if (pos.includes('director') || pos.includes('dean') || pos.includes('head')) return 'chair';
    if (pos.includes('senior') || pos.includes('professor')) return 'senior_reviewer';
    if (pos.includes('junior') || pos.includes('assistant')) return 'junior_reviewer';
    return 'reviewer';
  };

  const loadApplicationFeedback = async () => {
    try {
      const result = await FirestoreService.getAll('applicationFeedback');
      if (result.success && result.data) {
        setApplicationFeedback(result.data as ApplicationFeedback[]);
      }
    } catch (error) {
      console.error('Error loading application feedback:', error);
    }
  };

  const updateCommitteeStatistics = async (members: CommitteeMember[]) => {
    try {
      const updatedMembers = members.map(member => {
        const memberFeedback = applicationFeedback.filter(feedback => feedback.reviewerId === member.id);
        const reviewedCount = memberFeedback.length;
        const averageScore = reviewedCount > 0 
          ? memberFeedback.reduce((sum, feedback) => sum + feedback.score, 0) / reviewedCount 
          : 0;

        return {
          ...member,
          reviewedApplications: reviewedCount,
          averageScore: Math.round(averageScore * 10) / 10
        };
      });

      setCommitteeMembers(updatedMembers);
    } catch (error) {
      console.error('Error updating committee statistics:', error);
    }
  };

  const submitFeedback = async (feedbackData: Partial<ApplicationFeedback>) => {
    try {
      if (feedbackModal.existingFeedback) {
        // Update existing feedback
        const result = await FirestoreService.update('applicationFeedback', feedbackModal.existingFeedback.id, {
          ...feedbackData,
          updatedAt: new Date().toISOString()
        });
        
        if (result.success) {
          setApplicationFeedback(prev => 
            prev.map(feedback => 
              feedback.id === feedbackModal.existingFeedback!.id 
                ? { ...feedback, ...feedbackData }
                : feedback
            )
          );
          alert('Feedback updated successfully!');
        }
      } else {
        // Create new feedback
        const result = await FirestoreService.create('applicationFeedback', feedbackData);
        
        if (result.success && result.id) {
          const newFeedback = { ...feedbackData as ApplicationFeedback, id: result.id };
          setApplicationFeedback(prev => [...prev, newFeedback]);
          alert('Feedback submitted successfully!');
        }
      }
      
      setFeedbackModal({ isOpen: false, applicant: null, existingFeedback: null });
      
      // Update committee statistics
      await updateCommitteeStatistics(committeeMembers);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  const openFeedbackModal = (applicant: Applicant) => {
    const existingFeedback = applicationFeedback.find(
      feedback => feedback.applicationId === applicant.id && feedback.reviewerId === user?.uid
    );
    
    setFeedbackModal({
      isOpen: true,
      applicant,
      existingFeedback: existingFeedback || null
    });
  };

  const getCommitteeRoleBadgeColor = (role: CommitteeMember['committeeRole']) => {
    switch (role) {
      case 'chair': return 'bg-purple-100 text-purple-800';
      case 'senior_reviewer': return 'bg-blue-100 text-blue-800';
      case 'reviewer': return 'bg-green-100 text-green-800';
      case 'junior_reviewer': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommitteeRoleText = (role: CommitteeMember['committeeRole']) => {
    switch (role) {
      case 'chair': return 'Committee Chair';
      case 'senior_reviewer': return 'Senior Reviewer';
      case 'reviewer': return 'Reviewer';
      case 'junior_reviewer': return 'Junior Reviewer';
      default: return 'Member';
    }
  };

  // Pagination helper functions
  const updatePagination = (tab: keyof typeof pagination, updates: Partial<typeof pagination.applications>) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], ...updates }
    }));
  };

  const getPaginatedData = <T extends any>(data: T[], tab: keyof typeof pagination): { 
    paginatedData: T[], 
    totalPages: number, 
    currentPage: number,
    totalItems: number,
    startIndex: number,
    endIndex: number
  } => {
    const { currentPage, itemsPerPage } = pagination[tab];
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages,
      currentPage,
      totalItems,
      startIndex,
      endIndex
    };
  };

  const goToPage = (tab: keyof typeof pagination, page: number) => {
    updatePagination(tab, { currentPage: page });
  };

  const goToPreviousPage = (tab: keyof typeof pagination) => {
    const currentPage = pagination[tab].currentPage;
    if (currentPage > 1) {
      updatePagination(tab, { currentPage: currentPage - 1 });
    }
  };

  const goToNextPage = (tab: keyof typeof pagination, totalPages: number) => {
    const currentPage = pagination[tab].currentPage;
    if (currentPage < totalPages) {
      updatePagination(tab, { currentPage: currentPage + 1 });
    }
  };

  // Competency Tests Functions
  const loadCompetencyTests = async () => {
    try {
      const result = await FirestoreService.getAll('competencyTests');
      if (result.success && result.data) {
        setCompetencyTests(result.data as CompetencyTest[]);
      }
    } catch (error) {
      console.error('Error loading competency tests:', error);
    }
  };

  const loadTestAttempts = async () => {
    try {
      const result = await FirestoreService.getAll('testAttempts');
      if (result.success && result.data) {
        setTestAttempts(result.data as TestAttempt[]);
      }
    } catch (error) {
      console.error('Error loading test attempts:', error);
    }
  };

  const saveCompetencyTest = async (testData: Partial<CompetencyTest>) => {
    try {
      const isEditing = testModal.isEditing && testModal.test?.id;
      
      if (isEditing) {
        const result = await FirestoreService.update('competencyTests', testModal.test!.id, {
          ...testData,
          updatedAt: new Date().toISOString(),
          totalPoints: testData.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0
        });
        
        if (result.success) {
          setCompetencyTests(prev => 
            prev.map(test => 
              test.id === testModal.test!.id 
                ? { ...test, ...testData, updatedAt: new Date().toISOString() }
                : test
            )
          );
          alert('Test updated successfully!');
        }
      } else {
        const newTest: Omit<CompetencyTest, 'id'> = {
          ...testData as CompetencyTest,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user?.uid || '',
          totalPoints: testData.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0
        };
        
        const result = await FirestoreService.create('competencyTests', newTest);
        
        if (result.success && result.id) {
          setCompetencyTests(prev => [...prev, { ...newTest, id: result.id }]);
          alert('Test created successfully!');
        }
      }
      
      setTestModal({ isOpen: false, test: null, isEditing: false });
    } catch (error) {
      console.error('Error saving competency test:', error);
      alert('Error saving test. Please try again.');
    }
  };

  const deleteCompetencyTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    
    try {
      const result = await FirestoreService.delete('competencyTests', testId);
      
      if (result.success) {
        setCompetencyTests(prev => prev.filter(test => test.id !== testId));
        alert('Test deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting competency test:', error);
      alert('Error deleting test. Please try again.');
    }
  };

  const duplicateCompetencyTest = async (test: CompetencyTest) => {
    try {
      const newTest: Omit<CompetencyTest, 'id'> = {
        ...test,
        title: `${test.title} (Copy)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || '',
        questions: test.questions.map((q, index) => ({
          ...q,
          id: `question_${Date.now()}_${index}`
        }))
      };
      
      const result = await FirestoreService.create('competencyTests', newTest);
      
      if (result.success && result.id) {
        setCompetencyTests(prev => [...prev, { ...newTest, id: result.id }]);
        alert('Test duplicated successfully!');
      }
    } catch (error) {
      console.error('Error duplicating test:', error);
      alert('Error duplicating test. Please try again.');
    }
  };

  const saveQuestion = (questionData: Partial<TestQuestion>) => {
    if (!currentEditingTest) return;

    const isEditing = questionModal.isEditing && questionModal.question?.id;
    
    if (isEditing) {
      // Update existing question
      const updatedQuestions = currentEditingTest.questions.map(q =>
        q.id === questionModal.question!.id ? { ...q, ...questionData } : q
      );
      setCurrentEditingTest({
        ...currentEditingTest,
        questions: updatedQuestions
      });
    } else {
      // Add new question
      const newQuestion: TestQuestion = {
        id: `question_${Date.now()}`,
        questionText: questionData.questionText || '',
        questionType: questionData.questionType || 'multiple_choice',
        options: questionData.options || [''],
        correctAnswer: questionData.correctAnswer || 0,
        points: questionData.points || 1,
        explanation: questionData.explanation || '',
        order: currentEditingTest.questions.length + 1
      };
      
      setCurrentEditingTest({
        ...currentEditingTest,
        questions: [...currentEditingTest.questions, newQuestion]
      });
    }
    
    setQuestionModal({ isOpen: false, question: null, isEditing: false, questionNumber: 1 });
  };

  const deleteQuestion = (questionId: string) => {
    if (!currentEditingTest) return;
    
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = currentEditingTest.questions
        .filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index + 1 }));
      
      setCurrentEditingTest({
        ...currentEditingTest,
        questions: updatedQuestions
      });
    }
  };

  const reorderQuestions = (questions: TestQuestion[]) => {
    if (!currentEditingTest) return;
    
    const reorderedQuestions = questions.map((q, index) => ({ ...q, order: index + 1 }));
    setCurrentEditingTest({
      ...currentEditingTest,
      questions: reorderedQuestions
    });
  };

  const getTestStatistics = (testId: string) => {
    const attempts = testAttempts.filter(attempt => attempt.testId === testId && attempt.status === 'completed');
    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0 
      ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts 
      : 0;
    const passRate = totalAttempts > 0 
      ? (attempts.filter(attempt => attempt.passed).length / totalAttempts) * 100 
      : 0;

    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10
    };
  };

  const getDifficultyBadgeColor = (difficulty: CompetencyTest['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: CompetencyTest['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadCohorts = async () => {
    try {
      const result = await FirestoreService.getAll('cohorts');
      if (result.success && result.data) {
        setCohorts(result.data);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const result = await FirestoreService.getAll('applicants');
      if (result.success && result.data) {
        setApplications(result.data);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const generateStudentId = async () => {
    try {
      const result = await FirestoreService.getAll('learners');
      if (result.success && result.data) {
        const count = result.data.length + 1;
        return `LN${count.toString().padStart(3, '0')}`;
      }
      return 'LN001';
    } catch (error) {
      console.error('Error generating student ID:', error);
      return 'LN001';
    }
  };

  const convertApplicantToLearner = async (applicant: Applicant) => {
    try {
      // Check if learner already exists
      const existingLearnerCheck = await FirestoreService.getWithQuery('learners', [
        { field: 'email', operator: '==', value: applicant.email }
      ]);
      
      if (existingLearnerCheck.success && existingLearnerCheck.data && existingLearnerCheck.data.length > 0) {
        console.log('Learner already exists for this email');
        return true; // Return true since they're already a learner
      }

      // Generate student ID
      const studentId = await generateStudentId();
      
      // Get program information
      const selectedProgram = programs.find(p => p.id === applicant.programId);
      
      // Get the selected cohort details
      const selectedCohort = cohorts.find(c => c.id === applicant.cohort);
      
      // Create learner data
      const learnerData = {
        studentId,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        phoneNumber: applicant.phoneNumber,
        currentJobTitle: applicant.currentJobTitle || '',
        currentOrganisation: applicant.currentOrganisation || '',
        salesExperience: applicant.salesExperience || '',
        keyAchievements: applicant.keyAchievements || '',
        programId: applicant.programId,
        learningGoals: applicant.learningGoals || '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        academicStatus: 'active' as const,
        cohortId: applicant.cohort || '', // Use the cohort ID from cohorts collection
        cohortName: selectedCohort?.name || '',
        cohort: applicant.cohort || `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 3)}Q`, // Keep for backward compatibility
        currentGPA: 0,
        paymentRecords: [],
        totalFees: selectedProgram?.fees || 0,
        amountPaid: applicant.amountPaid || 0,
        outstandingBalance: (selectedProgram?.fees || 0) - (applicant.amountPaid || 0),
        paymentPlan: 'full',
        role: 'learner' // Ensure role is set for user profile updates
      };

      // Create learner in learners collection
      const learnerResult = await FirestoreService.create('learners', learnerData);
      
      if (learnerResult.success) {
        // Update user profile role from 'applicant' to 'learner'
        try {
          const userProfileCheck = await FirestoreService.getWithQuery('users', [
            { field: 'email', operator: '==', value: applicant.email }
          ]);
          
          if (userProfileCheck.success && userProfileCheck.data && userProfileCheck.data.length > 0) {
            const userProfile = userProfileCheck.data[0];
            await FirestoreService.update('users', userProfile.id, { 
              role: 'learner',
              studentId: studentId 
            });
            console.log('Updated user profile role to learner');
            
            // Refresh user profile if this is the current user
            if (user && user.email === applicant.email) {
              console.log('Refreshing current user profile after role update');
              await refreshUserProfile();
            }
          }
        } catch (error) {
          console.error('Error updating user profile role:', error);
          // Don't fail the whole process if user profile update fails
        }

        console.log('Successfully converted applicant to learner:', studentId);
        return true;
      } else {
        console.error('Failed to create learner:', learnerResult);
        return false;
      }
    } catch (error) {
      console.error('Error converting applicant to learner:', error);
      return false;
    }
  };

  const handleApproveApplication = async (applicant: Applicant, reason: string) => {
    try {
      // First, convert applicant to learner
      const conversionSuccess = await convertApplicantToLearner(applicant);
      
      if (!conversionSuccess) {
        alert('Failed to convert applicant to learner. Please try again.');
        return;
      }

      // Update application status with feedback
      const feedback = applicant.feedback || [];
      feedback.push({
        date: new Date().toISOString().split('T')[0],
        message: reason,
        author: userProfile?.displayName || 'Admin'
      });

      const selectedProgram = programs.find(p => p.id === applicant.programId);
      const updateData = {
        status: 'approved',
        feedback,
        admittedProgram: selectedProgram?.programName || '',
        approvalDate: new Date().toISOString().split('T')[0],
        approvedBy: userProfile?.displayName || 'Admin'
      };

      const result = await FirestoreService.update('applicants', applicant.id, updateData);
      
      if (result.success) {
        // Reload applications to show updated status
        loadApplications();
        
        // Get the generated student ID for the success message
        const learnerResult = await FirestoreService.getWithQuery('learners', [
          { field: 'email', operator: '==', value: applicant.email }
        ]);
        
        let studentId = 'N/A';
        if (learnerResult.success && learnerResult.data && learnerResult.data.length > 0) {
          const learnerData = learnerResult.data[0] as any;
          studentId = learnerData.studentId || 'N/A';
        }
        
        // Check if this was the current user being approved
        const isCurrentUser = user && user.email === applicant.email;
        
        alert(`✅ Application Approved Successfully!\n\n` +
              `Student: ${applicant.firstName} ${applicant.lastName}\n` +
              `Student ID: ${studentId}\n` +
              `Program: ${selectedProgram?.programName || 'N/A'}\n` +
              `Status: Learner profile created and user role updated` +
              (isCurrentUser ? `\n\n🎉 Your role has been updated to Learner!\nYou now have access to additional features in the portal.` : ''));
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('❌ Failed to approve application. Please try again.');
    }
  };

  const handleRejectApplication = async (applicant: Applicant, reason: string) => {
    try {
      // Update application status with feedback
      const feedback = applicant.feedback || [];
      feedback.push({
        date: new Date().toISOString().split('T')[0],
        message: reason,
        author: userProfile?.displayName || 'Admin'
      });

      const selectedProgram = programs.find(p => p.id === applicant.programId);
      const updateData = {
        status: 'rejected',
        feedback,
        rejectionDate: new Date().toISOString().split('T')[0],
        rejectedBy: userProfile?.displayName || 'Admin'
      };

      const result = await FirestoreService.update('applicants', applicant.id, updateData);
      
      if (result.success) {
        // Reload applications to show updated status
        loadApplications();
        alert(`❌ Application Rejected\n\n` +
              `Applicant: ${applicant.firstName} ${applicant.lastName}\n` +
              `Program: ${selectedProgram?.programName || 'N/A'}\n` +
              `Reason: ${reason}\n` +
              `Status: Application status updated`);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('❌ Failed to reject application. Please try again.');
    }
  };

  const openActionModal = (type: 'approve' | 'reject', applicant: Applicant) => {
    setActionModal({
      isOpen: true,
      type,
      applicant
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      type: 'approve',
      applicant: null
    });
  };

  const handleModalConfirm = async (reason: string) => {
    if (!actionModal.applicant) return;

    if (actionModal.type === 'approve') {
      await handleApproveApplication(actionModal.applicant, reason);
    } else {
      await handleRejectApplication(actionModal.applicant, reason);
    }
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program ? program.programName : 'N/A';
  };

  const tabs = [
    { id: 'applications', label: 'Applications' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'tests', label: 'Competency Tests' },
    { id: 'letters', label: 'Letters' },
    { id: 'committee', label: 'Admissions Committee' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-accent-100 text-accent-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-accent-100 text-accent-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'not_paid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination Component
  const PaginationControls: React.FC<{
    tab: keyof typeof pagination;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  }> = ({ tab, totalItems, currentPage, totalPages, startIndex, endIndex }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center text-sm text-secondary-600">
          <span>
            Showing {startIndex + 1} to {endIndex} of {totalItems} results
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPreviousPage(tab)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(tab, page)}
                className={`px-3 py-1 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                  page === currentPage
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-gray-300 bg-white text-secondary-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToNextPage(tab, totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-secondary-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const result = await FirestoreService.update('applicants', id, { status });
      if (result.success) {
        // Reload applications to show updated status
        loadApplications();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  // Applicant View Component
  const ApplicantView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!hasApplication) {
      return (
        <div className="text-center py-12">
          <div className="bg-white rounded-2xl shadow-lg p-12 max-w-2xl mx-auto">
            <UserPlus className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-secondary-800 mb-4">Apply for a Program</h2>
            <p className="text-lg text-secondary-600 mb-8">
              Ready to start your learning journey? Submit your application to join one of our programs.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2 text-secondary-600">
                <CheckCircle className="h-5 w-5 text-accent-600" />
                <span>Fill out your profile information</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-secondary-600">
                <CheckCircle className="h-5 w-5 text-accent-600" />
                <span>Share your job details and experience</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-secondary-600">
                <CheckCircle className="h-5 w-5 text-accent-600" />
                <span>Select your preferred program</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-secondary-600">
                <CheckCircle className="h-5 w-5 text-accent-600" />
                <span>Submit your application</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/portal/admissions/my-application')}
              className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-3 mx-auto"
            >
              <UserPlus className="h-6 w-6" />
              <span>Start Application</span>
            </button>
          </div>
        </div>
      );
    }

    // Show existing application
    const selectedProgram = programs.find(p => p.id === userApplication?.programId);
    
    return (
      <div className="space-y-6">
        {/* Application Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary-800">Your Application</h2>
              <p className="text-secondary-600">Application #{userApplication?.applicationNumber}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              userApplication?.status === 'approved' ? 'bg-green-100 text-green-800' :
              userApplication?.status === 'rejected' ? 'bg-red-100 text-red-800' :
              userApplication?.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {userApplication?.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-600 mb-1">Applied Program</p>
              <p className="text-lg font-semibold text-secondary-800">
                {selectedProgram?.programName || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-600 mb-1">Payment Status</p>
              <p className="text-lg font-semibold text-secondary-800">
                {userApplication?.paymentStatus.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-600 mb-1">Submitted Date</p>
              <p className="text-lg font-semibold text-secondary-800">
                {userApplication?.submittedDate ? new Date(userApplication.submittedDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/admissions/my-application')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Eye className="h-5 w-5" />
              <span>View Application</span>
            </button>
            {userApplication?.status === 'pending' && (
              <button
                onClick={() => navigate('/portal/admissions/my-application')}
                className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-5 w-5" />
                <span>Edit Application</span>
              </button>
            )}
          </div>
        </div>

        {/* Application Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-secondary-800 mb-6">Application Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-accent-600 rounded-full"></div>
              <div>
                <p className="font-medium text-secondary-800">Application Submitted</p>
                <p className="text-sm text-secondary-600">
                  {userApplication?.submittedDate ? new Date(userApplication.submittedDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            {userApplication?.status !== 'pending' && (
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  userApplication?.status === 'under_review' ? 'bg-yellow-500' :
                  userApplication?.status === 'approved' ? 'bg-green-500' :
                  userApplication?.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <p className="font-medium text-secondary-800">
                    Application {userApplication?.status.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-secondary-600">Status updated</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // If user is an applicant, show the applicant view
  if (userProfile?.role === 'applicant') {
    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Application</h1>
              <p className="text-lg text-primary-100">
                {hasApplication ? 'Track your application status and updates.' : 'Start your application process today.'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <ApplicantView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Modal */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={closeActionModal}
        onConfirm={handleModalConfirm}
        type={actionModal.type}
        applicant={actionModal.applicant}
      />

      {/* Letter Template Modal */}
      <LetterModal
        isOpen={letterModal.isOpen}
        onClose={() => setLetterModal({ isOpen: false, template: null, isEditing: false })}
        onSave={saveLetterTemplate}
        template={letterModal.template}
        isEditing={letterModal.isEditing}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, applicant: null, existingFeedback: null })}
        onSubmit={submitFeedback}
        applicant={feedbackModal.applicant}
        existingFeedback={feedbackModal.existingFeedback}
      />

      {/* Test Modal */}
      <TestModal
        isOpen={testModal.isOpen}
        onClose={() => setTestModal({ isOpen: false, test: null, isEditing: false })}
        onSave={saveCompetencyTest}
        test={testModal.test}
        isEditing={testModal.isEditing}
      />

      {/* Question Modal */}
      <QuestionModal
        isOpen={questionModal.isOpen}
        onClose={() => setQuestionModal({ isOpen: false, question: null, isEditing: false, questionNumber: 1 })}
        onSave={saveQuestion}
        question={questionModal.question}
        isEditing={questionModal.isEditing}
        questionNumber={questionModal.questionNumber}
      />

      {/* Result Detail Modal */}
      <ResultDetailModal
        isOpen={resultDetailModal.isOpen}
        onClose={() => setResultDetailModal({ isOpen: false, attempt: null, test: null })}
        attempt={resultDetailModal.attempt}
        test={resultDetailModal.test}
      />

      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admissions</h1>
            <p className="text-lg text-primary-100">
              Manage student applications and admission processes efficiently.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-primary-200">
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'applications' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
                <button 
                  onClick={() => navigate('/portal/admissions/applicants/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Application</span>
                </button>
              </div>

              {/* Applications Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Application ID</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Applicant</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Payment</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Submitted</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const { paginatedData } = getPaginatedData(applications, 'applications');
                        return paginatedData.map((app) => (
                          <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-4 px-4 font-medium text-secondary-800">{app.applicationNumber || 'N/A'}</td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-secondary-800">{`${app.firstName || ''} ${app.lastName || ''}`.trim()}</div>
                                <div className="text-sm text-secondary-500">{app.email}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-secondary-600">{getProgramName(app.programId)}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(app.paymentStatus)}`}>
                                {app.paymentStatus?.replace('_', ' ').toUpperCase() || 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-secondary-600">{new Date(app.submittedDate).toLocaleDateString()}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => navigate(`/portal/admissions/applicants/${app.id}`)}
                                  className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                  title="View Applicant"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                
                                {/* Review button for committee members */}
                                <button 
                                  onClick={() => openFeedbackModal(app)}
                                  className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                                  title="Review Application"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                
                                {app.status !== 'approved' && app.status !== 'rejected' && (
                                  <>
                                    <button 
                                      onClick={() => openActionModal('approve', app)}
                                      className="p-1 text-secondary-400 hover:text-green-600 transition-colors duration-200"
                                      title="Approve Application"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => openActionModal('reject', app)}
                                      className="p-1 text-secondary-400 hover:text-red-600 transition-colors duration-200"
                                      title="Reject Application"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  
                  {/* Applications Pagination */}
                  {(() => {
                    const paginationData = getPaginatedData(applications, 'applications');
                    return (
                      <PaginationControls
                        tab="applications"
                        totalItems={paginationData.totalItems}
                        currentPage={paginationData.currentPage}
                        totalPages={paginationData.totalPages}
                        startIndex={paginationData.startIndex}
                        endIndex={paginationData.endIndex}
                      />
                    );
                  })()}
                  
                  {applications.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <UserPlus className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Applications Yet</h3>
                      <p className="text-secondary-600 mb-6">Create your first application to get started.</p>
                      <button 
                        onClick={() => navigate('/portal/admissions/applicants/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Application</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cohorts' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search cohorts..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
                <button 
                  onClick={() => navigate('/portal/admissions/cohorts/new')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Cohort</span>
                </button>
              </div>

              {/* Cohorts Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Cohort ID</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Start Date</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Application Deadline</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Students</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredCohorts = cohorts.filter(cohort => 
                          cohort.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cohort.cohortId?.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        const { paginatedData } = getPaginatedData(filteredCohorts, 'cohorts');
                        return paginatedData.map((cohort) => {
                          const program = programs.find(p => p.id === cohort.programId);
                          const isActive = new Date(cohort.startDate) <= new Date() && new Date(cohort.closeDate) >= new Date();
                          const isUpcoming = new Date(cohort.startDate) > new Date();
                          const isPast = new Date(cohort.closeDate) < new Date();
                          
                          return (
                            <tr key={cohort.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                              <td className="py-4 px-4 font-medium text-secondary-800">{cohort.cohortId || 'N/A'}</td>
                              <td className="py-4 px-4">
                                <div className="font-medium text-secondary-800">{cohort.name}</div>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">{program?.programName || 'N/A'}</td>
                              <td className="py-4 px-4 text-secondary-600">
                                {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-4 px-4 text-secondary-600">
                                {cohort.applicationDeadline ? new Date(cohort.applicationDeadline).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isActive ? 'bg-green-100 text-green-800' :
                                  isUpcoming ? 'bg-blue-100 text-blue-800' :
                                  isPast ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {isActive ? 'Active' : isUpcoming ? 'Upcoming' : isPast ? 'Completed' : 'Draft'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">{cohort.enrolledCount || 0}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => navigate(`/portal/admissions/cohorts/${cohort.id}`)}
                                    className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                    title="View Cohort"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/portal/admissions/cohorts/${cohort.id}/edit`)}
                                    className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                                    title="Edit Cohort"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                  
                  {/* Cohorts Pagination */}
                  {(() => {
                    const filteredCohorts = cohorts.filter(cohort => 
                      cohort.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      cohort.cohortId?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    const paginationData = getPaginatedData(filteredCohorts, 'cohorts');
                    return (
                      <PaginationControls
                        tab="cohorts"
                        totalItems={paginationData.totalItems}
                        currentPage={paginationData.currentPage}
                        totalPages={paginationData.totalPages}
                        startIndex={paginationData.startIndex}
                        endIndex={paginationData.endIndex}
                      />
                    );
                  })()}
                  
                  {cohorts.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Cohorts Yet</h3>
                      <p className="text-secondary-600 mb-6">Create your first cohort to get started.</p>
                      <button 
                        onClick={() => navigate('/portal/admissions/cohorts/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Cohort</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'letters' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={letterSearchTerm}
                      onChange={(e) => setLetterSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={letterTypeFilter}
                    onChange={(e) => setLetterTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="acceptance">Acceptance</option>
                    <option value="rejection">Rejection</option>
                    <option value="payment_reminder">Payment Reminder</option>
                    <option value="interview_invitation">Interview</option>
                    <option value="document_request">Documents</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <button 
                  onClick={() => setLetterModal({ isOpen: true, template: null, isEditing: false })}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Template</span>
                </button>
              </div>

              {/* Letter Templates Grid */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const filteredTemplates = letterTemplates.filter(template => {
                      const matchesSearch = template.title.toLowerCase().includes(letterSearchTerm.toLowerCase()) ||
                                          template.subject.toLowerCase().includes(letterSearchTerm.toLowerCase());
                      const matchesType = letterTypeFilter === 'all' || template.type === letterTypeFilter;
                      return matchesSearch && matchesType;
                    });
                    const { paginatedData } = getPaginatedData(filteredTemplates, 'letters');
                    return paginatedData.map((template) => (
                      <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-secondary-800 mb-1">{template.title}</h3>
                            <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{template.subject}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {template.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                            {template.type.replace('_', ' ')}
                          </span>
                          <span className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{template.usageCount} uses</span>
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable, index) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                            {template.variables.length > 3 && (
                              <span className="text-xs text-secondary-500">
                                +{template.variables.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setLetterModal({ isOpen: true, template, isEditing: true })}
                            className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
                          >
                            Edit Template
                          </button>
                          <button 
                            onClick={() => duplicateLetterTemplate(template)}
                            className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                            title="Duplicate template"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteLetterTemplate(template.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                
                {/* Letters Pagination */}
                {(() => {
                  const filteredTemplates = letterTemplates.filter(template => {
                    const matchesSearch = template.title.toLowerCase().includes(letterSearchTerm.toLowerCase()) ||
                                        template.subject.toLowerCase().includes(letterSearchTerm.toLowerCase());
                    const matchesType = letterTypeFilter === 'all' || template.type === letterTypeFilter;
                    return matchesSearch && matchesType;
                  });
                  const paginationData = getPaginatedData(filteredTemplates, 'letters');
                  return (
                    <div className="mt-6">
                      <PaginationControls
                        tab="letters"
                        totalItems={paginationData.totalItems}
                        currentPage={paginationData.currentPage}
                        totalPages={paginationData.totalPages}
                        startIndex={paginationData.startIndex}
                        endIndex={paginationData.endIndex}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Empty State */}
              {letterTemplates.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-800 mb-2">No Letter Templates</h3>
                  <p className="text-secondary-600 mb-4">Create your first letter template to get started.</p>
                  <button 
                    onClick={() => setLetterModal({ isOpen: true, template: null, isEditing: false })}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                  >
                    Create Template
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'committee' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search committee members..."
                      value={committeeSearchTerm}
                      onChange={(e) => setCommitteeSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                    />
                  </div>
                  <select
                    value={committeeStatusFilter}
                    onChange={(e) => setCommitteeStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Members</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={loadCommitteeMembers}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Refresh
                  </button>
                  <button 
                    onClick={() => navigate('/portal/staff/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>

              {/* Committee Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Total Members</p>
                      <p className="text-2xl font-bold text-secondary-800">{committeeMembers.length}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Active Members</p>
                      <p className="text-2xl font-bold text-secondary-800">
                        {committeeMembers.filter(m => m.status === 'active').length}
                      </p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Avg Reviews</p>
                      <p className="text-2xl font-bold text-secondary-800">
                        {committeeMembers.length > 0 
                          ? Math.round(committeeMembers.reduce((sum, m) => sum + m.reviewedApplications, 0) / committeeMembers.length)
                          : 0
                        }
                      </p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Avg Score</p>
                      <p className="text-2xl font-bold text-secondary-800">
                        {committeeMembers.length > 0 
                          ? (committeeMembers.reduce((sum, m) => sum + m.averageScore, 0) / committeeMembers.length).toFixed(1)
                          : '0.0'
                        }
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Committee Members Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Member</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Committee Role</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Department</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Applications Reviewed</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Average Score</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredMembers = committeeMembers.filter(member => {
                          const matchesSearch = 
                            member.firstName.toLowerCase().includes(committeeSearchTerm.toLowerCase()) ||
                            member.lastName.toLowerCase().includes(committeeSearchTerm.toLowerCase()) ||
                            member.email.toLowerCase().includes(committeeSearchTerm.toLowerCase()) ||
                            member.department.toLowerCase().includes(committeeSearchTerm.toLowerCase());
                          const matchesStatus = committeeStatusFilter === 'all' || member.status === committeeStatusFilter;
                          return matchesSearch && matchesStatus;
                        });
                        const { paginatedData } = getPaginatedData(filteredMembers, 'committee');
                        return paginatedData.map((member) => (
                          <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-secondary-800">
                                  {member.firstName} {member.lastName}
                                </div>
                                <div className="text-sm text-secondary-500">{member.email}</div>
                                <div className="text-xs text-secondary-400">{member.position}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCommitteeRoleBadgeColor(member.committeeRole)}`}>
                                {getCommitteeRoleText(member.committeeRole)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="text-secondary-800">{member.department}</div>
                                {member.specialization && (
                                  <div className="text-xs text-secondary-500">{member.specialization}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-medium text-secondary-800">{member.reviewedApplications}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-secondary-800">
                                  {member.averageScore > 0 ? member.averageScore.toFixed(1) : '--'}
                                </span>
                                {member.averageScore > 0 && (
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full mr-1 ${
                                          i < Math.floor(member.averageScore / 2) ? 'bg-yellow-400' : 'bg-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => navigate(`/portal/staff/${member.id}`)}
                                  className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                  title="View Member Profile"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => navigate(`/portal/staff/${member.id}/edit`)}
                                  className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                                  title="Edit Member"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  
                  {/* Committee Pagination */}
                  {(() => {
                    const filteredMembers = committeeMembers.filter(member => {
                      const matchesSearch = 
                        member.firstName.toLowerCase().includes(committeeSearchTerm.toLowerCase()) ||
                        member.lastName.toLowerCase().includes(committeeSearchTerm.toLowerCase()) ||
                        member.email.toLowerCase().includes(committeeSearchTerm.toLowerCase()) ||
                        member.department.toLowerCase().includes(committeeSearchTerm.toLowerCase());
                      const matchesStatus = committeeStatusFilter === 'all' || member.status === committeeStatusFilter;
                      return matchesSearch && matchesStatus;
                    });
                    const paginationData = getPaginatedData(filteredMembers, 'committee');
                    return (
                      <PaginationControls
                        tab="committee"
                        totalItems={paginationData.totalItems}
                        currentPage={paginationData.currentPage}
                        totalPages={paginationData.totalPages}
                        startIndex={paginationData.startIndex}
                        endIndex={paginationData.endIndex}
                      />
                    );
                  })()}

                  {/* Empty State */}
                  {committeeMembers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Committee Members</h3>
                      <p className="text-secondary-600 mb-6">Add staff members to the admissions committee.</p>
                      <button 
                        onClick={() => navigate('/portal/staff/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add First Member</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              {/* Header with Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Competency Tests</h2>
                  <p className="text-secondary-600">Manage assessment tests for applicants</p>
                </div>
                <button
                  onClick={() => navigate('/portal/admissions/test/new')}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Test</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                      <input
                        type="text"
                        placeholder="Search tests..."
                        value={testSearchTerm}
                        onChange={(e) => setTestSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={testStatusFilter}
                      onChange={(e) => setTestStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tests Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Test</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Questions</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Time Limit</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Attempts</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Pass Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencyTests
                        .filter(test => 
                          test.title.toLowerCase().includes(testSearchTerm.toLowerCase()) ||
                          test.category.toLowerCase().includes(testSearchTerm.toLowerCase())
                        )
                        .filter(test => testStatusFilter === 'all' || test.status === testStatusFilter)
                        .map((test) => {
                          const stats = getTestStatistics(test.id);
                          return (
                            <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-secondary-800">{test.title}</p>
                                  <p className="text-sm text-secondary-600 line-clamp-1">{test.description}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeColor(test.difficulty)}`}>
                                      {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">{test.category}</td>
                              <td className="py-4 px-4">
                                <div className="text-center">
                                  <p className="font-medium text-secondary-800">{test.questions.length}</p>
                                  <p className="text-xs text-secondary-600">{test.totalPoints} pts</p>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">{test.timeLimit}m</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(test.status)}`}>
                                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-medium text-secondary-800">{stats.totalAttempts}</td>
                              <td className="py-4 px-4 text-center font-medium text-secondary-800">{stats.passRate}%</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => navigate(`/portal/admissions/test/${test.id}`)}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                    title="View/Edit test"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => navigate(`/portal/admissions/test/${test.id}/take`)}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                    title="Take test"
                                  >
                                    Take Test
                                  </button>
                                  <button
                                    onClick={() => navigate(`/portal/admissions/test/${test.id}/results`)}
                                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                                    title="View results"
                                  >
                                    Results
                                  </button>
                                  <button
                                    onClick={() => deleteCompetencyTest(test.id)}
                                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                                    title="Delete test"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {/* Empty State */}
                  {competencyTests.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Tests Created</h3>
                      <p className="text-secondary-600 mb-6">Create your first competency test to assess applicants.</p>
                      <button
                        onClick={() => navigate('/portal/admissions/test/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create First Test</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-secondary-800">68.5%</p>
                      <p className="text-sm text-green-600 font-medium">+5.2% from last month</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Avg. Review Time</p>
                      <p className="text-2xl font-bold text-secondary-800">3.2 days</p>
                      <p className="text-sm text-green-600 font-medium">-0.8 days improved</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Application Quality</p>
                      <p className="text-2xl font-bold text-secondary-800">7.8/10</p>
                      <p className="text-sm text-green-600 font-medium">+0.3 improvement</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <UserPlus className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Revenue Impact</p>
                      <p className="text-2xl font-bold text-secondary-800">$127K</p>
                      <p className="text-sm text-green-600 font-medium">+18% this quarter</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status Distribution */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Application Status Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { status: 'Approved', count: 156, percentage: 68.5, color: 'bg-green-500' },
                      { status: 'Under Review', count: 45, percentage: 19.7, color: 'bg-yellow-500' },
                      { status: 'Rejected', count: 18, percentage: 7.9, color: 'bg-red-500' },
                      { status: 'Pending', count: 9, percentage: 3.9, color: 'bg-gray-500' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-secondary-700">{item.status}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-secondary-600">{item.count}</span>
                            <span className="text-sm text-secondary-500">({item.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Application Trends */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Monthly Application Trends</h3>
                  <div className="h-64 flex items-end space-x-2">
                    {[
                      { month: 'Jan', apps: 45, approved: 32 },
                      { month: 'Feb', apps: 52, approved: 38 },
                      { month: 'Mar', apps: 61, approved: 41 },
                      { month: 'Apr', apps: 48, approved: 35 },
                      { month: 'May', apps: 67, approved: 48 },
                      { month: 'Jun', apps: 58, approved: 42 },
                    ].map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center space-y-1 mb-2">
                          <div 
                            className="w-full bg-primary-200 rounded-t"
                            style={{ height: `${(data.apps / 70) * 200}px` }}
                          ></div>
                          <div 
                            className="w-full bg-primary-600 rounded-b"
                            style={{ height: `${(data.approved / 70) * 200}px` }}
                          ></div>
                        </div>
                        <span className="text-xs text-secondary-600">{data.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary-200 rounded"></div>
                      <span className="text-secondary-600">Total Applications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary-600 rounded"></div>
                      <span className="text-secondary-600">Approved</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Performance */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Program Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Applications</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Approved</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Conversion Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Avg. Score</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Sales Foundations', apps: 89, approved: 67, rate: 75.3, score: 8.1, revenue: 45200 },
                        { name: 'Advanced Sales Strategies', apps: 76, approved: 48, rate: 63.2, score: 7.8, revenue: 38400 },
                        { name: 'Sales Leadership', apps: 34, approved: 26, rate: 76.5, score: 8.4, revenue: 31200 },
                        { name: 'Digital Sales Mastery', apps: 52, approved: 38, rate: 73.1, score: 8.0, revenue: 28800 },
                      ].map((program, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-4 px-4 font-medium text-secondary-800">{program.name}</td>
                          <td className="py-4 px-4 text-secondary-600">{program.apps}</td>
                          <td className="py-4 px-4 text-secondary-600">{program.approved}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-secondary-800 font-medium">{program.rate}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full" 
                                  style={{ width: `${program.rate}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-secondary-600">{program.score}/10</td>
                          <td className="py-4 px-4 font-medium text-secondary-800">${program.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admissions;