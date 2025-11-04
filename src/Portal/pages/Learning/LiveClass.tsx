import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Users,
  Settings,
  Maximize2,
  Minimize2,
  Hand,
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Zap,
  Clock,
  X
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';

interface LiveClassSession {
  id: string;
  intakeId: string;
  sessionNumber: number;
  sessionTitle: string;
  instructorName: string;
  instructorId: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'live' | 'ended';
  meetingLink?: string;
  meetingCode?: string;
  recordingUrl?: string;
  maxParticipants: number;
  currentParticipants: number;
  allowRecording: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
  description?: string;
  materials?: string[];
}

interface Participant {
  id: string;
  name: string;
  role: 'instructor' | 'learner' | 'facilitator';
  avatar?: string;
  stream?: MediaStream;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised: boolean;
  joinedAt: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'instructor' | 'learner' | 'facilitator';
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'poll' | 'question';
  isPrivate?: boolean;
  targetParticipant?: string;
}

interface LiveClassProps {}

const LiveClass: React.FC<LiveClassProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuthContext();
  const { intakeId, sessionNumber } = useParams<{ intakeId: string; sessionNumber: string }>();

  // Get session data from location state or fetch it
  const sessionData = location.state?.session as LiveClassSession | undefined;

  const [session, setSession] = useState<LiveClassSession | null>(sessionData || null);
  const [loading, setLoading] = useState(!sessionData);
  const [error, setError] = useState<string | null>(null);

  // Video conference state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // User controls
  const [isAudioMuted, setIsAudioMuted] = useState(true); // Start muted
  const [isVideoMuted, setIsVideoMuted] = useState(true); // Start with video off
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedVideoLayout, setSelectedVideoLayout] = useState<'grid' | 'speaker' | 'sidebar'>('speaker');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [videoQuality, setVideoQuality] = useState<'high' | 'medium' | 'low' | 'audio-only'>('medium');
  const [autoQualityAdjustment, setAutoQualityAdjustment] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Connection state
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [networkStats, setNetworkStats] = useState({
    latency: 0,
    bandwidth: 0,
    packetsLost: 0,
    jitter: 0
  });
  const [devicePermissions, setDevicePermissions] = useState({
    camera: false,
    microphone: false,
    screen: false
  });

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  // Load session data if not provided
  useEffect(() => {
    if (!sessionData && intakeId && sessionNumber) {
      loadSessionData();
    }
  }, [intakeId, sessionNumber, sessionData]);

  // Initialize devices and permissions
  useEffect(() => {
    checkDevicePermissions();
    loadChatHistory();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Connection quality monitoring and auto-adjustment
  useEffect(() => {
    if (isConnected && autoQualityAdjustment) {
      const interval = setInterval(async () => {
        await adjustQualityBasedOnConnection();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, autoQualityAdjustment]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isConnected) return;

      // Only handle shortcuts if not typing in input
      if ((event.target as HTMLElement).tagName === 'INPUT') return;

      switch (event.key.toLowerCase()) {
        case 'm':
          event.preventDefault();
          toggleAudio();
          break;
        case 'v':
          event.preventDefault();
          toggleVideo();
          break;
        case 'c':
          event.preventDefault();
          setShowChat(!showChat);
          break;
        case 'p':
          event.preventDefault();
          setShowParticipants(!showParticipants);
          break;
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (isMinimized) {
            setIsMinimized(false);
          } else if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isConnected, showChat, showParticipants, isFullscreen, isMinimized]);

  // Update unread messages
  useEffect(() => {
    if (!showChat) {
      setUnreadMessages(prev => prev + 1);
    } else {
      setUnreadMessages(0);
    }
  }, [chatMessages.length, showChat]);

  const loadSessionData = async () => {
    if (!intakeId || !sessionNumber) return;

    try {
      setLoading(true);
      // Load session details from schedule
      const result = await FirestoreService.getById('schedules', intakeId);

      if (result.success && result.data && result.data.sessions) {
        const sessionData = result.data.sessions.find((s: any) =>
          s.session === parseInt(sessionNumber)
        );

        if (sessionData) {
          // Transform to LiveClassSession format
          const liveSession: LiveClassSession = {
            id: `${intakeId}_${sessionNumber}`,
            intakeId,
            sessionNumber: parseInt(sessionNumber),
            sessionTitle: sessionData.sessionTitle || `Session ${sessionNumber}`,
            instructorName: sessionData.trainer || 'Instructor',
            instructorId: sessionData.instructorId || 'instructor-id',
            startTime: sessionData.date && sessionData.time ?
              `${sessionData.date}T${sessionData.time}` : new Date().toISOString(),
            status: 'scheduled',
            maxParticipants: 50,
            currentParticipants: 0,
            allowRecording: true,
            allowScreenSharing: true,
            allowChat: true,
            description: sessionData.activity || sessionData.moduleFocus,
          };

          setSession(liveSession);
        } else {
          setError('Session not found');
        }
      } else {
        setError('Failed to load session data');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const checkDevicePermissions = async () => {
    try {
      // Check camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setDevicePermissions(prev => ({ ...prev, camera: true }));
        stream.getTracks().forEach(track => track.stop());
      } catch {
        setDevicePermissions(prev => ({ ...prev, camera: false }));
      }

      // Check microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setDevicePermissions(prev => ({ ...prev, microphone: true }));
        stream.getTracks().forEach(track => track.stop());
      } catch {
        setDevicePermissions(prev => ({ ...prev, microphone: false }));
      }

      // Check screen sharing support
      const hasScreenShare = navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices;
      setDevicePermissions(prev => ({ ...prev, screen: hasScreenShare }));
    } catch (error) {
      console.error('Error checking device permissions:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!intakeId || !sessionNumber) return;

    try {
      const sessionKey = `${intakeId}_${sessionNumber}`;
      const result = await FirestoreService.getWithQuery('live_class_chat', [
        { field: 'sessionId', operator: '==', value: sessionKey }
      ]);

      if (result.success && result.data) {
        setChatMessages(result.data as ChatMessage[]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const joinClass = async () => {
    if (!session || !userProfile) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Request media permissions with adaptive quality
      const mediaConstraints: MediaStreamConstraints = {};

      if (!isAudioMuted && devicePermissions.microphone) {
        mediaConstraints.audio = getOptimalAudioConstraints(connectionQuality);
      }

      if (!isVideoMuted && devicePermissions.camera && videoQuality !== 'audio-only') {
        mediaConstraints.video = getOptimalVideoConstraints(videoQuality, connectionQuality);
      }

      if (mediaConstraints.video || mediaConstraints.audio) {
        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      // Add system message
      const joinMessage: ChatMessage = {
        id: Date.now().toString(),
        participantId: 'system',
        participantName: 'System',
        participantRole: 'instructor',
        message: `${userProfile.displayName} joined the class`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      setChatMessages(prev => [...prev, joinMessage]);
      setIsConnected(true);

      // Create participant entry
      const participant: Participant = {
        id: userProfile.uid,
        name: userProfile.displayName,
        role: userProfile.role as any,
        avatar: '',
        isAudioMuted,
        isVideoMuted,
        isHandRaised: false,
        joinedAt: new Date().toISOString(),
        connectionQuality: 'good'
      };

      setParticipants(prev => [...prev, participant]);

    } catch (error) {
      console.error('Error joining class:', error);
      setError('Failed to join class. Please check your camera and microphone permissions.');
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveClass = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Stop all remote streams
    remoteStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    setRemoteStreams(new Map());

    setIsConnected(false);
    navigate(-1);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    } else {
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    } else {
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);

    // Send hand raise notification
    const handMessage: ChatMessage = {
      id: Date.now().toString(),
      participantId: userProfile?.uid || '',
      participantName: userProfile?.displayName || '',
      participantRole: userProfile?.role as any,
      message: isHandRaised ? 'lowered their hand' : 'raised their hand',
      timestamp: new Date().toISOString(),
      type: 'system'
    };

    setChatMessages(prev => [...prev, handMessage]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !userProfile) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      participantId: userProfile.uid,
      participantName: userProfile.displayName,
      participantRole: userProfile.role as any,
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Adaptive quality based on connection
  const getOptimalVideoConstraints = (quality: string, connectionQuality: string) => {
    const constraints: any = {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 15, max: 30 },
      facingMode: 'user'
    };

    // Adjust based on connection quality
    if (connectionQuality === 'poor' || quality === 'low') {
      constraints.width = { ideal: 320, max: 640 };
      constraints.height = { ideal: 240, max: 480 };
      constraints.frameRate = { ideal: 10, max: 15 };
    } else if (connectionQuality === 'fair' || quality === 'medium') {
      constraints.width = { ideal: 640, max: 1280 };
      constraints.height = { ideal: 480, max: 720 };
      constraints.frameRate = { ideal: 15, max: 24 };
    } else if (connectionQuality === 'good' || quality === 'high') {
      constraints.width = { ideal: 1280, max: 1920 };
      constraints.height = { ideal: 720, max: 1080 };
      constraints.frameRate = { ideal: 24, max: 30 };
    }

    return constraints;
  };

  const getOptimalAudioConstraints = (connectionQuality: string) => {
    const baseConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (connectionQuality === 'poor') {
      return {
        ...baseConstraints,
        sampleRate: 16000,
        channelCount: 1,
      };
    } else if (connectionQuality === 'fair') {
      return {
        ...baseConstraints,
        sampleRate: 24000,
        channelCount: 1,
      };
    } else {
      return {
        ...baseConstraints,
        sampleRate: 48000,
        channelCount: 2,
      };
    }
  };

  const adjustQualityBasedOnConnection = async () => {
    try {
      // Simulate connection quality check (in real app, you'd measure actual metrics)
      const latency = Math.random() * 500; // Random latency simulation
      let newConnectionQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

      if (latency > 300) {
        newConnectionQuality = 'poor';
      } else if (latency > 200) {
        newConnectionQuality = 'fair';
      } else if (latency > 100) {
        newConnectionQuality = 'good';
      }

      setConnectionQuality(newConnectionQuality);

      // Auto-adjust video quality if enabled
      if (autoQualityAdjustment && localStream) {
        let newQuality = videoQuality;

        if (newConnectionQuality === 'poor' && videoQuality !== 'low' && videoQuality !== 'audio-only') {
          newQuality = 'low';
        } else if (newConnectionQuality === 'fair' && videoQuality === 'high') {
          newQuality = 'medium';
        } else if (newConnectionQuality === 'excellent' && videoQuality === 'low') {
          newQuality = 'medium';
        }

        if (newQuality !== videoQuality) {
          setVideoQuality(newQuality);
          await updateStreamQuality(newQuality);
        }
      }

      // Update network stats
      setNetworkStats(prev => ({
        ...prev,
        latency,
        bandwidth: Math.random() * 1000, // Simulated
        packetsLost: Math.random() * 5,
        jitter: Math.random() * 50
      }));

    } catch (error) {
      console.error('Error adjusting quality:', error);
    }
  };

  const updateStreamQuality = async (quality: string) => {
    if (!localStream) return;

    try {
      // Stop current video track
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }

      if (quality === 'audio-only') {
        // Remove video track completely
        localStream.getVideoTracks().forEach(track => {
          localStream.removeTrack(track);
        });
        setIsVideoMuted(true);
        return;
      }

      // Get new video stream with updated constraints
      const videoConstraints = getOptimalVideoConstraints(quality, connectionQuality);
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      // Replace video track
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (newVideoTrack) {
        localStream.addTrack(newVideoTrack);

        // Update video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }

    } catch (error) {
      console.error('Error updating stream quality:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      // Close sidebars when minimizing
      setShowChat(false);
      setShowParticipants(false);
      setShowSettings(false);
    }
  };

  const renderVideoGrid = () => {
    const allParticipants = participants.filter(p => !p.isVideoMuted);
    const gridCols = Math.ceil(Math.sqrt(allParticipants.length + (localStream && !isVideoMuted ? 1 : 0)));

    return (
      <div className={`grid gap-2 h-full ${
        gridCols === 1 ? 'grid-cols-1' :
        gridCols === 2 ? 'grid-cols-2' :
        gridCols === 3 ? 'grid-cols-3' :
        'grid-cols-4'
      }`}>
        {/* Local video */}
        {localStream && !isVideoMuted && (
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              You {isAudioMuted && '(muted)'}
            </div>
          </div>
        )}

        {/* Remote videos */}
        {allParticipants.map(participant => (
          <div key={participant.id} className="relative bg-gray-900 rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {participant.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {participant.name} {participant.isAudioMuted && '(muted)'}
              {participant.isHandRaised && ' ✋'}
            </div>
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                participant.connectionQuality === 'excellent' ? 'bg-green-400' :
                participant.connectionQuality === 'good' ? 'bg-yellow-400' :
                participant.connectionQuality === 'fair' ? 'bg-orange-400' :
                'bg-red-400'
              }`} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSpeakerView = () => {
    const speakerParticipant = pinnedParticipant ?
      participants.find(p => p.id === pinnedParticipant) :
      participants.find(p => p.role === 'instructor') ||
      participants[0];

    const thumbnailParticipants = participants.filter(p => p.id !== speakerParticipant?.id);

    return (
      <div className="h-full flex flex-col">
        {/* Main speaker video */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
          {speakerParticipant ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-4xl">
                {speakerParticipant.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          ) : localStream && !isVideoMuted ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Video className="h-16 w-16 mx-auto mb-4" />
                <p>Waiting for participants to join...</p>
              </div>
            </div>
          )}

          {speakerParticipant && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
              {speakerParticipant.name}
              {speakerParticipant.isAudioMuted && ' (muted)'}
              {speakerParticipant.isHandRaised && ' ✋'}
            </div>
          )}
        </div>

        {/* Thumbnail videos */}
        {(thumbnailParticipants.length > 0 || (localStream && !isVideoMuted && speakerParticipant)) && (
          <div className="mt-2 flex space-x-2 overflow-x-auto pb-2">
            {/* Local video thumbnail */}
            {localStream && !isVideoMuted && speakerParticipant && (
              <div className="flex-shrink-0 w-32 h-24 bg-gray-900 rounded overflow-hidden relative cursor-pointer">
                <video
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  src=""
                />
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                  You
                </div>
              </div>
            )}

            {thumbnailParticipants.map(participant => (
              <div
                key={participant.id}
                className="flex-shrink-0 w-32 h-24 bg-gray-900 rounded overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-primary-500"
                onClick={() => setPinnedParticipant(participant.id)}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                  {participant.name.split(' ')[0]}
                </div>
                {participant.isHandRaised && (
                  <div className="absolute top-1 right-1 text-yellow-400">✋</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading live class...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unable to Load Class</h1>
          <p className="text-gray-300 mb-6">{error || 'Session not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMinimized ? 'fixed bottom-4 right-4 w-80 h-64 z-50' : 'min-h-screen'} bg-gray-900 text-white flex flex-col transition-all duration-300 ${isMinimized ? 'rounded-lg overflow-hidden shadow-2xl' : ''}`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{session.sessionTitle}</h1>
            <p className="text-sm text-gray-400">
              Instructor: {session.instructorName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <>
              {/* Connection quality indicator */}
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionQuality === 'excellent' ? 'bg-green-400' :
                  connectionQuality === 'good' ? 'bg-yellow-400' :
                  connectionQuality === 'fair' ? 'bg-orange-400' :
                  'bg-red-400'
                }`} />
                <span className="text-xs text-gray-400 capitalize">{connectionQuality}</span>
              </div>

              {/* Video quality indicator */}
              <div className="flex items-center space-x-1 text-gray-400">
                <Zap className={`h-4 w-4 ${
                  videoQuality === 'high' ? 'text-green-400' :
                  videoQuality === 'medium' ? 'text-yellow-400' :
                  videoQuality === 'low' ? 'text-orange-400' :
                  'text-red-400'
                }`} />
                <span className="text-xs capitalize">{videoQuality}</span>
              </div>

              {/* Participants count */}
              <div className="flex items-center space-x-1 text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">{participants.length}</span>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-1 text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </>
          )}

          {/* Window controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleMinimize}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            {!isMinimized && (
              <button
                onClick={toggleFullscreen}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 ${isMinimized ? 'p-1' : 'p-4'}`}>
          {!isConnected ? (
            /* Pre-join screen */
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="bg-gray-800 rounded-2xl p-8 mb-6">
                  <Video className="h-16 w-16 text-primary-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Ready to Join?</h2>
                  <p className="text-gray-400 mb-6">{session.description}</p>

                  {/* Device preview */}
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Device Check</h3>
                      <button
                        onClick={checkDevicePermissions}
                        className="text-primary-400 hover:text-primary-300 text-sm"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Camera className="h-4 w-4" />
                          <span>Camera</span>
                        </span>
                        {devicePermissions.camera ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Mic className="h-4 w-4" />
                          <span>Microphone</span>
                        </span>
                        {devicePermissions.microphone ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Join options */}
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <button
                      onClick={toggleAudio}
                      className={`p-3 rounded-full ${
                        isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                      } transition-colors`}
                    >
                      {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={toggleVideo}
                      className={`p-3 rounded-full ${
                        isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                      } transition-colors`}
                    >
                      {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={joinClass}
                    disabled={isConnecting}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? 'Joining...' : 'Join Class'}
                  </button>

                  <p className="text-xs text-gray-500 mt-4">
                    By joining, you agree to follow class etiquette and participation guidelines.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* In-class view */
            <div className="h-full">
              {selectedVideoLayout === 'grid' ? renderVideoGrid() : renderSpeakerView()}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && isConnected && !isMinimized && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {chatMessages.map(message => (
                <div key={message.id} className={`${
                  message.type === 'system' ? 'text-center' : ''
                }`}>
                  {message.type === 'system' ? (
                    <p className="text-xs text-gray-500">{message.message}</p>
                  ) : (
                    <div className={`${
                      message.participantId === userProfile?.uid ? 'ml-4' : 'mr-4'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-semibold">
                          {message.participantName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">{message.participantName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              message.participantRole === 'instructor' ? 'bg-blue-500 text-blue-100' :
                              message.participantRole === 'facilitator' ? 'bg-purple-500 text-purple-100' :
                              'bg-gray-500 text-gray-100'
                            }`}>
                              {message.participantRole}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm bg-gray-700 rounded-lg px-3 py-2">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {showParticipants && isConnected && !isMinimized && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Participants ({participants.length})</h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-semibold">
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        participant.role === 'instructor' ? 'bg-blue-500 text-blue-100' :
                        participant.role === 'facilitator' ? 'bg-purple-500 text-purple-100' :
                        'bg-gray-500 text-gray-100'
                      }`}>
                        {participant.role}
                      </span>
                      {participant.isHandRaised && (
                        <span className="text-xs text-yellow-400">✋ Hand raised</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {participant.isAudioMuted ? (
                      <MicOff className="h-4 w-4 text-red-400" />
                    ) : (
                      <Mic className="h-4 w-4 text-green-400" />
                    )}
                    {participant.isVideoMuted ? (
                      <VideoOff className="h-4 w-4 text-red-400" />
                    ) : (
                      <Video className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Sidebar */}
        {showSettings && isConnected && !isMinimized && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Video Quality Settings */}
              <div>
                <h4 className="font-medium mb-3">Video Quality</h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Auto Quality</span>
                    <input
                      type="checkbox"
                      checked={autoQualityAdjustment}
                      onChange={(e) => setAutoQualityAdjustment(e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    />
                  </label>

                  {!autoQualityAdjustment && (
                    <div className="space-y-2">
                      {['high', 'medium', 'low', 'audio-only'].map((quality) => (
                        <label key={quality} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="videoQuality"
                            value={quality}
                            checked={videoQuality === quality}
                            onChange={(e) => {
                              setVideoQuality(e.target.value as any);
                              updateStreamQuality(e.target.value);
                            }}
                            className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600"
                          />
                          <span className="text-sm capitalize">
                            {quality === 'audio-only' ? 'Audio Only' : quality}
                            {quality === 'high' && ' (720p)'}
                            {quality === 'medium' && ' (480p)'}
                            {quality === 'low' && ' (240p)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Stats */}
              <div>
                <h4 className="font-medium mb-3">Connection Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latency:</span>
                    <span className={
                      networkStats.latency < 100 ? 'text-green-400' :
                      networkStats.latency < 200 ? 'text-yellow-400' :
                      'text-red-400'
                    }>
                      {networkStats.latency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Packets Lost:</span>
                    <span className={
                      networkStats.packetsLost < 1 ? 'text-green-400' :
                      networkStats.packetsLost < 3 ? 'text-yellow-400' :
                      'text-red-400'
                    }>
                      {networkStats.packetsLost.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Jitter:</span>
                    <span className={
                      networkStats.jitter < 30 ? 'text-green-400' :
                      networkStats.jitter < 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }>
                      {networkStats.jitter.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h4 className="font-medium mb-3">Keyboard Shortcuts</h4>
                <div className="space-y-1 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Mute/Unmute:</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">M</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Video On/Off:</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">V</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle Chat:</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">P</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Fullscreen:</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">F</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {isConnected && !isMinimized && (
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${
                  isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                } transition-colors`}
                title={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                } transition-colors`}
                title={isVideoMuted ? 'Start video' : 'Stop video'}
              >
                {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`p-3 rounded-full ${
                  isSpeakerMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                } transition-colors`}
                title={isSpeakerMuted ? 'Unmute speakers' : 'Mute speakers'}
              >
                {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleHandRaise}
                className={`p-3 rounded-full ${
                  isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
                } transition-colors`}
                title={isHandRaised ? 'Lower hand' : 'Raise hand'}
              >
                <Hand className="h-5 w-5" />
              </button>
            </div>

            {/* Center controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className="relative p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title="Toggle chat"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title="Toggle participants"
              >
                <Users className="h-5 w-5" />
              </button>

              <div className="flex items-center bg-gray-700 rounded-lg">
                <button
                  onClick={() => setSelectedVideoLayout('grid')}
                  className={`p-2 rounded-l-lg ${
                    selectedVideoLayout === 'grid' ? 'bg-primary-600' : 'hover:bg-gray-600'
                  } transition-colors`}
                  title="Grid view"
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedVideoLayout('speaker')}
                  className={`p-2 rounded-r-lg ${
                    selectedVideoLayout === 'speaker' ? 'bg-primary-600' : 'hover:bg-gray-600'
                  } transition-colors`}
                  title="Speaker view"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={leaveClass}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Leave Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Controls Overlay */}
      {isConnected && isMinimized && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full ${
                isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
              } transition-colors`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${
                isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
              } transition-colors`}
              title={isVideoMuted ? 'Start video' : 'Stop video'}
            >
              {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>

            <button
              onClick={leaveClass}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              title="Leave class"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClass;