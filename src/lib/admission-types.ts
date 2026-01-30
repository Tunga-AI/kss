import type { Timestamp } from 'firebase/firestore';

export type Admission = {
    id: string;
    userId: string;
    name: string;
    email: string;
    status: 'Pending Payment' | 'Pending Test' | 'Pending Review' | 'Admitted' | 'Rejected';
    cohortId?: string;
    interestedProgramId?: string;
    interestedProgramTitle?: string;
    testScore?: number;
    recommendedProgramId?: string;
    createdAt: Timestamp;
};
