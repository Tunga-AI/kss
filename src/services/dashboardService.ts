import { FirestoreService } from './firestore';

export interface DashboardStats {
  totalStudents: number;
  activePrograms: number;
  upcomingEvents: number;
  monthlyRevenue: number;
  studentChange: string;
  programChange: string;
  eventChange: string;
  revenueChange: string;
}

export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'event' | 'payment' | 'staff' | 'communication';
  message: string;
  time: string;
  timestamp: Date;
}

export interface RevenueData {
  month: string;
  revenue: number;
  previousYear?: number;
}

export interface ProgramData {
  name: string;
  value: number;
  color: string;
}

export interface EnrollmentData {
  month: string;
  enrollments: number;
  target?: number;
}

export interface ActivityData {
  date: string;
  events: number;
  payments: number;
  enrollments: number;
}

export interface DashboardCharts {
  revenueData: RevenueData[];
  programData: ProgramData[];
  enrollmentData: EnrollmentData[];
  activityData: ActivityData[];
}

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      // Fetch data concurrently
      const [studentsResult, programsResult, eventsResult, learnersResult, eventRegistrationsResult] = await Promise.all([
        FirestoreService.getAll('students'),
        FirestoreService.getAll('programs'),
        FirestoreService.getAll('events'),
        FirestoreService.getAll('learners'),
        FirestoreService.getAll('event_registrations')
      ]);

      // Calculate total students (from both students and learners collections)
      const studentsCount = studentsResult.success ? (studentsResult.data?.length || 0) : 0;
      const learnersCount = learnersResult.success ? (learnersResult.data?.length || 0) : 0;
      const totalStudents = studentsCount + learnersCount;

      // Calculate active programs
      const programs = programsResult.success ? (programsResult.data || []) : [];
      const activePrograms = programs.filter((program: any) => program.status === 'active').length;

      // Calculate upcoming events
      const events = eventsResult.success ? (eventsResult.data || []) : [];
      const now = new Date();
      const upcomingEvents = events.filter((event: any) => {
        if (event.date && typeof event.date === 'object' && event.date.toDate) {
          return event.date.toDate() > now;
        }
        if (typeof event.date === 'string') {
          return new Date(event.date) > now;
        }
        return false;
      }).length;

      // Calculate monthly revenue from learners and event registrations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let monthlyRevenue = 0;

      // Revenue from learners
      const learners = learnersResult.success ? (learnersResult.data || []) : [];
      learners.forEach((learner: any) => {
        if (learner.paymentRecords && Array.isArray(learner.paymentRecords)) {
          learner.paymentRecords.forEach((payment: any) => {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
              monthlyRevenue += payment.amount || 0;
            }
          });
        }
      });

      // Revenue from event registrations
      const eventRegistrations = eventRegistrationsResult.success ? (eventRegistrationsResult.data || []) : [];
      eventRegistrations.forEach((registration: any) => {
        if (registration.paymentRecords && Array.isArray(registration.paymentRecords)) {
          registration.paymentRecords.forEach((payment: any) => {
            const paymentDate = new Date(payment.transactionDate);
            if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
              monthlyRevenue += payment.amount || 0;
            }
          });
        }
      });

      // Calculate changes (mock data for now - would need historical data for real calculation)
      const stats: DashboardStats = {
        totalStudents,
        activePrograms,
        upcomingEvents,
        monthlyRevenue,
        studentChange: totalStudents > 0 ? '+12%' : '0%',
        programChange: activePrograms > 0 ? `+${Math.min(activePrograms, 3)}` : '0',
        eventChange: upcomingEvents > 0 ? `+${Math.min(upcomingEvents, 5)}` : '0',
        revenueChange: monthlyRevenue > 0 ? '+8%' : '0%'
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' };
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 5): Promise<{ success: boolean; data?: RecentActivity[]; error?: string }> {
    try {
      const activities: RecentActivity[] = [];

      // Fetch recent data
      const [learnersResult, eventsResult, staffResult, eventRegistrationsResult] = await Promise.all([
        FirestoreService.getWithQuery('learners', [], 'createdAt', 3),
        FirestoreService.getWithQuery('events', [], 'createdAt', 3),
        FirestoreService.getWithQuery('staff', [], 'createdAt', 2),
        FirestoreService.getWithQuery('event_registrations', [], 'registrationDate', 3)
      ]);

      // Process recent learner enrollments
      if (learnersResult.success && learnersResult.data) {
        learnersResult.data.forEach((learner: any) => {
          if (learner.createdAt) {
            const timestamp = learner.createdAt.toDate ? learner.createdAt.toDate() : new Date(learner.createdAt);
            activities.push({
              id: `enrollment_${learner.id}`,
              type: 'enrollment',
              message: `${learner.fullName || learner.name} enrolled in ${learner.programTitle || 'a program'}`,
              time: this.getTimeAgo(timestamp),
              timestamp
            });
          }
        });
      }

      // Process recent events
      if (eventsResult.success && eventsResult.data) {
        eventsResult.data.forEach((event: any) => {
          if (event.createdAt) {
            const timestamp = event.createdAt.toDate ? event.createdAt.toDate() : new Date(event.createdAt);
            activities.push({
              id: `event_${event.id}`,
              type: 'event',
              message: `${event.title} scheduled for ${this.formatEventDate(event.date)}`,
              time: this.getTimeAgo(timestamp),
              timestamp
            });
          }
        });
      }

      // Process recent staff additions
      if (staffResult.success && staffResult.data) {
        staffResult.data.forEach((staff: any) => {
          if (staff.createdAt) {
            const timestamp = staff.createdAt.toDate ? staff.createdAt.toDate() : new Date(staff.createdAt);
            activities.push({
              id: `staff_${staff.id}`,
              type: 'staff',
              message: `${staff.fullName || staff.name} added to ${staff.department || 'staff'}`,
              time: this.getTimeAgo(timestamp),
              timestamp
            });
          }
        });
      }

      // Process recent payments from event registrations
      if (eventRegistrationsResult.success && eventRegistrationsResult.data) {
        eventRegistrationsResult.data.forEach((registration: any) => {
          if (registration.paymentRecords && registration.paymentRecords.length > 0) {
            const latestPayment = registration.paymentRecords[registration.paymentRecords.length - 1];
            const timestamp = new Date(latestPayment.transactionDate);
            activities.push({
              id: `payment_${registration.id}`,
              type: 'payment',
              message: `Payment received from ${registration.name} - $${latestPayment.amount}`,
              time: this.getTimeAgo(timestamp),
              timestamp
            });
          }
        });
      }

      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      return { success: true, data: sortedActivities };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch recent activities' };
    }
  }

  /**
   * Format event date for display
   */
  private static formatEventDate(date: any): string {
    if (!date) return 'TBD';
    
    let eventDate: Date;
    if (date.toDate) {
      eventDate = date.toDate();
    } else if (typeof date === 'string') {
      eventDate = new Date(date);
    } else {
      return 'TBD';
    }

    return eventDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get dashboard chart data
   */
  static async getDashboardCharts(): Promise<{ success: boolean; data?: DashboardCharts; error?: string }> {
    try {
      // Fetch chart data concurrently
      const [revenueData, programData, enrollmentData, activityData] = await Promise.all([
        this.getRevenueChartData(),
        this.getProgramChartData(),
        this.getEnrollmentChartData(),
        this.getActivityChartData()
      ]);

      const charts: DashboardCharts = {
        revenueData: revenueData.success ? revenueData.data || [] : [],
        programData: programData.success ? programData.data || [] : [],
        enrollmentData: enrollmentData.success ? enrollmentData.data || [] : [],
        activityData: activityData.success ? activityData.data || [] : []
      };

      return { success: true, data: charts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch chart data' };
    }
  }

  /**
   * Get revenue chart data (last 6 months)
   */
  private static async getRevenueChartData(): Promise<{ success: boolean; data?: RevenueData[]; error?: string }> {
    try {
      const [learnersResult, eventRegistrationsResult] = await Promise.all([
        FirestoreService.getAll('learners'),
        FirestoreService.getAll('event_registrations')
      ]);

      // Generate last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          monthNum: date.getMonth(),
          year: date.getFullYear()
        });
      }

      const revenueData: RevenueData[] = months.map(({ month, monthNum, year }) => {
        let monthRevenue = 0;

        // Calculate revenue from learners
        if (learnersResult.success && learnersResult.data) {
          learnersResult.data.forEach((learner: any) => {
            if (learner.paymentRecords && Array.isArray(learner.paymentRecords)) {
              learner.paymentRecords.forEach((payment: any) => {
                const paymentDate = new Date(payment.date);
                if (paymentDate.getMonth() === monthNum && paymentDate.getFullYear() === year) {
                  monthRevenue += payment.amount || 0;
                }
              });
            }
          });
        }

        // Calculate revenue from event registrations
        if (eventRegistrationsResult.success && eventRegistrationsResult.data) {
          eventRegistrationsResult.data.forEach((registration: any) => {
            if (registration.paymentRecords && Array.isArray(registration.paymentRecords)) {
              registration.paymentRecords.forEach((payment: any) => {
                const paymentDate = new Date(payment.transactionDate);
                if (paymentDate.getMonth() === monthNum && paymentDate.getFullYear() === year) {
                  monthRevenue += payment.amount || 0;
                }
              });
            }
          });
        }

        return {
          month,
          revenue: monthRevenue
        };
      });

      return { success: true, data: revenueData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch revenue data' };
    }
  }

  /**
   * Get program enrollment distribution
   */
  private static async getProgramChartData(): Promise<{ success: boolean; data?: ProgramData[]; error?: string }> {
    try {
      const [programsResult, learnersResult] = await Promise.all([
        FirestoreService.getAll('programs'),
        FirestoreService.getAll('learners')
      ]);

      const programs = programsResult.success ? (programsResult.data || []) : [];
      const learners = learnersResult.success ? (learnersResult.data || []) : [];

      // Count learners per program
      const programCounts: { [key: string]: { name: string; count: number } } = {};

      programs.forEach((program: any) => {
        programCounts[program.id] = {
          name: program.programName || program.title || 'Unnamed Program',
          count: 0
        };
      });

      learners.forEach((learner: any) => {
        if (learner.programId && programCounts[learner.programId]) {
          programCounts[learner.programId].count++;
        }
      });

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
      const programData: ProgramData[] = Object.values(programCounts)
        .filter(p => p.count > 0)
        .map((program, index) => ({
          name: program.name,
          value: program.count,
          color: colors[index % colors.length]
        }));

      // If no data, create sample data
      if (programData.length === 0) {
        programData.push(
          { name: 'No Programs', value: 1, color: '#E5E7EB' }
        );
      }

      return { success: true, data: programData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch program data' };
    }
  }

  /**
   * Get enrollment trends (last 6 months)
   */
  private static async getEnrollmentChartData(): Promise<{ success: boolean; data?: EnrollmentData[]; error?: string }> {
    try {
      const learnersResult = await FirestoreService.getAll('learners');
      const learners = learnersResult.success ? (learnersResult.data || []) : [];

      // Generate last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          monthNum: date.getMonth(),
          year: date.getFullYear()
        });
      }

      const enrollmentData: EnrollmentData[] = months.map(({ month, monthNum, year }) => {
        let monthEnrollments = 0;

        learners.forEach((learner: any) => {
          const enrollmentDate = learner.createdAt?.toDate ? learner.createdAt.toDate() : 
                                 learner.createdAt ? new Date(learner.createdAt) : null;
          if (enrollmentDate && 
              enrollmentDate.getMonth() === monthNum && 
              enrollmentDate.getFullYear() === year) {
            monthEnrollments++;
          }
        });

        return {
          month,
          enrollments: monthEnrollments,
          target: Math.max(monthEnrollments, 10) // Set a reasonable target
        };
      });

      return { success: true, data: enrollmentData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch enrollment data' };
    }
  }

  /**
   * Get activity trends (last 7 days)
   */
  private static async getActivityChartData(): Promise<{ success: boolean; data?: ActivityData[]; error?: string }> {
    try {
      const [learnersResult, eventsResult, eventRegistrationsResult] = await Promise.all([
        FirestoreService.getAll('learners'),
        FirestoreService.getAll('events'),
        FirestoreService.getAll('event_registrations')
      ]);

      // Generate last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateObj: new Date(date.getFullYear(), date.getMonth(), date.getDate())
        });
      }

      const learners = learnersResult.success ? (learnersResult.data || []) : [];
      const events = eventsResult.success ? (eventsResult.data || []) : [];
      const eventRegistrations = eventRegistrationsResult.success ? (eventRegistrationsResult.data || []) : [];

      const activityData: ActivityData[] = days.map(({ date, dateObj }) => {
        let dayEnrollments = 0;
        let dayEvents = 0;
        let dayPayments = 0;

        // Count enrollments
        learners.forEach((learner: any) => {
          const enrollmentDate = learner.createdAt?.toDate ? learner.createdAt.toDate() : 
                                 learner.createdAt ? new Date(learner.createdAt) : null;
          if (enrollmentDate && 
              enrollmentDate.toDateString() === dateObj.toDateString()) {
            dayEnrollments++;
          }
        });

        // Count events created
        events.forEach((event: any) => {
          const eventDate = event.createdAt?.toDate ? event.createdAt.toDate() : 
                           event.createdAt ? new Date(event.createdAt) : null;
          if (eventDate && 
              eventDate.toDateString() === dateObj.toDateString()) {
            dayEvents++;
          }
        });

        // Count payments
        eventRegistrations.forEach((registration: any) => {
          if (registration.paymentRecords && Array.isArray(registration.paymentRecords)) {
            registration.paymentRecords.forEach((payment: any) => {
              const paymentDate = new Date(payment.transactionDate);
              if (paymentDate.toDateString() === dateObj.toDateString()) {
                dayPayments++;
              }
            });
          }
        });

        return {
          date,
          enrollments: dayEnrollments,
          events: dayEvents,
          payments: dayPayments
        };
      });

      return { success: true, data: activityData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch activity data' };
    }
  }

  /**
   * Calculate time ago from timestamp
   */
  private static getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }
}