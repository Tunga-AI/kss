/**
 * WebRTC Configuration for Google Cloud Deployment
 * 
 * This configuration is optimized for applications hosted on Google Cloud Platform.
 * It provides multiple fallback options and production-ready settings.
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
  iceTransportPolicy: RTCIceTransportPolicy;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

export interface MediaConstraints {
  video: MediaTrackConstraints | boolean;
  audio: MediaTrackConstraints | boolean;
}

/**
 * Production WebRTC Configuration for Google Cloud
 */
export class GoogleCloudWebRTC {
  
  /**
   * Get optimized WebRTC configuration for Google Cloud hosting
   * 
   * Benefits when hosted on Google Cloud:
   * - Lower latency to Google STUN servers
   * - Better reliability within Google's network
   * - Automatic failover between STUN servers
   */
  static getOptimizedConfig(): WebRTCConfig {
    return {
      iceServers: [
        // Google STUN servers (free, high performance for Google Cloud)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Fallback STUN servers for redundancy
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.ekiga.net' },
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
  }

  /**
   * Production configuration with TURN servers
   * 
   * Use this when you need guaranteed connectivity behind corporate firewalls.
   * You'll need to set up your own TURN servers or use a service like Twilio.
   */
  static getProductionConfig(turnServers?: RTCIceServer[]): WebRTCConfig {
    const baseConfig = this.getOptimizedConfig();
    
    if (turnServers && turnServers.length > 0) {
      return {
        ...baseConfig,
        iceServers: [
          ...baseConfig.iceServers,
          ...turnServers
        ]
      };
    }
    
    return baseConfig;
  }

  /**
   * High-quality media constraints for Google Cloud
   * 
   * Takes advantage of Google Cloud's high bandwidth and processing power
   */
  static getHighQualityConstraints(): MediaConstraints {
    return {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2
      }
    };
  }

  /**
   * Monitor connection quality to Google's network
   */
  static async measureLatencyToGoogle(): Promise<number> {
    try {
      const startTime = performance.now();
      await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return Math.round(performance.now() - startTime);
    } catch (error) {
      console.warn('Could not measure latency to Google:', error);
      return -1;
    }
  }
}

/**
 * TURN Server Setup Guide for Production
 * 
 * For enterprise deployments where users are behind strict firewalls,
 * you may need TURN servers. Here are your options:
 * 
 * 1. Google Cloud VM with Coturn:
 *    - Deploy coturn on a Google Cloud VM
 *    - Benefits: Full control, cost-effective
 *    - Setup: https://github.com/coturn/coturn
 * 
 * 2. Twilio TURN Service:
 *    - Managed TURN servers
 *    - Benefits: No maintenance, global infrastructure
 *    - Cost: Pay per usage
 * 
 * 3. Xirsys (alternative):
 *    - Another managed TURN service
 *    - Benefits: WebRTC specialist
 * 
 * Example TURN server configuration:
 * 
 * const turnServers = [
 *   {
 *     urls: 'turn:your-turn-server.com:3478',
 *     username: 'your-username',
 *     credential: 'your-password'
 *   }
 * ];
 * 
 * const config = GoogleCloudWebRTC.getProductionConfig(turnServers);
 */

export default GoogleCloudWebRTC; 