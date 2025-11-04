import { FirestoreService } from './firestore';

export interface JobApplication {
  id?: string;
  jobId: string;
  learnerId: string;
  learnerEmail: string;
  learnerName: string;
  applicationDate: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'rejected' | 'accepted';
  coverLetter?: string;
  notes?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  profileData?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    workExperience: any[];
    education: any[];
    skills: string[];
    certifications: string[];
    languages: string[];
    currentJobTitle?: string;
    currentOrganisation?: string;
    salesExperience?: string;
    keyAchievements?: string;
    learningGoals?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationData {
  jobId: string;
  coverLetter?: string;
  additionalNotes?: string;
}

export class JobApplicationService {
  
  /**
   * Create a new job application using learner's profile data
   */
  static async createApplication(
    learnerId: string,
    learnerEmail: string,
    learnerName: string,
    applicationData: JobApplicationData,
    profileData: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check if user has already applied for this job
      const existingApplication = await this.checkExistingApplication(learnerId, applicationData.jobId);
      
      if (existingApplication.success && existingApplication.data) {
        return {
          success: false,
          error: 'You have already applied for this job'
        };
      }

      // Create the application
      const application: JobApplication = {
        jobId: applicationData.jobId,
        learnerId,
        learnerEmail,
        learnerName,
        applicationDate: new Date().toISOString(),
        status: 'pending',
        coverLetter: applicationData.coverLetter || '',
        notes: applicationData.additionalNotes || '',
        profileData: {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || learnerEmail,
          phoneNumber: profileData.phoneNumber || '',
          workExperience: profileData.workExperience || [],
          education: profileData.education || [],
          skills: profileData.skills || [],
          certifications: profileData.certifications || [],
          languages: profileData.languages || [],
          currentJobTitle: profileData.currentJobTitle || '',
          currentOrganisation: profileData.currentOrganisation || '',
          salesExperience: profileData.salesExperience || '',
          keyAchievements: profileData.keyAchievements || '',
          learningGoals: profileData.learningGoals || ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await FirestoreService.create('jobApplications', application);
      
      if (result.success) {
        // Update job application count
        await this.updateJobApplicationCount(applicationData.jobId);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating job application:', error);
      return {
        success: false,
        error: 'Failed to submit application'
      };
    }
  }

  /**
   * Check if a learner has already applied for a specific job
   */
  static async checkExistingApplication(
    learnerId: string,
    jobId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('jobApplications', [
        { field: 'learnerId', operator: '==', value: learnerId },
        { field: 'jobId', operator: '==', value: jobId }
      ]);
      
      return {
        success: true,
        data: result.success && result.data && result.data.length > 0 ? result.data[0] : null
      };
    } catch (error) {
      console.error('Error checking existing application:', error);
      return {
        success: false,
        error: 'Failed to check existing application'
      };
    }
  }

  /**
   * Get all applications for a specific learner
   */
  static async getLearnerApplications(
    learnerId: string
  ): Promise<{ success: boolean; data?: JobApplication[]; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('jobApplications', [
        { field: 'learnerId', operator: '==', value: learnerId }
      ]);
      
      if (result.success && result.data) {
        // Sort by application date, newest first
        const applications = (result.data as JobApplication[]).sort((a, b) => 
          new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        );
        
        return {
          success: true,
          data: applications
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error getting learner applications:', error);
      return {
        success: false,
        error: 'Failed to load applications'
      };
    }
  }

  /**
   * Get all applications for a specific job
   */
  static async getJobApplications(
    jobId: string
  ): Promise<{ success: boolean; data?: JobApplication[]; error?: string }> {
    try {
      const result = await FirestoreService.getWithQuery('jobApplications', [
        { field: 'jobId', operator: '==', value: jobId }
      ]);
      
      if (result.success && result.data) {
        // Sort by application date, newest first
        const applications = (result.data as JobApplication[]).sort((a, b) => 
          new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        );
        
        return {
          success: true,
          data: applications
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error getting job applications:', error);
      return {
        success: false,
        error: 'Failed to load job applications'
      };
    }
  }

  /**
   * Update application status
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: JobApplication['status'],
    notes?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      const result = await FirestoreService.update('jobApplications', applicationId, updateData);
      return result;
    } catch (error) {
      console.error('Error updating application status:', error);
      return {
        success: false,
        error: 'Failed to update application status'
      };
    }
  }

  /**
   * Update job application count
   */
  private static async updateJobApplicationCount(jobId: string): Promise<void> {
    try {
      const applicationsResult = await this.getJobApplications(jobId);
      
      if (applicationsResult.success && applicationsResult.data) {
        const count = applicationsResult.data.length;
        await FirestoreService.update('jobs', jobId, { 
          applicationsCount: count,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating job application count:', error);
    }
  }

  /**
   * Get learner profile data for job application
   */
  static async getLearnerProfileData(
    learnerEmail: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // First try to get from learners collection
      const learnerResult = await FirestoreService.getWithQuery('learners', [
        { field: 'email', operator: '==', value: learnerEmail }
      ]);
      
      if (learnerResult.success && learnerResult.data && learnerResult.data.length > 0) {
        return {
          success: true,
          data: learnerResult.data[0]
        };
      }
      
      // If not found in learners, try users collection
      const userResult = await FirestoreService.getWithQuery('users', [
        { field: 'email', operator: '==', value: learnerEmail }
      ]);
      
      if (userResult.success && userResult.data && userResult.data.length > 0) {
        return {
          success: true,
          data: userResult.data[0]
        };
      }
      
      return {
        success: false,
        error: 'Profile data not found'
      };
    } catch (error) {
      console.error('Error getting learner profile data:', error);
      return {
        success: false,
        error: 'Failed to load profile data'
      };
    }
  }

  /**
   * Delete an application
   */
  static async deleteApplication(
    applicationId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await FirestoreService.delete('jobApplications', applicationId);
      return result;
    } catch (error) {
      console.error('Error deleting application:', error);
      return {
        success: false,
        error: 'Failed to delete application'
      };
    }
  }

  /**
   * Get application statistics for admin dashboard
   */
  static async getApplicationStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await FirestoreService.getAll('jobApplications');
      
      if (result.success && result.data) {
        const applications = result.data as JobApplication[];
        
        const stats = {
          total: applications.length,
          pending: applications.filter(app => app.status === 'pending').length,
          reviewed: applications.filter(app => app.status === 'reviewed').length,
          shortlisted: applications.filter(app => app.status === 'shortlisted').length,
          interviewed: applications.filter(app => app.status === 'interviewed').length,
          accepted: applications.filter(app => app.status === 'accepted').length,
          rejected: applications.filter(app => app.status === 'rejected').length,
          thisWeek: applications.filter(app => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(app.applicationDate) > weekAgo;
          }).length,
          thisMonth: applications.filter(app => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(app.applicationDate) > monthAgo;
          }).length
        };
        
        return {
          success: true,
          data: stats
        };
      }
      
      return {
        success: true,
        data: {
          total: 0,
          pending: 0,
          reviewed: 0,
          shortlisted: 0,
          interviewed: 0,
          accepted: 0,
          rejected: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      };
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        success: false,
        error: 'Failed to load application statistics'
      };
    }
  }
}

export default JobApplicationService; 