export interface Instructor {
  id?: string;
  uid?: string; // Links to user account if they have one
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  employeeId?: string;
  
  // Professional Information
  specializations: string[];
  qualifications: string[];
  certifications: string[];
  yearsOfExperience: number;
  bio?: string;
  
  // Teaching Information
  subjects: string[]; // Areas they can teach
  preferredPrograms: string[]; // Program IDs they prefer to teach
  maxSessionsPerWeek: number;
  availability: AvailabilitySlot[];
  
  // Assignment & Schedule
  assignedSessions?: string[]; // Session IDs they're assigned to
  assignedIntakes?: string[]; // Intake IDs they're teaching in
  currentLoad: number; // Current number of sessions assigned
  
  // Status & Meta
  status: 'active' | 'on_leave' | 'inactive';
  joinedDate: string;
  rating?: number; // Average rating from feedback
  totalSessionsTaught?: number;
  
  // Contact & Location
  address?: string;
  city?: string;
  country?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  
  // Administrative
  contractType: 'full_time' | 'part_time' | 'contract' | 'guest';
  hourlyRate?: number;
  department?: string;
  notes?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilitySlot {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  isAvailable: boolean;
}

export interface InstructorAssignment {
  id?: string;
  instructorId: string;
  instructorName: string;
  sessionId?: string;
  intakeId: string;
  programId: string;
  
  // Schedule Details
  sessionDate?: string;
  sessionTime?: string;
  sessionTitle?: string;
  sessionType?: 'lecture' | 'practical' | 'workshop' | 'assessment';
  
  // Assignment Meta
  assignedDate: string;
  assignedBy: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  
  // Additional Info
  notes?: string;
  specialRequirements?: string[];
  
  createdAt?: string;
  updatedAt?: string;
}

export interface InstructorScheduleRequest {
  intakeId: string;
  sessionId?: string;
  requiredDate: string;
  requiredTime: string;
  duration: number; // in minutes
  subject: string;
  sessionType: 'lecture' | 'practical' | 'workshop' | 'assessment';
  specialRequirements?: string[];
}

export interface InstructorAvailabilityCheck {
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflicts?: string[]; // List of conflicting session IDs
}