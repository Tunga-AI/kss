'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, UserPlus, Calendar } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Learner } from '@/lib/learners-types';
import type { Program } from '@/lib/program-types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const learnersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'learners'));
  }, [firestore]);
  
  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const { data: learners, loading: learnersLoading } = useCollection<Learner>(learnersQuery);
  const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery);

  const stats = useMemo(() => {
    if (!learners || !programs) return { totalLearners: 0, newSignups: 0, totalCourses: 0, upcomingEvents: 0 };
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSignups = learners.filter(learner => learner.joinedDate && new Date(learner.joinedDate) > thirtyDaysAgo).length;

    const totalCourses = programs.filter(p => p.programType !== 'Event').length;
    
    const upcomingEvents = programs.filter(p => p.programType === 'Event' && p.date && new Date(p.date) > new Date()).length;

    return {
      totalLearners: learners.length,
      newSignups,
      totalCourses,
      upcomingEvents,
    };
  }, [learners, programs]);
  
  const loading = learnersLoading || programsLoading;

  const StatCard = ({ title, value, icon: Icon, loading, description }: { title: string, value: string | number, icon: React.ElementType, loading: boolean, description?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
        {description && !loading && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 p-4 sm:p-6 lg:p-10">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Admin Dashboard</CardTitle>
          <CardDescription className="text-primary-foreground/80">Overview of the KSS Institute portal.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Learners" value={stats.totalLearners} icon={Users} loading={loading} />
        <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} loading={loading} />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon={Calendar} loading={loading} />
        <StatCard title="New Sign-ups (30d)" value={stats.newSignups} icon={UserPlus} loading={loading} />
      </div>
    </div>
  );
}
