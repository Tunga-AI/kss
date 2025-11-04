export interface Customer {
  id: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  programId?: string | null;
  programName?: string | null;
  learningGoals: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  source: 'website' | 'referral' | 'social_media' | 'direct' | 'other';
  socialMediaPlatform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  referralSource?: 'friend_colleague' | 'staff_student' | 'family' | 'other_referral';
  staffStudentName?: string;
  submittedDate: string;
  lastContactDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  notes?: CustomerNote[];
  followUpDate?: string;
  conversionDate?: string;
  conversionType?: 'application' | 'enrollment' | 'other';
  tags?: string[];
  communicationPreference: 'email' | 'whatsapp' | 'phone' | 'any';
  currentRole?: string;
  currentOrganization?: string;
  programType?: 'core' | 'short';
  intakeId?: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'follow_up' | 'general';
  author: string;
  authorName: string;
  createdAt: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface Program {
  id: string;
  programName: string;
  programCode?: string;
  description?: string;
  duration?: string;
  price?: number;
  isActive: boolean;
}

export interface CustomerStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  conversions: number;
  conversionRate: number;
  averageResponseTime: number;
}

export interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (note: Partial<CustomerNote>) => void;
}

export interface CustomerFilters {
  status: string;
  priority: string;
  programId: string;
  assignedTo: string;
  source: string;
  dateRange: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  surname?: string;
  email: string;
  phone: string;
  organisation?: string;
  source: 'manual' | 'csv_upload' | 'website' | 'referral' | 'social_media' | 'direct' | 'other';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tags?: string[];
  isConverted?: boolean;
  convertedToLeadId?: string;
}

export interface ContactFilters {
  source: string;
  organisation: string;
  searchTerm: string;
} 