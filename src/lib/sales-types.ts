import type { Timestamp } from 'firebase/firestore';

export type SaleLead = {
    id: string;
    leadNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    whatsappNumber?: string;
    programId?: string;
    programName: string;
    programType?: string;
    status: string;
    priority?: string;
    rating?: string;
    communicationPreference?: string;
    source?: string;
    referralSource?: string;
    learningGoals?: string;
    currentRole?: string;
    currentOrganization?: string;
    submittedDate?: string;
    tags?: string[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    // Legacy fields that might still be useful or present
    assignedTo?: string;
    cohort?: string;
    enrollmentType?: string;
    notes?: LeadNote[];
    socialMediaPlatform?: string;
    staffStudentName?: string;
};

export type LeadNote = {
    id: string;
    content: string;
    createdAt: Timestamp;
    authorId: string;
    authorName: string;
};
