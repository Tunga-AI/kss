import { FirestoreService } from './firestore';

export interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  cohortId: string;
  cohortName?: string;
  type: 'individual' | 'group';
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
  startDate: string;
  dueDate: string;
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: EvaluationCriteria[];
  resources: ProjectResource[];
  assignedLearners: string[];
  assignedLearnerNames?: string[];
  maxTeamSize?: number;
  submissionFormat: 'document' | 'presentation' | 'prototype' | 'report' | 'other';
  instructions: string;
  weight: number; // percentage of total grade
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submissions?: number;
  completedSubmissions?: number;
  averageScore?: number;
}

export interface EvaluationCriteria {
  id: string;
  criteria: string;
  description: string;
  weight: number; // percentage of project grade
  maxPoints: number;
}

export interface ProjectResource {
  id: string;
  title: string;
  type: 'link' | 'file' | 'document' | 'template';
  url: string;
  description?: string;
}

export interface CapstoneProjectData {
  title: string;
  description: string;
  cohortId: string;
  type: 'individual' | 'group';
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
  startDate: string;
  dueDate: string;
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: EvaluationCriteria[];
  resources: ProjectResource[];
  assignedLearners: string[];
  maxTeamSize?: number;
  submissionFormat: 'document' | 'presentation' | 'prototype' | 'report' | 'other';
  instructions: string;
  weight: number;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  projectTitle?: string;
  learnerId: string;
  learnerName?: string;
  teamId?: string;
  teamName?: string;
  teamMembers?: string[];
  cohortId: string;
  title: string;
  description: string;
  submissionFiles: SubmissionFile[];
  submissionLinks: SubmissionLink[];
  reflectionNotes: string;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'under_review' | 'graded' | 'returned' | 'approved';
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  evaluationScores?: EvaluationScore[];
  comments?: ProjectComment[];
  revisionRequested?: boolean;
  revisionNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface SubmissionFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface SubmissionLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  linkType: 'demo' | 'repository' | 'presentation' | 'documentation' | 'other';
}

export interface EvaluationScore {
  criteriaId: string;
  criteriaName: string;
  score: number;
  maxPoints: number;
  feedback?: string;
}

export interface ProjectComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  type: 'feedback' | 'question' | 'suggestion' | 'approval';
}

export interface ProjectTeam {
  id: string;
  name: string;
  projectId: string;
  members: string[];
  memberNames?: string[];
  leaderId: string;
  leaderName?: string;
  createdAt: string;
  status: 'active' | 'disbanded';
}

export interface ProjectFilter {
  cohortId?: string;
  type?: string;
  status?: string;
  createdBy?: string;
  assignedLearner?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

export interface SubmissionFilter {
  projectId?: string;
  learnerId?: string;
  cohortId?: string;
  status?: string;
  teamId?: string;
  searchTerm?: string;
  gradedBy?: string;
}

export interface CapstoneStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalSubmissions: number;
  pendingReviews: number;
  averageScore: number;
  projectsByType: { type: string; count: number }[];
  projectsByStatus: { status: string; count: number }[];
  submissionsByStatus: { status: string; count: number }[];
  monthlySubmissions: { month: string; count: number }[];
}

export class CapstoneService {
  private static projectCollection = 'capstone_projects';
  private static submissionCollection = 'project_submissions';
  private static teamCollection = 'project_teams';

  // ===== PROJECT METHODS =====

  // Create a new capstone project
  static async createProject(
    data: CapstoneProjectData,
    userId: string
  ): Promise<{ success: boolean; data?: CapstoneProject; error?: string }> {
    try {
      const now = new Date().toISOString();
      const projectData = {
        ...data,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        submissions: 0,
        completedSubmissions: 0,
        averageScore: 0
      };

      const result = await FirestoreService.create(this.projectCollection, projectData);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...projectData } as CapstoneProject
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create capstone project' };
    }
  }

  // Get all capstone projects with optional filtering
  static async getProjects(
    filters: ProjectFilter = {}
  ): Promise<{ success: boolean; data?: CapstoneProject[]; error?: string }> {
    try {
      const queries = [];
      
      if (filters.cohortId) {
        queries.push({ field: 'cohortId', operator: '==', value: filters.cohortId });
      }
      
      if (filters.type) {
        queries.push({ field: 'type', operator: '==', value: filters.type });
      }
      
      if (filters.status) {
        queries.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.createdBy) {
        queries.push({ field: 'createdBy', operator: '==', value: filters.createdBy });
      }
      
      if (filters.assignedLearner) {
        queries.push({ field: 'assignedLearners', operator: 'array-contains', value: filters.assignedLearner });
      }

      const result = await FirestoreService.getWithQuery(this.projectCollection, queries);
      
      if (result.success && result.data) {
        let projects = result.data as CapstoneProject[];
        
        // Apply search filter if provided
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          projects = projects.filter(project => 
            project.title.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm)
          );
        }
        
        // Apply date filters
        if (filters.startDate || filters.endDate) {
          projects = projects.filter(project => {
            const projectDate = new Date(project.startDate);
            if (filters.startDate && projectDate < new Date(filters.startDate)) return false;
            if (filters.endDate && projectDate > new Date(filters.endDate)) return false;
            return true;
          });
        }
        
        // Sort by most recent
        projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return { success: true, data: projects };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch capstone projects' };
    }
  }

  // Get a single capstone project by ID
  static async getProject(
    id: string
  ): Promise<{ success: boolean; data?: CapstoneProject; error?: string }> {
    try {
      const result = await FirestoreService.getById(this.projectCollection, id);
      
      if (result.success && result.data) {
        return { success: true, data: result.data as CapstoneProject };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch capstone project' };
    }
  }

  // Update a capstone project
  static async updateProject(
    id: string,
    data: Partial<CapstoneProjectData>
  ): Promise<{ success: boolean; data?: CapstoneProject; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update(this.projectCollection, id, updateData);
      
      if (result.success) {
        const updatedProject = await this.getProject(id);
        return updatedProject;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update capstone project' };
    }
  }

  // Delete a capstone project
  static async deleteProject(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.delete(this.projectCollection, id);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete capstone project' };
    }
  }

  // ===== SUBMISSION METHODS =====

  // Create a new project submission
  static async createSubmission(
    projectId: string,
    learnerId: string,
    cohortId: string,
    submissionData: {
      title: string;
      description: string;
      submissionFiles: SubmissionFile[];
      submissionLinks: SubmissionLink[];
      reflectionNotes: string;
      teamId?: string;
      teamMembers?: string[];
    }
  ): Promise<{ success: boolean; data?: ProjectSubmission; error?: string }> {
    try {
      const now = new Date().toISOString();
      const submission = {
        projectId,
        learnerId,
        cohortId,
        ...submissionData,
        submittedAt: now,
        status: 'submitted' as const
      };

      const result = await FirestoreService.create(this.submissionCollection, submission);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...submission } as ProjectSubmission
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create project submission' };
    }
  }

  // Get project submissions with optional filtering
  static async getSubmissions(
    filters: SubmissionFilter = {}
  ): Promise<{ success: boolean; data?: ProjectSubmission[]; error?: string }> {
    try {
      const queries = [];
      
      if (filters.projectId) {
        queries.push({ field: 'projectId', operator: '==', value: filters.projectId });
      }
      
      if (filters.learnerId) {
        queries.push({ field: 'learnerId', operator: '==', value: filters.learnerId });
      }
      
      if (filters.cohortId) {
        queries.push({ field: 'cohortId', operator: '==', value: filters.cohortId });
      }
      
      if (filters.status) {
        queries.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.teamId) {
        queries.push({ field: 'teamId', operator: '==', value: filters.teamId });
      }
      
      if (filters.gradedBy) {
        queries.push({ field: 'gradedBy', operator: '==', value: filters.gradedBy });
      }

      const result = await FirestoreService.getWithQuery(this.submissionCollection, queries);
      
      if (result.success && result.data) {
        let submissions = result.data as ProjectSubmission[];
        
        // Apply search filter if provided
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          submissions = submissions.filter(submission => 
            submission.title.toLowerCase().includes(searchTerm) ||
            submission.description.toLowerCase().includes(searchTerm) ||
            submission.learnerName?.toLowerCase().includes(searchTerm) ||
            submission.teamName?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Sort by most recent
        submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        
        return { success: true, data: submissions };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch project submissions' };
    }
  }

  // Get a single project submission by ID
  static async getSubmission(
    id: string
  ): Promise<{ success: boolean; data?: ProjectSubmission; error?: string }> {
    try {
      const result = await FirestoreService.getById(this.submissionCollection, id);
      
      if (result.success && result.data) {
        return { success: true, data: result.data as ProjectSubmission };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch project submission' };
    }
  }

  // Update a project submission
  static async updateSubmission(
    id: string,
    data: Partial<ProjectSubmission>
  ): Promise<{ success: boolean; data?: ProjectSubmission; error?: string }> {
    try {
      const result = await FirestoreService.update(this.submissionCollection, id, data);
      
      if (result.success) {
        const updatedSubmission = await this.getSubmission(id);
        return updatedSubmission;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update project submission' };
    }
  }

  // Grade a project submission
  static async gradeSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    evaluationScores: EvaluationScore[],
    gradedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gradeData = {
        score,
        feedback,
        evaluationScores,
        gradedBy,
        gradedAt: new Date().toISOString(),
        status: 'graded' as const
      };

      const result = await FirestoreService.update(this.submissionCollection, submissionId, gradeData);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to grade project submission' };
    }
  }

  // Add feedback comment to a project submission
  static async addFeedbackComment(
    submissionId: string,
    comment: {
      authorId: string;
      authorName: string;
      content: string;
      type: 'feedback' | 'question' | 'suggestion' | 'approval';
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const submission = await this.getSubmission(submissionId);
      if (!submission.success || !submission.data) {
        return { success: false, error: 'Submission not found' };
      }

      const newComment: ProjectComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...comment,
        timestamp: new Date().toISOString()
      };

      const currentComments = submission.data.comments || [];
      const updatedComments = [...currentComments, newComment];

      const result = await FirestoreService.update(this.submissionCollection, submissionId, {
        comments: updatedComments
      });

      return result;
    } catch (error) {
      return { success: false, error: 'Failed to add feedback comment' };
    }
  }

  // Request revision for a project submission
  static async requestRevision(
    submissionId: string,
    revisionNotes: string,
    requestedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const revisionData = {
        status: 'returned' as const,
        revisionRequested: true,
        revisionNotes,
        gradedBy: requestedBy,
        gradedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update(this.submissionCollection, submissionId, revisionData);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to request revision' };
    }
  }

  // Approve a project submission
  static async approveSubmission(
    submissionId: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const approvalData = {
        status: 'approved' as const,
        approvedBy,
        approvedAt: new Date().toISOString()
      };

      const result = await FirestoreService.update(this.submissionCollection, submissionId, approvalData);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to approve submission' };
    }
  }

  // ===== TEAM METHODS =====

  // Create a project team
  static async createTeam(
    projectId: string,
    teamData: {
      name: string;
      members: string[];
      leaderId: string;
    }
  ): Promise<{ success: boolean; data?: ProjectTeam; error?: string }> {
    try {
      const now = new Date().toISOString();
      const team = {
        projectId,
        ...teamData,
        createdAt: now,
        status: 'active' as const
      };

      const result = await FirestoreService.create(this.teamCollection, team);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...team } as ProjectTeam
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create project team' };
    }
  }

  // Get project teams
  static async getTeams(
    projectId?: string
  ): Promise<{ success: boolean; data?: ProjectTeam[]; error?: string }> {
    try {
      const queries = [];
      
      if (projectId) {
        queries.push({ field: 'projectId', operator: '==', value: projectId });
      }

      const result = await FirestoreService.getWithQuery(this.teamCollection, queries);
      
      if (result.success && result.data) {
        const teams = result.data as ProjectTeam[];
        return { success: true, data: teams };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch project teams' };
    }
  }

  // ===== STATISTICS AND REPORTING =====

  // Get capstone statistics
  static async getCapstoneStats(): Promise<{
    success: boolean;
    data?: CapstoneStats;
    error?: string;
  }> {
    try {
      const [projectsResult, submissionsResult] = await Promise.all([
        FirestoreService.getAll(this.projectCollection),
        FirestoreService.getAll(this.submissionCollection)
      ]);

      if (projectsResult.success && submissionsResult.success) {
        const projects = projectsResult.data as CapstoneProject[];
        const submissions = submissionsResult.data as ProjectSubmission[];

        const stats: CapstoneStats = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'in_progress').length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          totalSubmissions: submissions.length,
          pendingReviews: submissions.filter(s => s.status === 'under_review').length,
          averageScore: submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length || 0,
          projectsByType: [],
          projectsByStatus: [],
          submissionsByStatus: [],
          monthlySubmissions: []
        };

        // Calculate projects by type
        const typeCount = projects.reduce((acc, project) => {
          acc[project.type] = (acc[project.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        stats.projectsByType = Object.entries(typeCount).map(([type, count]) => ({
          type,
          count
        }));

        // Calculate projects by status
        const statusCount = projects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        stats.projectsByStatus = Object.entries(statusCount).map(([status, count]) => ({
          status,
          count
        }));

        // Calculate submissions by status
        const submissionStatusCount = submissions.reduce((acc, submission) => {
          acc[submission.status] = (acc[submission.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        stats.submissionsByStatus = Object.entries(submissionStatusCount).map(([status, count]) => ({
          status,
          count
        }));

        // Calculate monthly submissions for the last 6 months
        const monthlyCount = submissions.reduce((acc, submission) => {
          const month = new Date(submission.submittedAt).toISOString().slice(0, 7);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        stats.monthlySubmissions = Object.entries(monthlyCount).map(([month, count]) => ({
          month,
          count
        }));

        return { success: true, data: stats };
      }

      return { success: false, error: 'Failed to fetch capstone statistics' };
    } catch (error) {
      return { success: false, error: 'Failed to calculate capstone statistics' };
    }
  }

  // Get learner project progress
  static async getLearnerProjectProgress(
    learnerId: string,
    cohortId?: string
  ): Promise<{
    success: boolean;
    data?: {
      projects: CapstoneProject[];
      submissions: ProjectSubmission[];
      averageScore: number;
      completionRate: number;
    };
    error?: string;
  }> {
    try {
      const projectsResult = await this.getProjects({ assignedLearner: learnerId, cohortId });
      const submissionsResult = await this.getSubmissions({ learnerId, cohortId });

      if (projectsResult.success && submissionsResult.success) {
        const projects = projectsResult.data || [];
        const submissions = submissionsResult.data || [];
        
        const averageScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length || 0;
        const completionRate = submissions.filter(s => s.status === 'graded' || s.status === 'approved').length / submissions.length || 0;

        return {
          success: true,
          data: {
            projects,
            submissions,
            averageScore,
            completionRate
          }
        };
      }

      return { success: false, error: 'Failed to fetch learner project progress' };
    } catch (error) {
      return { success: false, error: 'Failed to calculate learner project progress' };
    }
  }
} 