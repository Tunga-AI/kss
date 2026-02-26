'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, UserPlus, Calendar, TrendingUp, ShieldCheck, Activity, Target, RefreshCw, Tag, GraduationCap, Clock, ArrowRight, Settings, FileText, BarChart3, UserCog, Briefcase, MessageSquare } from "lucide-react";
import { useFirestore, useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Learner } from '@/lib/learners-types';
import type { Program } from '@/lib/program-types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const usersFirestore = useUsersFirestore();

  const learnersQuery = useMemo(() => {
    if (!usersFirestore) return null;
    return query(collection(usersFirestore, 'learners'));
  }, [usersFirestore]);

  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const admissionsQuery = useMemo(() => {
    if (!usersFirestore) return null;
    return query(collection(usersFirestore, 'admissions'));
  }, [usersFirestore]);

  const transactionsQuery = useMemo(() => {
    if (!usersFirestore) return null;
    return query(collection(usersFirestore, 'transactions'));
  }, [usersFirestore]);

  const classroomQuery = useMemo(() => {
    if (!usersFirestore) return null;
    return query(collection(usersFirestore, 'classroom'), limit(5));
  }, [usersFirestore]);

  const cohortsQuery = useMemo(() => {
    if (!usersFirestore) return null;
    return query(collection(usersFirestore, 'cohorts'), limit(3));
  }, [usersFirestore]);

  const { data: learners, loading: learnersLoading } = useCollection<Learner>(learnersQuery as any);
  const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);
  const { data: admissions, loading: admissionsLoading } = useCollection<any>(admissionsQuery as any);
  const { data: transactions, loading: transactionsLoading } = useCollection<any>(transactionsQuery as any);
  const { data: classroomSessions, loading: classroomLoading } = useCollection<any>(classroomQuery as any);
  const { data: cohorts, loading: cohortsLoading } = useCollection<any>(cohortsQuery as any);

  const stats = useMemo(() => {
    if (!learners || !programs || !admissions || !transactions) return {
      totalLearners: 0,
      newSignups: 0,
      totalCourses: 0,
      upcomingEvents: 0,
      totalRevenue: 0,
      pendingAdmissions: 0,
      activePrograms: 0,
      completionRate: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSignups = learners.filter(learner => learner.joinedDate && new Date(learner.joinedDate) > thirtyDaysAgo).length;

    const totalCourses = programs.filter(p => p.programType !== 'Event').length;
    const upcomingEvents = programs.filter(p => p.programType === 'Event' && (p as any).date && new Date((p as any).date) > new Date()).length;

    const successTxs = transactions.filter((t: any) => t.status === 'Success');
    const admissionTotal = successTxs.filter(t => String(t.paymentType ?? '').toLowerCase() === 'admission').reduce((s, t) => s + (t.amount || 0), 0);
    const tuitionTotal = successTxs.filter(t => !t.paymentType || String(t.paymentType).toLowerCase() === 'tuition').reduce((s, t) => s + (t.amount || 0), 0);
    const totalRevenue = admissionTotal + tuitionTotal;

    const pendingAdmissions = admissions.filter((a: any) => a.status === 'Pending').length;

    return {
      totalLearners: learners.length,
      newSignups,
      totalCourses,
      upcomingEvents,
      totalRevenue,
      pendingAdmissions,
      activePrograms: programs.length,
      completionRate: 78
    };
  }, [learners, programs, admissions, transactions]);

  // ── Real chart data from Firestore ──────────────────────────────────────

  // Learner growth: count signups per month for last 6 months
  const learnerGrowthData = useMemo(() => {
    if (!learners) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const count = learners.filter(l => {
        const joined = (l as any).joinedDate || (l as any).createdAt;
        if (!joined) return false;
        const date = joined?.toDate ? joined.toDate() : new Date(joined);
        return date >= d && date < nextMonth;
      }).length;
      return { month: d.toLocaleDateString('en-US', { month: 'short' }), learners: count };
    });
  }, [learners]);

  // Revenue: sum successful transactions per month for last 6 months
  const revenueData = useMemo(() => {
    if (!transactions) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const revenue = transactions
        .filter((t: any) => {
          if (t.status !== 'Success') return false;
          if (!t.date) return false;
          const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
          return date >= d && date < nextMonth;
        })
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      return { month: d.toLocaleDateString('en-US', { month: 'short' }), revenue };
    });
  }, [transactions]);

  // Program distribution by type
  const programDistribution = useMemo(() => {
    if (!programs) return [];
    const types = ['Core', 'Short', 'E-Learning', 'Event'];
    return types
      .map(type => ({ name: type, value: programs.filter(p => p.programType === type).length }))
      .filter(d => d.value > 0);
  }, [programs]);

  // Real month-over-month trends
  const trends = useMemo(() => {
    if (!transactions || !learners) return { revenue: '+0%', learners: '+0', newSignups: '+0%', programs: String(programs?.length ?? 0) };
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthRevenue = transactions
      .filter((t: any) => t.status === 'Success' && t.date?.toDate && t.date.toDate() >= thisMonthStart)
      .reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const lastMonthRevenue = transactions
      .filter((t: any) => t.status === 'Success' && t.date?.toDate && t.date.toDate() >= lastMonthStart && t.date.toDate() < thisMonthStart)
      .reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const revPct = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    const thisMonthLearners = learners.filter(l => {
      const joined = (l as any).joinedDate || (l as any).createdAt;
      if (!joined) return false;
      const d = joined?.toDate ? joined.toDate() : new Date(joined);
      return d >= thisMonthStart;
    }).length;
    const lastMonthLearners = learners.filter(l => {
      const joined = (l as any).joinedDate || (l as any).createdAt;
      if (!joined) return false;
      const d = joined?.toDate ? joined.toDate() : new Date(joined);
      return d >= lastMonthStart && d < thisMonthStart;
    }).length;
    const learnerPct = lastMonthLearners > 0 ? Math.round(((thisMonthLearners - lastMonthLearners) / lastMonthLearners) * 100) : 0;

    return {
      revenue: revPct >= 0 ? `+${revPct}%` : `${revPct}%`,
      learners: learnerPct >= 0 ? `+${learnerPct}%` : `${learnerPct}%`,
      newSignups: thisMonthLearners > 0 ? `+${thisMonthLearners} this month` : 'None this month',
      programs: `${programs?.length ?? 0} total`,
    };
  }, [transactions, learners, programs]);

  const loading = learnersLoading || programsLoading || admissionsLoading || transactionsLoading;

  if (loading && !learners) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
      <div className="w-full">
        {/* Admin Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Executive Terminal</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Global operations oversight and institute metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-400" /> Live
                </p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">System Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 mt-6">
          <DashboardStatCard
            title="Total Learners"
            value={stats.totalLearners}
            icon={Users}
            trend={trends.learners}
            description="All registered students"
            chartData={learnerGrowthData}
            chartType="area"
          />
          <DashboardStatCard
            title="Total Revenue"
            value={`KES ${stats.totalRevenue >= 1000000 ? (stats.totalRevenue / 1000000).toFixed(1) + 'M' : (stats.totalRevenue / 1000).toFixed(0) + 'K'}`}
            icon={Tag}
            trend={trends.revenue}
            description="Verified payments only"
            chartData={revenueData}
            chartType="bar"
          />
          <DashboardStatCard
            title="Total Programs"
            value={stats.activePrograms}
            icon={GraduationCap}
            trend={trends.programs}
            description="All active courses"
            chartData={programDistribution}
            chartType="line"
          />
          <DashboardStatCard
            title="New Signups (30d)"
            value={stats.newSignups}
            icon={UserPlus}
            trend={trends.newSignups}
            description="Recent registrations"
            highlight
            chartData={learnerGrowthData.slice(-4)}
            chartType="area"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Learner Growth Trend
              </CardTitle>
              <CardDescription>Last 6 months enrollment trajectory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={learnerGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="learners" stroke="#0066cc" fill="#0066cc" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Tag className="h-5 w-5 text-accent" />
                Revenue Performance
              </CardTitle>
              <CardDescription>Monthly revenue breakdown (KES)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#ff6b35" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links and Upcoming Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickLinkButton href="/a/learners" icon={Users} label="Manage Learners" />
                <QuickLinkButton href="/a/programs" icon={BookOpen} label="Manage Programs" />
                <QuickLinkButton href="/a/admissions" icon={UserCog} label="Review Admissions" badge={stats.pendingAdmissions} />
                <QuickLinkButton href="/a/classroom" icon={GraduationCap} label="Classroom Sessions" />
                <QuickLinkButton href="/a/finance" icon={Tag} label="Financial Reports" />
                <QuickLinkButton href="/a/settings" icon={Settings} label="System Settings" />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Upcoming Intakes
                </CardTitle>
                <CardDescription>Next cohort start dates</CardDescription>
              </CardHeader>
              <CardContent>
                {cohortsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : cohorts && cohorts.length > 0 ? (
                  <div className="space-y-3">
                    {cohorts.slice(0, 3).map((cohort: any) => (
                      <div key={cohort.id} className="p-3 border border-primary/10 rounded-tl-xl rounded-br-xl hover:bg-primary/5 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-primary text-sm">{cohort.name}</p>
                            <p className="text-xs text-primary/60">{cohort.program}</p>
                          </div>
                          <Badge className="bg-accent/10 text-accent text-xs">
                            {cohort.startDate && new Date(cohort.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-primary/40 py-8 text-sm">No upcoming intakes</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>Latest classroom activities</CardDescription>
              </CardHeader>
              <CardContent>
                {classroomLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : classroomSessions && classroomSessions.length > 0 ? (
                  <div className="space-y-3">
                    {classroomSessions.slice(0, 3).map((session: any) => (
                      <div key={session.id} className="p-3 border border-primary/10 rounded-tl-xl rounded-br-xl hover:bg-primary/5 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-primary text-sm line-clamp-1">{session.title}</p>
                            <p className="text-xs text-primary/60">{session.facilitator}</p>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            session.status === 'Completed' ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                          )}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-primary/40 py-8 text-sm">No recent sessions</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New Leads Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" />
                New Leads
              </CardTitle>
              <CardDescription>Recent prospective students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {admissions && admissions.filter((a: any) => a.status === 'Pending').slice(0, 5).map((admission: any) => (
                  <div key={admission.id} className="p-3 border border-primary/10 rounded-tl-xl rounded-br-xl hover:bg-primary/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary text-sm">{admission.learnerName || 'Unknown'}</p>
                        <p className="text-xs text-primary/60">{admission.program || 'N/A'}</p>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-600 text-xs">
                        {admission.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!admissions || admissions.filter((a: any) => a.status === 'Pending').length === 0) && (
                  <p className="text-center text-primary/40 py-8 text-sm">No new leads</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Admissions by Status
              </CardTitle>
              <CardDescription>Current pipeline overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Pending', 'Approved', 'Rejected'].map((status) => {
                  const count = admissions?.filter((a: any) => a.status === status).length || 0;
                  const total = admissions?.length || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-primary">{status}</span>
                        <span className="text-xs text-primary/60">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-primary/5 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            status === 'Pending' ? "bg-blue-500" : status === 'Approved' ? "bg-green-500" : "bg-red-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardStatCard({ title, value, icon: Icon, trend, description, highlight = false, chartData = [], chartType = 'line' }: any) {
  return (
    <div className={cn(
      "p-6 border rounded-tl-2xl rounded-br-2xl shadow-lg transition-all hover:scale-105 cursor-pointer overflow-hidden",
      highlight ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <Icon className={cn(
          "h-6 w-6",
          highlight ? "text-accent" : "text-accent"
        )} />
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm",
          highlight ? "bg-accent text-white" : "bg-green-500/10 text-green-500"
        )}>
          {trend}
        </span>
      </div>

      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-1 opacity-60")}>{title}</h3>
      <p className="text-3xl font-black mb-2 tracking-tighter">{value}</p>
      <p className={cn("text-[9px] font-medium leading-relaxed opacity-40 uppercase tracking-wide mb-3")}>{description}</p>

      {/* Inline mini chart */}
      {chartData && chartData.length > 0 && (
        <div className="h-16 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <Area
                  type="monotone"
                  dataKey={chartData[0]?.learners !== undefined ? "learners" : "value"}
                  stroke={highlight ? "#ffffff" : "#0066cc"}
                  fill={highlight ? "#ffffff" : "#0066cc"}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <Bar
                  dataKey={chartData[0]?.revenue !== undefined ? "revenue" : "value"}
                  fill={highlight ? "#ffffff" : "#ff6b35"}
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey={chartData[0]?.value !== undefined ? "value" : chartData[0]?.learners !== undefined ? "learners" : "revenue"}
                  stroke={highlight ? "#ffffff" : "#0066cc"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function QuickLinkButton({ href, icon: Icon, label, badge }: { href: string, icon: any, label: string, badge?: number }) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start h-auto py-3 px-4 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-tl-lg rounded-br-lg group transition-all"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 flex items-center justify-center bg-primary/5 rounded-lg text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-bold text-sm text-primary flex-1 text-left">{label}</span>
          {badge !== undefined && badge > 0 && (
            <Badge className="bg-accent text-white">{badge}</Badge>
          )}
          <ArrowRight className="h-4 w-4 text-primary/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </div>
      </Button>
    </Link>
  )
}

function HealthMetric({ label, value, status }: { label: string, value: string, status: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
      <Badge className="bg-accent/20 text-accent border-none text-[8px] uppercase font-black px-2 shadow-sm">
        {status}
      </Badge>
    </div>
  )
}
