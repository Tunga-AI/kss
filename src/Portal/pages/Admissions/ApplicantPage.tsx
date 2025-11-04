import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus, Edit, User, Briefcase, FileText, CheckCircle, Plus, Trash2, BookOpen, Play, Eye, Clock, Award, ChevronLeft, ChevronRight, Upload, Download, Calendar, Building, GraduationCap, X, ExternalLink, Receipt, CreditCard } from 'lucide-react';
import { FirestoreService, ProgramService } from '../../../services/firestore';
import { useAuthContext } from '../../../contexts/AuthContext';
import Invoice from '../Profile/Invoice';
import ReceiptComponent from '../Profile/Receipt';
import PDFService from '../../../services/pdfService';
import { WorkExperience, Education } from '../../../types/shared';
import WhatsAppButton from '../../../components/WhatsAppButton';

interface ApplicantData {
  id?: string;
  applicationNumber?: string;
  // Profile
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  personalDescription: string;
  // Job Details - Enhanced
  currentJobTitle: string;
  currentOrganisation: string;
  salesExperience: string;
  keyAchievements: string;
  biggestAchievement: string;
  // Work Experience (comprehensive)
  workExperience: WorkExperience[];
  // Education (comprehensive)
  education: Education[];
  // File uploads
  coverLetterUrl?: string;
  resumeUrl?: string;
  // Application
  programId: string;
  learningGoals: string;
  spokenToRep: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'not_paid';
  // Payment Details
  amountPaid: number;
  confirmationCode: string;
  paymentMethod: 'mpesa' | 'bank_transfer' | 'cash' | 'other';
  // Application Status
  feedback: { date: string; message: string; author: string }[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  intake: string;
  intakeId?: string; // For backward compatibility
  admittedProgram: string;
  submittedDate: string;
}

interface Program {
  id: string;
  programName: string;
  programCode?: string;
  level?: string;
  status: string;
  fees?: number;
}

interface CompetencyTest {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number;
  passingScore: number;
  questions: any[];
  status: 'draft' | 'active' | 'archived';
  totalPoints: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface TestAttempt {
  id: string;
  testId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    points: number;
  }[];
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
  submittedAt?: string;
}

interface Intake {
  id: string;
  intakeId: string;
  name: string;
  programId: string;
  startDate: string;
  applicationDeadline: string;
  closeDate: string;
  programCost: number;
  staffManagerId: string;
  description?: string;
  maxStudents?: number;
  enrolledCount?: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

// Payment constants
const BASE_PROGRAM_FEE = 5000;
const VAT_RATE = 0.16;
const VAT_AMOUNT = BASE_PROGRAM_FEE * VAT_RATE;
const TOTAL_PROGRAM_FEE = BASE_PROGRAM_FEE + VAT_AMOUNT;

const ApplicantPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Default to view mode
  const [programs, setPrograms] = useState<Program[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [competencyTests, setCompetencyTests] = useState<CompetencyTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  
  // Document modal state
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    type: 'coverLetter' | 'resume' | null;
    url: string | null;
    title: string;
  }>({
    isOpen: false,
    type: null,
    url: null,
    title: ''
  });

  // Invoice/Receipt modal state
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    type: 'invoice' as 'invoice' | 'receipt'
  });


  // References for PDF generation
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [applicantData, setApplicantData] = useState<ApplicantData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    personalDescription: '',
    currentJobTitle: '',
    currentOrganisation: '',
    salesExperience: '',
    keyAchievements: '',
    biggestAchievement: '',
    workExperience: [],
    education: [],
    programId: '',
    learningGoals: '',
    spokenToRep: '',
    paymentStatus: 'pending',
    amountPaid: 0,
    confirmationCode: '',
    paymentMethod: 'mpesa',
    feedback: [],
    status: 'pending',
    intake: '',
    admittedProgram: '',
    submittedDate: new Date().toISOString().split('T')[0]
  });

  const [newFeedback, setNewFeedback] = useState({ message: '', author: '' });
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  

  const handlePaymentSuccess = async (transactionId: string, amount: number) => {
    // Reload applicant data to get updated payment status
    if (id) {
      await loadApplicant();
    }
    
    closePaymentCompletion();
    
    const remainingBalance = TOTAL_PROGRAM_FEE - ((applicantData.amountPaid || 0) + amount);
    const successMessage = remainingBalance <= 0
      ? `Payment completed successfully! You now have full access to competency tests.`
      : `Payment of KES ${amount.toLocaleString()} completed successfully! Remaining balance: KES ${remainingBalance.toLocaleString()}`;
    
    alert(successMessage);
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  // Helper function to determine actual payment status based on amount paid
  const getActualPaymentStatus = (): 'not_paid' | 'partial' | 'paid' => {
    const amountPaid = applicantData.amountPaid || 0;
    
    if (amountPaid === 0) {
      return 'not_paid';
    } else if (amountPaid >= TOTAL_PROGRAM_FEE) {
      return 'paid';
    } else {
      return 'partial';
    }
  };

  // Check if competency tests should be available
  const areCompetencyTestsAvailable = () => {
    return getActualPaymentStatus() === 'paid';
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'application-fee', label: 'Application Fee', icon: FileText },
    { id: 'tests', label: 'Capability Assessment', icon: BookOpen },
    { id: 'status', label: 'Application Status', icon: CheckCircle },
  ];

  const getCurrentTabIndex = () => {
    return tabs.findIndex(tab => tab.id === activeTab);
  };

  const getPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex > 0 ? tabs[currentIndex - 1] : null;
  };

  const getNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
  };

  const goToPreviousTab = () => {
    const previousTab = getPreviousTab();
    if (previousTab) {
      setActiveTab(previousTab.id);
    }
  };

  const goToNextTab = () => {
    const nextTab = getNextTab();
    if (nextTab) {
      setActiveTab(nextTab.id);
    }
  };

  useEffect(() => {
    if (location.pathname.endsWith('/my-application')) {
      // Load current user's application
      loadCurrentUserApplication();
    } else if (id) {
      // Load specific applicant by ID
      loadApplicant();
    } else if (userProfile?.role === 'applicant' && user?.email) {
      // For applicants accessing their own application (fallback)
      loadApplicantByEmail();
    } else if (!id && user && userProfile) {
      // For new applications, pre-populate with user data
      initializeWithUserProfile();
      setIsEditing(true); // New application creation
    }
    loadPrograms();
    loadIntakes();
    loadCompetencyTests();
    if (user?.email) {
      loadTestAttempts();
    }
  }, [id, location.pathname, userProfile, user]);

  // Update the useEffect to reload competency tests when payment status changes
  useEffect(() => {
    loadCompetencyTests();
  }, [applicantData.paymentStatus]);

  const loadApplicant = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('applicants', id!);
      if (result.success) {
        setApplicantData(result.data as ApplicantData);
        setIsEditing(false); // View mode for existing applicant
      }
    } catch (error) {
      console.error('Error loading applicant:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserApplication = async () => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    setLoading(true);
    try {
      // Try to find applicant record by email
      const result = await FirestoreService.getWithQuery('applicants', [
        { field: 'email', operator: '==', value: user.email }
      ]);
      
      if (result.success && result.data && result.data.length > 0) {
        const data = result.data[0] as ApplicantData;
        setApplicantData(data);
        setIsEditing(false); // View mode for existing application
      } else {
        // No application found, initialize with user data for new application
        await initializeWithUserProfile();
        setIsEditing(true); // Edit mode to create application
      }
    } catch (error) {
      console.error('Error loading current user application:', error);
      // Fallback to initialization
      await initializeWithUserProfile();
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicantByEmail = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('applicants', [
        { field: 'email', operator: '==', value: user!.email }
      ]);
      if (result.success && result.data && result.data.length > 0) {
        setApplicantData(result.data[0] as ApplicantData);
        setIsEditing(false); // Existing application, view mode
      } else {
        // No application found, pre-populate with user profile data
        initializeWithUserProfile();
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading applicant by email:', error);
      // Even if there's an error, try to pre-populate with user data
      initializeWithUserProfile();
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const initializeWithUserProfile = async () => {
    if (!user) return;

    // Try to get additional user data from users collection
    try {
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'uid', operator: '==', value: user.uid }
      ]);

      let userData: any = {};
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        userData = userResult.data[0];
      }

      // Pre-populate with available data
      setApplicantData(prev => ({
        ...prev,
        firstName: userData.firstName || userProfile?.displayName?.split(' ')[0] || '',
        lastName: userData.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phoneNumber: userData.phoneNumber || '',
        currentOrganisation: userData.organization || userProfile?.organization || '',
      }));
    } catch (error) {
      console.error('Error loading user profile for pre-population:', error);
      // Fallback to basic user data
      setApplicantData(prev => ({
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

  const loadIntakes = async () => {
    try {
      const result = await FirestoreService.getAll('intakes');
      if (result.success && result.data) {
        // Filter to only show active intakes or intakes that match the applicant's program
        const availableIntakes = (result.data as Intake[]).filter(intake => 
          intake.status === 'active' || intake.status === 'draft'
        );
        setIntakes(availableIntakes);
      }
    } catch (error) {
      console.error('Error loading intakes:', error);
    }
  };

  // Load competency tests only if payment is fully paid
  const loadCompetencyTests = async () => {
    if (!areCompetencyTestsAvailable()) {
      setCompetencyTests([]);
      return;
    }

    try {
      const result = await FirestoreService.getAll('competencyTests');
      if (result.success && result.data) {
        // Only show active tests to applicants
        const activeTests = (result.data as CompetencyTest[]).filter(test => test.status === 'active');
        setCompetencyTests(activeTests);
      }
    } catch (error) {
      console.error('Error loading competency tests:', error);
    }
  };

  const loadTestAttempts = async () => {
    try {
      const result = await FirestoreService.getWithQuery('testAttempts', [
        { field: 'applicantEmail', operator: '==', value: user!.email }
      ]);
      if (result.success && result.data) {
        setTestAttempts(result.data as TestAttempt[]);
      }
    } catch (error) {
      console.error('Error loading test attempts:', error);
    }
  };

  const generateApplicationNumber = async () => {
    try {
      const result = await FirestoreService.getAll('applicants');
      if (result.success && result.data) {
        const count = result.data.length + 1;
        return `APP${count.toString().padStart(3, '0')}`;
      }
      return 'APP001';
    } catch (error) {
      console.error('Error generating application number:', error);
      return 'APP001';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      let dataToSave = { ...applicantData };

      if (!id) {
        // Generate application number for new applicants
        dataToSave.applicationNumber = await generateApplicationNumber();
        dataToSave.submittedDate = new Date().toISOString().split('T')[0];
        result = await FirestoreService.create('applicants', dataToSave);
      } else {
        result = await FirestoreService.update('applicants', id, dataToSave);
      }

      if (result.success) {
        if (!id && (result as any).id) {
          navigate(`/portal/admissions/applicants/${(result as any).id}`);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving applicant:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ApplicantData, value: any) => {
    setApplicantData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFeedback = () => {
    if (newFeedback.message && newFeedback.author) {
      const feedback = {
        date: new Date().toISOString().split('T')[0],
        message: newFeedback.message,
        author: newFeedback.author
      };
      
      setApplicantData(prev => ({
        ...prev,
        feedback: [...prev.feedback, feedback]
      }));
      
      setNewFeedback({ message: '', author: '' });
    }
  };

  const removeFeedback = (index: number) => {
    setApplicantData(prev => ({
      ...prev,
      feedback: prev.feedback.filter((_, i) => i !== index)
    }));
  };

  const getSelectedProgram = () => {
    return programs.find(p => p.id === applicantData.programId);
  };

  const getTestAttempt = (testId: string): TestAttempt | undefined => {
    return testAttempts.find(attempt => attempt.testId === testId);
  };

  const getTestStatus = (testId: string): { status: string; color: string; canTake: boolean; canViewResults: boolean } => {
    const attempt = getTestAttempt(testId);
    
    if (!attempt) {
      return { 
        status: 'Not Taken', 
        color: 'text-gray-500', 
        canTake: true, 
        canViewResults: false 
      };
    }

    if (attempt.status === 'in_progress') {
      return { 
        status: 'In Progress', 
        color: 'text-blue-600', 
        canTake: true, 
        canViewResults: false 
      };
    }

    if (attempt.status === 'completed') {
      if (attempt.passed) {
        return { 
          status: 'Passed', 
          color: 'text-green-600', 
          canTake: false, 
          canViewResults: true 
        };
      } else {
        return { 
          status: 'Failed', 
          color: 'text-red-600', 
          canTake: true, 
          canViewResults: true 
        };
      }
    }

    return { 
      status: 'Unknown', 
      color: 'text-gray-500', 
      canTake: true, 
      canViewResults: false 
    };
  };

  const handleTakeTest = (testId: string) => {
    navigate(`/portal/admissions/test/${testId}/take`);
  };

  const handleViewResults = (testId: string) => {
    navigate(`/portal/admissions/test/${testId}/results`);
  };

  // Work Experience Management
  const addWorkExperience = () => {
    const newWork: WorkExperience = {
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
    setApplicantData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newWork]
    }));
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setApplicantData(prev => ({
      ...prev,
      workExperience: (prev.workExperience || []).map(work => 
        work.id === id ? { ...work, [field]: value } : work
      )
    }));
  };

  const removeWorkExperience = (id: string) => {
    setApplicantData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(work => work.id !== id)
    }));
  };

  // Education Management
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
    setApplicantData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setApplicantData(prev => ({
      ...prev,
      education: (prev.education || []).map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setApplicantData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  // File Upload Functions
  const handleFileUpload = async (file: File, type: 'coverLetter' | 'resume') => {
    if (type === 'coverLetter') {
      setUploadingCoverLetter(true);
    } else {
      setUploadingResume(true);
    }

    try {
      // In a real implementation, you would upload to Firebase Storage or your preferred service
      // For now, we'll simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
      
      const fileUrl = `https://example.com/uploads/${file.name}`; // Mock URL
      
      if (type === 'coverLetter') {
        setApplicantData(prev => ({ ...prev, coverLetterUrl: fileUrl }));
      } else {
        setApplicantData(prev => ({ ...prev, resumeUrl: fileUrl }));
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      if (type === 'coverLetter') {
        setUploadingCoverLetter(false);
      } else {
        setUploadingResume(false);
      }
    }
  };

  // Document modal functions
  const openDocumentModal = (type: 'coverLetter' | 'resume', url: string, title: string) => {
    setDocumentModal({
      isOpen: true,
      type,
      url,
      title
    });
  };

  const closeDocumentModal = () => {
    setDocumentModal({
      isOpen: false,
      type: null,
      url: null,
      title: ''
    });
  };

  const downloadDocument = (url: string, filename: string) => {
    // In a real implementation, this would handle the actual download
    // For now, we'll simulate it
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      if (!applicantData.firstName) {
        alert('Applicant data not loaded');
        return;
      }

      const invoiceData = {
        ...applicantData,
        paymentDate: applicantData.submittedDate
      };

      const selectedProgram = getSelectedProgram();
      const selectedIntake = intakes.find(i => i.intakeId === applicantData.intake);

      await PDFService.generateInvoicePDF(
        invoiceData,
        selectedProgram,
        selectedIntake
      );
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    }
  };

  const downloadReceiptPDF = async () => {
    try {
      if (!applicantData.firstName || !applicantData.amountPaid) {
        alert('No payment data available');
        return;
      }

      const receiptData = {
        ...applicantData,
        paymentDate: applicantData.submittedDate
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
          filename: `Invoice-${applicantData.applicationNumber || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`,
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
          filename: `Receipt-${applicantData.applicationNumber || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`,
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

  // Migration function to convert applicant to learner with standardized format
  const migrateApplicantToLearner = async (applicantData: ApplicantData): Promise<any> => {
    try {
              // Get the selected intake to determine the correct program cost
        const selectedIntake = intakes.find(i => i.intakeId === applicantData.intake);
        const selectedProgram = programs.find(p => p.id === applicantData.programId);
      
                  // Determine the correct fee amount - prioritize intake programCost, fallback to program fees, then TOTAL_PROGRAM_FEE
            const expectedAmount = selectedIntake?.programCost || selectedProgram?.fees || TOTAL_PROGRAM_FEE;
      
      // Create learner data using standardized format
      const learnerData = {
        // Personal Information (standardized)
        firstName: applicantData.firstName,
        lastName: applicantData.lastName,
        email: applicantData.email,
        phoneNumber: applicantData.phoneNumber,
        role: 'learner',
        
        // Work Experience (standardized)
        workExperience: applicantData.workExperience || [],
        
        // Education (standardized)
        education: applicantData.education || [],
        
        // Skills and Certifications (standardized)
        skills: [], // Can be populated from job experience if needed
        certifications: [],
        languages: [],
        
        // Learner-specific fields
        currentJobTitle: applicantData.currentJobTitle,
        currentOrganisation: applicantData.currentOrganisation,
        salesExperience: applicantData.salesExperience,
        keyAchievements: applicantData.keyAchievements,
        programId: applicantData.programId,
        learningGoals: applicantData.learningGoals,
        enrollmentDate: new Date().toISOString().split('T')[0],
        academicStatus: 'active',
        intake: applicantData.intake,
        intakeName: selectedIntake?.name || '',
        
        // Financial information transfer - Use intake/program pricing
        expectedAmount: expectedAmount,
        totalFees: expectedAmount,
        totalAmountPaid: applicantData.amountPaid,
        amountPaid: applicantData.amountPaid,
        remainingBalance: Math.max(0, expectedAmount - applicantData.amountPaid),
        outstandingBalance: Math.max(0, expectedAmount - applicantData.amountPaid),
        intakeProgramCost: selectedIntake?.programCost,
        paymentRecords: applicantData.amountPaid > 0 ? [{
          id: Date.now().toString(),
          date: applicantData.submittedDate,
          amount: applicantData.amountPaid,
          type: 'tuition' as const,
          status: 'pending' as const, // Set as pending for finance team verification
          description: 'Initial application payment transferred from application',
          method: applicantData.paymentMethod,
          confirmationCode: applicantData.confirmationCode,
          verified: false
        }] : [],
        
        // Generate student ID
        studentId: await generateStudentId(),
        
        // Other fields
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create learner record
      const learnerResult = await FirestoreService.create('learners', learnerData);
      
      if (learnerResult.success) {
        // Update user role in users collection
        const userResult = await FirestoreService.getWithQuery('users', [
          { field: 'email', operator: '==', value: applicantData.email }
        ]);
        
        if (userResult.success && userResult.data && userResult.data.length > 0) {
          await FirestoreService.update('users', userResult.data[0].id, {
            role: 'learner',
            updatedAt: new Date().toISOString()
          });
        }
        
        // Update applicant status to approved
        if (applicantData.id) {
          await FirestoreService.update('applicants', applicantData.id, {
            status: 'approved',
            admittedProgram: applicantData.programId,
            updatedAt: new Date().toISOString()
          });
        }
        
        return { success: true, learnerId: learnerResult.id };
      }
      
      return { success: false, error: 'Failed to create learner record' };
    } catch (error) {
      console.error('Error migrating applicant to learner:', error);
      return { success: false, error: 'Migration failed' };
    }
  };

  const generateStudentId = async (): Promise<string> => {
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
                  applicantData={applicantData}
                  programData={getSelectedProgram()}
                  cohortData={intakes.find((i: Intake) => i.intakeId === applicantData.intake)}
                  onDownload={downloadInvoiceFromModal}
                />
              ) : (
                <ReceiptComponent
                  ref={receiptRef}
                  paymentData={{
                    ...applicantData,
                    paymentDate: applicantData.submittedDate
                  }}
                  programData={getSelectedProgram()}
                  onDownload={downloadReceiptFromModal}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {documentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{documentModal.title}</h3>
                  <p className="text-sm text-gray-500">
                    {documentModal.type === 'coverLetter' ? 'Cover Letter' : 'Resume/CV'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadDocument(documentModal.url!, `${documentModal.title}.pdf`)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                  title="Download document"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => window.open(documentModal.url!, '_blank')}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
                <button
                  onClick={closeDocumentModal}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {/* Document Preview */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h4>
                <p className="text-gray-600 mb-6">
                  This is a preview of the uploaded {documentModal.type === 'coverLetter' ? 'cover letter' : 'resume'}.
                </p>
                
                {/* Document Info */}
                <div className="bg-white rounded-lg p-4 mb-6 text-left">
                  <h5 className="font-medium text-gray-900 mb-3">Document Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 text-gray-900">
                        {documentModal.type === 'coverLetter' ? 'Cover Letter' : 'Resume/CV'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Format:</span>
                      <span className="ml-2 text-gray-900">PDF</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 text-green-600 font-medium">Uploaded</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Upload Date:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PDF Viewer Placeholder */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">PDF Preview</p>
                    <p className="text-sm text-gray-500 mb-4">
                      In a real implementation, this would show an embedded PDF viewer
                    </p>
                    <button
                      onClick={() => window.open(documentModal.url!, '_blank')}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Document
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => downloadDocument(documentModal.url!, `${documentModal.title}.pdf`)}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={closeDocumentModal}
                    className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(userProfile?.role === 'applicant' ? '/portal/admissions' : '/portal/admissions')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {location.pathname.endsWith('/my-application') 
                  ? `Welcome, ${applicantData.firstName || user?.displayName || user?.email?.split('@')[0] || 'User'}!`
                  : userProfile?.role === 'applicant' 
                    ? (id ? (isEditing ? 'Edit My Application' : 'My Application') : 'Create Application')
                    : (id ? (isEditing ? 'Edit Applicant' : `${applicantData.firstName} ${applicantData.lastName}` || 'Applicant Details') : 'New Applicant')
                }
              </h1>
              <p className="text-lg text-primary-100">
                {location.pathname.endsWith('/my-application')
                  ? 'This is your application - you can view and update your program application here'
                  : userProfile?.role === 'applicant'
                    ? (id ? `Application ${applicantData.applicationNumber || 'N/A'}` : 'Complete your program application')
                    : (id ? `Application ${applicantData.applicationNumber || 'N/A'}` : 'Create a new applicant profile')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {id && !isEditing && userProfile?.role !== 'applicant' && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {id && !isEditing && userProfile?.role === 'applicant' && applicantData.status === 'pending' && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Application</span>
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
                <span>{saving ? 'Saving...' : (userProfile?.role === 'applicant' ? 'Submit Application' : 'Save Applicant')}</span>
              </button>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Application Status</p>
                  <p className="text-2xl font-bold text-white">{applicantData.status.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Payment Status</p>
                  <p className="text-2xl font-bold text-white">{getActualPaymentStatus().replace('_', ' ').toUpperCase()}</p>
                  <p className="text-xs text-primary-200">
                    KES {(applicantData.amountPaid || 0).toLocaleString()} of {TOTAL_PROGRAM_FEE.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-100">Applied Program</p>
                  <p className="text-2xl font-bold text-white">{getSelectedProgram()?.programName || 'N/A'}</p>
                                {applicantData.intake && (
                <p className="text-xs text-primary-200">
                  Intake: {intakes.find(i => i.intakeId === applicantData.intake)?.name || applicantData.intake}
                </p>
              )}
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Contact Actions - Only show for existing applicants and staff/admin */}
      {id && applicantData.phoneNumber && userProfile?.role !== 'applicant' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Contact</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${applicantData.phoneNumber}`}
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Call</span>
            </a>
            <a
              href={`mailto:${applicantData.email}`}
              className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Email</span>
            </a>
            <WhatsAppButton
              customerId={applicantData.id}
              customerPhone={applicantData.phoneNumber}
              customerName={`${applicantData.firstName} ${applicantData.lastName}`}
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
                    value={applicantData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
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
                    value={applicantData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
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
                    value={applicantData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
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
                    value={applicantData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Personal Description *
                </label>
                <textarea
                  rows={4}
                  value={applicantData.personalDescription}
                  onChange={(e) => handleInputChange('personalDescription', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                  placeholder="Describe yourself, your background, interests, and what makes you unique..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Program *
                  </label>
                  <select
                    value={applicantData.programId}
                    onChange={(e) => handleInputChange('programId', e.target.value)}
                    disabled={!isEditing}
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
                    Preferred Intake *
                  </label>
                  <select
                    value={applicantData.intake}
                    onChange={(e) => handleInputChange('intake', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">Select an intake</option>
                    {intakes
                      .filter(intake => !applicantData.programId || intake.programId === applicantData.programId)
                      .map((intake) => (
                        <option key={intake.id} value={intake.intakeId}>
                          {intake.name} - Starts {new Date(intake.startDate).toLocaleDateString()} 
                          (Deadline: {new Date(intake.applicationDeadline).toLocaleDateString()})
                        </option>
                      ))}
                  </select>
                  {intakes.filter(intake => !applicantData.programId || intake.programId === applicantData.programId).length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {applicantData.programId ? 'No intakes available for selected program' : 'Select a program first to see available intakes'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Work Experience</h2>
              
              {/* Biggest Achievement Field */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="h-6 w-6 text-primary-600" />
                  <h3 className="text-xl font-semibold text-secondary-800">Biggest Achievement</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Describe your biggest professional achievement *
                  </label>
                  <textarea
                    rows={4}
                    value={applicantData.biggestAchievement}
                    onChange={(e) => handleInputChange('biggestAchievement', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                    placeholder="Tell us about your most significant professional accomplishment, including the impact it had..."
                  />
                </div>
              </div>
              
              {/* Work Experience Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-6 w-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-secondary-800">Work Experience</h3>
                  </div>
                  {isEditing && (
                    <button
                      onClick={addWorkExperience}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Experience</span>
                    </button>
                  )}
                </div>

                {(applicantData.workExperience || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No work experience added yet</p>
                    {isEditing && (
                      <button
                        onClick={addWorkExperience}
                        className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Add your first work experience
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(applicantData.workExperience || []).map((work, index) => (
                      <div key={work.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-secondary-800">
                            Experience #{index + 1}
                          </h4>
                          {isEditing && (
                            <button
                              onClick={() => removeWorkExperience(work.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Job Title *
                            </label>
                            <input
                              type="text"
                              value={work.jobTitle}
                              onChange={(e) => updateWorkExperience(work.id, 'jobTitle', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="e.g., Sales Manager"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Company *
                            </label>
                            <input
                              type="text"
                              value={work.company}
                              onChange={(e) => updateWorkExperience(work.id, 'company', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="Company name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Start Date *
                            </label>
                            <input
                              type="month"
                              value={work.startDate}
                              onChange={(e) => updateWorkExperience(work.id, 'startDate', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              End Date
                            </label>
                            <input
                              type="month"
                              value={work.endDate}
                              onChange={(e) => updateWorkExperience(work.id, 'endDate', e.target.value)}
                              disabled={!isEditing || work.isCurrentJob}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={work.isCurrentJob}
                                onChange={(e) => {
                                  updateWorkExperience(work.id, 'isCurrentJob', e.target.checked);
                                  if (e.target.checked) {
                                    updateWorkExperience(work.id, 'endDate', '');
                                  }
                                }}
                                disabled={!isEditing}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-secondary-700">Current Job</span>
                            </label>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Job Description
                          </label>
                          <textarea
                            rows={3}
                            value={work.description}
                            onChange={(e) => updateWorkExperience(work.id, 'description', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                            placeholder="Brief description of the role and company..."
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Key Responsibilities
                          </label>
                          <textarea
                            rows={4}
                            value={work.responsibilities}
                            onChange={(e) => updateWorkExperience(work.id, 'responsibilities', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                            placeholder="• Key responsibility 1&#10;• Key responsibility 2&#10;• Key responsibility 3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Key Achievements
                          </label>
                          <textarea
                            rows={4}
                            value={work.achievements}
                            onChange={(e) => updateWorkExperience(work.id, 'achievements', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                            placeholder="• Achievement 1&#10;• Achievement 2&#10;• Achievement 3"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>


                          </div>
            )}

          {activeTab === 'education' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Education Background</h2>
              
              {/* Education Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-6 w-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-secondary-800">Academic Qualifications</h3>
                  </div>
                  {isEditing && (
                    <button
                      onClick={addEducation}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Education</span>
                    </button>
                  )}
                </div>

                {(applicantData.education || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No education history added yet</p>
                    {isEditing && (
                      <button
                        onClick={addEducation}
                        className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Add your education background
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(applicantData.education || []).map((edu, index) => (
                      <div key={edu.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-secondary-800">
                            Education #{index + 1}
                          </h4>
                          {isEditing && (
                            <button
                              onClick={() => removeEducation(edu.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Institution *
                            </label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="e.g., University of Nairobi"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Degree/Certificate *
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                              placeholder="e.g., Bachelor's Degree"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Field of Study *
                          </label>
                          <input
                            type="text"
                            value={edu.fieldOfStudy}
                            onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                            placeholder="e.g., Business Administration"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Start Date *
                            </label>
                            <input
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              End Date
                            </label>
                            <input
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              disabled={!isEditing || edu.isCurrentStudy}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={edu.isCurrentStudy}
                                onChange={(e) => {
                                  updateEducation(edu.id, 'isCurrentStudy', e.target.checked);
                                  if (e.target.checked) {
                                    updateEducation(edu.id, 'endDate', '');
                                  }
                                }}
                                disabled={!isEditing}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-secondary-700">Currently Studying</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Achievements & Activities
                          </label>
                          <textarea
                            rows={3}
                            value={edu.achievements || ''}
                            onChange={(e) => updateEducation(edu.id, 'achievements', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 resize-none"
                            placeholder="Academic achievements, extracurricular activities, honors, etc."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'application-fee' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Application Fee</h2>
              
              {/* Application Fee Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">About the Application Fee</h3>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>
                        The application fee is necessary for the professional review of your application and ensures proper placement in the right course for your career goals.
                      </p>
                      <p>
                        <strong>Important:</strong> This application fee is separate from the program fee and helps cover:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Professional assessment of your profile and qualifications</li>
                        <li>Competency testing and evaluation</li>
                        <li>Academic advisory and course placement consultation</li>
                        <li>Administrative processing and documentation</li>
                      </ul>
                      <p>
                        <strong>Payment Options:</strong> You can pay in installments with a minimum of 20% as the first installment to begin the application process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-800 mb-4">Payment Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={applicantData.paymentStatus}
                      onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial Payment</option>
                      <option value="paid">Fully Paid</option>
                      <option value="not_paid">Not Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Amount Paid (KES)
                    </label>
                    <input
                      type="number"
                      value={applicantData.amountPaid || 0}
                      onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter amount paid"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={applicantData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {applicantData.paymentMethod === 'mpesa' ? 'M-Pesa Confirmation Code' : 
                       applicantData.paymentMethod === 'bank_transfer' ? 'Bank Reference Number' : 
                       'Receipt Number'}
                    </label>
                    <input
                      type="text"
                      value={applicantData.confirmationCode}
                      onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={
                        applicantData.paymentMethod === 'mpesa' ? 'Enter M-Pesa confirmation code' :
                        applicantData.paymentMethod === 'bank_transfer' ? 'Enter bank reference number' :
                        'Enter receipt number'
                      }
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                {getSelectedProgram() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h5 className="font-medium text-blue-800 mb-2">Payment Summary</h5>
                    
                    {/* Payment Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-blue-600 mb-1">
                        <span>Payment Progress</span>
                        <span>{Math.round(((applicantData.amountPaid || 0) / TOTAL_PROGRAM_FEE) * 100)}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(((applicantData.amountPaid || 0) / TOTAL_PROGRAM_FEE) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Base Program Fee:</span>
                        <span className="font-medium text-blue-800">
                          KES {BASE_PROGRAM_FEE.toLocaleString()}.00
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">VAT (16%):</span>
                        <span className="font-medium text-blue-800">
                          KES {VAT_AMOUNT.toLocaleString()}.00
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 pt-2">
                        <span className="text-blue-600 font-medium">Total Program Fee:</span>
                        <span className="font-bold text-blue-800">
                          KES {TOTAL_PROGRAM_FEE.toLocaleString()}.00
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Amount Paid:</span>
                        <span className="font-medium text-blue-800">
                          KES {(applicantData.amountPaid || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 flex justify-between">
                        <span className="text-blue-600 font-medium">Balance Due:</span>
                        <span className={`font-bold ${(TOTAL_PROGRAM_FEE - (applicantData.amountPaid || 0)) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          KES {(TOTAL_PROGRAM_FEE - (applicantData.amountPaid || 0)).toLocaleString()}
                        </span>
                      </div>
                      {(TOTAL_PROGRAM_FEE - (applicantData.amountPaid || 0)) <= 0 && (
                        <div className="mt-3 flex items-center justify-center text-green-600 bg-green-50 rounded-lg py-2">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">Payment Complete!</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Payment Completion Button */}
                    {getActualPaymentStatus() === 'partial' && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={openPaymentCompletion}
                          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Payment
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Competency Tests Access Notice */}
                {!areCompetencyTestsAvailable() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <BookOpen className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-yellow-800 mb-1">Competency Tests</h5>
                        <p className="text-sm text-yellow-700 mb-2">
                          Competency tests will be available after your payment is completed (KES {TOTAL_PROGRAM_FEE.toLocaleString()}).
                        </p>
                        <p className="text-xs text-yellow-600">
                          Amount needed: KES {(TOTAL_PROGRAM_FEE - (applicantData.amountPaid || 0)).toLocaleString()} remaining
                        </p>
                        {getActualPaymentStatus() === 'partial' && (
                          <button
                            onClick={openPaymentCompletion}
                            className="mt-3 inline-flex items-center text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Documents Section */}
                <div className="space-y-4 mt-6">
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
                        Official invoice for {getSelectedProgram()?.programName || 'Sales Training Program'} including VAT breakdown and payment details.
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
                          disabled={!applicantData.amountPaid || applicantData.amountPaid === 0}
                          className="flex-1 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={downloadReceiptPDF}
                          disabled={!applicantData.amountPaid || applicantData.amountPaid === 0}
                          className="flex-1 border border-accent-600 text-accent-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                      {(!applicantData.amountPaid || applicantData.amountPaid === 0) && (
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          Available after first payment
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Capability Assessment</h2>
              
              {/* About Capability Assessment */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">About Capability Assessment</h3>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>
                        The capability assessment helps us understand your current sales knowledge and skills to ensure proper placement in the right program for your career goals.
                      </p>
                      <p>
                        <strong>Important:</strong> This assessment covers:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Core sales competencies and techniques</li>
                        <li>Customer relationship management</li>
                        <li>Sales process understanding</li>
                        <li>Professional development areas</li>
                      </ul>
                      <p>
                        <strong>Assessment Options:</strong> You can take the free basic assessment immediately, with advanced tests available after payment completion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Options Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-800 mb-4">Available Assessments</h4>
                
                {/* Free Assessment Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">Sales Competency Assessment</h5>
                      <p className="text-sm text-gray-600">Free basic assessment for all applicants</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Comprehensive evaluation of your sales skills including prospecting, presentation, objection handling, and closing techniques.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">30 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">15 questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Detailed feedback</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/portal/admissions/test/competency-assessment/take')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Take Free Assessment</span>
                  </button>
                </div>
              </div>

              {/* Additional Competency Tests - Premium */}
              {areCompetencyTestsAvailable() && competencyTests.length > 0 && (
                <div className="space-y-6">
                  <div className="border-t border-gray-200 pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-secondary-800">Additional Competency Tests</h3>
                        <p className="text-sm text-secondary-600 mt-1">
                          Advanced tests available with full payment
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-4xl">
                      <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                Test
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Category
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                Details
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Score
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {competencyTests.map((test) => {
                              const { status, color, canTake, canViewResults } = getTestStatus(test.id);
                              const attempt = getTestAttempt(test.id);
                              
                              return (
                                <tr key={test.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {test.title}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {test.description}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {test.category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-xs text-gray-600">
                                    <div className="space-y-1">
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {test.timeLimit}m
                                      </div>
                                      <div className="flex items-center">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {test.questions.length}q
                                      </div>
                                      <div className="flex items-center">
                                        <Award className="h-3 w-3 mr-1" />
                                        {test.passingScore}%
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`text-sm font-medium ${color}`}>
                                      {status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-xs text-gray-900">
                                    {attempt ? (
                                      <div>
                                        <div className="font-medium">
                                          {attempt.totalScore}/{test.totalPoints}
                                        </div>
                                        <div className="text-gray-500">
                                          {attempt.percentage}%
                                        </div>
                                        {attempt.submittedAt && (
                                          <div className="text-gray-400">
                                            {new Date(attempt.submittedAt).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-xs space-y-1">
                                    {canTake && (
                                      <button
                                        onClick={() => handleTakeTest(test.id)}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500"
                                      >
                                        <Play className="h-3 w-3 mr-1" />
                                        {status === 'In Progress' ? 'Continue' : status === 'Failed' ? 'Retake' : 'Take'}
                                      </button>
                                    )}
                                    {canViewResults && (
                                      <button
                                        onClick={() => handleViewResults(test.id)}
                                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Results
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Required Notice for Additional Tests */}
              {!areCompetencyTestsAvailable() && (
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <BookOpen className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">Additional Tests Available with Payment</h3>
                        <p className="text-yellow-700 mb-4">
                          Premium competency tests and advanced assessments are available after completing your program payment.
                        </p>
                        <div className="text-sm text-yellow-600">
                          <p>Current payment status: <span className="font-medium">{getActualPaymentStatus().replace('_', ' ').toUpperCase()}</span></p>
                          <p className="mt-1">Amount paid: <span className="font-medium">KES {(applicantData.amountPaid || 0).toLocaleString()}</span> of <span className="font-medium">KES {TOTAL_PROGRAM_FEE.toLocaleString()}</span></p>
                          {getActualPaymentStatus() === 'partial' && (
                            <div className="mt-4">
                              <button
                                onClick={openPaymentCompletion}
                                className="inline-flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Payment to Unlock
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assessment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Assessment Guidelines</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    The Capability Assessment is available to all applicants and takes 30 minutes to complete.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Questions are randomly selected from our question bank to ensure comprehensive evaluation.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You'll receive detailed feedback on your performance across all competency areas.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Ensure you have a stable internet connection before starting the assessment.
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Read each question carefully and select the best answer based on your knowledge and experience.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Application Status</h2>
              
              {/* Application Status Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Application Status
                    </label>
                    <select
                      value={applicantData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Assigned Intake
                    </label>
                    <select
                      value={applicantData.intake}
                      onChange={(e) => handleInputChange('intake', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                    >
                      <option value="">No intake assigned</option>
                      {intakes.map((intake) => (
                        <option key={intake.id} value={intake.intakeId}>
                          {intake.name} - Starts {new Date(intake.startDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Admitted Program
                  </label>
                  <select
                    value={applicantData.admittedProgram}
                    onChange={(e) => handleInputChange('admittedProgram', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  >
                    <option value="">No program assigned</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.programName} ({program.programCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Application Letter Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Application Letter & Communication</h3>
                
                {/* Status-based Letter Templates */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Official Letter
                  </label>
                  
                  {applicantData.status === 'approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                      <h4 className="font-medium text-green-800 mb-3">Acceptance Letter</h4>
                      <div className="text-sm text-green-700 space-y-2">
                        <p><strong>Dear {applicantData.firstName} {applicantData.lastName},</strong></p>
                        <p>We are pleased to inform you that your application to <strong>{getSelectedProgram()?.programName || 'our program'}</strong> has been <strong>APPROVED</strong>.</p>
                        
                        {applicantData.intake && (
                          <p>You have been assigned to <strong>{intakes.find(i => i.intakeId === applicantData.intake)?.name || applicantData.intake}</strong>.</p>
                        )}
                        
                        <p>Program Details:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Program: {getSelectedProgram()?.programName || 'TBD'}</li>
                          <li>Intake: {intakes.find(i => i.intakeId === applicantData.intake)?.name || 'TBD'}</li>
                          <li>Start Date: {intakes.find(i => i.intakeId === applicantData.intake) ? new Date(intakes.find(i => i.intakeId === applicantData.intake)!.startDate).toLocaleDateString() : 'TBD'}</li>
                          <li>Application Number: {applicantData.applicationNumber}</li>
                        </ul>
                        
                        <p>Please ensure your payment is completed before the program start date.</p>
                        <p>We look forward to welcoming you to Kenya School of Sales.</p>
                        <p><strong>Best regards,<br/>Admissions Team<br/>Kenya School of Sales</strong></p>
                      </div>
                    </div>
                  )}

                  {applicantData.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                      <h4 className="font-medium text-red-800 mb-3">Application Decision Letter</h4>
                      <div className="text-sm text-red-700 space-y-2">
                        <p><strong>Dear {applicantData.firstName} {applicantData.lastName},</strong></p>
                        <p>Thank you for your interest in <strong>{getSelectedProgram()?.programName || 'our program'}</strong> at Kenya School of Sales.</p>
                        <p>After careful consideration of your application, we regret to inform you that we cannot offer you admission at this time.</p>
                        <p>This decision was made based on the competitive nature of our admissions process and the high volume of qualified applicants.</p>
                        <p>We encourage you to reapply for future cohorts and wish you success in your educational endeavors.</p>
                        <p><strong>Best regards,<br/>Admissions Team<br/>Kenya School of Sales</strong></p>
                      </div>
                    </div>
                  )}

                  {applicantData.status === 'under_review' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                      <h4 className="font-medium text-yellow-800 mb-3">Application Under Review</h4>
                      <div className="text-sm text-yellow-700 space-y-2">
                        <p><strong>Dear {applicantData.firstName} {applicantData.lastName},</strong></p>
                        <p>Thank you for submitting your application to <strong>{getSelectedProgram()?.programName || 'our program'}</strong>.</p>
                        <p>Your application is currently under review by our admissions committee.</p>
                        <p>Application Details:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Application Number: {applicantData.applicationNumber}</li>
                          <li>Submitted: {new Date(applicantData.submittedDate).toLocaleDateString()}</li>
                          <li>Program: {getSelectedProgram()?.programName || 'TBD'}</li>
                          <li>Payment Status: {getActualPaymentStatus().replace('_', ' ').toUpperCase()}</li>
                        </ul>
                        <p>We will notify you of our decision within 5-7 business days.</p>
                        <p><strong>Best regards,<br/>Admissions Team<br/>Kenya School of Sales</strong></p>
                      </div>
                    </div>
                  )}

                  {applicantData.status === 'pending' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                      <h4 className="font-medium text-blue-800 mb-3">Application Received</h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        <p><strong>Dear {applicantData.firstName} {applicantData.lastName},</strong></p>
                        <p>Thank you for your application to <strong>{getSelectedProgram()?.programName || 'our program'}</strong> at Kenya School of Sales.</p>
                        <p>We have received your application and it is currently being processed.</p>
                        <p>Application Number: <strong>{applicantData.applicationNumber}</strong></p>
                        <p>Please ensure you complete any pending requirements, including payment, to finalize your application.</p>
                        <p>Our admissions team will review your application and contact you with the next steps.</p>
                        <p><strong>Best regards,<br/>Admissions Team<br/>Kenya School of Sales</strong></p>
                      </div>
                                         </div>
                   )}
                 </div>
               </div>

              {/* Feedback & Communication History */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary-800">Communication History</h3>
                  {isEditing && (
                    <button
                      onClick={addFeedback}
                      disabled={!newFeedback.message || !newFeedback.author}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Note</span>
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <input
                        type="text"
                        value={newFeedback.author}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, author: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Author name (e.g., Admissions Officer)"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={newFeedback.message}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Add communication note, feedback, or update..."
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {(applicantData.feedback || []).map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="bg-primary-100 p-1 rounded-full">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <span className="font-medium text-secondary-800">{item.author}</span>
                          <span className="text-sm text-secondary-500">
                            {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                          </span>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeFeedback(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-secondary-700 pl-7">{item.message}</p>
                    </div>
                  ))}
                  
                  {(applicantData.feedback || []).length === 0 && (
                    <div className="text-center py-8 text-secondary-500">
                      <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <p>No communication history yet.</p>
                      {isEditing && (
                        <p className="text-sm mt-2">Add notes to track communications with this applicant.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
            <div>
              {getPreviousTab() ? (
                <button
                  onClick={goToPreviousTab}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {getPreviousTab()?.label}
                </button>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-500">
                {getCurrentTabIndex() + 1} of {tabs.length}
              </span>
            </div>

            <div>
              {getNextTab() ? (
                <button
                  onClick={goToNextTab}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  {getNextTab()?.label}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantPage; 