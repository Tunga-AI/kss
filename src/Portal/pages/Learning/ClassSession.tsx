import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Video, 
  Image, 
  Users, 
  Clock,
  Play,
  Download,
  Eye,
  Trash2,
  Camera,
  Mic,
  MicOff,
  CameraOff,
  UserCheck,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  Link,
  Plus,
  Save,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Share2,
  ExternalLink,
  MessageSquare,
  ClipboardList,
  FileSearch,
  BookOpenCheck
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import VideoConference from '../../../components/VideoConference';
import { useAuthContext } from '../../../contexts/AuthContext';

interface ClassSession {
  id: string;
  intakeId: string;
  session: number;
  week: number;
  date?: string;
  time?: string;
  moduleFocus?: string;
  sessionTitle?: string;
  activity?: string;
  trainingDeck?: string;
  trainer?: string;
  quadrantMapping?: string;
  deliveryMode?: 'physical' | 'virtual' | 'self-paced' | 'break';
  sessionType: string;
}

interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  clockInTime?: string;
  clockOutTime?: string;
  status: 'present' | 'absent' | 'late';
  avatar?: string;
}

interface SessionContent {
  id: string;
  sessionId: string;
  fileName: string;
  fileType: 'pdf' | 'video' | 'image' | 'slide' | 'document';
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  size: number;
}

interface MeetingSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType: string;
    entryPointAccess: string;
  };
}

interface Conference {
  name: string;
  startTime: string;
  endTime?: string;
}

interface MeetParticipant {
  name: string;
  earliestStartTime: string;
  latestEndTime?: string;
  signaledMeetingUri: string;
}

interface MeetingArtifacts {
  recordings: any[];
  transcripts: any[];
}

interface Question {
  id: string;
  sessionId: string;
  question: string;
  askedBy: string;
  askedByName: string;
  askedAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: 'pending' | 'answered' | 'dismissed';
}

interface Survey {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'active' | 'completed';
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'multiple_choice' | 'text' | 'yes_no';
  options?: string[];
  required: boolean;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  respondentName: string;
  answers: { [questionId: string]: any };
  submittedAt: string;
}

interface Observation {
  id: string;
  sessionId: string;
  studentEngagement: 'excellent' | 'good' | 'average' | 'needs_improvement';
  participationLevel: 'high' | 'medium' | 'low';
  keyObservations: string;
  areasForImprovement: string;
  nextSessionRecommendations: string;
  createdAt: string;
  createdBy: string;
}

interface Assignment {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'published' | 'closed';
}

interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submissionText?: string;
  attachments?: string[];
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  status: 'not_submitted' | 'submitted' | 'graded' | 'late';
}

interface ContentViewerProps {
  content: SessionContent;
  onClose: () => void;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ content, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = async () => {
    const link = document.createElement('a');
    link.href = content.fileUrl;
    link.download = content.fileName;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.fileName,
          text: content.description,
          url: content.fileUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(content.fileUrl);
      alert('Link copied to clipboard!');
    }
  };


  const renderContent = () => {
    switch (content.fileType) {
      case 'video':
        return (
          <div className="relative bg-black rounded-lg overflow-hidden h-full">
            <video
              ref={videoRef}
              src={content.fileUrl}
              controls
              className="w-full h-full object-contain"
              muted={isMuted}
            />
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full">
            <iframe
              ref={iframeRef}
              src={`${content.fileUrl}#view=FitH`}
              className="w-full h-full border-none"
              style={{ transform: `scale(${zoom})` }}
            />
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full flex items-center justify-center">
            <img
              src={content.fileUrl}
              alt={content.fileName}
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'slide':
        return (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full">
            <iframe
              src={content.fileUrl}
              className="w-full h-full border-none"
              style={{ transform: `scale(${zoom})` }}
            />
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-colors shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{content.fileName}</h3>
            <p className="text-gray-600 mb-4">{content.description}</p>
            <button
              onClick={handleDownload}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      <div className="bg-white h-full w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              {content.fileType === 'video' && <Play className="h-5 w-5 text-primary-600" />}
              {content.fileType === 'pdf' && <FileText className="h-5 w-5 text-primary-600" />}
              {content.fileType === 'image' && <Image className="h-5 w-5 text-primary-600" />}
              {content.fileType === 'slide' && <BookOpen className="h-5 w-5 text-primary-600" />}
              {content.fileType === 'document' && <FileText className="h-5 w-5 text-primary-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{content.fileName}</h2>
              <p className="text-sm text-gray-600 capitalize">{content.fileType}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        {content.description && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">{content.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ClassSession: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const { intakeId, sessionNumber } = useParams<{ intakeId: string; sessionNumber: string }>();
  
  const [session, setSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [sessionContent, setSessionContent] = useState<SessionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  
  // Live session state
  const [isLiveSession, setIsLiveSession] = useState(false);
  
  // File upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Content viewer state
  const [viewingContent, setViewingContent] = useState<SessionContent | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Survey state
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: [] as SurveyQuestion[]
  });
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  // Observation state
  const [observations, setObservations] = useState<Observation[]>([]);
  const [currentObservation, setCurrentObservation] = useState<Partial<Observation>>({
    studentEngagement: 'good',
    participationLevel: 'medium',
    keyObservations: '',
    areasForImprovement: '',
    nextSessionRecommendations: ''
  });
  const [loadingObservations, setLoadingObservations] = useState(false);

  // Assignment state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100
  });
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Role-based access control
  const isInstructor = userProfile?.role === 'instructor' || userProfile?.role === 'admin' || userProfile?.role === 'staff';
  const isLearner = userProfile?.role === 'learner';
  const isFacilitator = userProfile?.role === 'facilitator';

  // Role-based tabs
  const allTabs = [
    { id: 'content', label: 'Session Content', icon: FileText, roles: ['instructor', 'admin', 'staff', 'learner', 'facilitator'] },
    { id: 'attendance', label: 'Attendance', icon: Users, roles: ['instructor', 'admin', 'staff'] },
    { id: 'live', label: 'Live Session', icon: Video, roles: ['instructor', 'admin', 'staff', 'learner', 'facilitator'] },
    { id: 'questions', label: 'Questions', icon: MessageSquare, roles: ['instructor', 'admin', 'staff', 'learner', 'facilitator'] },
    { id: 'survey', label: 'Survey', icon: ClipboardList, roles: ['instructor', 'admin', 'staff'] },
    { id: 'observation', label: 'Observation', icon: FileSearch, roles: ['instructor', 'admin', 'staff'] },
    { id: 'assignment', label: 'Assignment', icon: BookOpenCheck, roles: ['instructor', 'admin', 'staff'] },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab =>
    userProfile?.role && tab.roles.includes(userProfile.role)
  );

  useEffect(() => {
    if (intakeId && sessionNumber) {
      loadSessionData();
      loadAttendance();
      loadSessionContent();
      loadQuestions();
      loadSurveys();
      loadObservations();
      loadAssignments();
    }
  }, [intakeId, sessionNumber]);

  const loadSessionData = async () => {
    if (!intakeId || !sessionNumber) return;
    
    try {
      // Load schedule from the schedules collection using intake ID as document ID
      const result = await FirestoreService.getById('schedules', intakeId);
      
      if (result.success && result.data && result.data.sessions) {
        const sessionData = result.data.sessions.find((s: any) => 
          s.session === parseInt(sessionNumber)
        );
        
        if (sessionData) {
          setSession(sessionData as ClassSession);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const loadAttendance = async () => {
    if (!intakeId || !sessionNumber) return;
    
    try {
      // Load learners for this intake
      const result = await FirestoreService.getWithQuery('learners', [
        { field: 'intakeId', operator: '==', value: intakeId }
      ]);
      
      if (result.success && result.data) {
        // Convert learners to attendance format
        const attendanceData = (result.data as any[]).map(learner => ({
          id: learner.id,
          studentId: learner.id,
          studentName: `${learner.firstName} ${learner.lastName}`,
          studentEmail: learner.email,
          status: 'absent' as const,
          avatar: learner.profileImage
        }));
        setAttendance(attendanceData);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionContent = async () => {
    if (!intakeId || !sessionNumber) return;
    
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const result = await FirestoreService.getWithQuery('session_content', [
        { field: 'sessionKey', operator: '==', value: sessionKey }
      ]);
      
      if (result.success && result.data) {
        setSessionContent(result.data as SessionContent[]);
      }
    } catch (error) {
      console.error('Error loading session content:', error);
    }
  };

  // Load Questions
  const loadQuestions = async () => {
    if (!intakeId || !sessionNumber) return;
    
    setLoadingQuestions(true);
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const result = await FirestoreService.getWithQuery('session_questions', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);
      
      if (result.success && result.data) {
        setQuestions(result.data as Question[]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Load Surveys
  const loadSurveys = async () => {
    if (!intakeId || !sessionNumber) return;
    
    setLoadingSurveys(true);
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const result = await FirestoreService.getWithQuery('session_surveys', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);
      
      if (result.success && result.data) {
        setSurveys(result.data as Survey[]);
      }

      // Load survey responses
      const responsesResult = await FirestoreService.getWithQuery('survey_responses', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);
      
      if (responsesResult.success && responsesResult.data) {
        setSurveyResponses(responsesResult.data as SurveyResponse[]);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoadingSurveys(false);
    }
  };

  // Load Observations
  const loadObservations = async () => {
    if (!intakeId || !sessionNumber) return;
    
    setLoadingObservations(true);
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const result = await FirestoreService.getWithQuery('session_observations', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);
      
      if (result.success && result.data) {
        setObservations(result.data as Observation[]);
        // Set current observation to the latest one if exists
        if (result.data.length > 0) {
          const latest = result.data[result.data.length - 1] as Observation;
          setCurrentObservation({
            studentEngagement: latest.studentEngagement,
            participationLevel: latest.participationLevel,
            keyObservations: latest.keyObservations,
            areasForImprovement: latest.areasForImprovement,
            nextSessionRecommendations: latest.nextSessionRecommendations
          });
        }
      }
    } catch (error) {
      console.error('Error loading observations:', error);
    } finally {
      setLoadingObservations(false);
    }
  };

  // Load Assignments
  const loadAssignments = async () => {
    if (!intakeId || !sessionNumber) return;
    
    setLoadingAssignments(true);
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const result = await FirestoreService.getWithQuery('session_assignments', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);
      
      if (result.success && result.data) {
        setAssignments(result.data as Assignment[]);
      }

      // Load assignment submissions
      const submissionsResult = await FirestoreService.getWithQuery('assignment_submissions', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);
      
      if (submissionsResult.success && submissionsResult.data) {
        setAssignmentSubmissions(submissionsResult.data as AssignmentSubmission[]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Questions CRUD Operations
  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !intakeId || !sessionNumber) return;
    
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const questionData: Omit<Question, 'id'> = {
        sessionId: sessionKey,
        question: newQuestion,
        askedBy: 'trainer', // In real app, get from user context
        askedByName: 'Trainer', // In real app, get from user context
        askedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      const result = await FirestoreService.create('session_questions', questionData);
      if (result.success) {
        setNewQuestion('');
        await loadQuestions();
      }
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      const updateData = {
        answer,
        answeredBy: 'current-user-id', // In real app, get from user context
        answeredAt: new Date().toISOString(),
        status: 'answered'
      };
      
      const result = await FirestoreService.update('session_questions', questionId, updateData);
      if (result.success) {
        await loadQuestions();
      }
    } catch (error) {
      console.error('Error answering question:', error);
    }
  };

  const handleDismissQuestion = async (questionId: string) => {
    try {
      const result = await FirestoreService.update('session_questions', questionId, { status: 'dismissed' });
      if (result.success) {
        await loadQuestions();
      }
    } catch (error) {
      console.error('Error dismissing question:', error);
    }
  };

  // Survey CRUD Operations
  const handleCreateSurvey = async () => {
    if (!newSurvey.title.trim() || !intakeId || !sessionNumber) return;
    
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const surveyData: Omit<Survey, 'id'> = {
        sessionId: sessionKey,
        title: newSurvey.title,
        description: newSurvey.description,
        questions: newSurvey.questions,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user-id', // In real app, get from user context
        status: 'draft'
      };
      
      const result = await FirestoreService.create('session_surveys', surveyData);
      if (result.success) {
        setNewSurvey({ title: '', description: '', questions: [] });
        await loadSurveys();
      }
    } catch (error) {
      console.error('Error creating survey:', error);
    }
  };

  // Observation CRUD Operations
  const handleSaveObservation = async () => {
    if (!intakeId || !sessionNumber) return;
    
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const observationData: Omit<Observation, 'id'> = {
        sessionId: sessionKey,
        studentEngagement: currentObservation.studentEngagement!,
        participationLevel: currentObservation.participationLevel!,
        keyObservations: currentObservation.keyObservations!,
        areasForImprovement: currentObservation.areasForImprovement!,
        nextSessionRecommendations: currentObservation.nextSessionRecommendations!,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user-id' // In real app, get from user context
      };
      
      const result = await FirestoreService.create('session_observations', observationData);
      if (result.success) {
        await loadObservations();
        alert('Observation saved successfully!');
      }
    } catch (error) {
      console.error('Error saving observation:', error);
      alert('Error saving observation. Please try again.');
    }
  };

  // Assignment CRUD Operations
  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim() || !intakeId || !sessionNumber) return;
    
    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const assignmentData: Omit<Assignment, 'id'> = {
        sessionId: sessionKey,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate,
        points: newAssignment.points,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user-id', // In real app, get from user context
        status: 'draft'
      };
      
      const result = await FirestoreService.create('session_assignments', assignmentData);
      if (result.success) {
        setNewAssignment({ title: '', description: '', dueDate: '', points: 100 });
        await loadAssignments();
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !intakeId || !sessionNumber) return;
    
    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // In a real app, you'd upload to Firebase Storage or similar
        const mockFileUrl = URL.createObjectURL(file);
        
        const contentData = {
          sessionKey: `${intakeId}_${sessionNumber}`,
          intakeId,
          sessionNumber: parseInt(sessionNumber),
          fileName: file.name,
          fileType: getFileType(file.type),
          fileUrl: mockFileUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'current-user-id', // Replace with actual user ID
          description: '',
          size: file.size
        };
        
        await FirestoreService.create('session_content', contentData);
      }
      
      await loadSessionContent();
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (mimeType: string): SessionContent['fileType'] => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slide';
    return 'document';
  };

  const getFileIcon = (fileType: SessionContent['fileType']) => {
    switch (fileType) {
      case 'pdf': return FileText;
      case 'video': return Video;
      case 'image': return Image;
      case 'slide': return BookOpen;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleClockIn = async (studentId: string) => {
    try {
      const attendanceRecord = attendance.find(a => a.studentId === studentId);
      
      if (attendanceRecord) {
        // Update existing record
        await FirestoreService.update('attendance', attendanceRecord.id, {
          clockInTime: new Date().toISOString(),
          status: 'present'
        });
      } else {
        // Create new attendance record
        await FirestoreService.create('attendance', {
          intakeId,
          sessionNumber: parseInt(sessionNumber),
          sessionKey: `${intakeId}_${sessionNumber}`,
          studentId,
          clockInTime: new Date().toISOString(),
          status: 'present'
        });
      }
      
      await loadAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/portal/learning/intake/${intakeId}/schedule`)}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Class Session</h1>
              <p className="text-lg text-primary-100">
                {session ? `${session.sessionTitle} - Week ${session.week}` : 'Manage your class session'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Session Info */}
        {session && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Week</p>
              <p className="text-lg font-semibold">{session.week}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Date</p>
              <p className="text-lg font-semibold">{session.date || 'TBD'}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Time</p>
              <p className="text-lg font-semibold">{session.time || 'TBD'}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Delivery Mode</p>
              <p className="text-lg font-semibold capitalize">{session.deliveryMode || 'TBD'}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Trainer</p>
              <p className="text-lg font-semibold">{session.trainer || 'TBD'}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Module Focus</p>
              <p className="text-lg font-semibold">{session.moduleFocus || 'TBD'}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Session Type</p>
              <p className="text-lg font-semibold capitalize">{session.sessionType}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Quadrant</p>
              <p className="text-lg font-semibold">{session.quadrantMapping || 'TBD'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Viewer Modal */}
      {viewingContent && (
        <ContentViewer
          content={viewingContent}
          onClose={() => setViewingContent(null)}
        />
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
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

          {/* Session Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Upload Area - Only for instructors */}
              {isInstructor && (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Session Materials</h3>
                <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
                <label
                  htmlFor="file-upload"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 cursor-pointer inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Choose Files</span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: PDF, PowerPoint, Images, Videos, Documents
                </p>
                </div>
              )}

              {/* Content List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Session Materials</h3>
                
                {sessionContent.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{isInstructor ? 'No materials uploaded yet. Upload some content to get started.' : 'No materials available yet.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessionContent.map((content) => {
                      const Icon = getFileIcon(content.fileType);
                      return (
                        <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 truncate">{content.fileName}</h4>
                                <p className="text-xs text-gray-500">{formatFileSize(content.size)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              content.fileType === 'pdf' ? 'bg-red-100 text-red-800' :
                              content.fileType === 'video' ? 'bg-purple-100 text-purple-800' :
                              content.fileType === 'image' ? 'bg-green-100 text-green-800' :
                              content.fileType === 'slide' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {content.fileType.toUpperCase()}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setViewingContent(content)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = content.fileUrl;
                                  a.download = content.fileName;
                                  a.click();
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Student Attendance</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Present: {attendance.filter(a => a.status === 'present').length}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Late: {attendance.filter(a => a.status === 'late').length}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Absent: {attendance.filter(a => a.status === 'absent').length}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {attendance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No students enrolled in this session yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendance.map((student) => (
                      <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.studentName} className="w-10 h-10 rounded-full" />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {student.studentName.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{student.studentName}</h4>
                            <p className="text-sm text-gray-500">{student.studentEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              student.status === 'present' ? 'bg-green-500' :
                              student.status === 'late' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <span className="text-sm font-medium capitalize">{student.status}</span>
                          </div>
                          
                          {student.clockInTime && (
                            <span className="text-xs text-gray-500">
                              {new Date(student.clockInTime).toLocaleTimeString()}
                            </span>
                          )}
                        </div>

                        {!student.clockInTime && isInstructor && (
                          <button
                            onClick={() => handleClockIn(student.studentId)}
                            className="w-full mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Clock In</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Session Tab */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              {!isLiveSession ? (
                <div className="text-center">
                  <Video className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">Live Video Conference</h3>
                  <p className="text-gray-600 mb-6">Join or start a live video class session with enhanced features</p>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        // Navigate to the new live class page
                        navigate(`/portal/learning/live-class/${intakeId}/${sessionNumber}`, {
                          state: {
                            session: {
                              id: `${intakeId}_${sessionNumber}`,
                              intakeId,
                              sessionNumber: parseInt(sessionNumber!),
                              sessionTitle: session?.sessionTitle || `Session ${sessionNumber}`,
                              instructorName: session?.trainer || 'Instructor',
                              instructorId: session?.instructorId || 'instructor-id',
                              startTime: session?.date && session?.time ?
                                `${session.date}T${session.time}` : new Date().toISOString(),
                              status: 'live' as const,
                              maxParticipants: 50,
                              currentParticipants: 0,
                              allowRecording: true,
                              allowScreenSharing: true,
                              allowChat: true,
                              description: session?.activity || session?.moduleFocus,
                            }
                          }
                        });
                      }}
                      className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-3"
                    >
                      <ExternalLink className="h-5 w-5" />
                      <span>Join Live Class</span>
                    </button>

                    <button
                      onClick={() => setIsLiveSession(true)}
                      className="bg-secondary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-secondary-700 transition-colors flex items-center space-x-3"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Start Basic Conference</span>
                    </button>
                  </div>

                  {/* Live Session Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <Video className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-blue-800 mb-2">HD Video Conferencing</h4>
                      <p className="text-sm text-blue-700">Crystal clear two-way video communication with WebRTC</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-green-800 mb-2">Interactive Learning</h4>
                      <p className="text-sm text-green-700">Real-time participation with multiple learners</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg text-center">
                      <FileText className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-purple-800 mb-2">Screen Sharing</h4>
                      <p className="text-sm text-purple-700">Share screens and presentations for better engagement</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Live Video Conference */
                <VideoConference 
                  sessionId={`${intakeId}_${sessionNumber}` || ''}
                  participantName="Facilitator" // In real app, get from user context
                  onEnd={() => setIsLiveSession(false)}
                />
              )}
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Session Questions</h3>
                <p className="text-gray-600 mb-6">
                  {isInstructor ? 'Manage questions and Q&A for this session' : 'View questions and Q&A for this session'}
                </p>
              </div>

              {/* Add Question Form - Only for instructors */}
              {isInstructor && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Add New Question</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter a question..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
                  />
                  <button 
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Question</span>
                  </button>
                </div>
                </div>
              )}

              {/* Questions List */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Session Questions</h4>
                  <span className="text-sm text-gray-500">
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {loadingQuestions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading questions...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-sm">No questions yet. Add one above or questions from students will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 mb-2">{question.question}</p>
                            <p className="text-xs text-gray-500 mb-2">
                              Asked by: {question.askedByName} • {new Date(question.askedAt).toLocaleString()}
                            </p>
                            {question.answer && (
                              <div className="bg-white p-3 rounded border-l-4 border-green-500 mt-2">
                                <p className="text-sm text-gray-900 mb-1"><strong>Answer:</strong> {question.answer}</p>
                                <p className="text-xs text-gray-500">
                                  Answered on {new Date(question.answeredAt!).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question.status === 'answered' ? 'bg-green-100 text-green-800' :
                              question.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {question.status}
                            </span>
                            {question.status === 'pending' && isInstructor && (
                              <>
                                <button
                                  onClick={() => {
                                    const answer = prompt('Enter your answer:');
                                    if (answer) handleAnswerQuestion(question.id, answer);
                                  }}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Answer
                                </button>
                                <button
                                  onClick={() => handleDismissQuestion(question.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Dismiss question"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Survey Tab */}
          {activeTab === 'survey' && (
            <div className="space-y-6">
              <div className="text-center">
                <ClipboardList className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Session Survey</h3>
                <p className="text-gray-600 mb-6">Collect feedback and ratings from participants</p>
              </div>

              {/* Survey Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Survey Creation */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Create Survey</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Survey Title</label>
                      <input 
                        type="text" 
                        value={newSurvey.title}
                        onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Session Feedback Survey"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea 
                        rows={3}
                        value={newSurvey.description}
                        onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Please rate your experience with today's session..."
                      />
                    </div>

                    <button 
                      onClick={handleCreateSurvey}
                      disabled={!newSurvey.title.trim() || loadingSurveys}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {loadingSurveys ? 'Creating...' : 'Create Survey'}
                    </button>
                  </div>
                </div>

                {/* Survey Results */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Survey Results</h4>
                  
                  {loadingSurveys ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading surveys...</p>
                    </div>
                  ) : surveys.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-sm">No surveys created yet. Create one to start collecting feedback.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {surveys.map((survey) => {
                        const responses = surveyResponses.filter(r => r.surveyId === survey.id);
                        const avgRating = responses.length > 0 ? 
                          responses.reduce((sum, r) => sum + (r.answers['overall_rating'] || 0), 0) / responses.length : 0;
                        
                        return (
                          <div key={survey.id} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">{survey.title}</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  survey.status === 'active' ? 'bg-green-100 text-green-800' :
                                  survey.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {survey.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Responses</span>
                                <span className="font-medium text-gray-900">{responses.length}</span>
                              </div>
                              {avgRating > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Avg Rating</span>
                                  <span className="font-medium text-gray-900">{avgRating.toFixed(1)}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Surveys List */}
              {surveys.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Created Surveys</h4>
                  <div className="space-y-3">
                    {surveys.map((survey) => (
                      <div key={survey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">{survey.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(survey.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            survey.status === 'active' ? 'bg-green-100 text-green-800' :
                            survey.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observation Tab */}
          {activeTab === 'observation' && (
            <div className="space-y-6">
              <div className="text-center">
                <FileSearch className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Session Observation</h3>
                <p className="text-gray-600 mb-6">Record observations and notes about the session</p>
              </div>

              {/* Observation Form */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Trainer Observations</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Student Engagement</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option>Excellent</option>
                        <option>Good</option>
                        <option>Average</option>
                        <option>Needs Improvement</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Participation Level</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Observations</label>
                    <textarea 
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Record your observations about student behavior, understanding, challenges, etc..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Note areas where students struggled or need additional support..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Session Recommendations</label>
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Recommendations for the next session based on today's observations..."
                    />
                  </div>

                  <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                    Save Observations
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Tab */}
          {activeTab === 'assignment' && (
            <div className="space-y-6">
              <div className="text-center">
                <BookOpenCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Session Assignments</h3>
                <p className="text-gray-600 mb-6">Manage assignments and track submissions</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Assignment */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Create Assignment</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="JavaScript Fundamentals Exercise"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea 
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Complete the exercises on async/await and promise handling..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Create Assignment
                    </button>
                  </div>
                </div>

                {/* Assignment Submissions */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Submissions Overview</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">18</p>
                        <p className="text-xs text-green-700">Submitted</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">5</p>
                        <p className="text-xs text-yellow-700">Pending</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">2</p>
                        <p className="text-xs text-red-700">Overdue</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">John Doe</p>
                          <p className="text-xs text-green-600">Submitted • 2 hours ago</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Grade</button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sarah Wilson</p>
                          <p className="text-xs text-green-600">Submitted • 4 hours ago</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Grade</button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Mike Johnson</p>
                          <p className="text-xs text-yellow-600">In Progress</p>
                        </div>
                        <button className="text-gray-400 text-sm">Pending</button>
                      </div>
                    </div>

                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      View All Submissions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassSession; 