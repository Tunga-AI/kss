import type { Timestamp } from 'firebase/firestore';

export type Admission = {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    status: 'Pending Payment' | 'Pending Assessment' | 'Pending Review' | 'Placed' | 'Admitted' | 'Rejected';

    // Initial application
    cohortId?: string;
    interestedProgramId?: string;
    interestedProgramTitle?: string;

    // Assessment
    assessmentRequired: boolean;
    assessmentCompleted: boolean;
    assessmentAttemptId?: string;
    assessmentScore?: number;
    assessmentPassed?: boolean;

    // Council Review
    councilReviewId?: string;
    councilFeedback?: string;
    councilNotes?: string;

    // Final Placement
    finalProgramId?: string;
    finalProgramTitle?: string;
    finalCohortId?: string;
    finalCohortTitle?: string;
    placedAt?: Timestamp;

    // Legacy
    testScore?: number;
    recommendedProgramId?: string;
    recommendedProgramTitle?: string;

    createdAt: Timestamp;
    updatedAt?: Timestamp;
};
