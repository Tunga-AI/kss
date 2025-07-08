import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Admissions from './pages/Admissions/Admissions';
import ApplicantPage from './pages/Admissions/ApplicantPage';
import CohortPage from './pages/Admissions/CohortPage';
import Programs from './pages/Programs/Programs';
import ProgramPage from './pages/Programs/ProgramPage';
import Events from './pages/Events/Events';
import EventPage from './pages/Events/EventPage';
import Learners from './pages/Learners/Learners';
import LearnerPage from './pages/Learners/LearnerPage';
import Staff from './pages/Staff/Staff';
import StaffPage from './pages/Staff/StaffPage';
import Users from './pages/Users/Users';
import UserPage from './pages/Users/UserPage';
import Learning from './pages/Learning/Learning';
import CohortLearners from './pages/Learning/CohortLearners';
import Schedule from './pages/Learning/Schedule';
import ClassSession from './pages/Learning/ClassSession';
import Finance from './pages/Finance/Finance';
import Communication from './pages/Communication/Communication';
import Settings from './pages/Settings/Settings';
import CompetencyTestPage from './pages/Admissions/CompetencyTestPage';
import Recruitment from './pages/Recruitment/Recruitment';
import JobDetailPage from './pages/Recruitment/JobDetailPage';
import CandidateDetailPage from './pages/Recruitment/CandidateDetailPage';
import OrganizationDetailPage from './pages/Recruitment/OrganizationDetailPage';

const Portal: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { userProfile } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        expanded={sidebarExpanded} 
        onExpandedChange={setSidebarExpanded} 
      />
      <main className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          <Routes>
            <Route 
              path="/" 
              element={
                userProfile?.role === 'applicant' ? 
                <Navigate to="/portal/profile" replace /> : 
                <Dashboard />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                userProfile?.role === 'applicant' ? 
                <Navigate to="/portal/profile" replace /> : 
                <Dashboard />
              } 
            />
            <Route path="/profile" element={<Profile />} />
            <Route 
              path="/admissions" 
              element={
                userProfile?.role === 'applicant' ? 
                <Navigate to="/portal/admissions/my-application" replace /> : 
                <Admissions />
              } 
            />
            <Route path="/admissions/applicants/new" element={<ApplicantPage />} />
            <Route path="/admissions/applicants/:id" element={<ApplicantPage />} />
            <Route path="/admissions/my-application" element={<ApplicantPage />} />
            <Route path="/admissions/cohorts/new" element={<CohortPage />} />
            <Route path="/admissions/cohorts/:id" element={<CohortPage />} />
            <Route path="/admissions/cohorts/:id/edit" element={<CohortPage />} />
            <Route path="/admissions/test/new" element={<CompetencyTestPage />} />
            <Route path="/admissions/test/:id" element={<CompetencyTestPage />} />
            <Route path="/admissions/test/:id/:action" element={<CompetencyTestPage />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/new" element={<ProgramPage />} />
            <Route path="/programs/:id" element={<ProgramPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/new" element={<EventPage />} />
            <Route path="/events/:id" element={<EventPage />} />
            <Route path="/events/:id/edit" element={<EventPage />} />
            <Route path="/learners" element={<Learners />} />
            <Route path="/learners/new" element={<LearnerPage />} />
            <Route path="/learners/:id" element={<LearnerPage />} />
            <Route path="/learners/:id/edit" element={<LearnerPage />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/new" element={<StaffPage />} />
            <Route path="/staff/:id" element={<StaffPage />} />
            <Route path="/staff/:id/edit" element={<StaffPage />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/new" element={<UserPage />} />
            <Route path="/users/:id" element={<UserPage />} />
            <Route path="/users/:id/edit" element={<UserPage />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/cohort/:cohortId/learners" element={<CohortLearners />} />
            <Route path="/learning/cohort/:cohortId/schedule" element={<Schedule />} />
            <Route path="/learning/cohort/:cohortId/session/:sessionId" element={<ClassSession />} />
            <Route path="/recruitment" element={<Recruitment />} />
            <Route path="/recruitment/jobs/new" element={<JobDetailPage />} />
            <Route path="/recruitment/jobs/:id" element={<JobDetailPage />} />
            <Route path="/recruitment/jobs/:id/edit" element={<JobDetailPage />} />
            <Route path="/recruitment/candidates/new" element={<CandidateDetailPage />} />
            <Route path="/recruitment/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/recruitment/candidates/:id/edit" element={<CandidateDetailPage />} />
            <Route path="/recruitment/organizations/new" element={<OrganizationDetailPage />} />
            <Route path="/recruitment/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/recruitment/organizations/:id/edit" element={<OrganizationDetailPage />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Portal;