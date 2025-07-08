import React from 'react';
import { GraduationCap } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="bg-white p-6 rounded-2xl shadow-2xl mb-6">
            <GraduationCap className="h-16 w-16 text-primary-600 mx-auto animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-white rounded-2xl opacity-20 animate-ping"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading Msomi</h2>
        <p className="text-primary-100">Please wait while we prepare your experience...</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;