import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus, Edit, User, Briefcase, FileText, CheckCircle, Plus, Trash2, BookOpen, ChevronLeft, ChevronRight, Upload, Download, Calendar, Building, GraduationCap, X, ExternalLink, Receipt, CreditCard, Banknote, Eye, Loader } from 'lucide-react';
import { FirestoreService, ProgramService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import Invoice from '../Profile/Invoice';
import ReceiptComponent from '../Profile/Receipt';
import PDFService from '../../../services/pdfService';
import { WorkExperience, Education, BaseUserData } from '../../../types/shared';
import WhatsAppButton from '../../../components/WhatsAppButton';

// Payment constants
const BASE_PROGRAM_FEE = 5000;
const VAT_RATE = 0.16;
const VAT_AMOUNT = BASE_PROGRAM_FEE * VAT_RATE;
const TOTAL_PROGRAM_FEE = BASE_PROGRAM_FEE + VAT_AMOUNT;

interface LearnerData extends BaseUserData {
  // Additional learner-specific fields
  paymentRecords: {
    id: string;
    date: string;
    amount: number;
    type: 'tuition' | 'fees' | 'materials' | 'other';
    status: 'paid' | 'pending' | 'overdue' | 'verified';
    description: string;
    method?: string;
    confirmationCode?: string;
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
  }[];
  // Finance fields
  expectedAmount?: number;
  totalAmountPaid?: number;
  remainingBalance?: number;
  cohortProgramCost?: number;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  level?: string;
  status: string;
  fees?: number;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  programId: string;
  startDate: string;
  closeDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  maxStudents?: number;
  enrolledCount?: number;
  programCost?: number;
}

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  programId: string;
  startDate: string;
  closeDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  maxStudents?: number;
  enrolledCount?: number;
  programCost?: number;
  description?: string;
}

const LearnerPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Default to view mode
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);

  // Invoice/Receipt modal state
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    type: 'invoice' as 'invoice' | 'receipt'
  });


  // Payment completion state
  const [showPaymentCompletion, setShowPaymentCompletion] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank_transfer' | 'cash'>('mpesa');
  const [paymentConfirmation, setPaymentConfirmation] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // References for PDF generation
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [learnerData, setLearnerData] = useState<LearnerData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'learner',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    currentJobTitle: '',
    currentOrganisation: '',
    salesExperience: '',
    keyAchievements: '',
    programId: '',
    learningGoals: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    academicStatus: 'active',
    cohort: '',
    cohortId: '',
    cohortName: '',
    intakeId: '',
    intakeName: '',
    currentGPA: 0,
    paymentRecords: [],
    totalFees: 0,
    amountPaid: 0,
    outstandingBalance: 0,
    paymentPlan: 'full',
    expectedAmount: 0,
    totalAmountPaid: 0,
    remainingBalance: 0,
    cohortProgramCost: 0
  });

  const [newPayment, setNewPayment] = useState({
    amount: '',
    type: 'tuition' as const,
    description: '',
    method: 'cash',
    confirmationCode: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Check if user can edit this learner profile
  const canEdit = userProfile?.role !== 'learner' || learnerData.email === user?.email;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'work-experience', label: 'Work Experience', icon: Briefcase },
    { id: 'education', label: 'Education & Skills', icon: GraduationCap },
    ...(userProfile?.role !== 'learner' ? [
    { id: 'academic', label: 'Learning', icon: FileText },
    ] : []),
    { id: 'finance', label: 'Finance', icon: Banknote }
  ];

  useEffect(() => {
    if (location.pathname.endsWith('/my-profile')) {
      // Load current user's learner profile
      loadCurrentUserLearnerProfile();
    } else if (id) {
      // Load specific learner by ID
      loadLearner();
    } else if (userProfile?.role === 'learner' && user?.email) {
      // For learners accessing their own profile (fallback)
      loadLearnerByEmail();
    } else if (!id && user && userProfile) {
      // For new learners, pre-populate with user data
      initializeWithUserProfile();
      setIsEditing(true); // New learner creation
    }
    loadPrograms();
    loadCohorts();
    loadIntakes();
  }, [id, location.pathname, userProfile, user]);

  const loadLearner = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('learners', id!);
      if (result.success) {
        const data = result.data as LearnerData;
        // Ensure all required fields are present with default values
        setLearnerData({
          ...data,
          workExperience: data.workExperience || [],
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
          paymentRecords: data.paymentRecords || [],
          expectedAmount: data.expectedAmount || 0,
          totalAmountPaid: data.totalAmountPaid || 0,
          remainingBalance: data.remainingBalance || 0,
          cohortProgramCost: data.cohortProgramCost || 0
        });
        setIsEditing(false); // View mode for existing learner
      }
    } catch (error) {
      console.error('Error loading learner:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserLearnerProfile = async () => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    setLoading(true);
    try {
      // First try to find learner record by email
      const result = await FirestoreService.getWithQuery('learners', [
        { field: 'email', operator: '==', value: user.email }
      ]);
      
      if (result.success && result.data && result.data.length > 0) {
        const data = result.data[0] as LearnerData;
        // Ensure all required fields are present with default values
        setLearnerData({
          ...data,
          workExperience: data.workExperience || [],
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
          paymentRecords: data.paymentRecords || [],
          expectedAmount: data.expectedAmount || 0,
          totalAmountPaid: data.totalAmountPaid || 0,
          remainingBalance: data.remainingBalance || 0,
          cohortProgramCost: data.cohortProgramCost || 0
        });
        setIsEditing(false); // View mode for current user's profile
      } else {
        // If no learner record found, try to find by UID
        const uidResult = await FirestoreService.getWithQuery('learners', [
          { field: 'uid', operator: '==', value: user.uid }
        ]);
        
        if (uidResult.success && uidResult.data && uidResult.data.length > 0) {
          const data = uidResult.data[0] as LearnerData;
          setLearnerData({
            ...data,
            workExperience: data.workExperience || [],
            education: data.education || [],
            skills: data.skills || [],
            certifications: data.certifications || [],
            languages: data.languages || [],
            paymentRecords: data.paymentRecords || [],
            expectedAmount: data.expectedAmount || 0,
            totalAmountPaid: data.totalAmountPaid || 0,
            remainingBalance: data.remainingBalance || 0,
            cohortProgramCost: data.cohortProgramCost || 0
          });
          setIsEditing(false); // View mode for current user's profile
        } else {
          // No learner record found, initialize with user data for profile creation
          await initializeWithUserProfile();
          setIsEditing(true); // Edit mode to create profile
        }
      }
    } catch (error) {
      console.error('Error loading current user learner profile:', error);
      // Fallback to initialization
      await initializeWithUserProfile();
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const loadLearnerByEmail = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('learners', [
        { field: 'email', operator: '==', value: user!.email }
      ]);
      if (result.success && result.data && result.data.length > 0) {
        const data = result.data[0] as LearnerData;
        // Ensure all required fields are present with default values
        setLearnerData({
          ...data,
          workExperience: data.workExperience || [],
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
          paymentRecords: data.paymentRecords || [],
          expectedAmount: data.expectedAmount || 0,
          totalAmountPaid: data.totalAmountPaid || 0,
          remainingBalance: data.remainingBalance || 0,
          cohortProgramCost: data.cohortProgramCost || 0
        });
        setIsEditing(false); // Existing learner, view mode
      } else {
        // No learner found, pre-populate with user profile data
        initializeWithUserProfile();
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading learner by email:', error);
      initializeWithUserProfile();
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const initializeWithUserProfile = async () => {
    if (!user) return;

    try {
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'uid', operator: '==', value: user.uid }
      ]);

      let userData: any = {};
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        userData = userResult.data[0];
      }

      // Pre-populate with available data
      setLearnerData(prev => ({
        ...prev,
        firstName: userData.firstName || userProfile?.displayName?.split(' ')[0] || '',
        lastName: userData.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phoneNumber: userData.phoneNumber || '',
        currentOrganisation: userData.organization || userProfile?.organization || '',
      }));
    } catch (error) {
      console.error('Error loading user profile for pre-population:', error);
      setLearnerData(prev => ({
        ...prev,
        firstName: userProfile?.displayName?.split(' ')[0] || '',
        lastName: userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        currentOrganisation: userProfile?.organization || '',
      }));
    }
  };

  const loadPrograms = async () => {
    try {
      const result = await ProgramService.getAll('programs');
      if (result.success && result.data) {
        setPrograms(result.data as Program[]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadCohorts = async () => {
    try {
      const result = await FirestoreService.getAll('cohorts');
      if (result.success && result.data) {
        // Filter to show only active cohorts
        const activeCohortsData = (result.data as Cohort[]).filter(cohort => 
          cohort.status === 'active' || cohort.status === 'draft'
        );
        setCohorts(activeCohortsData);
      }
    } catch (error) {
      console.error('Error loading cohorts:', error);
    }
  };

  const loadIntakes = async () => {
    try {
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        // Filter to show only active intakes
        const activeIntakesData = (result.data as Intake[]).filter(intake => 
          intake.status === 'active' || intake.status === 'draft'
        );
        setIntakes(activeIntakesData);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  const generateStudentId = async () => {
    try {
      const result = await FirestoreService.getAll('learners');
      if (result.success && result.data) {
        const count = result.data.length + 1;
        return `LN${count.toString().padStart(3, '0')}`;
      }
      return 'LN001';
    } catch (error) {
      console.error('Error generating student ID:', error);
      return 'LN001';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...learnerData };

      if (!id) {
        // Generate student ID for new learners
        dataToSave.studentId = await generateStudentId();
        dataToSave.enrollmentDate = new Date().toISOString().split('T')[0];
        result = await FirestoreService.create('learners', dataToSave);
      } else {
        result = await FirestoreService.update('learners', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/learners/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving learner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LearnerData, value: any) => {
    setLearnerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPayment = () => {
    if (newPayment.amount && newPayment.description) {
      const payment = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(newPayment.amount),
        type: newPayment.type,
        status: 'paid' as const,
        description: newPayment.description,
        method: newPayment.method
      };
      
      const updatedRecords = [...learnerData.paymentRecords, payment];
      const newAmountPaid = (learnerData.amountPaid || 0) + payment.amount;
      const newOutstanding = (learnerData.totalFees || 0) - newAmountPaid;
      
      setLearnerData(prev => ({
        ...prev,
        paymentRecords: updatedRecords,
        amountPaid: newAmountPaid,
        outstandingBalance: Math.max(0, newOutstanding)
      }));
      
      setNewPayment({ amount: '', type: 'tuition', description: '', method: 'cash', confirmationCode: '' });
    }
  };

  const removePayment = (paymentId: string) => {
    const paymentToRemove = learnerData.paymentRecords.find(p => p.id === paymentId);
    if (paymentToRemove) {
      const updatedRecords = learnerData.paymentRecords.filter(p => p.id !== paymentId);
      const newAmountPaid = (learnerData.amountPaid || 0) - paymentToRemove.amount;
      const newOutstanding = (learnerData.totalFees || 0) - newAmountPaid;
      
      setLearnerData(prev => ({
        ...prev,
        paymentRecords: updatedRecords,
        amountPaid: Math.max(0, newAmountPaid),
        outstandingBalance: Math.max(0, newOutstanding)
      }));
    }
  };

  const getSelectedProgram = () => {
    return programs.find(p => p.id === learnerData.programId);
  };

  const getSelectedCohort = () => {
    return cohorts.find(c => c.id === learnerData.cohortId);
  };

  const getSelectedIntake = () => {
    return intakes.find(i => i.id === learnerData.cohortId);
  };

  const getAcademicStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      responsibilities: '',
      achievements: '',
      description: ''
    };
    setLearnerData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newExperience]
    }));
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setLearnerData(prev => ({
      ...prev,
      workExperience: (prev.workExperience || []).map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeWorkExperience = (id: string) => {
    setLearnerData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrentStudy: false,
      grade: '',
      achievements: ''
    };
    setLearnerData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setLearnerData(prev => ({
      ...prev,
      education: (prev.education || []).map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setLearnerData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addItem = (type: 'skills' | 'certifications' | 'languages', value: string, setter: (value: string) => void) => {
    if (value.trim() && !learnerData[type].includes(value.trim())) {
      setLearnerData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setter('');
    }
  };

  const removeItem = (type: 'skills' | 'certifications' | 'languages', itemToRemove: string) => {
    setLearnerData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== itemToRemove)
    }));
  };


  // Invoice/Receipt functions
  const openInvoiceModal = () => {
    setInvoiceModal({ isOpen: true, type: 'invoice' });
  };

  const openReceiptModal = () => {
    setInvoiceModal({ isOpen: true, type: 'receipt' });
  };

  const closeInvoiceModal = () => {
    setInvoiceModal({ isOpen: false, type: 'invoice' });
  };

  const downloadInvoicePDF = async () => {
    try {
      if (!learnerData.firstName) {
        alert('Learner data not loaded');
        return;
      }

      const invoiceData = {
        ...learnerData,
        paymentDate: learnerData.enrollmentDate,
        applicationNumber: learnerData.studentId || 'N/A'
      };

      const selectedProgram = getSelectedProgram();
      const selectedCohort = getSelectedCohort();

      await PDFService.generateInvoicePDF(
        invoiceData,
        selectedProgram,
        selectedCohort
      );
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    }
  };

  const downloadReceiptPDF = async () => {
    try {
      if (!learnerData.firstName || !learnerData.totalAmountPaid) {
        alert('No payment data available');
        return;
      }

      const receiptData = {
        ...learnerData,
        paymentDate: learnerData.enrollmentDate,
        amountPaid: learnerData.totalAmountPaid || learnerData.amountPaid || 0
      };

      const selectedProgram = getSelectedProgram();

      await PDFService.generateReceiptPDF(
        receiptData,
        selectedProgram
      );
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      alert('Failed to generate receipt PDF. Please try again.');
    }
  };

  const downloadInvoiceFromModal = async () => {
    if (invoiceRef.current) {
      try {
        await PDFService.generatePDF(invoiceRef.current, {
          filename: `Invoice-${learnerData.studentId || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`,
          quality: 0.98,
          format: 'a4',
          orientation: 'portrait',
          margin: 10
        });
      } catch (error) {
        console.error('Error downloading invoice:', error);
        alert('Failed to download invoice. Please try again.');
      }
    }
  };

  const downloadReceiptFromModal = async () => {
    if (receiptRef.current) {
      try {
        await PDFService.generatePDF(receiptRef.current, {
          filename: `Receipt-${learnerData.studentId || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`,
          quality: 0.98,
          format: 'a4',
          orientation: 'portrait',
          margin: 10
        });
      } catch (error) {
        console.error('Error downloading receipt:', error);
        alert('Failed to download receipt. Please try again.');
      }
    }
  };

  // Helper functions for payment status
  const getActualPaymentStatus = (): 'not_paid' | 'partial' | 'paid' => {
    const amountPaid = learnerData.totalAmountPaid || learnerData.amountPaid || 0;
    const expectedAmount = learnerData.expectedAmount || learnerData.totalFees || 0;
    
    if (amountPaid === 0) {
      return 'not_paid';
    } else if (amountPaid >= expectedAmount) {
      return 'paid';
    } else {
      return 'partial';
    }
  };

  const calculatePaymentDetails = () => {
    const amountPaid = learnerData.totalAmountPaid || learnerData.amountPaid || 0;
    const expectedAmount = learnerData.expectedAmount || learnerData.totalFees || 0;
    const balanceDue = Math.max(0, expectedAmount - amountPaid);
    const paymentProgress = expectedAmount > 0 ? (amountPaid / expectedAmount) * 100 : 0;
    
    return {
      amountPaid,
      balanceDue,
      paymentProgress: Math.min(100, paymentProgress),
      isFullyPaid: balanceDue <= 0
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice/Receipt Modal */}
      {invoiceModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {invoiceModal.type === 'invoice' ? (
                  <CreditCard className="h-6 w-6 text-primary-600" />
                ) : (
                  <Receipt className="h-6 w-6 text-accent-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {invoiceModal.type === 'invoice' ? 'Invoice' : 'Payment Receipt'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {invoiceModal.type === 'invoice' ? 'Program Fee Invoice' : 'Payment Confirmation Receipt'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={invoiceModal.type === 'invoice' ? downloadInvoiceFromModal : downloadReceiptFromModal}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                  title="Download PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={closeInvoiceModal}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {invoiceModal.type === 'invoice' ? (
                <Invoice
                  ref={invoiceRef}
                                     applicantData={{
                     ...learnerData,
                     applicationNumber: learnerData.studentId || 'N/A',
                     amountPaid: learnerData.totalAmountPaid || learnerData.amountPaid || 0,
                     paymentMethod: 'mpesa' as const,
                     confirmationCode: learnerData.paymentRecords[0]?.confirmationCode || 'N/A',
                     submittedDate: learnerData.enrollmentDate || new Date().toISOString().split('T')[0],
                     programId: learnerData.programId || ''
                   }}
                   programData={getSelectedProgram() || undefined}
                   cohortData={getSelectedCohort() ? {
                     name: getSelectedCohort()!.name,
                     startDate: getSelectedCohort()!.startDate
                   } : undefined}
                  onDownload={downloadInvoiceFromModal}
                />
              ) : (
                                 <ReceiptComponent
                   ref={receiptRef}
                   paymentData={{
                     ...learnerData,
                     paymentDate: learnerData.enrollmentDate || new Date().toISOString().split('T')[0],
                     amountPaid: learnerData.totalAmountPaid || learnerData.amountPaid || 0,
                     paymentMethod: (learnerData.paymentRecords[0]?.method || 'mpesa') as 'mpesa' | 'bank_transfer' | 'cash' | 'other',
                     confirmationCode: learnerData.paymentRecords[0]?.confirmationCode || 'N/A'
                   }}
                   programData={getSelectedProgram() || undefined}
                   onDownload={downloadReceiptFromModal}
                 />
              )}
            </div>
          </div>
        </div>
      )}


      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/learners')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {location.pathname.endsWith('/my-profile') 
                  ? `Welcome, ${learnerData.firstName || user?.displayName || user?.email?.split('@')[0] || 'User'}!`
                  : userProfile?.role === 'learner' 
                    ? (id ? (isEditing ? 'Edit My Profile' : 'My Profile') : 'Create Profile')
                    : (id ? (isEditing ? 'Edit Learner' : `${learnerData.firstName} ${learnerData.lastName}` || 'Learner Details') : 'New Learner')
                }
              </h1>
              <p className="text-lg text-primary-100">
                {location.pathname.endsWith('/my-profile')
                  ? 'This is your profile - you can view and edit your learning information here'
                  : userProfile?.role === 'learner'
                    ? (id ? `Student ID: ${learnerData.studentId || 'N/A'}` : 'Complete your learner profile')
                    : (id ? `Student ID: ${learnerData.studentId || 'N/A'}` : 'Create a new learner profile')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {id && !isEditing && canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Learner'}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Academic Status</p>
                  <p className="text-2xl font-bold text-white">{(learnerData.academicStatus || 'active').replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-white">KSh {(learnerData.outstandingBalance || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Banknote className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Program</p>
                  <p className="text-2xl font-bold text-white">{getSelectedProgram()?.programName || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Contact Actions - Only show for existing learners and staff/admin */}
      {id && learnerData.phoneNumber && userProfile?.role !== 'learner' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Contact</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${learnerData.email}`}
              className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Email</span>
            </a>
            <WhatsAppButton
              customerId={learnerData.id}
              customerPhone={learnerData.phoneNumber}
              customerName={`${learnerData.firstName} ${learnerData.lastName}`}
              variant="minimal"
              size="md"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8 pt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={learnerData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={learnerData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={learnerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={learnerData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work-experience' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Work Experience</h2>
              
              {learnerData.workExperience && learnerData.workExperience.map((experience) => (
                <div key={experience.id} className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-secondary-800">
                      {experience.jobTitle} at {experience.company}
                    </h3>
                    {isEditing && (
                      <button
                        onClick={() => removeWorkExperience(experience.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-secondary-600 mb-2">
                    {new Date(experience.startDate).toLocaleDateString()} - {experience.isCurrentJob ? 'Present' : new Date(experience.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-secondary-600 mb-2">
                    Responsibilities: {experience.responsibilities}
                  </p>
                  <p className="text-sm text-secondary-600">
                    Achievements: {experience.achievements}
                  </p>
                  <p className="text-sm text-secondary-600 mt-2">
                    Description: {experience.description}
                  </p>
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={addWorkExperience}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Work Experience</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'education' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Education & Skills</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Skills
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {learnerData.skills && learnerData.skills.map((skill, index) => (
                      <span key={index} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeItem('skills', skill)}
                            className="ml-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                  <input
                    type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItem('skills', newSkill, setNewSkill);
                          }
                        }}
                        className="flex-grow px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add skill"
                  />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Certifications
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {learnerData.certifications && learnerData.certifications.map((cert, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {cert}
                        {isEditing && (
                          <button
                            onClick={() => removeItem('certifications', cert)}
                            className="ml-2 text-blue-600 hover:text-blue-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                  <input
                    type="text"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItem('certifications', newCertification, setNewCertification);
                          }
                        }}
                        className="flex-grow px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add certification"
                  />
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Languages
                </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {learnerData.languages && learnerData.languages.map((lang, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {lang}
                        {isEditing && (
                          <button
                            onClick={() => removeItem('languages', lang)}
                            className="ml-2 text-green-600 hover:text-green-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                <input
                  type="text"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItem('languages', newLanguage, setNewLanguage);
                          }
                        }}
                        className="flex-grow px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add language"
                />
                    )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Education
                </label>
                  {learnerData.education && learnerData.education.map((edu) => (
                    <div key={edu.id} className="bg-gray-50 p-4 rounded-lg shadow-sm mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-semibold text-secondary-800">
                          {edu.degree} in {edu.fieldOfStudy}
                        </h4>
                        {isEditing && (
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
              </div>
                      <p className="text-sm text-secondary-600">
                        {edu.institution}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {new Date(edu.startDate).toLocaleDateString()} - {edu.isCurrentStudy ? 'Present' : new Date(edu.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-secondary-600">
                        Grade: {edu.grade}
                      </p>
                      <p className="text-sm text-secondary-600">
                        Achievements: {edu.achievements}
                      </p>
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={addEducation}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Education</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Learning Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Program *
                </label>
                <select
                  value={learnerData.programId}
                  onChange={(e) => handleInputChange('programId', e.target.value)}
                  disabled={!isEditing || !canEdit}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.programName} ({program.programCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Learning Goals
                </label>
                <textarea
                  rows={4}
                  value={learnerData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                  disabled={!isEditing || !canEdit}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="What do you hope to achieve from this program?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Academic Status
                  </label>
                  <select
                    value={learnerData.academicStatus}
                    onChange={(e) => handleInputChange('academicStatus', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Intake
                  </label>
                  <select
                    value={learnerData.intakeId || learnerData.cohortId || ''}
                    onChange={(e) => {
                      const selectedIntake = intakes.find(i => i.id === e.target.value);
                      if (selectedIntake) {
                        handleInputChange('intakeId', selectedIntake.id);
                        handleInputChange('intakeName', selectedIntake.name);
                        handleInputChange('cohortId', selectedIntake.id); // For backward compatibility
                        handleInputChange('cohortName', selectedIntake.name);
                        handleInputChange('cohort', selectedIntake.name);
                      } else {
                        handleInputChange('intakeId', '');
                        handleInputChange('intakeName', '');
                        handleInputChange('cohortId', '');
                        handleInputChange('cohortName', '');
                        handleInputChange('cohort', '');
                      }
                    }}
                    disabled={!isEditing || !canEdit}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select an intake</option>
                    {intakes.map((intake) => (
                      <option key={intake.id} value={intake.id}>
                        {intake.name} ({intake.intakeId}) - {intake.status.charAt(0).toUpperCase() + intake.status.slice(1)}
                      </option>
                    ))}
                  </select>
                  {(learnerData.intakeId || learnerData.cohortId) && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Program: {intakes.find(i => i.id === (learnerData.intakeId || learnerData.cohortId))?.programId || 'N/A'}</p>
                      <p>Start Date: {intakes.find(i => i.id === (learnerData.intakeId || learnerData.cohortId)) ? new Date(intakes.find(i => i.id === (learnerData.intakeId || learnerData.cohortId))!.startDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={learnerData.enrollmentDate}
                  onChange={(e) => handleInputChange('enrollmentDate', e.target.value)}
                  disabled={!isEditing || !canEdit}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Finance & Payments</h2>
              
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-2">Total Fees</h3>
                  <p className="text-3xl font-bold text-secondary-800">KSh {(learnerData.totalFees || 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Amount Paid</h3>
                  <p className="text-3xl font-bold text-green-600">KSh {(learnerData.amountPaid || 0).toLocaleString()}</p>
                </div>
                <div className={`p-6 rounded-xl ${(learnerData.outstandingBalance || 0) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${(learnerData.outstandingBalance || 0) > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    Outstanding Balance
                  </h3>
                  <p className={`text-3xl font-bold ${(learnerData.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    KSh {(learnerData.outstandingBalance || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Fee Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Total Program Fees (KSh)
                  </label>
                  <input
                    type="number"
                    value={learnerData.totalFees || ''}
                    onChange={(e) => {
                      const newTotal = parseFloat(e.target.value) || 0;
                    const newOutstanding = newTotal - (learnerData.amountPaid || 0);
                      handleInputChange('totalFees', newTotal);
                      handleInputChange('outstandingBalance', Math.max(0, newOutstanding));
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter total fees"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Payment Plan
                  </label>
                  <select
                    value={learnerData.paymentPlan || ''}
                    onChange={(e) => handleInputChange('paymentPlan', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="full">Full Payment</option>
                    <option value="installments">Installments</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              {/* Payment Records */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Payment Records
                  </label>
                  {isEditing && (
                    <button
                      onClick={addPayment}
                      disabled={!newPayment.amount || !newPayment.description}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Payment</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <input
                        type="number"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Amount (KSh)"
                      />
                      <select
                        value={newPayment.type}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value as any }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="tuition">Tuition</option>
                        <option value="fees">Fees</option>
                        <option value="materials">Materials</option>
                        <option value="other">Other</option>
                      </select>
                      <select
                        value={newPayment.method}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="cheque">Cheque</option>
                        <option value="card">Card</option>
                      </select>
                      <input
                        type="text"
                        value={newPayment.description}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {learnerData.paymentRecords?.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="font-medium text-secondary-800">KSh {payment.amount.toLocaleString()}</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-secondary-500">
                            <p>{new Date(payment.date).toLocaleDateString()}</p>
                            <p>{payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} • {payment.method?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removePayment(payment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-secondary-600">{payment.description}</p>
                    </div>
                  ))}
                  
                  {(!learnerData.paymentRecords || learnerData.paymentRecords.length === 0) && (
                    <div className="text-center py-8 text-secondary-500">
                      No payment records found.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Payment Action */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Need to make a payment?</h4>
                    <p className="text-blue-700">
                      Record your payment quickly and get instant confirmation. 
                      Remaining balance: KES {Math.max(0, (learnerData.expectedAmount || learnerData.totalFees || 0) - (learnerData.totalAmountPaid || learnerData.amountPaid || 0)).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={addPayment}
                    disabled={!newPayment.amount || !newPayment.description}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>

              {/* Financial Documents Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-800 mb-4">Financial Documents</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Invoice Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <CreditCard className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">Invoice</h5>
                        <p className="text-sm text-gray-600">Program fee invoice</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Official invoice for {getSelectedProgram()?.programName || 'Sales Training Program'} including program details and payment information.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={openInvoiceModal}
                        className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={downloadInvoicePDF}
                        className="flex-1 border border-primary-600 text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Receipt Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-accent-100 p-2 rounded-lg">
                        <Receipt className="h-6 w-6 text-accent-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">Payment Receipt</h5>
                        <p className="text-sm text-gray-600">Payment confirmation</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Official receipt for payments made with transaction details and remaining balance information.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={openReceiptModal}
                        disabled={!learnerData.totalAmountPaid || learnerData.totalAmountPaid === 0}
                        className="flex-1 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={downloadReceiptPDF}
                        disabled={!learnerData.totalAmountPaid || learnerData.totalAmountPaid === 0}
                        className="flex-1 border border-accent-600 text-accent-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                    {(!learnerData.totalAmountPaid || learnerData.totalAmountPaid === 0) && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Available after first payment
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Status & Progress */}
              {learnerData.expectedAmount && learnerData.expectedAmount > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-secondary-800 mb-4">Payment Progress</h4>
                  
                  {/* Payment Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Payment Progress</span>
                      <span>{Math.round(calculatePaymentDetails().paymentProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculatePaymentDetails().paymentProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Expected Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        KES {(learnerData.expectedAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Amount Paid</p>
                      <p className="text-lg font-bold text-green-600">
                        KES {(learnerData.totalAmountPaid || learnerData.amountPaid || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Remaining Balance</p>
                      <p className={`text-lg font-bold ${calculatePaymentDetails().isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                        KES {calculatePaymentDetails().balanceDue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {calculatePaymentDetails().isFullyPaid && (
                    <div className="mt-4 flex items-center justify-center text-green-600 bg-green-50 rounded-lg py-3">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Payment Complete!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerPage; 