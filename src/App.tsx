import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { SystemSettingsProvider } from './contexts/SystemSettingsContext';
import Website from './Website/Website';
import Portal from './Portal/Portal';
import AuthPage from './Auth/AuthPage';
import SignUpPage from './Auth/SignUpPage';
import EmailVerificationPage from './Auth/EmailVerificationPage';
import LoadingSpinner from './components/LoadingSpinner';
import ScrollToTop from './components/ScrollToTop';
import CustomerLead from './Website/pages/CustomerLead';
import CustomerLeadModal from './components/CustomerLeadModal';
import B2bLeadModal from './components/B2bLeadModal';
import PublicInvoice from './components/PublicInvoice';
import PublicReceipt from './components/PublicReceipt';

const AppRouter: React.FC = () => {
  const { user, userProfile, loading } = useAuthContext();
  const { showLeadModal, showB2bLeadModal, selectedProgramType, setShowLeadModal, setShowB2bLeadModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();



  // Handle redirection after successful authentication
  useEffect(() => {
    if (!loading && user && userProfile) {
  
      
      // If user is on auth page but is authenticated, redirect based on role
      if (location.pathname === '/auth' || location.pathname === '/auth/signup') {
        if (userProfile.role === 'applicant') {

          navigate('/portal/admissions', { replace: true });
        } else {
          
          navigate('/portal', { replace: true });
        }
      }
      
      // Only redirect from root if user just authenticated (coming from auth page)
      // Allow authenticated users to manually navigate to website homepage
      if (location.pathname === '/' && user && (
        document.referrer.includes('/auth') ||
        sessionStorage.getItem('justAuthenticated') === 'true'
      )) {
        if (userProfile.role === 'applicant') {

          navigate('/portal/admissions', { replace: true });
        } else {

          navigate('/portal', { replace: true });
        }
        // Clear the flag after redirect
        sessionStorage.removeItem('justAuthenticated');
      }
    }
  }, [user, userProfile, loading, location.pathname, navigate]);

  if (loading) {
    
    return <LoadingSpinner />;
  }

  // Log navigation decisions
  

  return (
    <div className="min-h-screen bg-white font-urbanist">
      <ScrollToTop />
      <Routes>
        <Route path="/invoice/:invoiceNumber" element={<PublicInvoice />} />
        <Route path="/receipt/:receiptNumber" element={<PublicReceipt />} />
        <Route path="/lead" element={<CustomerLead />} />
        <Route path="/*" element={<Website />} />
        <Route path="/auth" element={
          user ? (
            <>
    
              <Navigate to="/portal" replace />
            </>
          ) : (
            <AuthPage />
          )
        } />
        <Route path="/auth/signup" element={
          user ? (
            <>
    
              <Navigate to="/portal" replace />
            </>
          ) : (
            <SignUpPage />
          )
        } />
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
        <Route 
          path="/portal/*" 
          element={
            user ? (
              <>
    
                <Portal />
              </>
            ) : (
              <>
    
                <Navigate to="/auth" replace />
            </>
            )
          } 
        />
      </Routes>
      
      {/* Global Modals */}
      <CustomerLeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        programType={selectedProgramType}
      />
      
      <B2bLeadModal
        isOpen={showB2bLeadModal}
        onClose={() => setShowB2bLeadModal(false)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <SystemSettingsProvider>
        <ModalProvider>
          <AppContent />
        </ModalProvider>
      </SystemSettingsProvider>
    </AuthProvider>
  );
}

export default App;