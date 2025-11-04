import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedFinanceRouteProps {
  children: React.ReactNode;
}

const ProtectedFinanceRoute: React.FC<ProtectedFinanceRouteProps> = ({ children }) => {
  const { userProfile, loading } = useAuthContext();

  // Show loading spinner while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if user is authenticated
  if (!userProfile) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has finance role or admin access
  const hasFinanceAccess = userProfile.role === 'finance' || userProfile.role === 'admin';

  if (!hasFinanceAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the Finance Portal. This area is restricted to finance team members.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current role: <span className="font-medium capitalize">{userProfile.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User has finance access, render the protected content
  return <>{children}</>;
};

export default ProtectedFinanceRoute;