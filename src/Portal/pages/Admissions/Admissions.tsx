import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter, Plus, Eye, CheckCircle, XCircle, Clock, Users, TrendingUp, Edit, X, FileText, Copy, Trash2, Download, BarChart3, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
  intake?: string;
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



interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  designations: string[];
  status: 'active' | 'inactive' | 'on_leave';
  type: 'teaching' | 'administrative' | 'support';
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

interface ViewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  testAttempt: TestAttempt | null;
}

interface ConvertToCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cohortId: string, reason: string) => void;
  applicant: Applicant | null;
  testAttempt: TestAttempt | null;
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
                  ? 'Enter approval notes, intake information, or additional instructions...'
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

const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ isOpen, onClose, applicant, testAttempt }) => {
  const [activeProfileTab, setActiveProfileTab] = useState('personal');
  
  if (!isOpen || !applicant) return null;

  const profileTabs = [
    { id: 'personal', label: 'Employee Information' },
    { id: 'education', label: 'Education' },
    { id: 'work', label: 'Work Experience' },
    { id: 'results', label: 'Test Results' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-secondary-800">Applicant Profile</h3>
            <p className="text-secondary-600">{applicant.firstName} {applicant.lastName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeProfileTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-600 hover:text-secondary-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Personal Information Tab */}
          {activeProfileTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-secondary-800 mb-4">Personal Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Full Name</label>
                      <p className="text-secondary-800">{applicant.firstName} {applicant.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Email</label>
                      <p className="text-secondary-800">{applicant.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Phone Number</label>
                      <p className="text-secondary-800">{applicant.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Application Number</label>
                      <p className="text-secondary-800">{applicant.applicationNumber}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-secondary-800 mb-4">Application Status</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Status</label>
                      <p className="text-secondary-800">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          applicant.status === 'approved' ? 'bg-green-100 text-green-800' :
                          applicant.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          applicant.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1).replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Payment Status</label>
                      <p className="text-secondary-800">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          applicant.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          applicant.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {applicant.paymentStatus.charAt(0).toUpperCase() + applicant.paymentStatus.slice(1).replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Amount Paid</label>
                      <p className="text-secondary-800">KSh {applicant.amountPaid?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Submitted Date</label>
                      <p className="text-secondary-800">{new Date(applicant.submittedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeProfileTab === 'education' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-secondary-800">Education Background</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-secondary-600">Education details would be displayed here when available in the applicant data structure.</p>
              </div>
            </div>
          )}

          {/* Work Experience Tab */}
          {activeProfileTab === 'work' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-secondary-800">Work Experience</h4>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-sm font-medium text-secondary-600">Current Job Title</label>
                  <p className="text-secondary-800">{applicant.currentJobTitle || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-600">Current Organization</label>
                  <p className="text-secondary-800">{applicant.currentOrganisation || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-600">Sales Experience</label>
                  <p className="text-secondary-800">{applicant.salesExperience || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-600">Key Achievements</label>
                  <p className="text-secondary-800">{applicant.keyAchievements || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-600">Learning Goals</label>
                  <p className="text-secondary-800">{applicant.learningGoals || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Results Tab */}
          {activeProfileTab === 'results' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-secondary-800">Test Results</h4>
              {testAttempt ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-blue-600 mb-1">Score</p>
                      <p className="text-2xl font-bold text-blue-800">{testAttempt.percentage}%</p>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${testAttempt.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`text-sm font-medium mb-1 ${testAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>Result</p>
                      <p className={`text-2xl font-bold ${testAttempt.passed ? 'text-green-800' : 'text-red-800'}`}>
                        {testAttempt.passed ? 'PASSED' : 'FAILED'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-purple-600 mb-1">Time</p>
                      <p className="text-2xl font-bold text-purple-800">{testAttempt.timeSpent}m</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-600">Test Completed</label>
                    <p className="text-secondary-800">{new Date(testAttempt.submittedAt || testAttempt.endTime || '').toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-secondary-600">No test results available for this applicant.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
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

const ConvertToCohortModal: React.FC<ConvertToCohortModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  applicant, 
  testAttempt 
}) => {
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [cohorts, setCohorts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCohorts();
      setReason('');
      setSelectedCohortId('');
    }
  }, [isOpen]);

  const loadCohorts = async () => {
    try {
      const result = await FirestoreService.getCollection('cohorts');
      if (result.success) {
        setCohorts(result.data || []);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !reason.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(selectedCohortId, reason.trim());
      onClose();
    } catch (error) {
      console.error('Error converting to cohort:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !applicant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-secondary-800">Convert to Cohort</h3>
            <p className="text-secondary-600">{applicant.firstName} {applicant.lastName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Applicant Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary-800 mb-2">Applicant Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Email:</span>
                <span className="ml-2 text-secondary-800">{applicant.email}</span>
              </div>
              <div>
                <span className="text-secondary-600">Application:</span>
                <span className="ml-2 text-secondary-800">{applicant.applicationNumber}</span>
              </div>
              {testAttempt && (
                <>
                  <div>
                    <span className="text-secondary-600">Test Score:</span>
                    <span className="ml-2 text-secondary-800">{testAttempt.percentage}%</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Test Result:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      testAttempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {testAttempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cohort Selection */}
          <div>
            <label htmlFor="cohort" className="block text-sm font-medium text-secondary-700 mb-2">
              Select Cohort *
            </label>
            <select
              id="cohort"
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Choose a cohort...</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} - {cohort.programName} ({cohort.startDate})
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-secondary-700 mb-2">
              Reason for Conversion *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Provide a reason for converting this applicant to the selected cohort..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-secondary-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCohortId || !reason.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>Convert to Cohort</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Admissions: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuthContext();
  // Role-based access control
  const isAdmin = userProfile?.role === 'admin';
  const isStaff = userProfile?.role === 'staff';
  
  const [activeTab, setActiveTab] = useState(isAdmin ? 'analytics' : 'applications');
  const [applications, setApplications] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [applicationFeedback, setApplicationFeedback] = useState<ApplicationFeedback[]>([]);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    applicant: null as Applicant | null,
    existingFeedback: null as ApplicationFeedback | null
  });
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  
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
  const [viewProfileModal, setViewProfileModal] = useState({
    isOpen: false,
    applicant: null as Applicant | null,
    testAttempt: null as TestAttempt | null
  });
  const [convertToCohortModal, setConvertToCohortModal] = useState({
    isOpen: false,
    applicant: null as Applicant | null,
    testAttempt: null as TestAttempt | null
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
    applications: { currentPage: 1, itemsPerPage: 15 },
    intakes: { currentPage: 1, itemsPerPage: 15 },
    letters: { currentPage: 1, itemsPerPage: 15 },
    committee: { currentPage: 1, itemsPerPage: 15 },
    tests: { currentPage: 1, itemsPerPage: 15 }
  });

  const stats = [
    { title: 'Total Applications', value: applications.length.toString(), change: '+23%', icon: UserPlus, color: 'primary' },
    { title: 'Active Intakes', value: intakes.filter(intake => intake.status === 'active').length.toString(), change: '+12%', icon: Users, color: 'secondary' },
    { title: 'Approved', value: applications.filter(app => app.status === 'approved').length.toString(), change: '+18%', icon: CheckCircle, color: 'accent' },
    { title: 'Pending Review', value: applications.filter(app => app.status === 'pending' || app.status === 'under_review').length.toString(), change: '+8', icon: Clock, color: 'yellow' },
  ];

  useEffect(() => {
    if (userProfile?.role === 'applicant') {
      checkUserApplication();
    } else {
      loadData();
      loadAllStaff();
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
      // Load applications, programs, and intakes with learner counts
      const [applicationsResult, programsResult] = await Promise.all([
        FirestoreService.getAll('applicants'),
        ProgramService.getAll('programs')
      ]);
      
      if (applicationsResult.success && applicationsResult.data) {
        setApplications(applicationsResult.data);
      }
      
      if (programsResult.success && programsResult.data) {
        setPrograms(programsResult.data);
      }
      
      // Load intakes with learner counts using the dedicated function
      await loadIntakes();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };



  const loadAllStaff = async () => {
    try {
      const result = await FirestoreService.getAll('staff');
      if (result.success && result.data) {
        setAllStaff(result.data as StaffMember[]);
      }
    } catch (error) {
      console.error('Error loading all staff:', error);
    }
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

  const handleConvertToCohort = async (cohortId: string, reason: string) => {
    const { applicant, testAttempt } = convertToCohortModal;
    if (!applicant || !testAttempt) return;

    try {
      // Step 1: Create learner record
      const learnerData = {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        phoneNumber: applicant.phoneNumber,
        cohortId: cohortId,
        applicationId: applicant.id,
        applicationNumber: applicant.applicationNumber,
        testScore: testAttempt.percentage,
        testPassed: testAttempt.passed,
        conversionReason: reason,
        status: 'active',
        enrollmentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || ''
      };

      const learnerResult = await FirestoreService.create('learners', learnerData);
      if (!learnerResult.success) {
        throw new Error('Failed to create learner record');
      }

      // Step 2: Create user record for authentication
      const userData = {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        phoneNumber: applicant.phoneNumber,
        role: 'learner',
        status: 'active',
        learnerId: learnerResult.id,
        cohortId: cohortId,
        hasFirebaseAuth: false, // They'll set up password on first login
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || ''
      };

      const userResult = await FirestoreService.create('users', userData);
      if (!userResult.success) {
        // Rollback learner creation if user creation fails
        await FirestoreService.delete('learners', learnerResult.id);
        throw new Error('Failed to create user record');
      }

      // Step 3: Update applicant status
      await FirestoreService.update('applicants', applicant.id, {
        status: 'approved',
        admittedProgram: cohortId,
        conversionDate: new Date().toISOString(),
        conversionReason: reason,
        learnerId: learnerResult.id,
        updatedAt: new Date().toISOString()
      });

      // Close modal and refresh data
      setConvertToCohortModal({ isOpen: false, applicant: null, testAttempt: null });
      loadData(); // Refresh the applicants data
      
      alert(`${applicant.firstName} ${applicant.lastName} has been successfully converted to a learner!`);
    } catch (error) {
      console.error('Error converting to cohort:', error);
      alert('Error converting applicant to learner. Please try again.');
      throw error; // Re-throw so the modal can handle the loading state
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

  const loadIntakes = async () => {
    try {
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        // Calculate enrolled count for each intake by counting learners with matching intakeId
        const intakesWithCounts = await Promise.all(
          result.data.map(async (intake: any) => {
            try {
              const learnersResult = await FirestoreService.getWithQuery('learners', [
                { field: 'intakeId', operator: '==', value: intake.id }
              ]);
              
              const enrolledCount = learnersResult.success && learnersResult.data 
                ? learnersResult.data.length 
                : 0;
              
              return {
                ...intake,
                enrolledCount
              };
            } catch (error) {
              console.error(`Error counting learners for intake ${intake.id}:`, error);
              return {
                ...intake,
                enrolledCount: 0
              };
            }
          })
        );
        
        // Sort intakes by date: recent/upcoming first, then by status
        const sortedIntakes = intakesWithCounts.sort((a: any, b: any) => {
          const aDate = new Date(a.startDate);
          const bDate = new Date(b.startDate);
          
          // Priority order: upcoming > active > completed/cancelled
          const statusPriority = {
            'upcoming': 1,
            'active': 2, 
            'draft': 3,
            'completed': 4,
            'cancelled': 5
          };
          
          // First sort by status priority
          const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 6;
          const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 6;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Within same status, sort by date:
          // - For upcoming/active: earliest first
          // - For completed: most recent first
          if (a.status === 'upcoming' || a.status === 'active' || a.status === 'draft') {
            return aDate.getTime() - bDate.getTime(); // Earlier dates first
          } else {
            return bDate.getTime() - aDate.getTime(); // Later dates first for completed
          }
        });
        
        setIntakes(sortedIntakes);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const result = await FirestoreService.getAll('applicants');
      if (result.success && result.data) {
        // Sort applications by submission date, newest first
        const sortedApplications = result.data.sort((a: any, b: any) => 
          new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
        );
        setApplications(sortedApplications);
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
    console.log('🔄 Starting conversion of applicant to learner:', applicant.email);
    console.log('👤 Current user role:', userProfile?.role);
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
      
      // Get the selected intake details
      const selectedIntake = intakes.find(i => i.id === applicant.intake);
      
      // Determine the correct fee amount - prioritize intake programCost, fallback to program fees, then 0
      const expectedAmount = selectedIntake?.programCost || selectedProgram?.fees || 0;
      
      // Create learner data - simplified for debugging
      const learnerData = {
        studentId,
        firstName: applicant.firstName || '',
        lastName: applicant.lastName || '',
        email: applicant.email,
        phoneNumber: applicant.phoneNumber || '',
        programId: applicant.programId || '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        academicStatus: 'active',
        intakeId: applicant.intake || '',
        intakeName: selectedIntake?.name || '',
        totalFees: expectedAmount || 0,
        amountPaid: applicant.amountPaid || 0,
        outstandingBalance: Math.max(0, (expectedAmount || 0) - (applicant.amountPaid || 0)),
        role: 'learner'
      };
      
      // Log the simplified data structure
      console.log('🎓 Simplified learner data for debugging:', JSON.stringify(learnerData, null, 2));

      // Create learner in learners collection using the same method as the working manual script
      console.log('🎓 Creating learner with data:', { 
        studentId, 
        email: applicant.email,
        programId: applicant.programId,
        intakeId: applicant.intake
      });
      console.log('🎓 Full learner data object:', JSON.stringify(learnerData, null, 2));
      
      // Add the timestamps that FirestoreService.create would add
      const learnerDataWithTimestamps = {
        ...learnerData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const learnerResult = await FirestoreService.create('learners', learnerDataWithTimestamps);
      console.log('📝 Learner creation result:', learnerResult);
      console.log('📝 Learner creation success:', learnerResult.success);
      console.log('📝 Learner creation error:', learnerResult.error);
      console.log('📝 Learner creation data:', learnerResult.data);
      
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

        console.log('✅ Learner creation successful! Student ID:', studentId);
        
        // Verify learner was actually created
        try {
          const verificationResult = await FirestoreService.getWithQuery('learners', [
            { field: 'email', operator: '==', value: applicant.email }
          ]);
          
          if (verificationResult.success && verificationResult.data && verificationResult.data.length > 0) {
            console.log('✅ VERIFIED: Learner exists in database:', verificationResult.data[0]);
          } else {
            console.error('❌ VERIFICATION FAILED: Learner not found in database after creation!');
          }
        } catch (verifyError) {
          console.error('❌ Error verifying learner creation:', verifyError);
        }
        
        return true;
      } else {
        console.error('❌ Failed to create learner:', learnerResult);
        console.error('❌ Error details:', JSON.stringify(learnerResult, null, 2));
        if (learnerResult.error && (learnerResult.error.includes('permission') || learnerResult.error.includes('PERMISSION_DENIED'))) {
          console.error('🚫 Permission denied - make sure user has staff role');
        }
        alert(`❌ LEARNER CREATION FAILED:\n\nError: ${learnerResult.error || 'Unknown error'}\n\nFull details logged to console.`);
        return false;
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in convertApplicantToLearner:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      alert(`❌ CONVERSION FAILED:\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for full details.`);
      return false;
    }
  };

  const handleApproveApplication = async (applicant: Applicant, reason: string) => {
    try {
      // First, convert applicant to learner
      const conversionSuccess = await convertApplicantToLearner(applicant);
      
      if (!conversionSuccess) {
        alert('❌ CRITICAL ERROR: Failed to convert applicant to learner.\n\nThis means the learner record was NOT created.\nCheck browser console for details.\n\nPossible causes:\n• User lacks staff permissions\n• Firestore rules blocking creation\n• Network/connection issue');
        return;
      }
      
      console.log('✅ Learner conversion successful, proceeding with status update');

      // Update application status with feedback
      const feedback = applicant.feedback || [];
      feedback.push({
        date: new Date().toISOString().split('T')[0],
        message: reason,
        author: userProfile?.displayName || 'Admin'
      });

      const selectedProgram = programs.find(p => p.id === applicant.programId);
      const updateData = {
        status: 'admitted',
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
    ...(isAdmin ? [{ id: 'analytics', label: 'Analytics' }] : []),
    { id: 'applications', label: 'Applications' },
    { id: 'intakes', label: 'Intakes' },
    { id: 'tests', label: 'Test Results' },
    { id: 'admissions', label: 'Admissions' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-accent-100 text-accent-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'admitted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'admitted': return 'Admitted';
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

  const handleApprovalAction = async (reason: string) => {
    if (!actionModal.applicant) return;

    try {
      const status = actionModal.type === 'approve' ? 'approved' : 'rejected';
      const result = await FirestoreService.update('applicants', actionModal.applicant.id, {
        status,
        feedback: [
          ...(actionModal.applicant.feedback || []),
          {
            date: new Date().toISOString(),
            message: reason,
            author: userProfile?.displayName || user?.email || 'System'
          }
        ]
      });

      if (result.success) {
        // If approving, optionally convert to learner
        if (actionModal.type === 'approve') {
          await convertApplicantToLearner(actionModal.applicant);
        }
        
        // Reload applications to show updated status
        await loadData();
        alert(`Application ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application. Please try again.');
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
              userApplication?.status === 'approved' || userApplication?.status === 'admitted' ? 'bg-green-100 text-green-800' :
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
                  userApplication?.status === 'approved' || userApplication?.status === 'admitted' ? 'bg-green-500' :
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
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
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/portal/admissions/applicants/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Application</span>
                  </button>
                )}
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
                                
                                
                                {app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'admitted' && (
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

          {activeTab === 'intakes' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Search intakes..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                  <button 
                    onClick={loadIntakes}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/portal/admissions/intakes/new')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Intake</span>
                  </button>
                )}
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
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Intake ID</th>
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
                                        const filteredIntakes = intakes.filter(intake =>
                  intake.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  intake.intakeId?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                const { paginatedData } = getPaginatedData(filteredIntakes, 'intakes');
                return paginatedData.map((intake) => {
                  const program = programs.find(p => p.id === intake.programId);
                  const isActive = new Date(intake.startDate) <= new Date() && new Date(intake.closeDate) >= new Date();
                  const isUpcoming = new Date(intake.startDate) > new Date();
                  const isPast = new Date(intake.closeDate) < new Date();
                          
                          return (
                            <tr key={intake.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                              <td className="py-4 px-4 font-medium text-secondary-800">{intake.intakeId || 'N/A'}</td>
                              <td className="py-4 px-4">
                                <div className="font-medium text-secondary-800">{intake.name}</div>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">{program?.programName || 'N/A'}</td>
                              <td className="py-4 px-4 text-secondary-600">
                                {intake.startDate ? new Date(intake.startDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-4 px-4 text-secondary-600">
                                {intake.applicationDeadline ? new Date(intake.applicationDeadline).toLocaleDateString() : 'N/A'}
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
                              <td className="py-4 px-4 text-secondary-600">{intake.enrolledCount || 0}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => navigate(`/portal/admissions/intakes/${intake.id}`)}
                                    className="p-1 text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                                    title="View Intake"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/portal/admissions/intakes/${intake.id}/edit`)}
                                    className="p-1 text-secondary-400 hover:text-blue-600 transition-colors duration-200"
                                    title="Edit Intake"
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
                  
                  {/* Intakes Pagination */}
                  {(() => {
                    const filteredIntakes = intakes.filter(intake => 
                      intake.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      intake.intakeId?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    const paginationData = getPaginatedData(filteredIntakes, 'intakes');
                    return (
                      <PaginationControls
                        tab="intakes"
                        totalItems={paginationData.totalItems}
                        currentPage={paginationData.currentPage}
                        totalPages={paginationData.totalPages}
                        startIndex={paginationData.startIndex}
                        endIndex={paginationData.endIndex}
                      />
                    );
                  })()}
                  
                  {intakes.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Intakes Yet</h3>
                      <p className="text-secondary-600 mb-6">Create your first intake to get started.</p>
                      <button 
                        onClick={() => navigate('/portal/admissions/intakes/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Intake</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Test Results</h2>
                  <p className="text-secondary-600">View all test attempts and results from applicants</p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                      <input
                        type="text"
                        placeholder="Search by applicant name or test..."
                        value={resultSearchTerm}
                        onChange={(e) => setResultSearchTerm(e.target.value)}
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
                      <option value="all">All Results</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Test Results Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Applicant</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Test</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Result</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Time Taken</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testAttempts
                        .filter(attempt => 
                          attempt.applicantName.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                          attempt.applicantEmail.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                          competencyTests.find(t => t.id === attempt.testId)?.title.toLowerCase().includes(resultSearchTerm.toLowerCase())
                        )
                        .filter(attempt => {
                          if (testStatusFilter === 'all') return true;
                          if (testStatusFilter === 'passed') return attempt.passed;
                          if (testStatusFilter === 'failed') return !attempt.passed;
                          if (testStatusFilter === 'completed') return attempt.status === 'completed';
                          return true;
                        })
                        .sort((a, b) => new Date(b.submittedAt || b.endTime || '').getTime() - new Date(a.submittedAt || a.endTime || '').getTime())
                        .map((attempt) => {
                          const test = competencyTests.find(t => t.id === attempt.testId);
                          return (
                            <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-secondary-800">{attempt.applicantName}</p>
                                  <p className="text-sm text-secondary-600">{attempt.applicantEmail}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-secondary-800">{test?.title || 'Unknown Test'}</p>
                                  <p className="text-sm text-secondary-600">{test?.category || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-center">
                                  <p className="font-medium text-secondary-800">{attempt.percentage}%</p>
                                  <p className="text-xs text-secondary-600">{attempt.totalScore}/{test?.totalPoints || 0} pts</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  attempt.passed 
                                    ? 'bg-green-100 text-green-800' 
                                    : attempt.status === 'completed' 
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {attempt.passed ? 'Passed' : attempt.status === 'completed' ? 'Failed' : attempt.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">{attempt.timeSpent}m</td>
                              <td className="py-4 px-4 text-secondary-600">
                                {new Date(attempt.submittedAt || attempt.endTime || '').toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setResultDetailModal({
                                      isOpen: true,
                                      attempt,
                                      test: test || null
                                    })}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center space-x-1"
                                    title="View detailed results"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>View Results</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {/* Empty State */}
                  {testAttempts.length === 0 && (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Test Results</h3>
                      <p className="text-secondary-600 mb-6">Test results will appear here once applicants complete assessments.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admissions' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Admissions</h2>
                  <p className="text-secondary-600">Manage applicants who have passed tests and are ready for admission</p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                      <input
                        type="text"
                        placeholder="Search by applicant name..."
                        value={resultSearchTerm}
                        onChange={(e) => setResultSearchTerm(e.target.value)}
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
                      <option value="all">All Passed</option>
                      <option value="pending_admission">Pending Admission</option>
                      <option value="admitted">Admitted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admissions Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Applicant</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Test</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Date Passed</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testAttempts
                        .filter(attempt => attempt.passed) // Only show passed tests
                        .filter(attempt => 
                          attempt.applicantName.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                          attempt.applicantEmail.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                          competencyTests.find(t => t.id === attempt.testId)?.title.toLowerCase().includes(resultSearchTerm.toLowerCase())
                        )
                        .sort((a, b) => new Date(b.submittedAt || b.endTime || '').getTime() - new Date(a.submittedAt || a.endTime || '').getTime())
                        .map((attempt) => {
                          const test = competencyTests.find(t => t.id === attempt.testId);
                          return (
                            <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-secondary-800">{attempt.applicantName}</p>
                                  <p className="text-sm text-secondary-600">{attempt.applicantEmail}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-secondary-800">{test?.title || 'Unknown Test'}</p>
                                  <p className="text-sm text-secondary-600">{test?.category || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-center">
                                  <p className="font-medium text-secondary-800">{attempt.percentage}%</p>
                                  <p className="text-xs text-secondary-600">{attempt.totalScore}/{test?.totalPoints || 0} pts</p>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-secondary-600">
                                {new Date(attempt.submittedAt || attempt.endTime || '').toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Passed
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={async () => {
                                      // Find the applicant data based on the test attempt
                                      const applicant = applicants.find(app => app.email === attempt.applicantEmail);
                                      if (applicant) {
                                        setViewProfileModal({
                                          isOpen: true,
                                          applicant,
                                          testAttempt: attempt
                                        });
                                      }
                                    }}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center space-x-1"
                                    title="View applicant profile"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>View Profile</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      // Find the applicant data based on the test attempt
                                      const applicant = applicants.find(app => app.email === attempt.applicantEmail);
                                      if (applicant) {
                                        setConvertToCohortModal({
                                          isOpen: true,
                                          applicant,
                                          testAttempt: attempt
                                        });
                                      }
                                    }}
                                    className="text-accent-600 hover:text-accent-700 font-medium text-sm flex items-center space-x-1 ml-3"
                                    title="Convert to cohort"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    <span>Convert to Cohort</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {/* Empty State */}
                  {testAttempts.filter(attempt => attempt.passed).length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Qualified Applicants</h3>
                      <p className="text-secondary-600 mb-6">Qualified applicants who have passed tests will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Admissions Analytics</h2>
                  <p className="text-secondary-600">Comprehensive overview of all admissions activities and performance metrics</p>
                </div>
              </div>

              {/* Key Metrics Cards - Dynamic calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Total Applications</p>
                      <p className="text-2xl font-bold text-secondary-800">{applications.length}</p>
                      <p className="text-sm text-blue-600 font-medium">All submissions</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Active Intakes</p>
                      <p className="text-2xl font-bold text-secondary-800">{intakes.filter(i => i.status === 'active').length}</p>
                      <p className="text-sm text-green-600 font-medium">Currently open</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Test Attempts</p>
                      <p className="text-2xl font-bold text-secondary-800">{testAttempts.length}</p>
                      <p className="text-sm text-purple-600 font-medium">All assessments</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Qualified Applicants</p>
                      <p className="text-2xl font-bold text-secondary-800">{testAttempts.filter(t => t.passed).length}</p>
                      <p className="text-sm text-accent-600 font-medium">Ready for admission</p>
                    </div>
                    <div className="bg-accent-100 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-accent-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Pass Rate</p>
                      <p className="text-2xl font-bold text-secondary-800">
                        {testAttempts.length > 0 ? Math.round((testAttempts.filter(t => t.passed).length / testAttempts.length) * 100) : 0}%
                      </p>
                      <p className="text-sm text-yellow-600 font-medium">Test success rate</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab-Specific Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status Distribution */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Application Status Distribution</h3>
                  <div className="space-y-4">
                    {(() => {
                      const statusCounts = applications.reduce((acc, app) => {
                        acc[app.status] = (acc[app.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const total = applications.length;
                      const statusData = [
                        { status: 'Approved', count: statusCounts.approved || 0, color: 'bg-green-500' },
                        { status: 'Under Review', count: statusCounts.under_review || 0, color: 'bg-yellow-500' },
                        { status: 'Rejected', count: statusCounts.rejected || 0, color: 'bg-red-500' },
                        { status: 'Pending', count: statusCounts.pending || 0, color: 'bg-gray-500' },
                      ];

                      return statusData.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded ${item.color}`}></div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-secondary-700">{item.status}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-secondary-600">{item.count}</span>
                              <span className="text-sm text-secondary-500">
                                ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Intakes Analytics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Intakes Overview</h3>
                  <div className="space-y-4">
                    {(() => {
                      const statusCounts = intakes.reduce((acc, intake) => {
                        acc[intake.status] = (acc[intake.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const total = intakes.length;
                      const intakeData = [
                        { status: 'Active', count: statusCounts.active || 0, color: 'bg-green-500' },
                        { status: 'Upcoming', count: statusCounts.upcoming || 0, color: 'bg-blue-500' },
                        { status: 'Closed', count: statusCounts.closed || 0, color: 'bg-gray-500' },
                        { status: 'Cancelled', count: statusCounts.cancelled || 0, color: 'bg-red-500' },
                      ];

                      return intakeData.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded ${item.color}`}></div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-secondary-700">{item.status}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-secondary-600">{item.count}</span>
                              <span className="text-sm text-secondary-500">
                                ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Test Results Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Test Performance Metrics</h3>
                  <div className="space-y-4">
                    {(() => {
                      if (testAttempts.length === 0) {
                        return (
                          <div className="text-center py-8 text-secondary-600">
                            No test data available
                          </div>
                        );
                      }

                      const avgScore = testAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / testAttempts.length;
                      const passedCount = testAttempts.filter(t => t.passed).length;
                      const failedCount = testAttempts.length - passedCount;
                      const avgTimeSpent = testAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / testAttempts.length;

                      return (
                        <>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Average Score</span>
                            <span className="text-lg font-bold text-secondary-800">{avgScore.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Tests Passed</span>
                            <span className="text-lg font-bold text-green-600">{passedCount}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Tests Failed</span>
                            <span className="text-lg font-bold text-red-600">{failedCount}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Avg. Time Spent</span>
                            <span className="text-lg font-bold text-secondary-800">{avgTimeSpent.toFixed(1)}m</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Admissions Pipeline</h3>
                  <div className="space-y-4">
                    {(() => {
                      const qualifiedApplicants = testAttempts.filter(t => t.passed);
                      const totalRevenue = applications.reduce((sum, app) => sum + (app.amountPaid || 0), 0);
                      const paidApplications = applications.filter(app => app.paymentStatus === 'paid').length;
                      
                      return (
                        <>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Qualified for Admission</span>
                            <span className="text-lg font-bold text-accent-600">{qualifiedApplicants.length}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Fully Paid Applications</span>
                            <span className="text-lg font-bold text-green-600">{paidApplications}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Total Revenue</span>
                            <span className="text-lg font-bold text-secondary-800">KSh {totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-secondary-700">Conversion Rate</span>
                            <span className="text-lg font-bold text-yellow-600">
                              {applications.length > 0 ? Math.round((qualifiedApplicants.length / applications.length) * 100) : 0}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Program Performance Table */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Program Performance Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Program</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Applications</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Tests Taken</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Pass Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Avg. Score</th>
                        <th className="text-left py-3 px-4 font-medium text-secondary-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const programStats = programs.map(program => {
                          const programApps = applications.filter(app => app.programId === program.id);
                          const programTests = testAttempts.filter(attempt => 
                            programApps.some(app => app.email === attempt.applicantEmail)
                          );
                          const passedTests = programTests.filter(t => t.passed);
                          const avgScore = programTests.length > 0 
                            ? programTests.reduce((sum, t) => sum + t.percentage, 0) / programTests.length 
                            : 0;
                          const revenue = programApps.reduce((sum, app) => sum + (app.amountPaid || 0), 0);
                          const passRate = programTests.length > 0 
                            ? (passedTests.length / programTests.length) * 100 
                            : 0;

                          return {
                            name: program.programName || program.name || 'Unknown Program',
                            applications: programApps.length,
                            tests: programTests.length,
                            passRate: passRate,
                            avgScore: avgScore,
                            revenue: revenue
                          };
                        });

                        if (programStats.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-secondary-600">
                                No program data available
                              </td>
                            </tr>
                          );
                        }

                        return programStats.map((program, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-4 px-4 font-medium text-secondary-800">{program.name}</td>
                            <td className="py-4 px-4 text-secondary-600">{program.applications}</td>
                            <td className="py-4 px-4 text-secondary-600">{program.tests}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  program.passRate >= 70 ? 'text-green-600' : 
                                  program.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {program.passRate.toFixed(1)}%
                                </span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      program.passRate >= 70 ? 'bg-green-500' : 
                                      program.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(program.passRate, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-secondary-600">{program.avgScore.toFixed(1)}%</td>
                            <td className="py-4 px-4 font-medium text-secondary-800">
                              KSh {program.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions & Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-primary-100">
                    <h4 className="font-semibold text-secondary-800 mb-2">Applications Needing Review</h4>
                    <p className="text-2xl font-bold text-yellow-600 mb-2">
                      {applications.filter(app => app.status === 'under_review').length}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Waiting for staff review
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-primary-100">
                    <h4 className="font-semibold text-secondary-800 mb-2">Pending Test Takers</h4>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {applications.filter(app => 
                        app.status === 'approved' && 
                        !testAttempts.some(t => t.applicantEmail === app.email)
                      ).length}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Approved but haven't taken tests
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-primary-100">
                    <h4 className="font-semibold text-secondary-800 mb-2">Ready for Admission</h4>
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      {testAttempts.filter(t => t.passed).length}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Passed tests, ready to convert
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: 'approve', applicant: null })}
        onConfirm={handleApprovalAction}
        type={actionModal.type}
        applicant={actionModal.applicant}
      />

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, applicant: null, existingFeedback: null })}
        onSubmit={submitFeedback}
        applicant={feedbackModal.applicant}
        existingFeedback={feedbackModal.existingFeedback}
      />

      <TestModal
        isOpen={testModal.isOpen}
        onClose={() => setTestModal({ isOpen: false, test: null, isEditing: false })}
        onSave={saveCompetencyTest}
        test={testModal.test}
        isEditing={testModal.isEditing}
      />

      <QuestionModal
        isOpen={questionModal.isOpen}
        onClose={() => setQuestionModal({ isOpen: false, question: null, isEditing: false, questionNumber: 1 })}
        onSave={saveQuestion}
        question={questionModal.question}
        isEditing={questionModal.isEditing}
        questionNumber={questionModal.questionNumber}
      />

      <ResultDetailModal
        isOpen={resultDetailModal.isOpen}
        onClose={() => setResultDetailModal({ isOpen: false, attempt: null, test: null })}
        attempt={resultDetailModal.attempt}
        test={resultDetailModal.test}
      />

      <ViewProfileModal
        isOpen={viewProfileModal.isOpen}
        onClose={() => setViewProfileModal({ isOpen: false, applicant: null, testAttempt: null })}
        applicant={viewProfileModal.applicant}
        testAttempt={viewProfileModal.testAttempt}
      />

      <ConvertToCohortModal
        isOpen={convertToCohortModal.isOpen}
        onClose={() => setConvertToCohortModal({ isOpen: false, applicant: null, testAttempt: null })}
        onConfirm={handleConvertToCohort}
        applicant={convertToCohortModal.applicant}
        testAttempt={convertToCohortModal.testAttempt}
      />
    </div>
  );
};

export default Admissions;