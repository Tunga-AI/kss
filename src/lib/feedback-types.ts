import type { Timestamp } from 'firebase/firestore';

export type FeedbackType = 'general' | 'class' | 'instructor' | 'program' | 'cohort';

export type QuestionType = 'rating' | 'text' | 'multiple_choice' | 'yes_no';

export type FeedbackStatus = 'draft' | 'active' | 'closed';

export interface FeedbackQuestion {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // For multiple_choice
  ratingScale?: number; // For rating (e.g., 5 for 1-5 scale)
}

export interface FeedbackCycle {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  status: FeedbackStatus;
  questions: FeedbackQuestion[];
  targetAudience: 'all' | 'learners' | 'instructors' | 'specific';
  specificUserIds?: string[]; // If targetAudience is 'specific'
  specificCohortIds?: string[]; // For class/cohort specific feedback
  specificProgramIds?: string[]; // For program specific feedback
  specificInstructorIds?: string[]; // For instructor specific feedback
  createdBy: string; // User ID of creator
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startDate: Timestamp;
  endDate: Timestamp;
  anonymousResponses: boolean;
}

export interface FeedbackAnswer {
  questionId: string;
  answer: string | number; // Text/choice answer or rating number
}

export interface FeedbackResponse {
  id: string;
  feedbackCycleId: string;
  respondentId: string; // User ID (empty if anonymous)
  respondentName?: string; // Name (if not anonymous)
  respondentRole?: string; // Role (if not anonymous)
  answers: FeedbackAnswer[];
  submittedAt: Timestamp;
  isAnonymous: boolean;
}

export interface FeedbackAnalytics {
  feedbackCycleId: string;
  totalResponses: number;
  completionRate: number; // Percentage of target audience who responded
  averageRatings: { [questionId: string]: number };
  responsesByQuestion: { [questionId: string]: any };
  textResponses: { [questionId: string]: string[] };
  multipleChoiceDistribution: { [questionId: string]: { [option: string]: number } };
  responsesByDate: { [date: string]: number };
}
