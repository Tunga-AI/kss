import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, Plus, Edit, Trash2, Search, Filter, Calendar, Clock, Users, Star,
  CheckCircle, AlertCircle, Target, BarChart3, TrendingUp, FileText,
  Award, MessageSquare, Eye, Play, BookOpen, ArrowUp, ArrowDown,
  ExternalLink, Download, Share2, Settings, Send, Check, AlertTriangle
} from 'lucide-react';
import { 
  MonitoringService, 
  Assessment, 
  TrainerReview, 
  AssessmentData, 
  TrainerReviewData,
  AssessmentQuestion,
  AssessmentSubmission,
  AssessmentResponse
} from '../../../services/monitoringService';

interface AssessmentPreviewProps {
  assessment: Assessment;
  onClose: () => void;
}

const AssessmentPreview: React.FC<AssessmentPreviewProps> = ({ assessment, onClose }) => {
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'submissions' | 'results'>('preview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [assessment.id]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const result = await MonitoringService.getAssessmentSubmissions(assessment.id);
      if (result.success && result.data) {
        setSubmissions(result.data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      const result = await MonitoringService.gradeSubmission(submissionId, score, feedback, 'current_user_id');
      if (result.success) {
        loadSubmissions();
      }
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return CheckCircle;
      case 'essay': return FileText;
      case 'practical': return Play;
      case 'rating': return Star;
      default: return AlertCircle;
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{assessment.title}</h2>
              <p className="text-sm text-gray-600 capitalize">{assessment.type} assessment</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              assessment.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {assessment.status}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'submissions', label: 'Submissions', icon: Send },
            { id: 'results', label: 'Results', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'submissions' && submissions.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    {submissions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Assessment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{assessment.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Score:</span>
                      <span className="font-medium">{assessment.maxScore} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="font-medium">{assessment.timeLimit || 'No limit'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">
                        {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submissions:</span>
                      <span className="font-medium">{submissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Graded:</span>
                      <span className="font-medium">{submissions.filter(s => s.status === 'graded').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Score:</span>
                      <span className="font-medium">
                        {submissions.filter(s => s.score).length > 0 
                          ? Math.round(submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-600">{assessment.description}</p>
              </div>

              {assessment.instructions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
                  <p className="text-gray-600">{assessment.instructions}</p>
                </div>
              )}

              {assessment.questions && assessment.questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Questions ({assessment.questions.length})</h3>
                  <div className="space-y-4">
                    {assessment.questions.map((question, index) => {
                      const Icon = getQuestionTypeIcon(question.type);
                      return (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 capitalize">{question.type}</span>
                            </div>
                            <span className="text-sm text-gray-500">{question.points} points</span>
                          </div>
                          <h4 className="font-medium text-gray-800 mb-2">
                            {index + 1}. {question.question}
                          </h4>
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                  <span className="text-sm text-gray-600">{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Submissions ({submissions.length})</h3>
                <button
                  onClick={loadSubmissions}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">Students haven't submitted this assessment yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{submission.learnerName || 'Unknown Learner'}</h4>
                            <p className="text-sm text-gray-600">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          {submission.score && (
                            <span className="text-sm font-medium text-gray-800">
                              {submission.score}/{assessment.maxScore}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {submission.status === 'submitted' && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Grade this submission</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={assessment.maxScore}
                                placeholder="Score"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const score = parseInt((e.target as HTMLInputElement).value);
                                    const feedback = (e.target as HTMLInputElement).parentElement?.querySelector('textarea')?.value || '';
                                    handleGradeSubmission(submission.id, score, feedback);
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const scoreInput = document.querySelector(`input[placeholder="Score"]`) as HTMLInputElement;
                                  const feedbackInput = document.querySelector('textarea') as HTMLTextAreaElement;
                                  if (scoreInput && feedbackInput) {
                                    const score = parseInt(scoreInput.value);
                                    const feedback = feedbackInput.value;
                                    handleGradeSubmission(submission.id, score, feedback);
                                  }
                                }}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Grade
                              </button>
                            </div>
                          </div>
                          <textarea
                            placeholder="Feedback (optional)"
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm"
                            rows={2}
                          />
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Feedback:</p>
                          <p className="text-sm text-blue-800">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Submissions</p>
                      <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                    </div>
                    <Send className="h-8 w-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Graded</p>
                      <p className="text-2xl font-bold text-green-600">{submissions.filter(s => s.status === 'graded').length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">Average Score</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {submissions.filter(s => s.score).length > 0 
                          ? Math.round(submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length)
                          : 0}%
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h3>
                <div className="space-y-2">
                  {[
                    { range: '90-100%', color: 'bg-green-500' },
                    { range: '80-89%', color: 'bg-blue-500' },
                    { range: '70-79%', color: 'bg-yellow-500' },
                    { range: '60-69%', color: 'bg-orange-500' },
                    { range: 'Below 60%', color: 'bg-red-500' }
                  ].map((grade) => {
                    const count = submissions.filter(s => {
                      if (!s.score) return false;
                      const percentage = (s.score / assessment.maxScore) * 100;
                      if (grade.range === '90-100%') return percentage >= 90;
                      if (grade.range === '80-89%') return percentage >= 80 && percentage < 90;
                      if (grade.range === '70-79%') return percentage >= 70 && percentage < 80;
                      if (grade.range === '60-69%') return percentage >= 60 && percentage < 70;
                      return percentage < 60;
                    }).length;
                    
                    const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0;
                    
                    return (
                      <div key={grade.range} className="flex items-center space-x-3">
                        <div className="w-20 text-sm text-gray-600">{grade.range}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full ${grade.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-gray-600">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Monitoring: React.FC = () => {
  const navigate = useNavigate();
  const { intakeId } = useParams();
  const [activeTab, setActiveTab] = useState<'assessments' | 'reviews' | 'analytics'>('assessments');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'formative' | 'summative' | 'milestone' | 'peer_feedback'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'completed' | 'archived'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewingAssessment, setPreviewingAssessment] = useState<Assessment | null>(null);

  // Data states
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [reviews, setReviews] = useState<TrainerReview[]>([]);

  // Stats
  const [stats, setStats] = useState([
    { title: 'Total Assessments', value: '0', change: '+0', icon: CheckCircle, color: 'primary' },
    { title: 'Trainer Reviews', value: '0', change: '+0', icon: Star, color: 'accent' },
    { title: 'Avg Score', value: '0%', change: '+0%', icon: Target, color: 'secondary' },
    { title: 'This Week', value: '0', change: '+0', icon: Calendar, color: 'blue' },
  ]);

  // Form states
  const [assessmentForm, setAssessmentForm] = useState<AssessmentData>({
    title: '',
    description: '',
    type: 'formative',
    intakeId: intakeId || '',
    maxScore: 100,
    questions: [],
    status: 'draft'
  });

  const [reviewForm, setReviewForm] = useState<TrainerReviewData>({
    learnerId: '',
    intakeId: intakeId || '',
    week: 1,
    strengths: '',
    areasForImprovement: '',
    rating: 5,
    comments: '',
    actionItems: [],
    status: 'draft'
  });

  const [newQuestion, setNewQuestion] = useState<AssessmentQuestion>({
    id: '',
    question: '',
    type: 'multiple_choice',
    options: [''],
    points: 1,
    required: true,
    order: 0
  });

  const [newActionItem, setNewActionItem] = useState('');

  const tabs = [
    { id: 'assessments', label: 'Assessments', icon: CheckCircle },
    { id: 'reviews', label: 'Trainer Reviews', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    loadData();
    loadStats();
  }, [intakeId, typeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assessmentsResult, reviewsResult] = await Promise.all([
        MonitoringService.getAssessments({ intakeId, type: typeFilter !== 'all' ? typeFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }),
        MonitoringService.getTrainerReviews({ intakeId })
      ]);

      if (assessmentsResult.success && assessmentsResult.data) {
        setAssessments(assessmentsResult.data);
      }
      if (reviewsResult.success && reviewsResult.data) {
        setReviews(reviewsResult.data);
      }
    } catch (error) {
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await MonitoringService.getMonitoringStats();
      if (result.success && result.data) {
        const thisWeekAssessments = assessments.filter(a => {
          const created = new Date(a.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length;

        setStats([
          { title: 'Total Assessments', value: result.data.totalAssessments.toString(), change: '+2', icon: CheckCircle, color: 'primary' },
          { title: 'Trainer Reviews', value: result.data.totalReviews.toString(), change: '+5', icon: Star, color: 'accent' },
          { title: 'Avg Score', value: `${result.data.averageScore}%`, change: '+3%', icon: Target, color: 'secondary' },
          { title: 'This Week', value: thisWeekAssessments.toString(), change: `+${thisWeekAssessments}`, icon: Calendar, color: 'blue' },
        ]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await MonitoringService.updateAssessment(editingItem, assessmentForm)
        : await MonitoringService.createAssessment(assessmentForm, 'current_user_id');

      if (result.success) {
        setSuccess(editingItem ? 'Assessment updated successfully' : 'Assessment created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetAssessmentForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save assessment');
      }
    } catch (error) {
      setError('Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await MonitoringService.updateTrainerReview(editingItem, reviewForm)
        : await MonitoringService.createTrainerReview(reviewForm, 'current_user_id');

      if (result.success) {
        setSuccess(editingItem ? 'Review updated successfully' : 'Review created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetReviewForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save review');
      }
    } catch (error) {
      setError('Failed to save review');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'assessment' | 'review') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const result = type === 'assessment'
        ? await MonitoringService.deleteAssessment(id)
        : await MonitoringService.deleteTrainerReview(id);

      if (result.success) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        loadData();
        loadStats();
      } else {
        setError(result.error || `Failed to delete ${type}`);
      }
    } catch (error) {
      setError(`Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAssessment = async (id: string) => {
    try {
      const result = await MonitoringService.getAssessment(id);
      if (result.success && result.data) {
        setAssessmentForm({
          title: result.data.title,
          description: result.data.description,
          type: result.data.type,
          intakeId: result.data.intakeId,
          week: result.data.week,
          dueDate: result.data.dueDate,
          maxScore: result.data.maxScore,
          questions: result.data.questions || [],
          instructions: result.data.instructions,
          timeLimit: result.data.timeLimit,
          status: result.data.status
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('assessments');
      }
    } catch (error) {
      setError('Failed to load assessment');
    }
  };

  const loadReview = async (id: string) => {
    try {
      const result = await MonitoringService.getTrainerReview(id);
      if (result.success && result.data) {
        setReviewForm({
          learnerId: result.data.learnerId,
          intakeId: result.data.intakeId,
          week: result.data.week,
          strengths: result.data.strengths,
          areasForImprovement: result.data.areasForImprovement,
          rating: result.data.rating,
          comments: result.data.comments,
          actionItems: result.data.actionItems || [],
          followUpDate: result.data.followUpDate,
          status: result.data.status
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('reviews');
      }
    } catch (error) {
      setError('Failed to load review');
    }
  };

  const resetAssessmentForm = () => {
    setAssessmentForm({
      title: '',
      description: '',
      type: 'formative',
      intakeId: intakeId || '',
      maxScore: 100,
      questions: [],
      status: 'draft'
    });
  };

  const resetReviewForm = () => {
    setReviewForm({
      learnerId: '',
      intakeId: intakeId || '',
      week: 1,
      strengths: '',
      areasForImprovement: '',
      rating: 5,
      comments: '',
      actionItems: [],
      status: 'draft'
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setError(null);
    resetAssessmentForm();
    resetReviewForm();
  };

  const addQuestion = () => {
    if (newQuestion.question.trim()) {
      const questionWithId = {
        ...newQuestion,
        id: Date.now().toString(),
        order: assessmentForm.questions?.length || 0
      };
      setAssessmentForm(prev => ({
        ...prev,
        questions: [...(prev.questions || []), questionWithId]
      }));
      setNewQuestion({
        id: '',
        question: '',
        type: 'multiple_choice',
        options: [''],
        points: 1,
        required: true,
        order: 0
      });
    }
  };

  const removeQuestion = (questionId: string) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== questionId) || []
    }));
  };

  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }));
  };

  const removeOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const addActionItem = () => {
    if (newActionItem.trim()) {
      setReviewForm(prev => ({
        ...prev,
        actionItems: [...(prev.actionItems || []), newActionItem.trim()]
      }));
      setNewActionItem('');
    }
  };

  const removeActionItem = (item: string) => {
    setReviewForm(prev => ({
      ...prev,
      actionItems: prev.actionItems?.filter(i => i !== item) || []
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'formative': return CheckCircle;
      case 'summative': return Award;
      case 'milestone': return Target;
      case 'peer_feedback': return MessageSquare;
      default: return AlertCircle;
    }
  };

  // Filter functions
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.strengths.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.areasForImprovement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comments.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Search handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Monitoring & Evaluation</h1>
            <p className="text-lg text-purple-100">
              Track learning progress, conduct assessments, and gather feedback.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-purple-200">{stat.change}</p>
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

      {/* Assessment Preview Modal */}
      {previewingAssessment && (
        <AssessmentPreview
          assessment={previewingAssessment}
          onClose={() => setPreviewingAssessment(null)}
        />
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
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
        <div className="p-8">
          {!showForm ? (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
                    />
                  </div>
                  {activeTab === 'assessments' && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="all">All Types</option>
                        <option value="formative">Formative</option>
                        <option value="summative">Summative</option>
                        <option value="milestone">Milestone</option>
                        <option value="peer_feedback">Peer Feedback</option>
                      </select>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    Create {activeTab === 'assessments' ? 'Assessment' : activeTab === 'reviews' ? 'Review' : 'Report'}
                  </span>
                </button>
              </div>

              {/* Content Grid */}
              <div>
                {activeTab === 'assessments' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssessments.map((assessment) => {
                      const Icon = getTypeIcon(assessment.type);
                      return (
                        <div key={assessment.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <Icon className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{assessment.title}</h3>
                                <p className="text-sm text-gray-600 capitalize">{assessment.type}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                              {assessment.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assessment.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {assessment.questions?.length || 0} questions
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {assessment.maxScore} points
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setPreviewingAssessment(assessment)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => loadAssessment(assessment.id)}
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(assessment.id, 'assessment')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-yellow-100 p-2 rounded-lg">
                              <Star className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">Week {review.week} Review</h3>
                              <p className="text-sm text-gray-600">{review.learnerName || 'Unknown Learner'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{review.strengths}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => loadReview(review.id)}
                              className="text-purple-600 hover:text-purple-800 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(review.id, 'review')}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Assessment Completion</p>
                            <p className="text-2xl font-bold text-blue-600">78%</p>
                            <p className="text-sm text-blue-700">+5% from last week</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      <div className="bg-green-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">Average Score</p>
                            <p className="text-2xl font-bold text-green-600">84%</p>
                            <p className="text-sm text-green-700">+2% from last week</p>
                          </div>
                          <Target className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-900">Reviews Given</p>
                            <p className="text-2xl font-bold text-purple-600">{reviews.length}</p>
                            <p className="text-sm text-purple-700">This month</p>
                          </div>
                          <Star className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                      <div className="space-y-3">
                        {[...assessments, ...reviews].slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              {'title' in item ? <CheckCircle className="h-4 w-4 text-purple-600" /> : <Star className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {'title' in item ? item.title : `Week ${(item as TrainerReview).week} Review`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {((activeTab === 'assessments' && filteredAssessments.length === 0) ||
                  (activeTab === 'reviews' && filteredReviews.length === 0)) && (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                      {activeTab === 'assessments' && <CheckCircle className="h-8 w-8 text-gray-400" />}
                      {activeTab === 'reviews' && <Star className="h-8 w-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No {activeTab} found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search criteria.' 
                        : `No ${activeTab} have been created yet.`}
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Create First {activeTab === 'assessments' ? 'Assessment' : 'Review'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Form Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem ? 'Edit' : 'Create'} {activeTab === 'assessments' ? 'Assessment' : 'Review'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Forms */}
              <div className="max-w-4xl">
                {activeTab === 'assessments' && (
                  <form onSubmit={handleAssessmentSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assessment Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={assessmentForm.title}
                          onChange={(e) => setAssessmentForm({...assessmentForm, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter assessment title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assessment Type *
                        </label>
                        <select
                          required
                          value={assessmentForm.type}
                          onChange={(e) => setAssessmentForm({...assessmentForm, type: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="formative">Formative</option>
                          <option value="summative">Summative</option>
                          <option value="milestone">Milestone</option>
                          <option value="peer_feedback">Peer Feedback</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          required
                          value={assessmentForm.description}
                          onChange={(e) => setAssessmentForm({...assessmentForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Describe the assessment"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Score *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={assessmentForm.maxScore}
                          onChange={(e) => setAssessmentForm({...assessmentForm, maxScore: parseInt(e.target.value) || 100})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={assessmentForm.dueDate}
                          onChange={(e) => setAssessmentForm({...assessmentForm, dueDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Questions
                      </label>
                      <div className="space-y-3">
                        {assessmentForm.questions?.map((question, index) => (
                          <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {index + 1}. {question.type} - {question.points} points
                              </span>
                              <button
                                type="button"
                                onClick={() => removeQuestion(question.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600">{question.question}</p>
                          </div>
                        ))}
                        
                        {/* Add Question Form */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-900 mb-3">Add New Question</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <select
                                value={newQuestion.type}
                                onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value as any})}
                                className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="essay">Essay</option>
                                <option value="practical">Practical</option>
                                <option value="rating">Rating</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                value={newQuestion.points}
                                onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 1})}
                                placeholder="Points"
                                className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <textarea
                              value={newQuestion.question}
                              onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                              placeholder="Enter your question..."
                              rows={2}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            
                            {newQuestion.type === 'multiple_choice' && (
                              <div className="space-y-2">
                                <label className="block text-xs font-medium text-blue-700">Options:</label>
                                {newQuestion.options?.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => updateOption(index, e.target.value)}
                                      placeholder={`Option ${index + 1}`}
                                      className="flex-1 px-3 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeOption(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={addOption}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Option
                                </button>
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={addQuestion}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Add Question
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'} Assessment
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'reviews' && (
                  <form onSubmit={handleReviewSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Learner ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewForm.learnerId}
                          onChange={(e) => setReviewForm({...reviewForm, learnerId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter learner ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Week *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={reviewForm.week}
                          onChange={(e) => setReviewForm({...reviewForm, week: parseInt(e.target.value) || 1})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Week number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Strengths *
                        </label>
                        <textarea
                          required
                          value={reviewForm.strengths}
                          onChange={(e) => setReviewForm({...reviewForm, strengths: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="What did the learner do well?"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Areas for Improvement *
                        </label>
                        <textarea
                          required
                          value={reviewForm.areasForImprovement}
                          onChange={(e) => setReviewForm({...reviewForm, areasForImprovement: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="What areas need improvement?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating *
                        </label>
                        <select
                          required
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value={5}>5 - Excellent</option>
                          <option value={4}>4 - Good</option>
                          <option value={3}>3 - Average</option>
                          <option value={2}>2 - Below Average</option>
                          <option value={1}>1 - Poor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={reviewForm.followUpDate}
                          onChange={(e) => setReviewForm({...reviewForm, followUpDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Comments
                        </label>
                        <textarea
                          value={reviewForm.comments}
                          onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Any additional comments or notes"
                        />
                      </div>
                    </div>

                    {/* Action Items */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action Items
                      </label>
                      <div className="space-y-2">
                        {reviewForm.actionItems?.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="flex-1 text-sm text-gray-700">{item}</span>
                            <button
                              type="button"
                              onClick={() => removeActionItem(item)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newActionItem}
                            onChange={(e) => setNewActionItem(e.target.value)}
                            placeholder="Add action item..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={addActionItem}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'} Review
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring; 