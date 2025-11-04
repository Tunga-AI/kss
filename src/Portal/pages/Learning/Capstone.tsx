import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, Plus, Edit, Trash2, Search, Filter, Download, Upload, Users, Award,
  Calendar, Clock, Target, CheckCircle, AlertCircle, FileText, ExternalLink,
  Star, BarChart3, TrendingUp, BookOpen, Send, Eye, Link, Settings, Share2,
  MessageSquare, ArrowRight, ChevronRight, Play, Pause, CheckSquare, AlertTriangle
} from 'lucide-react';
import { 
  CapstoneService, 
  CapstoneProject, 
  ProjectSubmission, 
  CapstoneProjectData,
  EvaluationCriteria,
  EvaluationScore
} from '../../../services/capstoneService';

interface ProjectViewerProps {
  project: CapstoneProject;
  onClose: () => void;
}

const ProjectViewer: React.FC<ProjectViewerProps> = ({ project, onClose }) => {
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'evaluation' | 'progress'>('details');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [project.id]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const result = await CapstoneService.getSubmissions({ projectId: project.id });
      if (result.success && result.data) {
        setSubmissions(result.data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      const result = await CapstoneService.gradeSubmission(submissionId, score, feedback, [], 'current_user_id');
      if (result.success) {
        loadSubmissions();
      }
    } catch (error) {
      console.error('Error evaluating submission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

     const getSubmissionStatusColor = (status: string) => {
     switch (status) {
       case 'submitted': return 'bg-blue-100 text-blue-800';
       case 'graded': return 'bg-green-100 text-green-800';
       case 'under_review': return 'bg-purple-100 text-purple-800';
       case 'returned': return 'bg-orange-100 text-orange-800';
       case 'approved': return 'bg-green-100 text-green-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   };

  const getProgressPercentage = () => {
    if (project.status === 'completed') return 100;
    if (project.status === 'review') return 80;
    if (project.status === 'in_progress') return 50;
    if (project.status === 'planning') return 25;
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{project.title}</h2>
              <p className="text-sm text-gray-600">{project.type} project</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Project Progress</span>
            <span className="text-sm font-medium text-gray-700">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'submissions', label: 'Submissions', icon: Send },
            { id: 'evaluation', label: 'Evaluation', icon: Star },
            { id: 'progress', label: 'Progress', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'submissions' && submissions.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    {submissions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Project Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Type</p>
                      <p className="text-sm text-gray-800 capitalize">{project.type}</p>
                    </div>
                                         <div>
                       <p className="text-sm font-medium text-gray-600">Format</p>
                       <p className="text-sm text-gray-800 capitalize">{project.submissionFormat}</p>
                     </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Team Size</p>
                      <p className="text-sm text-gray-800">{project.maxTeamSize} members</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Due Date</p>
                      <p className="text-sm text-gray-800">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Statistics</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                      <p className="text-sm text-gray-800">{submissions.length}</p>
                    </div>
                                         <div>
                       <p className="text-sm font-medium text-gray-600">Graded</p>
                       <p className="text-sm text-gray-800">{submissions.filter(s => s.status === 'graded').length}</p>
                     </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Score</p>
                      <p className="text-sm text-gray-800">
                        {submissions.filter(s => s.score).length > 0 
                          ? Math.round(submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-sm text-gray-800">{submissions.length > 0 ? Math.round((submissions.filter(s => s.status === 'evaluated').length / submissions.length) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
              </div>

              {project.requirements && project.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {project.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.deliverables && project.deliverables.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Deliverables</h3>
                  <ul className="space-y-2">
                    {project.deliverables.map((deliverable, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
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
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">Students haven't submitted their capstone projects yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Users className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{submission.title}</h4>
                            <p className="text-sm text-gray-600">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission.status)}`}>
                            {submission.status.replace('_', ' ')}
                          </span>
                          {submission.score && (
                            <span className="text-sm font-medium text-gray-800">
                              {submission.score}/100
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{submission.description}</p>

                      {submission.teamMembers && submission.teamMembers.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Team Members:</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.teamMembers.map((member, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {member}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.files && submission.files.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Files:</p>
                          <div className="space-y-1">
                            {submission.files.map((file, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {file.name}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.links && submission.links.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Links:</p>
                          <div className="space-y-1">
                            {submission.links.map((link, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Link className="h-4 w-4 text-gray-500" />
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {link.title}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.status === 'submitted' && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Evaluate this submission</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Score (0-100)"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                id={`score-${submission.id}`}
                              />
                              <button
                                onClick={() => {
                                  const scoreInput = document.getElementById(`score-${submission.id}`) as HTMLInputElement;
                                  const feedbackInput = document.getElementById(`feedback-${submission.id}`) as HTMLTextAreaElement;
                                  if (scoreInput && feedbackInput) {
                                    const score = parseInt(scoreInput.value);
                                    const feedback = feedbackInput.value;
                                    handleEvaluateSubmission(submission.id, score, feedback);
                                  }
                                }}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Evaluate
                              </button>
                            </div>
                            <textarea
                              id={`feedback-${submission.id}`}
                              placeholder="Feedback and comments..."
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={3}
                            />
                          </div>
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

          {activeTab === 'evaluation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Criteria</h3>
                {project.evaluationCriteria && project.evaluationCriteria.length > 0 ? (
                  <div className="space-y-4">
                    {project.evaluationCriteria.map((criteria, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">{criteria.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Weight: {criteria.weight}%</span>
                            <span className="text-sm text-gray-600">Max: {criteria.maxScore}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{criteria.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No evaluation criteria defined for this project.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-sm font-medium text-green-900">Evaluated</p>
                        <p className="text-2xl font-bold text-green-600">{submissions.filter(s => s.status === 'evaluated').length}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-900">Average Score</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {submissions.filter(s => s.score).length > 0 
                            ? Math.round(submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length)
                            : 0}%
                        </p>
                      </div>
                      <Award className="h-8 w-8 text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Timeline</h3>
                <div className="space-y-4">
                  {[
                    { stage: 'Planning', status: 'completed', date: project.createdAt },
                    { stage: 'Development', status: project.status === 'planning' ? 'pending' : 'in_progress', date: null },
                    { stage: 'Review', status: project.status === 'review' ? 'in_progress' : project.status === 'completed' ? 'completed' : 'pending', date: null },
                    { stage: 'Completion', status: project.status === 'completed' ? 'completed' : 'pending', date: project.dueDate }
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stage.status === 'completed' ? 'bg-green-100' : 
                        stage.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {stage.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : stage.status === 'in_progress' ? (
                          <Clock className="h-5 w-5 text-blue-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{stage.stage}</p>
                        {stage.date && (
                          <p className="text-sm text-gray-600">
                            {new Date(stage.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                        stage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {stage.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Submission Progress</h3>
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{submission.title}</p>
                          <p className="text-sm text-gray-600">
                            Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission.status)}`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                        {submission.score && (
                          <span className="text-sm font-medium text-gray-800">
                            {submission.score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Capstone: React.FC = () => {
  const navigate = useNavigate();
  const { intakeId } = useParams();
  const [activeTab, setActiveTab] = useState<'projects' | 'submissions' | 'analytics'>('projects');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'in_progress' | 'review' | 'completed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewingProject, setViewingProject] = useState<CapstoneProject | null>(null);

  // Data states
  const [projects, setProjects] = useState<CapstoneProject[]>([]);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);

  // Stats
  const [stats, setStats] = useState([
    { title: 'Total Projects', value: '0', change: '+0', icon: Target, color: 'primary' },
    { title: 'Submissions', value: '0', change: '+0', icon: Send, color: 'accent' },
    { title: 'Completed', value: '0', change: '+0', icon: CheckCircle, color: 'secondary' },
    { title: 'Avg Score', value: '0%', change: '+0%', icon: Award, color: 'blue' },
  ]);

  // Form states
  const [projectForm, setProjectForm] = useState<CapstoneProjectData>({
    title: '',
    description: '',
    type: 'individual',
    intakeId: intakeId || '',
    requirements: [],
    deliverables: [],
    evaluationCriteria: [],
    maxTeamSize: 1
  });

  const [submissionForm, setSubmissionForm] = useState<ProjectSubmissionData>({
    projectId: '',
    submittedBy: '',
    title: '',
    description: '',
    files: [],
    links: [],
    teamMembers: []
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newCriterion, setNewCriterion] = useState<EvaluationCriteria>({
    id: '',
    name: '',
    description: '',
    weight: 10,
    maxScore: 100
  });

  const tabs = [
    { id: 'projects', label: 'Capstone Projects', icon: Target },
    { id: 'submissions', label: 'Submissions', icon: Send },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    loadData();
    loadStats();
  }, [intakeId, typeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsResult, submissionsResult] = await Promise.all([
        CapstoneService.getProjects({ intakeId, type: typeFilter !== 'all' ? typeFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }),
        CapstoneService.getSubmissions({ intakeId })
      ]);

      if (projectsResult.success && projectsResult.data) {
        setProjects(projectsResult.data);
      }
      if (submissionsResult.success && submissionsResult.data) {
        setSubmissions(submissionsResult.data);
      }
    } catch (error) {
      setError('Failed to load capstone data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await CapstoneService.getCapstoneStats();
      if (result.success && result.data) {
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const avgScore = submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length 
          : 0;

        setStats([
          { title: 'Total Projects', value: result.data.totalProjects?.toString() || '0', change: '+1', icon: Target, color: 'primary' },
          { title: 'Submissions', value: result.data.totalSubmissions?.toString() || '0', change: '+3', icon: Send, color: 'accent' },
          { title: 'Completed', value: completedProjects.toString(), change: '+2', icon: CheckCircle, color: 'secondary' },
          { title: 'Avg Score', value: `${avgScore.toFixed(0)}%`, change: '+5%', icon: Award, color: 'blue' },
        ]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await CapstoneService.updateProject(editingItem, projectForm)
        : await CapstoneService.createProject(projectForm);

      if (result.success) {
        setSuccess(editingItem ? 'Project updated successfully' : 'Project created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetProjectForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save project');
      }
    } catch (error) {
      setError('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = editingItem
        ? await CapstoneService.updateSubmission(editingItem, submissionForm)
        : await CapstoneService.createSubmission(submissionForm);

      if (result.success) {
        setSuccess(editingItem ? 'Submission updated successfully' : 'Submission created successfully');
        setShowForm(false);
        setEditingItem(null);
        resetSubmissionForm();
        loadData();
        loadStats();
      } else {
        setError(result.error || 'Failed to save submission');
      }
    } catch (error) {
      setError('Failed to save submission');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'project' | 'submission') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const result = type === 'project'
        ? await CapstoneService.deleteProject(id)
        : await CapstoneService.deleteSubmission(id);

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

  const loadProject = async (id: string) => {
    try {
      const result = await CapstoneService.getProject(id);
      if (result.success && result.data) {
        setProjectForm({
          title: result.data.title,
          description: result.data.description,
          type: result.data.type,
          intakeId: result.data.intakeId,
          requirements: result.data.requirements || [],
          deliverables: result.data.deliverables || [],
          evaluationCriteria: result.data.evaluationCriteria || [],
          maxTeamSize: result.data.maxTeamSize || 1,
          dueDate: result.data.dueDate,
          submissionFormat: result.data.submissionFormat,
          allowLateSubmissions: result.data.allowLateSubmissions,
          maxSubmissions: result.data.maxSubmissions
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('projects');
      }
    } catch (error) {
      setError('Failed to load project');
    }
  };

  const loadSubmission = async (id: string) => {
    try {
      const result = await CapstoneService.getSubmission(id);
      if (result.success && result.data) {
        setSubmissionForm({
          projectId: result.data.projectId,
          submittedBy: result.data.submittedBy,
          title: result.data.title,
          description: result.data.description,
          files: result.data.files,
          links: result.data.links,
          teamMembers: result.data.teamMembers
        });
        setEditingItem(id);
        setShowForm(true);
        setActiveTab('submissions');
      }
    } catch (error) {
      setError('Failed to load submission');
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      type: 'individual',
      intakeId: intakeId || '',
      requirements: [],
      deliverables: [],
      evaluationCriteria: [],
      maxTeamSize: 1
    });
  };

  const resetSubmissionForm = () => {
    setSubmissionForm({
      projectId: '',
      submittedBy: '',
      title: '',
      description: '',
      files: [],
      links: [],
      teamMembers: []
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setError(null);
    resetProjectForm();
    resetSubmissionForm();
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setProjectForm(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (requirement: string) => {
    setProjectForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement)
    }));
  };

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setProjectForm(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, newDeliverable.trim()]
      }));
      setNewDeliverable('');
    }
  };

  const removeDeliverable = (deliverable: string) => {
    setProjectForm(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d !== deliverable)
    }));
  };

  const addCriterion = () => {
    if (newCriterion.name.trim()) {
      const criterionWithId = {
        ...newCriterion,
        id: Date.now().toString()
      };
      setProjectForm(prev => ({
        ...prev,
        evaluationCriteria: [...prev.evaluationCriteria, criterionWithId]
      }));
      setNewCriterion({
        id: '',
        name: '',
        description: '',
        weight: 10,
        maxScore: 100
      });
    }
  };

  const removeCriterion = (criterionId: string) => {
    setProjectForm(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.filter(c => c.id !== criterionId)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return Users;
      case 'group': return Users;
      default: return Target;
    }
  };

  // Filter functions
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.description.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="bg-orange-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Capstone Projects</h1>
            <p className="text-lg text-orange-100">
              Final competency assessment projects and portfolio development.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Award className="h-8 w-8 text-white" />
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
                    <p className="text-sm font-medium text-orange-100">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-orange-200">{stat.change}</p>
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
                      ? 'border-orange-600 text-orange-600'
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
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Capstone Projects</h2>
                  <p className="text-secondary-600 mt-1">Create and manage capstone projects</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Under Review</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Award className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No projects found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No capstone projects have been created yet.'}
                  </p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Create First Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const IconComponent = getTypeIcon(project.type);
                    return (
                      <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                              <IconComponent className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{project.title}</h3>
                              <p className="text-sm text-gray-500 capitalize">{project.type}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Team Size:</span>
                            <span className="font-medium">{project.maxTeamSize} members</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Requirements:</span>
                            <span className="font-medium">{project.requirements.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Deliverables:</span>
                            <span className="font-medium">{project.deliverables.length}</span>
                          </div>
                          {project.dueDate && (
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Due Date:</span>
                              <span className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          <button
                            onClick={() => setViewingProject(project)}
                            className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => loadProject(project.id)}
                            className="bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(project.id, 'project')}
                            className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Project Submissions</h2>
                  <p className="text-secondary-600 mt-1">View and evaluate student submissions</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search submissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Submissions Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading submissions...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No submissions found</h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Try adjusting your search criteria.' 
                      : 'No project submissions have been received yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubmissions.map((submission) => (
                    <div key={submission.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Send className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{submission.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'evaluated' ? 'bg-green-100 text-green-800' :
                          submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{submission.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Files:</span>
                          <span className="font-medium">{submission.files?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Links:</span>
                          <span className="font-medium">{submission.links?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Team Members:</span>
                          <span className="font-medium">{submission.teamMembers?.length || 0}</span>
                        </div>
                        {submission.score && (
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Score:</span>
                            <span className="font-medium">{submission.score}/100</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => loadSubmission(submission.id)}
                          className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDelete(submission.id, 'submission')}
                          className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-secondary-800">Capstone Analytics</h2>
                  <p className="text-secondary-600 mt-1">Track project progress and performance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Status Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status</h3>
                  <div className="space-y-3">
                    {[
                      { status: 'planning', color: 'bg-yellow-500' },
                      { status: 'in_progress', color: 'bg-blue-500' },
                      { status: 'review', color: 'bg-purple-500' },
                      { status: 'completed', color: 'bg-green-500' }
                    ].map((item) => {
                      const count = projects.filter(p => p.status === item.status).length;
                      const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                      return (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm text-gray-600 capitalize">{item.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-800">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Projects</h3>
                  <div className="space-y-3">
                    {projects
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((project) => (
                        <div key={project.id} className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Award className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{project.title}</p>
                            <p className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Submission Performance */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Submission Performance</h3>
                  <div className="space-y-3">
                    {[
                      { range: '90-100%', color: 'bg-green-500' },
                      { range: '80-89%', color: 'bg-blue-500' },
                      { range: '70-79%', color: 'bg-yellow-500' },
                      { range: '60-69%', color: 'bg-orange-500' },
                      { range: 'Below 60%', color: 'bg-red-500' }
                    ].map((grade) => {
                      const count = submissions.filter(s => {
                        if (!s.score) return false;
                        if (grade.range === '90-100%') return s.score >= 90;
                        if (grade.range === '80-89%') return s.score >= 80 && s.score < 90;
                        if (grade.range === '70-79%') return s.score >= 70 && s.score < 80;
                        if (grade.range === '60-69%') return s.score >= 60 && s.score < 70;
                        return s.score < 60;
                      }).length;
                      
                      const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0;
                      
                      return (
                        <div key={grade.range} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${grade.color}`}></div>
                            <span className="text-sm text-gray-600">{grade.range}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${grade.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-800">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      {showForm && activeTab === 'projects' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingItem ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleProjectSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter project title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type *
                  </label>
                  <select
                    required
                    value={projectForm.type}
                    onChange={(e) => setProjectForm({...projectForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe the capstone project"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={projectForm.maxTeamSize}
                    onChange={(e) => setProjectForm({...projectForm, maxTeamSize: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Maximum team size"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={projectForm.dueDate}
                    onChange={(e) => setProjectForm({...projectForm, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <div className="space-y-2">
                  {projectForm.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                      <span className="flex-1 text-sm text-gray-700">{requirement}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(requirement)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deliverables
                </label>
                <div className="space-y-2">
                  {projectForm.deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="flex-1 text-sm text-gray-700">{deliverable}</span>
                      <button
                        type="button"
                        onClick={() => removeDeliverable(deliverable)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      placeholder="Add a deliverable..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Evaluation Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation Criteria
                </label>
                <div className="space-y-3">
                  {projectForm.evaluationCriteria.map((criterion) => (
                    <div key={criterion.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{criterion.name}</h4>
                          <p className="text-sm text-gray-600">{criterion.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Weight: {criterion.weight}%</span>
                          <span className="text-sm text-gray-600">Max: {criterion.maxScore}</span>
                          <button
                            type="button"
                            onClick={() => removeCriterion(criterion.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newCriterion.name}
                      onChange={(e) => setNewCriterion({...newCriterion, name: e.target.value})}
                      placeholder="Criterion name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={newCriterion.description}
                      onChange={(e) => setNewCriterion({...newCriterion, description: e.target.value})}
                      placeholder="Description"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCriterion.weight}
                      onChange={(e) => setNewCriterion({...newCriterion, weight: parseInt(e.target.value) || 10})}
                      placeholder="Weight %"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={addCriterion}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{editingItem ? 'Update Project' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Viewer Modal */}
      {viewingProject && (
        <ProjectViewer
          project={viewingProject}
          onClose={() => setViewingProject(null)}
        />
      )}
    </div>
  );
};

export default Capstone; 