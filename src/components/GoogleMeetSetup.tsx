import React from 'react';
import { AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';

interface GoogleMeetSetupProps {
  onClose?: () => void;
}

const GoogleMeetSetup: React.FC<GoogleMeetSetupProps> = ({ onClose }) => {
  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_API_KEY;
  const isConfigured = hasClientId && hasApiKey;

  const setupSteps = [
    {
      title: "Create Google Cloud Project",
      description: "Go to Google Cloud Console and create a new project",
      link: "https://console.cloud.google.com/",
      completed: true // We assume this is always done
    },
    {
      title: "Enable Google Meet API",
      description: "Search for 'Google Meet API' and enable it for your project",
      link: "https://console.cloud.google.com/apis/library/meet.googleapis.com",
      completed: true // We assume this is done
    },
    {
      title: "Create OAuth 2.0 Credentials",
      description: "Create OAuth 2.0 Client ID for web application",
      link: "https://console.cloud.google.com/apis/credentials",
      completed: hasClientId
    },
    {
      title: "Create API Key",
      description: "Create an API key and restrict it to Google Meet API",
      link: "https://console.cloud.google.com/apis/credentials",
      completed: hasApiKey
    },
    {
      title: "Configure Environment Variables",
      description: "Add your credentials to the .env file",
      completed: isConfigured
    }
  ];

  if (isConfigured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 text-green-800 mb-4">
          <CheckCircle className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Google Meet API Configured</h3>
        </div>
        <p className="text-green-700">
          Your Google Meet API is properly configured and ready to use!
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 text-orange-600 mb-6">
        <AlertTriangle className="h-6 w-6" />
        <h3 className="text-lg font-semibold">Google Meet API Setup Required</h3>
      </div>

      <p className="text-gray-700 mb-6">
        To use embedded Google Meet functionality, you need to configure the Google Meet API. 
        Follow these steps to get started:
      </p>

      <div className="space-y-4">
        {setupSteps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              step.completed 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{step.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <span>Open in Google Cloud Console</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Environment Variables Template */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Environment Variables (.env file)</h4>
        <pre className="text-sm bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`# Add these to your .env file in the project root
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here

# Example:
# VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
# VITE_GOOGLE_API_KEY=AIzaSyABC123def456GHI789jkl`}
        </pre>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">After Configuration</h4>
        <p className="text-sm text-blue-700">
          Once you've added the environment variables, restart your development server for the changes to take effect.
        </p>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMeetSetup; 