import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
    </div>
  );
};

export default LoadingSpinner;