import React, { useState, useEffect } from 'react';
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
  Save
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import VideoConference from '../../../components/VideoConference';

interface ClassSession {
  id: string;
  cohortId: string;
  week: number;
  topic: string;
  format: string;
  time: string;
  trainer: string;
  sessionType: string;
  date: string;
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

const ClassSession: React.FC = () => {
  const navigate = useNavigate();
  const { cohortId, sessionId } = useParams<{ cohortId: string; sessionId: string }>();
  
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

  const tabs = [
    { id: 'content', label: 'Session Content', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'live', label: 'Live Session', icon: Video },
  ];

  useEffect(() => {
    loadSessionData();
    loadAttendance();
    loadSessionContent();
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    try {
      const result = await FirestoreService.getById('sessions', sessionId);
      if (result.success && result.data) {
        setSession(result.data as ClassSession);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const loadAttendance = async () => {
    if (!sessionId) return;
    
    try {
      const result = await FirestoreService.getWithQuery('attendance', [
        { field: 'sessionId', operator: '==', value: sessionId }
      ]);
      
      if (result.success && result.data) {
        setAttendance(result.data as StudentAttendance[]);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionContent = async () => {
    if (!sessionId) return;
    
    try {
      const result = await FirestoreService.getWithQuery('session_content', [
        { field: 'sessionId', operator: '==', value: sessionId }
      ]);
      
      if (result.success && result.data) {
        setSessionContent(result.data as SessionContent[]);
      }
    } catch (error) {
      console.error('Error loading session content:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !sessionId) return;
    
    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // In a real app, you'd upload to Firebase Storage or similar
        const mockFileUrl = URL.createObjectURL(file);
        
        const contentData = {
          sessionId,
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
          sessionId,
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
              onClick={() => navigate(`/portal/learning/cohort/${cohortId}/schedule`)}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Class Session</h1>
              <p className="text-lg text-primary-100">
                {session ? `${session.topic} - Week ${session.week}` : 'Manage your class session'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Session Info */}
        {session && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Format</p>
              <p className="text-lg font-semibold">{session.format}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Time</p>
              <p className="text-lg font-semibold">{session.time}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Trainer</p>
              <p className="text-lg font-semibold">{session.trainer}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <p className="text-sm text-primary-100">Type</p>
              <p className="text-lg font-semibold">{session.sessionType}</p>
            </div>
          </div>
        )}
      </div>

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
              {/* Upload Area */}
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

              {/* Content List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Session Materials</h3>
                
                {sessionContent.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No materials uploaded yet. Upload some content to get started.</p>
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
                                onClick={() => window.open(content.fileUrl, '_blank')}
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

                        {!student.clockInTime && (
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
                  <p className="text-gray-600 mb-6">Start a WebRTC-powered video conference with your students</p>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setIsLiveSession(true)}
                      className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-3"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Start Conference</span>
                    </button>
                  </div>

                  {/* Live Session Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <Video className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-blue-800 mb-2">HD Video Calls</h4>
                      <p className="text-sm text-blue-700">Crystal clear video powered by WebRTC technology</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-green-800 mb-2">Multi-Participant</h4>
                      <p className="text-sm text-green-700">Support for multiple students in one session</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg text-center">
                      <FileText className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-purple-800 mb-2">Screen Sharing</h4>
                      <p className="text-sm text-purple-700">Share your screen and presentations seamlessly</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Live Video Conference */
                <VideoConference 
                  sessionId={sessionId || ''}
                  participantName="Facilitator" // In real app, get from user context
                  onEnd={() => setIsLiveSession(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassSession; 