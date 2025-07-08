import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MessageSquare, 
  Users,
  Settings,
  Maximize,
  Minimize2,
  Copy,
  UserPlus
} from 'lucide-react';
import GoogleCloudWebRTC from '../services/webrtcConfig';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
}

interface ChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  timestamp: string;
}

interface VideoConferenceProps {
  sessionId: string;
  participantName: string;
  onEnd?: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ 
  sessionId, 
  participantName, 
  onEnd 
}) => {
  // Video conference state
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [networkStats, setNetworkStats] = useState({ latency: 0, bandwidth: 0 });

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conferenceRef = useRef<HTMLDivElement>(null);

  // WebRTC configuration optimized for Google Cloud
  const rtcConfig = GoogleCloudWebRTC.getOptimizedConfig();

  // Monitor connection quality (Google Cloud optimized)
  const monitorConnectionQuality = useCallback(async () => {
    try {
      const latency = await GoogleCloudWebRTC.measureLatencyToGoogle();
      
      // Determine connection quality based on latency
      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
      if (latency > 200) quality = 'poor';
      else if (latency > 150) quality = 'fair';
      else if (latency > 100) quality = 'good';
      
      setConnectionQuality(quality);
      setNetworkStats(prev => ({ ...prev, latency }));
      
    } catch (error) {
      console.error('Connection quality check failed:', error);
      setConnectionQuality('fair');
    }
  }, []);

  // Initialize with Google Cloud optimizations
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log('Requesting camera access...');
      
      // Try high quality first
      let constraints = GoogleCloudWebRTC.getHighQualityConstraints();
      let stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('High quality stream obtained:', stream);
      setLocalStream(stream);
      
      // Ensure video element is properly set up
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Video element source set');
        
        // Force video to play
        try {
          await localVideoRef.current.play();
          console.log('Video is playing');
        } catch (playError) {
          console.warn('Video play failed:', playError);
        }
      }
      
      return stream;
    } catch (error) {
      console.error('High quality stream failed:', error);
      
      // Fallback to basic constraints
      try {
        console.log('Trying fallback constraints...');
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });
        
        console.log('Fallback stream obtained:', fallbackStream);
        setLocalStream(fallbackStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = fallbackStream;
          try {
            await localVideoRef.current.play();
            console.log('Fallback video is playing');
          } catch (playError) {
            console.warn('Fallback video play failed:', playError);
          }
        }
        return fallbackStream;
      } catch (fallbackError) {
        console.error('Fallback stream failed:', fallbackError);
        
        // Last resort - very basic constraints
        try {
          console.log('Trying basic constraints...');
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          console.log('Basic stream obtained:', basicStream);
          setLocalStream(basicStream);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = basicStream;
            try {
              await localVideoRef.current.play();
              console.log('Basic video is playing');
            } catch (playError) {
              console.warn('Basic video play failed:', playError);
            }
          }
          return basicStream;
        } catch (basicError) {
          console.error('All stream attempts failed:', basicError);
          alert('Unable to access camera/microphone. Please check permissions and try again.');
          return null;
        }
      }
    }
  }, []);

  // Join conference
  const joinConference = useCallback(async () => {
    setConnectionStatus('connecting');
    
    // Start connection quality monitoring
    monitorConnectionQuality();
    const qualityInterval = setInterval(monitorConnectionQuality, 5000);
    
    const stream = await initializeLocalStream();
    
    if (stream) {
      // Add self as participant
      const localParticipant: Participant = {
        id: 'local',
        name: participantName,
        stream,
        isAudioMuted: false,
        isVideoMuted: false,
        isScreenSharing: false
      };
      
      setParticipants([localParticipant]);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Cleanup quality monitoring on unmount
      return () => clearInterval(qualityInterval);
      
      // In a real implementation, you would connect to a signaling server here
      // For demo purposes, we'll simulate some remote participants
      setTimeout(() => {
        addDemoParticipants();
      }, 2000);
    }
  }, [participantName, initializeLocalStream, monitorConnectionQuality]);

  // Add demo participants (simulate real users)
  const addDemoParticipants = () => {
    const demoParticipants: Participant[] = [
      {
        id: 'demo1',
        name: 'Student 1',
        isAudioMuted: false,
        isVideoMuted: false,
        isScreenSharing: false
      },
      {
        id: 'demo2',
        name: 'Student 2',
        isAudioMuted: true,
        isVideoMuted: false,
        isScreenSharing: false
      }
    ];
    
    setParticipants(prev => [...prev, ...demoParticipants]);
    
    // Add some demo chat messages
    const demoMessages: ChatMessage[] = [
      {
        id: '1',
        participantId: 'demo1',
        participantName: 'Student 1',
        message: 'Hello everyone!',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        participantId: 'demo2',
        participantName: 'Student 2',
        message: 'Good morning!',
        timestamp: new Date().toISOString()
      }
    ];
    
    setChatMessages(demoMessages);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
      
      // Update local participant
      setParticipants(prev => 
        prev.map(p => 
          p.id === 'local' ? { ...p, isAudioMuted: !isAudioMuted } : p
        )
      );
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
      
      // Update local participant
      setParticipants(prev => 
        prev.map(p => 
          p.id === 'local' ? { ...p, isVideoMuted: !isVideoMuted } : p
        )
      );
    }
  };

  // Share screen
  const shareScreen = async () => {
    try {
      if (!isScreenSharing) {
        console.log('Starting screen share...');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnections.current.values().next().value?.getSenders()
            .find((s: RTCRtpSender) => s.track?.kind === 'video');
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        setIsScreenSharing(true);
        
        // Listen for screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          console.log('Screen share ended by user');
          setIsScreenSharing(false);
          // Switch back to camera
          initializeLocalStream();
        };
      } else {
        console.log('Stopping screen share...');
        // Stop current screen sharing tracks
        if (localStream) {
          const screenTracks = localStream.getTracks().filter(track => 
            track.label.includes('screen') || track.contentHint === 'motion'
          );
          screenTracks.forEach(track => {
            console.log('Stopping screen track:', track.label);
            track.stop();
          });
        }
        
        setIsScreenSharing(false);
        await initializeLocalStream();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      setIsScreenSharing(false);
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        participantId: 'local',
        participantName: participantName,
        message: newMessage,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  // End conference
  const endConference = () => {
    console.log('Ending conference...');
    
    // Stop all tracks from local stream
    if (localStream) {
      console.log('Stopping local stream tracks...');
      localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track:`, track.label);
        track.stop();
      });
    }
    
    // Clear video element source
    if (localVideoRef.current) {
      console.log('Clearing video element source...');
      localVideoRef.current.srcObject = null;
      localVideoRef.current.load(); // Force reload to clear any cached content
    }
    
    // Close peer connections
    peerConnections.current.forEach(pc => {
      console.log('Closing peer connection...');
      pc.close();
    });
    peerConnections.current.clear();
    
    // Reset all state
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setParticipants([]);
    setLocalStream(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
    setShowChat(false);
    setChatMessages([]);
    setNewMessage('');
    setIsFullscreen(false);
    
    console.log('Conference ended, all resources cleaned up');
    
    if (onEnd) {
      onEnd();
    }
  };

  // Copy meeting link
  const copyMeetingLink = () => {
    const meetingLink = `${window.location.origin}/join/${sessionId}`;
    navigator.clipboard.writeText(meetingLink);
    alert('Meeting link copied to clipboard!');
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...');
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track on unmount:`, track.label);
          track.stop();
        });
      }
      
      // Clear video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      
      // Close any peer connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
    };
  }, [localStream]);

  // Auto-join conference when component mounts
  useEffect(() => {
    joinConference();
  }, [joinConference]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <Video className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Initializing Video'}
          </h3>
          <p className="text-gray-600 mb-6">
            {connectionStatus === 'connecting' 
              ? 'Setting up your camera and microphone...' 
              : 'Getting ready to start video conference'
            }
          </p>
          
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-600">
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Loading...'}
            </span>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>💡 Make sure to allow camera and microphone permissions when prompted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={conferenceRef}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Live Conference</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-300">{participants.length} participants</span>
          <span className="text-gray-300">•</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionQuality === 'excellent' ? 'bg-green-500' :
              connectionQuality === 'good' ? 'bg-yellow-500' :
              connectionQuality === 'fair' ? 'bg-orange-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-300 capitalize text-sm">{connectionQuality}</span>
            {networkStats.latency > 0 && (
              <span className="text-gray-400 text-xs">({networkStats.latency}ms)</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400 mr-2">
            Google Cloud Optimized
          </div>
          <button
            onClick={copyMeetingLink}
            className="p-2 text-gray-300 hover:text-white transition-colors"
            title="Copy meeting link"
          >
            <Copy className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-300 hover:text-white transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="relative">
        <div className={`grid gap-2 p-4 ${
          participants.length === 1 ? 'grid-cols-1' :
          participants.length === 2 ? 'grid-cols-2' :
          participants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {participants.map((participant) => (
            <div key={participant.id} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {participant.id === 'local' ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log('Video metadata loaded');
                    if (localVideoRef.current) {
                      localVideoRef.current.play().catch(e => console.warn('Video play failed:', e));
                    }
                  }}
                  onError={(e) => console.error('Video error:', e)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm">{participant.name}</p>
                  </div>
                </div>
              )}
              
              {/* Participant overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {participant.name} {participant.id === 'local' && '(You)'}
                </span>
                <div className="flex items-center space-x-1">
                  {participant.isAudioMuted && (
                    <div className="bg-red-500 p-1 rounded">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {participant.isVideoMuted && (
                    <div className="bg-red-500 p-1 rounded">
                      <VideoOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {participant.isScreenSharing && (
                    <div className="bg-blue-500 p-1 rounded">
                      <Monitor className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute right-4 top-4 bottom-20 w-80 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Chat</h4>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-800">{msg.participantName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoMuted ? (
              <VideoOff className="h-5 w-5 text-white" />
            ) : (
              <Video className="h-5 w-5 text-white" />
            )}
          </button>
          
          <button
            onClick={shareScreen}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <Monitor className="h-5 w-5 text-white" />
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors relative"
            title="Toggle chat"
          >
            <MessageSquare className="h-5 w-5 text-white" />
            {chatMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">{chatMessages.length}</span>
              </div>
            )}
          </button>
          
          <button
            onClick={endConference}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="Leave conference"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoConference; 