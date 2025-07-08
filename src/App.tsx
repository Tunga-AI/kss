import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import Website from './Website/Website';
import Portal from './Portal/Portal';
import AuthPage from './Auth/AuthPage';
import SignUpPage from './Auth/SignUpPage';
import LoadingSpinner from './components/LoadingSpinner';

const AppContent: React.FC = () => {
  const { user, userProfile, loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-white font-urbanist">
        <Routes>
          <Route path="/*" element={<Website />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route 
            path="/portal/*" 
            element={
              user ? <Portal /> : <Navigate to="/auth" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;