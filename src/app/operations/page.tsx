'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Calendar, BookOpen, RefreshCw, Target, ArrowRight, Clock, TrendingUp, UserCheck, AlertCircle } from "lucide-react";
import type { Learner } from '@/lib/learners-types';
import type { Program } from '@/lib/program-types';
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area } from "recharts";
import { format } from 'date-fns';

export default function OperationsDashboardPage() {
  const firestore = useFirestore();

  const learnersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'learners'), orderBy('joinedDate', 'desc'));
  }, [firestore]);

  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const admissionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'admissions'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const classroomQuery = useMemo(() => {
    if (!firestore) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return query(
      collection(firestore, 'classroom'),
      where('startDateTime', '>=', Timestamp.fromDate(today)),
      orderBy('startDateTime', 'asc'),
      limit(10)
    );
  }, [firestore]);

  const { data: learners, loading: learnersLoading } = useCollection<Learner>(learnersQuery as any);
  const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);
  const { data: admissions, loading: admissionsLoading } = useCollection<any>(admissionsQuery as any);
  const { data: upcomingClasses, loading: classesLoading } = useCollection<any>(classroomQuery as any);

  const stats = useMemo(() => {
    if (!learners || !programs || !admissions) return {
      totalLearners: 0,
      activePrograms: 0,
      pendingAdmissions: 0,
      upcomingClasses: 0,
      newLearnersThisMonth: 0
    };

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newLearnersThisMonth = learners.filter(learner =>
      learner.joinedDate && new Date(learner.joinedDate) > oneMonthAgo
    ).length;

    return {
      totalLearners: learners.length,
      activePrograms: programs.filter(p => p.status === 'Published').length,
      pendingAdmissions: admissions.filter((a: any) => a.status === 'Pending').length,
      upcomingClasses: upcomingClasses?.length || 0,
      newLearnersThisMonth
    };
  }, [learners, programs, admissions, upcomingClasses]);

  // Generate mock trend data
  const learnerGrowthData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
      learners: Math.floor(Math.random() * 50) + 20 + (i * 10)
    }));
  }, []);

  const admissionsTrendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      admissions: Math.floor(Math.random() * 10) + 3
    }));
  }, []);

  const loading = learnersLoading || programsLoading || admissionsLoading || classesLoading;

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
        {/* Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Operations Dashboard</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Manage learners, programs, admissions, and schedules</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <OperationsStatCard
            title="Total Learners"
            value={stats.totalLearners}
            icon={Users}
            trend="+12%"
            description="Enrolled students"
            chartData={learnerGrowthData}
            chartType="area"
          />
          <OperationsStatCard
            title="Active Programs"
            value={stats.activePrograms}
            icon={GraduationCap}
            trend={`${stats.activePrograms}`}
            description="Published courses"
            chartData={learnerGrowthData.slice(0, 4)}
            chartType="bar"
          />
          <OperationsStatCard
            title="Pending Admissions"
            value={stats.pendingAdmissions}
            icon={UserCheck}
            trend={`${stats.pendingAdmissions}`}
            description="Awaiting review"
            chartData={admissionsTrendData}
            chartType="line"
            highlight
          />
          <OperationsStatCard
            title="New This Month"
            value={stats.newLearnersThisMonth}
            icon={TrendingUp}
            trend="+23%"
            description="Recent enrollments"
            chartData={learnerGrowthData.slice(-5)}
            chartType="area"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Learner Growth
              </CardTitle>
              <CardDescription>Monthly enrollment trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={learnerGrowthData}>
                    <defs>
                      <linearGradient id="colorLearners" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066cc" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0066cc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="learners"
                      stroke="#0066cc"
                      fill="url(#colorLearners)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-accent" />
                Weekly Admissions
              </CardTitle>
              <CardDescription>Admission requests per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={admissionsTrendData}>
                    <Bar
                      dataKey="admissions"
                      fill="#ff6b35"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Classes & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common operations tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickLinkButton href="/o/learners" icon={Users} label="Manage Learners" />
                <QuickLinkButton href="/o/programs" icon={GraduationCap} label="Manage Programs" />
                <QuickLinkButton href="/o/admissions" icon={UserCheck} label="Review Admissions" badge={stats.pendingAdmissions} />
                <QuickLinkButton href="/o/classroom" icon={Calendar} label="Class Schedule" />
              </CardContent>

              <div className="px-6 pb-6">
                <div className="bg-primary/5 p-4 rounded-tl-xl rounded-br-xl border border-primary/10 mt-4">
                  <p className="text-xs text-primary/60 uppercase font-bold mb-3">System Status</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Active Learners</span>
                      <Badge className="bg-green-500/10 text-green-600">
                        {stats.totalLearners}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Live Programs</span>
                      <Badge className="bg-blue-500/10 text-blue-600">
                        {stats.activePrograms}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Pending Items</span>
                      <Badge className="bg-orange-500/10 text-orange-600">
                        {stats.pendingAdmissions}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Upcoming Classes
                </CardTitle>
                <CardDescription>Next scheduled sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingClasses && upcomingClasses.length > 0 ? (
                    upcomingClasses.slice(0, 6).map((classSession: any) => (
                      <div
                        key={classSession.id}
                        className="p-4 border border-primary/10 rounded-tl-xl rounded-br-xl hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-primary/5 p-2 rounded-lg">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-primary text-sm">{classSession.title}</p>
                                <p className="text-xs text-primary/60">
                                  {classSession.facilitator || 'TBA'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-primary/60 ml-12">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {classSession.startDateTime && format(classSession.startDateTime.toDate(), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {classSession.startDateTime && format(classSession.startDateTime.toDate(), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            classSession.status === 'Scheduled' ? "bg-blue-500/10 text-blue-600" :
                              classSession.status === 'In Progress' ? "bg-green-500/10 text-green-600" :
                                "bg-gray-500/10 text-gray-600"
                          )}>
                            {classSession.status || 'Scheduled'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                      <p className="text-primary/40 font-bold">No upcoming classes scheduled</p>
                    </div>
                  )}
                </div>
                {upcomingClasses && upcomingClasses.length > 0 && (
                  <Button
                    asChild
                    className="w-full mt-6 bg-primary hover:bg-accent text-white rounded-tl-xl rounded-br-xl font-bold"
                  >
                    <Link href="/o/classroom">View All Classes <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationsStatCard({ title, value, icon: Icon, trend, description, highlight = false, chartData = [], chartType = 'line' }: any) {
  return (
    <div className={cn(
      "p-6 border rounded-tl-2xl rounded-br-2xl shadow-lg transition-all hover:scale-105 cursor-pointer overflow-hidden",
      highlight ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "h-12 w-12 flex items-center justify-center rounded-tl-lg rounded-br-lg",
          highlight ? "bg-white/10 text-accent" : "bg-primary/5 text-accent"
        )}>
          <Icon className="h-6 w-6" />
        </div>
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
                  dataKey={chartData[0]?.learners !== undefined ? "learners" : "admissions"}
                  stroke={highlight ? "#ffffff" : "#0066cc"}
                  fill={highlight ? "#ffffff" : "#0066cc"}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <Bar
                  dataKey={chartData[0]?.learners !== undefined ? "learners" : "admissions"}
                  fill={highlight ? "#ffffff" : "#ff6b35"}
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey={chartData[0]?.learners !== undefined ? "learners" : "admissions"}
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
