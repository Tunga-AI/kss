import { FirestoreService } from './firestore';

export interface LiveClassSession {
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

export interface Participant {
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

export interface ChatMessage {
  id: string;
  sessionId: string;
  participantId: string;
  participantName: string;
  participantRole: 'instructor' | 'learner' | 'facilitator';
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'poll' | 'question';
  isPrivate?: boolean;
  targetParticipant?: string;
}

export class LiveClassService {
  // WebRTC Configuration optimized for live classes
  private static readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  };

  // Media constraints for optimal video conferencing quality
  private static readonly videoConstraints = {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
  };

  private static readonly audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2,
  };

  // Get media stream with optimal settings
  static async getUserMedia(constraints: { video?: boolean; audio?: boolean }): Promise<MediaStream> {
    try {
      const mediaConstraints: MediaStreamConstraints = {};

      if (constraints.video) {
        mediaConstraints.video = this.videoConstraints;
      }

      if (constraints.audio) {
        mediaConstraints.audio = this.audioConstraints;
      }

      return await navigator.mediaDevices.getUserMedia(mediaConstraints);
    } catch (error) {
      console.error('Error getting user media:', error);

      // Fallback to basic constraints
      const fallbackConstraints: MediaStreamConstraints = {
        video: constraints.video || false,
        audio: constraints.audio || false,
      };

      return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    }
  }

  // Get screen sharing stream
  static async getDisplayMedia(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      });
    } catch (error) {
      console.error('Error getting display media:', error);
      throw error;
    }
  }

  // Create WebRTC peer connection
  static createPeerConnection(
    onIceCandidate?: (candidate: RTCIceCandidate) => void,
    onTrack?: (event: RTCTrackEvent) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.rtcConfig);

    if (onIceCandidate) {
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };
    }

    if (onTrack) {
      peerConnection.ontrack = onTrack;
    }

    if (onConnectionStateChange) {
      peerConnection.onconnectionstatechange = () => {
        onConnectionStateChange(peerConnection.connectionState);
      };
    }

    return peerConnection;
  }

  // Measure connection quality
  static async measureConnectionQuality(peerConnection: RTCPeerConnection): Promise<{
    latency: number;
    bandwidth: number;
    packetsLost: number;
    jitter: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  }> {
    try {
      const stats = await peerConnection.getStats();
      let latency = 0;
      let bandwidth = 0;
      let packetsLost = 0;
      let jitter = 0;

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          latency = report.currentRoundTripTime * 1000; // Convert to ms
        }

        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          packetsLost = report.packetsLost || 0;
          jitter = report.jitter || 0;
          bandwidth = report.bytesReceived || 0;
        }
      });

      // Determine quality based on metrics
      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

      if (latency > 300 || packetsLost > 5) {
        quality = 'poor';
      } else if (latency > 200 || packetsLost > 2) {
        quality = 'fair';
      } else if (latency > 100 || packetsLost > 0) {
        quality = 'good';
      }

      return {
        latency,
        bandwidth,
        packetsLost,
        jitter,
        quality,
      };
    } catch (error) {
      console.error('Error measuring connection quality:', error);
      return {
        latency: 0,
        bandwidth: 0,
        packetsLost: 0,
        jitter: 0,
        quality: 'fair',
      };
    }
  }

  // Live class session management
  static async createLiveSession(sessionData: Omit<LiveClassSession, 'id' | 'currentParticipants'>): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const session: Omit<LiveClassSession, 'id'> = {
        ...sessionData,
        currentParticipants: 0,
      };

      const result = await FirestoreService.create('live_sessions', session);

      if (result.success) {
        return { success: true, sessionId: result.id };
      } else {
        return { success: false, error: 'Failed to create session' };
      }
    } catch (error) {
      console.error('Error creating live session:', error);
      return { success: false, error: 'Failed to create session' };
    }
  }

  static async getLiveSession(sessionId: string): Promise<{ success: boolean; session?: LiveClassSession; error?: string }> {
    try {
      const result = await FirestoreService.getById('live_sessions', sessionId);

      if (result.success && result.data) {
        return { success: true, session: result.data as LiveClassSession };
      } else {
        return { success: false, error: 'Session not found' };
      }
    } catch (error) {
      console.error('Error getting live session:', error);
      return { success: false, error: 'Failed to get session' };
    }
  }

  static async updateLiveSession(sessionId: string, updates: Partial<LiveClassSession>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.update('live_sessions', sessionId, updates);
      return { success: result.success, error: result.success ? undefined : 'Failed to update session' };
    } catch (error) {
      console.error('Error updating live session:', error);
      return { success: false, error: 'Failed to update session' };
    }
  }

  // Participant management
  static async addParticipant(sessionId: string, participant: Omit<Participant, 'joinedAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      const participantData = {
        ...participant,
        sessionId,
        joinedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.create('session_participants', participantData);

      if (result.success) {
        // Update participant count
        await this.updateParticipantCount(sessionId, 1);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to add participant' };
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      return { success: false, error: 'Failed to add participant' };
    }
  }

  static async removeParticipant(sessionId: string, participantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('session_participants', [
        { field: 'sessionId', operator: '==', value: sessionId },
        { field: 'id', operator: '==', value: participantId }
      ]);

      if (result.success && result.data && result.data.length > 0) {
        await FirestoreService.delete('session_participants', result.data[0].id);
        await this.updateParticipantCount(sessionId, -1);
        return { success: true };
      } else {
        return { success: false, error: 'Participant not found' };
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      return { success: false, error: 'Failed to remove participant' };
    }
  }

  static async getParticipants(sessionId: string): Promise<{ success: boolean; participants?: Participant[]; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('session_participants', [
        { field: 'sessionId', operator: '==', value: sessionId }
      ]);

      if (result.success && result.data) {
        return { success: true, participants: result.data as Participant[] };
      } else {
        return { success: false, error: 'Failed to get participants' };
      }
    } catch (error) {
      console.error('Error getting participants:', error);
      return { success: false, error: 'Failed to get participants' };
    }
  }

  private static async updateParticipantCount(sessionId: string, change: number): Promise<void> {
    try {
      const sessionResult = await FirestoreService.getById('live_sessions', sessionId);

      if (sessionResult.success && sessionResult.data) {
        const currentCount = sessionResult.data.currentParticipants || 0;
        const newCount = Math.max(0, currentCount + change);

        await FirestoreService.update('live_sessions', sessionId, {
          currentParticipants: newCount
        });
      }
    } catch (error) {
      console.error('Error updating participant count:', error);
    }
  }

  // Chat management
  static async sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        ...message,
        timestamp: new Date().toISOString(),
      };

      const result = await FirestoreService.create('live_class_chat', messageData);

      if (result.success) {
        return { success: true, messageId: result.id };
      } else {
        return { success: false, error: 'Failed to send message' };
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  static async getChatMessages(sessionId: string, limit: number = 50): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('live_class_chat', [
        { field: 'sessionId', operator: '==', value: sessionId }
      ], limit);

      if (result.success && result.data) {
        return { success: true, messages: result.data as ChatMessage[] };
      } else {
        return { success: false, error: 'Failed to get messages' };
      }
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  // Session recording
  static async startRecording(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateLiveSession(sessionId, {
        recordingUrl: `recording_${sessionId}_${Date.now()}`,
        status: 'live'
      });

      return { success: true };
    } catch (error) {
      console.error('Error starting recording:', error);
      return { success: false, error: 'Failed to start recording' };
    }
  }

  static async stopRecording(sessionId: string, recordingUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateLiveSession(sessionId, {
        recordingUrl,
        endTime: new Date().toISOString(),
        status: 'ended'
      });

      return { success: true };
    } catch (error) {
      console.error('Error stopping recording:', error);
      return { success: false, error: 'Failed to stop recording' };
    }
  }

  // Device testing utilities
  static async testMicrophone(): Promise<{ success: boolean; level?: number; error?: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      return new Promise((resolve) => {
        const checkLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const level = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

          // Clean up
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();

          resolve({ success: true, level });
        };

        setTimeout(checkLevel, 1000);
      });
    } catch (error) {
      console.error('Error testing microphone:', error);
      return { success: false, error: 'Failed to test microphone' };
    }
  }

  static async testCamera(): Promise<{ success: boolean; resolution?: { width: number; height: number }; error?: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // Clean up
      stream.getTracks().forEach(track => track.stop());

      return {
        success: true,
        resolution: {
          width: settings.width || 0,
          height: settings.height || 0
        }
      };
    } catch (error) {
      console.error('Error testing camera:', error);
      return { success: false, error: 'Failed to test camera' };
    }
  }

  // Network quality testing
  static async testNetworkQuality(): Promise<{
    success: boolean;
    downloadSpeed?: number;
    uploadSpeed?: number;
    latency?: number;
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
    error?: string;
  }> {
    try {
      // Simple network test using ping to Google's public DNS
      const startTime = performance.now();

      await fetch('https://dns.google/resolve?name=google.com&type=A', {
        method: 'GET',
        mode: 'cors'
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

      if (latency > 500) {
        quality = 'poor';
      } else if (latency > 300) {
        quality = 'fair';
      } else if (latency > 150) {
        quality = 'good';
      }

      return {
        success: true,
        latency,
        quality,
        downloadSpeed: 0, // Would need more sophisticated testing
        uploadSpeed: 0    // Would need more sophisticated testing
      };
    } catch (error) {
      console.error('Error testing network quality:', error);
      return {
        success: false,
        error: 'Failed to test network quality'
      };
    }
  }
}

export default LiveClassService;