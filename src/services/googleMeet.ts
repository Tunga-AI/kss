/**
 * Google Meet REST API Service
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select existing one
 * 3. Enable the Google Meet API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add your domain to authorized origins
 * 6. Set these environment variables in your .env file:
 *    - VITE_GOOGLE_CLIENT_ID=your_oauth_client_id
 *    - VITE_GOOGLE_API_KEY=your_api_key
 * 
 * Required Scopes:
 * - https://www.googleapis.com/auth/meetings.space.created
 */
export class GoogleMeetService {
  private static readonly BASE_URL = 'https://meet.googleapis.com/v2';
  private static accessToken: string | null = null;

  // Initialize Google Meet API with OAuth token
  static async initialize(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Create a new meeting space
  static async createMeetingSpace(config?: {
    meetingCode?: string;
    config?: {
      accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
      entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
    };
  }) {
    try {
      const response = await fetch(`${this.BASE_URL}/spaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config || {}),
      });

      if (!response.ok) {
        throw new Error(`Failed to create meeting space: ${response.statusText}`);
      }

      const meetingSpace = await response.json();
      return {
        success: true,
        data: meetingSpace,
      };
    } catch (error: any) {
      console.error('Error creating meeting space:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get meeting space details
  static async getMeetingSpace(spaceName: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/${spaceName}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get meeting space: ${response.statusText}`);
      }

      const meetingSpace = await response.json();
      return {
        success: true,
        data: meetingSpace,
      };
    } catch (error: any) {
      console.error('Error getting meeting space:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // List active conferences in a space
  static async listConferences(spaceName: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/${spaceName}/conferences`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list conferences: ${response.statusText}`);
      }

      const conferences = await response.json();
      return {
        success: true,
        data: conferences,
      };
    } catch (error: any) {
      console.error('Error listing conferences:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // List participants in a conference
  static async listParticipants(conferenceName: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/${conferenceName}/participants`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list participants: ${response.statusText}`);
      }

      const participants = await response.json();
      return {
        success: true,
        data: participants,
      };
    } catch (error: any) {
      console.error('Error listing participants:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get recordings for a conference
  static async getRecordings(conferenceName: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/${conferenceName}/recordings`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get recordings: ${response.statusText}`);
      }

      const recordings = await response.json();
      return {
        success: true,
        data: recordings,
      };
    } catch (error: any) {
      console.error('Error getting recordings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get transcripts for a conference
  static async getTranscripts(conferenceName: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/${conferenceName}/transcripts`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get transcripts: ${response.statusText}`);
      }

      const transcripts = await response.json();
      return {
        success: true,
        data: transcripts,
      };
    } catch (error: any) {
      console.error('Error getting transcripts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate embed URL for Google Meet
  static generateEmbedUrl(meetingCode: string, config?: {
    pip?: boolean;
    audioMuted?: boolean;
    videoMuted?: boolean;
    fullscreen?: boolean;
  }): string {
    const baseUrl = `https://meet.google.com/${meetingCode}`;
    const params = new URLSearchParams();
    
    if (config?.pip) params.append('pip', 'true');
    if (config?.audioMuted) params.append('audio', 'false');
    if (config?.videoMuted) params.append('video', 'false');
    if (config?.fullscreen) params.append('fullscreen', 'true');
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }

  // Extract meeting code from meeting URI
  static extractMeetingCode(meetingUri: string): string | null {
    const match = meetingUri.match(/meet\.google\.com\/([a-z-]+)/i);
    return match ? match[1] : null;
  }
}

// OAuth2 helper for Google Meet API authentication
export class GoogleAuth {
  private static readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private static readonly API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  private static readonly DISCOVERY_DOC = 'https://meet.googleapis.com/$discovery/rest?version=v2';
  private static readonly SCOPES = 'https://www.googleapis.com/auth/meetings.space.created';

  static async initializeGapi() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google API can only be initialized in browser environment'));
        return;
      }

      // Load Google API
      if (!(window as any).gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          (window as any).gapi.load('auth2:client', async () => {
            try {
              await (window as any).gapi.client.init({
                apiKey: this.API_KEY,
                clientId: this.CLIENT_ID,
                discoveryDocs: [this.DISCOVERY_DOC],
                scope: this.SCOPES
              });
              resolve(true);
            } catch (error) {
              reject(error);
            }
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        resolve(true);
      }
    });
  }

  static async signIn(): Promise<string | null> {
    try {
      await this.initializeGapi();
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      
      const user = authInstance.currentUser.get();
      const authResponse = user.getAuthResponse(true);
      
      return authResponse.access_token;
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    }
  }

  static async signOut(): Promise<void> {
    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        return await this.signIn();
      }
      
      const user = authInstance.currentUser.get();
      const authResponse = user.getAuthResponse(true);
      
      return authResponse.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }
} 