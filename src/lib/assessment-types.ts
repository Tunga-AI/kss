import { Timestamp } from 'firebase/firestore';

// --- Competency types ---

export interface Competency {
    id: string;
    name: string;
    description: string;
}

export interface CompetencyCategory {
    id: string;
    name: string;
    description: string;
    competencies: Competency[];
}

export interface CompetencyConfig {
    id: string;
    categories: CompetencyCategory[];
    updatedAt: Timestamp;
}

// --- Assessment recommendation rules ---

export interface AssessmentRecommendationRule {
    minScore: number;
    maxScore: number;
    programId: string;
}

// --- Assessment types ---

export interface AssessmentQuestion {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[]; // For multiple choice
    correctAnswer?: string | number; // Index for MC, string for others
    points: number;
    competencyId?: string;   // Specific competency leaf ID this question tests
    competencyName?: string; // Denormalized name for display
}

export interface Assessment {
    id: string;
    title: string;
    description: string;
    programId: string;
    programTitle: string;
    questions: AssessmentQuestion[];
    passingScore: number; // Percentage
    timeLimit?: number; // Minutes
    status: 'Active' | 'Inactive';
    competencyIds?: string[]; // Category-level: which competency categories this covers
    recommendationRules?: AssessmentRecommendationRule[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AssessmentAttempt {
    id: string;
    assessmentId: string;
    assessmentTitle: string;
    userId: string;
    userName: string;
    userEmail: string;
    admissionId: string;
    programId: string;
    programTitle: string;
    answers: {
        questionId: string;
        answer: string | number;
    }[];
    score: number; // Percentage
    totalPoints: number;
    earnedPoints: number;
    passed: boolean;
    startedAt: Timestamp;
    completedAt?: Timestamp;
    status: 'In Progress' | 'Completed' | 'Abandoned';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CouncilReview {
    id: string;
    admissionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    assessmentAttemptId: string;
    assessmentScore: number;
    reviewerId: string;
    reviewerName: string;
    decision: 'Approve' | 'Reject' | 'Request Re-assessment';
    recommendedProgramId?: string;
    recommendedProgramTitle?: string;
    recommendedCohortId?: string;
    recommendedCohortTitle?: string;
    feedback: string;
    notes?: string;
    reviewedAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
