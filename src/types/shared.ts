export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  responsibilities: string;
  achievements: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrentStudy: boolean;
  grade?: string;
  achievements?: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  profilePicture?: string;
}

export interface BaseUserData extends PersonalInfo {
  id?: string;
  uid?: string;
  displayName?: string;
  role: 'admin' | 'staff' | 'instructor' | 'learner' | 'applicant';
  organization?: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  languages: string[];
  bio?: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
  
  // Staff-specific fields
  department?: string;
  position?: string;
  designations?: string[];
  qualifications?: string;
  experience?: string;
  specialization?: string;
  employeeId?: string;
  dateJoined?: string;
  assignedPrograms?: string[];
  type?: 'teaching' | 'administrative' | 'support';
  salary?: number;
  
  // Learner-specific fields
  studentId?: string;
  currentJobTitle?: string;
  currentOrganisation?: string;
  salesExperience?: string;
  keyAchievements?: string;
  programId?: string;
  learningGoals?: string;
  academicStatus?: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  currentGPA?: number;
  enrollmentDate?: string;
  cohort?: string;
  cohortId?: string;
  cohortName?: string;
  intakeId?: string;
  intakeName?: string;
  totalFees?: number;
  amountPaid?: number;
  outstandingBalance?: number;
  paymentPlan?: string;
  
  // Additional fields
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  programsEnrolled?: any[];
  paymentHistory?: any[];
} 