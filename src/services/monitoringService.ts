import { FirestoreService } from './firestore';

export interface Assessment {
  id: string;
  title: string;
  type: 'formative' | 'summative' | 'milestone' | 'peer_feedback';
  description: string;
  cohortId: string;
  week?: number;
  dueDate?: string;
  maxScore: number;
  questions?: AssessmentQuestion[];
  instructions?: string;
  timeLimit?: number; // in minutes
  status: 'draft' | 'published' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  submissions?: number;
  averageScore?: number;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay' | 'practical' | 'rating';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  required: boolean;
  order: number;
}

export interface AssessmentData {
  title: string;
  type: 'formative' | 'summative' | 'milestone' | 'peer_feedback';
  description: string;
  cohortId: string;
  week?: number;
  dueDate?: string;
  maxScore: number;
  questions?: AssessmentQuestion[];
  instructions?: string;
  timeLimit?: number;
  status: 'draft' | 'published' | 'completed' | 'archived';
}

export interface TrainerReview {
  id: string;
  learnerId: string;
  learnerName?: string;
  cohortId: string;
  cohortName?: string;
  week: number;
  strengths: string;
  areasForImprovement: string;
  rating: number; // 1-5 scale
  comments: string;
  actionItems: string[];
  followUpDate?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerReviewData {
  learnerId: string;
  cohortId: string;
  week: number;
  strengths: string;
  areasForImprovement: string;
  rating: number;
  comments: string;
  actionItems: string[];
  followUpDate?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  learnerId: string;
  learnerName?: string;
  cohortId: string;
  responses: AssessmentResponse[];
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: string;
  status: 'in_progress' | 'submitted' | 'graded' | 'returned';
  timeSpent?: number; // in minutes
}

export interface AssessmentResponse {
  questionId: string;
  response: string | number | string[];
  score?: number;
  feedback?: string;
}

export interface MonitoringStats {
  totalAssessments: number;
  publishedAssessments: number;
  completedAssessments: number;
  totalSubmissions: number;
  averageScore: number;
  totalReviews: number;
  assessmentsByType: { type: string; count: number }[];
  reviewsByWeek: { week: number; count: number }[];
}

export interface AssessmentFilter {
  type?: string;
  cohortId?: string;
  week?: number;
  status?: string;
  createdBy?: string;
  searchTerm?: string;
}

export interface ReviewFilter {
  learnerId?: string;
  cohortId?: string;
  week?: number;
  status?: string;
  reviewedBy?: string;
  rating?: number;
  searchTerm?: string;
}

export class MonitoringService {
  private static assessmentCollection = 'assessments';
  private static reviewCollection = 'trainer_reviews';
  private static submissionCollection = 'assessment_submissions';

  // ===== ASSESSMENT METHODS =====

  // Create a new assessment
  static async createAssessment(
    data: AssessmentData,
    userId: string
  ): Promise<{ success: boolean; data?: Assessment; error?: string }> {
    try {
      const now = new Date().toISOString();
      const assessmentData = {
        ...data,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        submissions: 0,
        averageScore: 0
      };

      const result = await FirestoreService.create(this.assessmentCollection, assessmentData);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...assessmentData } as Assessment
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create assessment' };
    }
  }

  // Get all assessments with optional filtering
  static async getAssessments(
    filters: AssessmentFilter = {}
  ): Promise<{ success: boolean; data?: Assessment[]; error?: string }> {
    try {
      const queries = [];
      
      if (filters.type) {
        queries.push({ field: 'type', operator: '==', value: filters.type });
      }
      
      if (filters.cohortId) {
        queries.push({ field: 'cohortId', operator: '==', value: filters.cohortId });
      }
      
      if (filters.week) {
        queries.push({ field: 'week', operator: '==', value: filters.week });
      }
      
      if (filters.status) {
        queries.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.createdBy) {
        queries.push({ field: 'createdBy', operator: '==', value: filters.createdBy });
      }

      const result = await FirestoreService.getWithQuery(this.assessmentCollection, queries);
      
      if (result.success && result.data) {
        let assessments = result.data as Assessment[];
        
        // Apply search filter if provided
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          assessments = assessments.filter(assessment => 
            assessment.title.toLowerCase().includes(searchTerm) ||
            assessment.description.toLowerCase().includes(searchTerm)
          );
        }
        
        // Sort by most recent
        assessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return { success: true, data: assessments };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch assessments' };
    }
  }

  // Get a single assessment by ID
  static async getAssessment(
    id: string
  ): Promise<{ success: boolean; data?: Assessment; error?: string }> {
    try {
      const result = await FirestoreService.getById(this.assessmentCollection, id);
      
      if (result.success && result.data) {
        return { success: true, data: result.data as Assessment };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch assessment' };
    }
  }

  // Update an assessment
  static async updateAssessment(
    id: string,
    data: Partial<AssessmentData>
  ): Promise<{ success: boolean; data?: Assessment; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update(this.assessmentCollection, id, updateData);
      
      if (result.success) {
        const updatedAssessment = await this.getAssessment(id);
        return updatedAssessment;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update assessment' };
    }
  }

  // Delete an assessment
  static async deleteAssessment(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.delete(this.assessmentCollection, id);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete assessment' };
    }
  }

  // ===== TRAINER REVIEW METHODS =====

  // Create a new trainer review
  static async createTrainerReview(
    data: TrainerReviewData,
    userId: string
  ): Promise<{ success: boolean; data?: TrainerReview; error?: string }> {
    try {
      const now = new Date().toISOString();
      const reviewData = {
        ...data,
        reviewedBy: userId,
        reviewedAt: now,
        createdAt: now,
        updatedAt: now
      };

      const result = await FirestoreService.create(this.reviewCollection, reviewData);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...reviewData } as TrainerReview
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create trainer review' };
    }
  }

  // Get all trainer reviews with optional filtering
  static async getTrainerReviews(
    filters: ReviewFilter = {}
  ): Promise<{ success: boolean; data?: TrainerReview[]; error?: string }> {
    try {
      const queries = [];
      
      if (filters.learnerId) {
        queries.push({ field: 'learnerId', operator: '==', value: filters.learnerId });
      }
      
      if (filters.cohortId) {
        queries.push({ field: 'cohortId', operator: '==', value: filters.cohortId });
      }
      
      if (filters.week) {
        queries.push({ field: 'week', operator: '==', value: filters.week });
      }
      
      if (filters.status) {
        queries.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.reviewedBy) {
        queries.push({ field: 'reviewedBy', operator: '==', value: filters.reviewedBy });
      }
      
      if (filters.rating) {
        queries.push({ field: 'rating', operator: '==', value: filters.rating });
      }

      const result = await FirestoreService.getWithQuery(this.reviewCollection, queries);
      
      if (result.success && result.data) {
        let reviews = result.data as TrainerReview[];
        
        // Apply search filter if provided
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          reviews = reviews.filter(review => 
            review.strengths.toLowerCase().includes(searchTerm) ||
            review.areasForImprovement.toLowerCase().includes(searchTerm) ||
            review.comments.toLowerCase().includes(searchTerm) ||
            review.learnerName?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Sort by most recent
        reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return { success: true, data: reviews };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch trainer reviews' };
    }
  }

  // Get a single trainer review by ID
  static async getTrainerReview(
    id: string
  ): Promise<{ success: boolean; data?: TrainerReview; error?: string }> {
    try {
      const result = await FirestoreService.getById(this.reviewCollection, id);
      
      if (result.success && result.data) {
        return { success: true, data: result.data as TrainerReview };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch trainer review' };
    }
  }

  // Update a trainer review
  static async updateTrainerReview(
    id: string,
    data: Partial<TrainerReviewData>
  ): Promise<{ success: boolean; data?: TrainerReview; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update(this.reviewCollection, id, updateData);
      
      if (result.success) {
        const updatedReview = await this.getTrainerReview(id);
        return updatedReview;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update trainer review' };
    }
  }

  // Delete a trainer review
  static async deleteTrainerReview(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.delete(this.reviewCollection, id);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete trainer review' };
    }
  }

  // ===== ASSESSMENT SUBMISSION METHODS =====

  // Submit an assessment response
  static async submitAssessment(
    assessmentId: string,
    learnerId: string,
    cohortId: string,
    responses: AssessmentResponse[]
  ): Promise<{ success: boolean; data?: AssessmentSubmission; error?: string }> {
    try {
      const now = new Date().toISOString();
      const submissionData = {
        assessmentId,
        learnerId,
        cohortId,
        responses,
        submittedAt: now,
        status: 'submitted' as const
      };

      const result = await FirestoreService.create(this.submissionCollection, submissionData);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...submissionData } as AssessmentSubmission
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to submit assessment' };
    }
  }

  // Get assessment submissions
  static async getAssessmentSubmissions(
    assessmentId?: string,
    learnerId?: string,
    cohortId?: string
  ): Promise<{ success: boolean; data?: AssessmentSubmission[]; error?: string }> {
    try {
      const queries = [];
      
      if (assessmentId) {
        queries.push({ field: 'assessmentId', operator: '==', value: assessmentId });
      }
      
      if (learnerId) {
        queries.push({ field: 'learnerId', operator: '==', value: learnerId });
      }
      
      if (cohortId) {
        queries.push({ field: 'cohortId', operator: '==', value: cohortId });
      }

      const result = await FirestoreService.getWithQuery(this.submissionCollection, queries);
      
      if (result.success && result.data) {
        const submissions = result.data as AssessmentSubmission[];
        submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        
        return { success: true, data: submissions };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch assessment submissions' };
    }
  }

  // Grade an assessment submission
  static async gradeSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    gradedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gradeData = {
        score,
        feedback,
        gradedBy,
        gradedAt: new Date().toISOString(),
        status: 'graded' as const
      };

      const result = await FirestoreService.update(this.submissionCollection, submissionId, gradeData);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to grade submission' };
    }
  }

  // ===== STATISTICS AND REPORTING =====

  // Get monitoring statistics
  static async getMonitoringStats(): Promise<{
    success: boolean;
    data?: MonitoringStats;
    error?: string;
  }> {
    try {
      const [assessmentsResult, reviewsResult, submissionsResult] = await Promise.all([
        FirestoreService.getAll(this.assessmentCollection),
        FirestoreService.getAll(this.reviewCollection),
        FirestoreService.getAll(this.submissionCollection)
      ]);

      if (assessmentsResult.success && reviewsResult.success && submissionsResult.success) {
        const assessments = assessmentsResult.data as Assessment[];
        const reviews = reviewsResult.data as TrainerReview[];
        const submissions = submissionsResult.data as AssessmentSubmission[];

        const stats: MonitoringStats = {
          totalAssessments: assessments.length,
          publishedAssessments: assessments.filter(a => a.status === 'published').length,
          completedAssessments: assessments.filter(a => a.status === 'completed').length,
          totalSubmissions: submissions.length,
          averageScore: submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length || 0,
          totalReviews: reviews.length,
          assessmentsByType: [],
          reviewsByWeek: []
        };

        // Calculate assessments by type
        const typeCount = assessments.reduce((acc, assessment) => {
          acc[assessment.type] = (acc[assessment.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        stats.assessmentsByType = Object.entries(typeCount).map(([type, count]) => ({
          type,
          count
        }));

        // Calculate reviews by week
        const weekCount = reviews.reduce((acc, review) => {
          acc[review.week] = (acc[review.week] || 0) + 1;
          return acc;
        }, {} as { [key: number]: number });

        stats.reviewsByWeek = Object.entries(weekCount).map(([week, count]) => ({
          week: parseInt(week),
          count
        }));

        return { success: true, data: stats };
      }

      return { success: false, error: 'Failed to fetch monitoring statistics' };
    } catch (error) {
      return { success: false, error: 'Failed to calculate monitoring statistics' };
    }
  }

  // Get learner progress report
  static async getLearnerProgress(
    learnerId: string,
    cohortId?: string
  ): Promise<{
    success: boolean;
    data?: {
      reviews: TrainerReview[];
      submissions: AssessmentSubmission[];
      averageRating: number;
      completionRate: number;
    };
    error?: string;
  }> {
    try {
      const reviewsResult = await this.getTrainerReviews({ learnerId, cohortId });
      const submissionsResult = await this.getAssessmentSubmissions(undefined, learnerId, cohortId);

      if (reviewsResult.success && submissionsResult.success) {
        const reviews = reviewsResult.data || [];
        const submissions = submissionsResult.data || [];
        
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
        const completionRate = submissions.filter(s => s.status === 'graded').length / submissions.length || 0;

        return {
          success: true,
          data: {
            reviews,
            submissions,
            averageRating,
            completionRate
          }
        };
      }

      return { success: false, error: 'Failed to fetch learner progress' };
    } catch (error) {
      return { success: false, error: 'Failed to calculate learner progress' };
    }
  }
} 