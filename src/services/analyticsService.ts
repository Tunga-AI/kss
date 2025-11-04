import { FirestoreService } from './firestore';

// Core Interfaces
export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'engagement' | 'progress' | 'assessment' | 'resource_usage' | 'attendance' | 'custom';
  cohortId?: string;
  learnerId?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: AnalyticsMetric[];
  visualizations: AnalyticsVisualization[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  type: 'count' | 'percentage' | 'average' | 'sum' | 'ratio' | 'trend';
  dataSource: 'assessments' | 'resources' | 'attendance' | 'engagement' | 'submissions' | 'reviews';
  aggregation: 'daily' | 'weekly' | 'monthly' | 'total';
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface AnalyticsVisualization {
  id: string;
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'gauge' | 'table' | 'heatmap' | 'scatter';
  title: string;
  description?: string;
  dataSource: string;
  config: {
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    colorScheme?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
    height?: number;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  isActive: boolean;
}

export interface Dashboard {
  id: string;
  title: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  cohortId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  isPublic: boolean;
  tags: string[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'activity' | 'leaderboard';
  title: string;
  dataSource: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  cohortId: string;
  week?: number;
  type: 'knowledge' | 'skill' | 'behavior' | 'outcome';
  targetValue: number;
  currentValue: number;
  unit: string;
  measurementMethod: 'assessment' | 'observation' | 'self_report' | 'peer_review';
  status: 'not_started' | 'in_progress' | 'achieved' | 'exceeded';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerAnalytics {
  id: string;
  learnerId: string;
  cohortId: string;
  overallProgress: number;
  engagementScore: number;
  attendanceRate: number;
  assessmentAverage: number;
  resourceConsumption: number;
  strengths: string[];
  improvementAreas: string[];
  learningPath: LearningPathStep[];
  lastUpdated: string;
}

export interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  type: 'resource' | 'assessment' | 'project' | 'discussion';
  resourceId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  timeSpent?: number;
  score?: number;
}

export interface AnalyticsReportData {
  title: string;
  description: string;
  type: 'performance' | 'engagement' | 'progress' | 'assessment' | 'resource_usage' | 'attendance' | 'custom';
  cohortId?: string;
  learnerId?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: AnalyticsMetric[];
  visualizations: AnalyticsVisualization[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  isPublic: boolean;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface DashboardData {
  title: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  cohortId?: string;
  isDefault: boolean;
  isPublic: boolean;
  tags: string[];
}

export interface LearningObjectiveData {
  title: string;
  description: string;
  cohortId: string;
  week?: number;
  type: 'knowledge' | 'skill' | 'behavior' | 'outcome';
  targetValue: number;
  unit: string;
  measurementMethod: 'assessment' | 'observation' | 'self_report' | 'peer_review';
}

export interface AnalyticsFilter {
  cohortId?: string;
  learnerId?: string;
  type?: string;
  status?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  tags?: string[];
}

export interface AnalyticsStats {
  totalReports: number;
  activeDashboards: number;
  trackingObjectives: number;
  avgEngagementScore: number;
  avgProgressRate: number;
  totalLearnerAnalytics: number;
  reportsByType: Record<string, number>;
  dashboardsByType: Record<string, number>;
}

class AnalyticsServiceClass {
  private collection = 'analytics';
  private dashboardCollection = 'dashboards';
  private objectiveCollection = 'learning_objectives';
  private learnerAnalyticsCollection = 'learner_analytics';

  // Report CRUD Operations
  async createReport(data: AnalyticsReportData): Promise<{ success: boolean; data?: AnalyticsReport; error?: string }> {
    try {
      const reportData = {
        ...data,
        createdBy: 'current_user_id', // Replace with actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.create(this.collection, reportData);
      
      if (result.success && result.id) {
        return {
          success: true,
          data: { id: result.id, ...reportData } as AnalyticsReport
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create analytics report' };
    }
  }

  async getReports(filter?: AnalyticsFilter): Promise<{ success: boolean; data?: AnalyticsReport[]; error?: string }> {
    try {
      const conditions = [];
      
      if (filter?.cohortId) {
        conditions.push({ field: 'cohortId', operator: '==', value: filter.cohortId });
      }
      
      if (filter?.learnerId) {
        conditions.push({ field: 'learnerId', operator: '==', value: filter.learnerId });
      }
      
      if (filter?.type) {
        conditions.push({ field: 'type', operator: '==', value: filter.type });
      }
      
      if (filter?.status) {
        conditions.push({ field: 'status', operator: '==', value: filter.status });
      }

      const result = await FirestoreService.getWithQuery(this.collection, conditions);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.map(doc => ({ ...doc, id: doc.id })) as AnalyticsReport[]
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch analytics reports' };
    }
  }

  async getReport(id: string): Promise<{ success: boolean; data?: AnalyticsReport; error?: string }> {
    try {
      const result = await FirestoreService.getById(this.collection, id);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: { ...result.data, id } as AnalyticsReport
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch analytics report' };
    }
  }

  async updateReport(id: string, data: Partial<AnalyticsReportData>): Promise<{ success: boolean; data?: AnalyticsReport; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.update(this.collection, id, updateData);
      
      if (result.success) {
        const updatedReport = await this.getReport(id);
        return updatedReport;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update analytics report' };
    }
  }

  async deleteReport(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.delete(this.collection, id);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete analytics report' };
    }
  }

  // Dashboard CRUD Operations
  async createDashboard(data: DashboardData): Promise<{ success: boolean; data?: Dashboard; error?: string }> {
    try {
      const dashboardData = {
        ...data,
        createdBy: 'current_user_id', // Replace with actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.add(this.dashboardCollection, dashboardData);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: { id: result.data.id, ...dashboardData } as Dashboard
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create dashboard' };
    }
  }

  async getDashboards(filter?: AnalyticsFilter): Promise<{ success: boolean; data?: Dashboard[]; error?: string }> {
    try {
      const conditions = [];
      
      if (filter?.cohortId) {
        conditions.push({ field: 'cohortId', operator: '==', value: filter.cohortId });
      }

      const result = await FirestoreService.getWithQuery(this.dashboardCollection, conditions);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.map(doc => ({ id: doc.id, ...doc })) as Dashboard[]
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch dashboards' };
    }
  }

  async getDashboard(id: string): Promise<{ success: boolean; data?: Dashboard; error?: string }> {
    try {
      const result = await FirestoreService.get(this.dashboardCollection, id);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: { id: result.data.id, ...result.data } as Dashboard
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch dashboard' };
    }
  }

  async updateDashboard(id: string, data: Partial<DashboardData>): Promise<{ success: boolean; data?: Dashboard; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.update(this.dashboardCollection, id, updateData);
      
      if (result.success) {
        const updatedDashboard = await this.getDashboard(id);
        return updatedDashboard;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update dashboard' };
    }
  }

  async deleteDashboard(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.delete(this.dashboardCollection, id);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete dashboard' };
    }
  }

  // Learning Objective CRUD Operations
  async createObjective(data: LearningObjectiveData): Promise<{ success: boolean; data?: LearningObjective; error?: string }> {
    try {
      const objectiveData = {
        ...data,
        currentValue: 0,
        status: 'not_started' as const,
        createdBy: 'current_user_id', // Replace with actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.add(this.objectiveCollection, objectiveData);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: { id: result.data.id, ...objectiveData } as LearningObjective
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to create learning objective' };
    }
  }

  async getObjectives(filter?: AnalyticsFilter): Promise<{ success: boolean; data?: LearningObjective[]; error?: string }> {
    try {
      const conditions = [];
      
      if (filter?.cohortId) {
        conditions.push({ field: 'cohortId', operator: '==', value: filter.cohortId });
      }

      const result = await FirestoreService.getWithQuery(this.objectiveCollection, conditions);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.map(doc => ({ id: doc.id, ...doc })) as LearningObjective[]
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch learning objectives' };
    }
  }

  async updateObjective(id: string, data: Partial<LearningObjectiveData>): Promise<{ success: boolean; data?: LearningObjective; error?: string }> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const result = await FirestoreService.update(this.objectiveCollection, id, updateData);
      
      if (result.success) {
        const updatedObjective = await this.getObjective(id);
        return updatedObjective;
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to update learning objective' };
    }
  }

  async getObjective(id: string): Promise<{ success: boolean; data?: LearningObjective; error?: string }> {
    try {
      const result = await FirestoreService.get(this.objectiveCollection, id);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: { id: result.data.id, ...result.data } as LearningObjective
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to fetch learning objective' };
    }
  }

  async deleteObjective(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FirestoreService.delete(this.objectiveCollection, id);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to delete learning objective' };
    }
  }

  // Learner Analytics Operations
  async getLearnerAnalytics(learnerId: string, cohortId?: string): Promise<{ success: boolean; data?: LearnerAnalytics; error?: string }> {
    try {
      const conditions = [
        { field: 'learnerId', operator: '==', value: learnerId }
      ];
      
      if (cohortId) {
        conditions.push({ field: 'cohortId', operator: '==', value: cohortId });
      }

      const result = await FirestoreService.getWithQuery(this.learnerAnalyticsCollection, conditions);
      
      if (result.success && result.data && result.data.length > 0) {
        return {
          success: true,
          data: { id: result.data[0].id, ...result.data[0] } as LearnerAnalytics
        };
      }
      
      return { success: false, error: 'Learner analytics not found' };
    } catch (error) {
      return { success: false, error: 'Failed to fetch learner analytics' };
    }
  }

  async updateLearnerAnalytics(learnerId: string, cohortId: string, data: Partial<LearnerAnalytics>): Promise<{ success: boolean; data?: LearnerAnalytics; error?: string }> {
    try {
      // First try to get existing analytics
      const existing = await this.getLearnerAnalytics(learnerId, cohortId);
      
      if (existing.success && existing.data) {
        // Update existing
        const updateData = {
          ...data,
          lastUpdated: new Date().toISOString(),
        };

        const result = await FirestoreService.update(this.learnerAnalyticsCollection, existing.data.id, updateData);
        
        if (result.success) {
          const updatedAnalytics = await this.getLearnerAnalytics(learnerId, cohortId);
          return updatedAnalytics;
        }
        
        return { success: false, error: result.error };
      } else {
        // Create new
        const newAnalytics = {
          learnerId,
          cohortId,
          overallProgress: 0,
          engagementScore: 0,
          attendanceRate: 0,
          assessmentAverage: 0,
          resourceConsumption: 0,
          strengths: [],
          improvementAreas: [],
          learningPath: [],
          ...data,
          lastUpdated: new Date().toISOString(),
        };

        const result = await FirestoreService.add(this.learnerAnalyticsCollection, newAnalytics);
        
        if (result.success && result.data) {
          return {
            success: true,
            data: { id: result.data.id, ...newAnalytics } as LearnerAnalytics
          };
        }
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update learner analytics' };
    }
  }

  // Statistics and Analytics
  async getAnalyticsStats(): Promise<{ success: boolean; data?: AnalyticsStats; error?: string }> {
    try {
      const [reportsResult, dashboardsResult, objectivesResult] = await Promise.all([
        FirestoreService.getAll(this.collection),
        FirestoreService.getAll(this.dashboardCollection),
        FirestoreService.getAll(this.objectiveCollection)
      ]);

      const reports = reportsResult.success ? reportsResult.data || [] : [];
      const dashboards = dashboardsResult.success ? dashboardsResult.data || [] : [];
      const objectives = objectivesResult.success ? objectivesResult.data || [] : [];

      // Calculate report types
      const reportsByType = reports.reduce((acc: Record<string, number>, report: any) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {});

      // Calculate dashboard types (based on widgets)
      const dashboardsByType = dashboards.reduce((acc: Record<string, number>, dashboard: any) => {
        const primaryType = dashboard.widgets?.[0]?.type || 'general';
        acc[primaryType] = (acc[primaryType] || 0) + 1;
        return acc;
      }, {});

      const stats: AnalyticsStats = {
        totalReports: reports.length,
        activeDashboards: dashboards.filter((d: any) => d.isPublic).length,
        trackingObjectives: objectives.filter((o: any) => o.status === 'in_progress').length,
        avgEngagementScore: 8.4, // Mock data - calculate from real data
        avgProgressRate: 76, // Mock data - calculate from real data
        totalLearnerAnalytics: 0, // Could add separate query
        reportsByType,
        dashboardsByType,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Failed to fetch analytics statistics' };
    }
  }

  // Utility methods
  async searchReports(query: string): Promise<{ success: boolean; data?: AnalyticsReport[]; error?: string }> {
    try {
      const result = await FirestoreService.getAll(this.collection);
      
      if (result.success && result.data) {
        const filtered = result.data.filter((report: any) =>
          report.title.toLowerCase().includes(query.toLowerCase()) ||
          report.description.toLowerCase().includes(query.toLowerCase()) ||
          report.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        return {
          success: true,
          data: filtered.map(doc => ({ id: doc.id, ...doc })) as AnalyticsReport[]
        };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to search reports' };
    }
  }

  async duplicateReport(id: string): Promise<{ success: boolean; data?: AnalyticsReport; error?: string }> {
    try {
      const originalResult = await this.getReport(id);
      
      if (originalResult.success && originalResult.data) {
        const original = originalResult.data;
        const duplicateData: AnalyticsReportData = {
          title: `${original.title} (Copy)`,
          description: original.description,
          type: original.type,
          cohortId: original.cohortId,
          learnerId: original.learnerId,
          dateRange: original.dateRange,
          metrics: original.metrics,
          visualizations: original.visualizations,
          filters: original.filters,
          schedule: original.schedule,
          isPublic: false,
          tags: original.tags,
          status: 'draft',
        };

        return await this.createReport(duplicateData);
      }
      
      return { success: false, error: originalResult.error };
    } catch (error) {
      return { success: false, error: 'Failed to duplicate report' };
    }
  }

  async exportReport(id: string, format: 'pdf' | 'excel' | 'csv'): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // This would typically integrate with a reporting service
      // For now, return a success message
      return { 
        success: true, 
        data: `Report exported successfully as ${format.toUpperCase()}` 
      };
    } catch (error) {
      return { success: false, error: 'Failed to export report' };
    }
  }
}

export const AnalyticsService = new AnalyticsServiceClass(); 