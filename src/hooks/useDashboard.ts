import { useState, useEffect } from 'react';
import { DashboardService, DashboardStats, RecentActivity, DashboardCharts } from '../services/dashboardService';

interface UseDashboardReturn {
  stats: DashboardStats | null;
  activities: RecentActivity[];
  charts: DashboardCharts | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats, activities, and charts concurrently
      const [statsResult, activitiesResult, chartsResult] = await Promise.all([
        DashboardService.getDashboardStats(),
        DashboardService.getRecentActivities(5),
        DashboardService.getDashboardCharts()
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        throw new Error(statsResult.error || 'Failed to fetch dashboard stats');
      }

      if (activitiesResult.success && activitiesResult.data) {
        setActivities(activitiesResult.data);
      } else {
        // Don't throw error for activities, just log it
        console.warn('Failed to fetch activities:', activitiesResult.error);
        setActivities([]);
      }

      if (chartsResult.success && chartsResult.data) {
        setCharts(chartsResult.data);
      } else {
        // Don't throw error for charts, just log it
        console.warn('Failed to fetch charts:', chartsResult.error);
        setCharts(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    activities,
    charts,
    loading,
    error,
    refetch
  };
};