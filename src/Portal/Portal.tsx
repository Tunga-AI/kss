import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTop from '../components/ScrollToTop';
import Sidebar from './components/Sidebar';
import LearnerSidebar from './components/LearnerSidebar';
import FacilitatorSidebar from './components/FacilitatorSidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Admissions from './pages/Admissions/Admissions';
import ApplicantPage from './pages/Admissions/ApplicantPage';
import CohortPage from './pages/Admissions/CohortPage';
import Programs from './pages/Programs/Programs';
import ProgramPage from './pages/Programs/ProgramPage';
import EventPage from './pages/Events/EventPage';
import Learners from './pages/Learners/Learners';
import LearnerPage from './pages/Learners/LearnerPage';
import ProgramLearnersPage from './pages/Learners/ProgramLearnersPage';
import EventAttendeesPage from './pages/Learners/EventAttendeesPage';
import Staff from './pages/Staff/Staff';
import StaffPage from './pages/Staff/StaffPage';
import Instructors from './pages/Instructors/Instructors';
import InstructorPage from './pages/Instructors/InstructorPage';
import Users from './pages/Users/Users';
import UserPage from './pages/Users/UserPage';
import Learning from './pages/Learning/Learning';
import CohortLearners from './pages/Learning/CohortLearners';
import Schedule from './pages/Learning/Schedule';
import CreateSchedule from './pages/Learning/CreateSchedule';
import ClassSession from './pages/Learning/ClassSession';
import Resource from './pages/Learning/Resource';
import Monitoring from './pages/Learning/Monitoring';
import Capstone from './pages/Learning/Capstone';
import Analytics from './pages/Learning/Analytics';
import LiveClass from './pages/Learning/LiveClass';
import Finance from './pages/Finance/Finance';
import FinancePortal from './pages/Finance/FinancePortal';
import CustomerFinancePage from './pages/Finance/CustomerFinancePage';
import Communication from './pages/Communication/Communication';
import Settings from './pages/Settings/Settings';
import CompetencyTestPage from './pages/Admissions/CompetencyTestPage';
import Opportunities from './pages/Recruitment/Opportunities';
import JobDetailPage from './pages/Recruitment/JobDetailPage';
import CandidateDetailPage from './pages/Recruitment/CandidateDetailPage';
import OrganizationDetailPage from './pages/Recruitment/OrganizationDetailPage';
import AI from './pages/AI/AI';
import EnhancedAI from './pages/AI/EnhancedAI';
import Customers from './pages/Customers/Customers';
import CustomerPage from './pages/Customers/CustomerPage';
import B2bCustomerPage from './pages/Customers/B2bCustomerPage';
import WhatsApp from './pages/WhatsApp/WhatsApp';
import WhatsAppTemplates from './pages/WhatsApp/WhatsAppTemplates';
import Media from './pages/Media/Media';
import MediaTypeSelector from './pages/Media/MediaTypeSelector';
import AlbumForm from './pages/Media/AlbumForm';
import BlogForm from './pages/Media/BlogForm';
import VideoForm from './pages/Media/VideoForm';
import LearnerCohortSelection from './pages/Learning/LearnerCohortSelection';
import LearnerFinance from './pages/Finance/LearnerFinance';
import ProtectedFinanceRoute from '../components/ProtectedFinanceRoute';


const Portal: React.FC = () => {

  
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalInitialized, setPortalInitialized] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const { userProfile, loading: authLoading } = useAuthContext();

  // Portal initialization effect
  useEffect(() => {
    const initializePortal = async () => {
      try {
        // Wait for authentication to complete
        if (!authLoading && userProfile) {
          // Shorter delay to reduce split screen effect
          await new Promise(resolve => setTimeout(resolve, 200));
          setPortalInitialized(true);
          // Set initial render to false after a brief moment to enable animations
          setTimeout(() => setInitialRender(false), 100);
        } else if (!authLoading && !userProfile) {
          console.warn('🏛️ [Portal] No user profile found after auth completion');
          setPortalInitialized(true);
          setTimeout(() => setInitialRender(false), 100);
        }
      } catch (error) {
        console.error('❌ [Portal] Error during portal initialization:', error);
        setPortalInitialized(true);
        setTimeout(() => setInitialRender(false), 100);
      }
    };

    initializePortal();
  }, [authLoading, userProfile]);

  // Debug logging - moved to proper hook location
  useEffect(() => {
    if (userProfile) {
      console.log('🏛️ Portal: User role detected:', userProfile.role, 'isLearner:', userProfile?.role === 'learner', 'isFacilitator:', userProfile?.role === 'facilitator');
      console.log('🏛️ Portal: Using',
        userProfile?.role === 'learner' ? 'LearnerSidebar' :
        userProfile?.role === 'facilitator' ? 'FacilitatorSidebar' :
        'Standard Sidebar');
    }
  }, [userProfile]);

  // Show loading spinner during authentication or portal initialization
  if (authLoading || !portalInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="fixed left-0 top-0 h-full bg-primary-600 w-16 lg:w-16 z-40"></div>
        <main className="flex-1 lg:ml-16 ml-0">
          <div className="p-4 sm:p-6 flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }

    

  // Determine which sidebar to use based on user role
  const isLearner = userProfile?.role === 'learner';
  const isFacilitator = userProfile?.role === 'facilitator';

  try {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ScrollToTop />
        {isLearner ? (
          <LearnerSidebar
            expanded={sidebarExpanded}
            onExpandedChange={setSidebarExpanded}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuChange={setMobileMenuOpen}
          />
        ) : isFacilitator ? (
          <FacilitatorSidebar
            expanded={sidebarExpanded}
            onExpandedChange={setSidebarExpanded}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuChange={setMobileMenuOpen}
          />
        ) : (
          <Sidebar
            expanded={sidebarExpanded}
            onExpandedChange={setSidebarExpanded}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuChange={setMobileMenuOpen}
          />
        )}
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <main className={`flex-1 ${initialRender ? '' : 'transition-all duration-300'} ${
          sidebarExpanded ? (isLearner ? 'lg:ml-72' : 'lg:ml-64') : 'lg:ml-16'
        } ml-0`}>
          <div className="p-4 sm:p-6">
            <Routes>
              <Route 
                path="/" 
                element={<Dashboard />}
              />
              <Route 
                path="/dashboard" 
                element={<Dashboard />}
              />
              <Route 
                path="/admissions" 
                element={
                  userProfile?.role === 'applicant' ? (
                    <Navigate to="/portal/admissions/my-application" replace />
                  ) : (
                    <Admissions />
                  )
                } 
              />
              <Route path="/admissions/applicants/new" element={<ApplicantPage />} />
              <Route path="/admissions/applicants/:id" element={<ApplicantPage />} />
              <Route path="/admissions/my-application" element={<ApplicantPage />} />
              <Route path="/admissions/intakes/new" element={<CohortPage />} />
              <Route path="/admissions/intakes/:id" element={<CohortPage />} />
              <Route path="/admissions/intakes/:id/edit" element={<CohortPage />} />
              <Route path="/admissions/test/new" element={<CompetencyTestPage />} />
              <Route path="/admissions/test/:id" element={<CompetencyTestPage />} />
              <Route path="/admissions/test/:id/:action" element={<CompetencyTestPage />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/new" element={<ProgramPage />} />
              <Route path="/programs/:id" element={<ProgramPage />} />
              {/* Redirect old events routes to programs */}
              <Route path="/events" element={<Navigate to="/portal/programs" replace />} />
              <Route path="/events/new" element={<EventPage />} />
              <Route path="/events/:id" element={<EventPage />} />
              <Route path="/events/:id/edit" element={<EventPage />} />
              <Route path="/learners" element={<Learners />} />
              <Route path="/learners/new" element={<LearnerPage />} />
              <Route path="/learners/program/:programId" element={<ProgramLearnersPage />} />
              <Route path="/learners/event/:eventId" element={<EventAttendeesPage />} />
              <Route path="/learners/:id" element={<LearnerPage />} />
              <Route path="/learners/:id/edit" element={<LearnerPage />} />
              <Route path="/learners/my-profile" element={<LearnerPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/new" element={<CustomerPage />} />
              <Route path="/customers/:customerId" element={<CustomerPage />} />
              <Route path="/customers/:customerId/edit" element={<CustomerPage />} />
              <Route path="/customers/b2b/new" element={<B2bCustomerPage />} />
              <Route path="/customers/b2b/:leadId" element={<B2bCustomerPage />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/new" element={<StaffPage />} />
              <Route path="/staff/:id" element={<StaffPage />} />
              <Route path="/staff/:id/edit" element={<StaffPage />} />
              <Route path="/staff/my-profile" element={<StaffPage />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/instructors/new" element={<InstructorPage />} />
              <Route path="/instructors/my-profile" element={<InstructorPage />} />
              <Route path="/instructors/:id/edit" element={<InstructorPage />} />
              <Route path="/instructors/:id" element={<InstructorPage />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/new" element={<UserPage />} />
              <Route path="/users/:id" element={<UserPage />} />
              <Route path="/users/:id/edit" element={<UserPage />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/cohorts" element={<LearnerCohortSelection />} />
              <Route path="/learning/schedule" element={<Schedule />} />
              <Route path="/learning/resources" element={<Resource />} />
              <Route path="/learning/content" element={<Resource />} />
              <Route path="/learning/monitoring" element={<Monitoring />} />
              <Route path="/learning/capstone" element={<Capstone />} />
              <Route path="/learning/analytics" element={<Analytics />} />
              <Route path="/learning/intake/:intakeId/learners" element={<CohortLearners />} />
              <Route path="/learning/intake/:intakeId/schedule" element={<Schedule />} />
              <Route path="/learning/intake/:intakeId/schedule/create" element={<CreateSchedule />} />
              <Route path="/learning/intake/:intakeId/session/:sessionNumber" element={<ClassSession />} />
              <Route path="/learning/live-class/:intakeId/:sessionNumber" element={<LiveClass />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/opportunities/jobs/new" element={<JobDetailPage />} />
              <Route path="/opportunities/jobs/:id" element={<JobDetailPage />} />
              <Route path="/opportunities/jobs/:id/edit" element={<JobDetailPage />} />
              <Route path="/opportunities/candidates/new" element={<CandidateDetailPage />} />
              <Route path="/opportunities/candidates/:id" element={<CandidateDetailPage />} />
              <Route path="/opportunities/candidates/:id/edit" element={<CandidateDetailPage />} />
              <Route path="/opportunities/organizations/new" element={<OrganizationDetailPage />} />
              <Route path="/opportunities/organizations/:id" element={<OrganizationDetailPage />} />
              <Route path="/opportunities/organizations/:id/edit" element={<OrganizationDetailPage />} />
              <Route path="/finance/*" element={
                <ProtectedFinanceRoute>
                  <FinancePortal />
                </ProtectedFinanceRoute>
              } />
              <Route path="/finance/my-finances" element={<LearnerFinance />} />
              <Route path="/finance/customer/:id" element={<CustomerFinancePage />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/ai" element={<EnhancedAI />} />
              <Route path="/ai/legacy" element={<AI />} />
              <Route path="/settings" element={<Settings />} />
              {/* WhatsApp Routes */}
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/whatsapp/templates" element={<WhatsAppTemplates />} />

              {/* Media Routes */}
              <Route path="/media" element={<Media />} />
              <Route path="/media/new" element={<MediaTypeSelector />} />
              <Route path="/media/albums/new" element={<AlbumForm />} />
              <Route path="/media/albums/:id/edit" element={<AlbumForm />} />
              <Route path="/media/blogs/new" element={<BlogForm />} />
              <Route path="/media/blogs/:id/edit" element={<BlogForm />} />
              <Route path="/media/videos/new" element={<VideoForm />} />
              <Route path="/media/videos/:id/edit" element={<VideoForm />} />

              {/* AI Assistant */}
            </Routes>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('❌ [Portal] Error rendering Portal component:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Portal Loading Error</h1>
          <p className="text-gray-600 mb-4">There was an error loading the portal. Check console for details.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default Portal;