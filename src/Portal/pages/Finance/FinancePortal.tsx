import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import FinanceDashboard from './FinanceDashboard';
import LearnerFinanceList from './LearnerFinanceList';
import AdmissionFinanceList from './AdmissionFinanceList';
import AlumniFinanceList from './AlumniFinanceList';
import InstructorFinanceList from './InstructorFinanceList';
import BillsExpensesList from './BillsExpensesList';
import CorporatesFinanceList from './CorporatesFinanceList';
import AllTransactionsList from './AllTransactionsList';
import FinanceReports from './FinanceReports';
import DetailedCustomerFinancePage from './DetailedCustomerFinancePage';
import LearnerFinanceView from './LearnerFinanceView';
import FinanceSidebar from '../../components/FinanceSidebar';


const FinancePortal: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <FinanceSidebar
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuChange={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarExpanded ? 'lg:ml-64 xl:ml-72' : 'lg:ml-16'
        }`}
      >
        <main>
          <Routes>
            <Route path="/" element={<FinanceDashboard />} />
            <Route path="/admissions" element={<AdmissionFinanceList />} />
            <Route path="/learners" element={<LearnerFinanceList />} />
            <Route path="/alumni" element={<AlumniFinanceList />} />
            <Route path="/instructors" element={<InstructorFinanceList />} />
            <Route path="/bills" element={<BillsExpensesList />} />
            <Route path="/corporates" element={<CorporatesFinanceList />} />
            <Route path="/transactions" element={<AllTransactionsList />} />
            <Route path="/my-finances" element={<LearnerFinanceView />} />
            <Route path="/customer/:id" element={<DetailedCustomerFinancePage />} />
            <Route path="/reports" element={<FinanceReports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default FinancePortal;