import type { Timestamp } from 'firebase/firestore';

export type Certificate = {
    id: string;
    learnerName: string;
    learnerEmail: string;
    learnerId?: string;

    programTitle: string;
    programType?: 'Core' | 'E-Learning' | 'Event' | 'Short' | 'Corporate';
    programId?: string;

    courseTitle?: string;
    courseId?: string;
    cohortId?: string;
    cohortName?: string;

    issuedDate: Timestamp;
    completedAt?: Timestamp;

    // Auto-generated flag
    isSystemGenerated?: boolean;

    // Optional PDF URL for admin-uploaded certificates
    certificateUrl?: string;

    // Legacy (pre-system) certificate fields
    isLegacy?: boolean;
    sourceFilename?: string;
    uploadedAt?: Timestamp;
};
