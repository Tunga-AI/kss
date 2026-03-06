'use client';
import { useMemo } from 'react';
import Link from "next/link";
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { Certificate } from '@/lib/certificate-types';
import type { Program } from '@/lib/program-types';
import type { Admission } from '@/lib/admission-types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ArrowRight, BookCopy, Award, CalendarCheck, RefreshCw, Star, TrendingUp,
    BookOpen, CheckCircle2, User as UserIcon, ClipboardList, GraduationCap,
    Rocket, Calendar, Bell, Video, Target, Briefcase, PlayCircle, Clock,
    Wallet, AlertCircle, ChevronRight, Sparkles, Zap, BarChart2, FileText
} from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { calculateProgramFinances } from '@/lib/finance-utils';

const ACCENT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function DashboardPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    // ── Queries ────────────────────────────────────────────────────────────
    const transactionsQuery = useMemo(() => {
        if (!firestore || !user?.email) return null;
        return query(
            collection(firestore, 'transactions'),
            where('learnerEmail', '==', user.email),
            where('status', '==', 'Success'),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const certificatesQuery = useMemo(() => {
        if (!firestore || !user?.email) return null;
        return query(collection(firestore, 'certificates'), where('learnerEmail', '==', user.email), orderBy('issuedDate', 'desc'));
    }, [firestore, user]);

    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'));
    }, [firestore]);

    const admissionsQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'admissions'), where('userId', '==', user.id));
    }, [firestore, user]);

    const elearningProgressQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'elearningProgress'), where('learnerId', '==', user.id));
    }, [firestore, user]);

    const upcomingClassesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'classroom'), where('startDateTime', '>=', Timestamp.now()), orderBy('startDateTime', 'asc'), limit(3));
    }, [firestore]);

    const upcomingEventsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'), where('programType', '==', 'Event'));
    }, [firestore]);

    // ── Data ───────────────────────────────────────────────────────────────
    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery as any);
    const { data: certificates, loading: certificatesLoading } = useCollection<Certificate>(certificatesQuery as any);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);
    const { data: admissions } = useCollection<Admission>(admissionsQuery as any);
    const { data: elearningProgress } = useCollection<any>(elearningProgressQuery as any);
    const { data: upcomingSessions } = useCollection<any>(upcomingClassesQuery as any);
    const { data: upcomingEvents } = useCollection<any>(upcomingEventsQuery as any);

    const loading = userLoading || transactionsLoading || certificatesLoading || programsLoading;

    // ── Derived ─────────────────────────────────────────────────────────
    const onboardingSteps = useMemo(() => {
        if (!user) return [];
        const profile = user.professionalProfile;
        const hasProfile = !!(profile?.summary || (profile?.experience && profile.experience.length > 0) || (profile?.education && profile.education.length > 0));
        const hasAdmission = admissions && admissions.length > 0;
        const admission = admissions?.[0];
        const hasAssessment = !!(admission?.assessmentCompleted || admission?.assessmentScore !== undefined);
        const isPlaced = admission?.status === 'Placed' || admission?.status === 'Admitted';

        if (!hasAdmission && hasProfile) return [];

        return [
            { key: 'admission', label: 'Apply for Admission', description: 'Submit your application to join a programme intake', icon: ClipboardList, done: hasAdmission, href: '/l/admissions' },
            { key: 'profile', label: 'Complete Your Profile', description: 'Add your professional background, education & experience', icon: UserIcon, done: hasProfile, href: '/l/profile' },
            { key: 'assessment', label: 'Complete Assessment', description: 'Take the skills assessment to qualify for placement', icon: GraduationCap, done: hasAssessment, href: '/l/assessment' },
            { key: 'placement', label: 'Await Placement', description: 'Council reviews your application and places you in a cohort', icon: Rocket, done: isPlaced, href: '/l/admissions' },
        ];
    }, [user, admissions]);

    const allStepsDone = onboardingSteps.length > 0 && onboardingSteps.every(s => s.done);
    const nextStep = onboardingSteps.find(s => !s.done);
    const activeAdmissionsCount = admissions?.length || 0;

    const stats = useMemo(() => {
        if (!transactions || !certificates || !programs) return { enrolled: 0, completed: 0, events: 0 };
        const courseTransactions = transactions.filter(t => t.program && !programs.find(p => p.title === t.program && p.programType === 'Event'));
        const eventTransactions = transactions.filter(t => t.program && programs.find(p => p.title === t.program && p.programType === 'Event'));
        return { enrolled: courseTransactions.length, completed: certificates.length, events: eventTransactions.length };
    }, [transactions, certificates, programs]);

    const allEnrolledPrograms = useMemo(() => {
        if (!transactions || !programs) return [];
        return transactions
            .map(t => programs.find(p => p.title === t.program))
            .filter((p): p is Program => p !== undefined)
            .filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
            .slice(0, 5);
    }, [transactions, programs]);

    const mostRecentEnrollment = useMemo(() => {
        if (!transactions || transactions.length === 0 || !programs) return null;
        const tx = transactions[0];
        const prog = programs.find(p => p.title === tx.program);
        if (!prog) return null;
        let url = '/l/courses';
        if (prog.programType === 'E-Learning') url = `/l/e-learning/${prog.slug}`;
        if (prog.programType === 'Core' || prog.programType === 'Short') url = `/l/courses/${prog.slug}`;
        if (prog.programType === 'Event') url = `/l/events/${prog.slug}`;
        return { ...prog, url };
    }, [transactions, programs]);

    const recentElearningProgress = useMemo(() => {
        if (!elearningProgress || !programs || elearningProgress.length === 0) return null;
        const sorted = [...elearningProgress].sort((a, b) => {
            if (!a.lastAccessedAt || !b.lastAccessedAt) return 0;
            return b.lastAccessedAt.toMillis() - a.lastAccessedAt.toMillis();
        });
        const prog = programs.find(p => p.id === sorted[0].programId);
        if (!prog) return null;
        const completedCount = Array.isArray(sorted[0].completedModuleIds) ? sorted[0].completedModuleIds.length : 0;
        const totalModules = prog.elearningModules?.length || 1;
        const pct = Math.round((completedCount / totalModules) * 100);
        return { program: prog, pct, completedCount, totalModules, url: `/l/e-learning/${prog.slug}/learn` };
    }, [elearningProgress, programs]);

    // Finance summary from transactions
    const programFinances = useMemo(() => {
        if (!transactions || !programs) return [];
        return calculateProgramFinances(transactions, programs as any);
    }, [transactions, programs]);

    const totalOutstanding = useMemo(() => programFinances.reduce((a, f) => a + Math.max(0, f.balance), 0), [programFinances]);
    const totalPaid = useMemo(() => programFinances.reduce((a, f) => a + f.totalPaid, 0), [programFinances]);

    // Pie data for programs by type
    const programTypePieData = useMemo(() => {
        const map: Record<string, number> = {};
        allEnrolledPrograms.forEach(p => { map[p.programType || 'Other'] = (map[p.programType || 'Other'] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [allEnrolledPrograms]);

    // Bar chart: payments per program
    const paymentBarData = useMemo(() => {
        return programFinances.slice(0, 5).map(f => ({
            name: f.programName.length > 16 ? f.programName.slice(0, 15) + '…' : f.programName,
            paid: f.totalPaid / 1000,
            balance: Math.max(0, f.balance) / 1000
        }));
    }, [programFinances]);

    const now = new Date();

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 font-body">
            {/* ── HERO ───────────────────────────────────────────────────────────── */}
            <div className="bg-primary text-white px-6 py-10 md:px-10 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30 pointer-events-none" />
                <div className="absolute bottom-0 left-0 mb-0 ml-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-8">
                        <div>
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">
                                {format(now, 'EEEE, MMMM d · h:mm a')}
                            </p>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
                                Welcome back, <span className="text-accent">{user?.name?.split(' ')[0]}</span>!
                            </h1>
                            <p className="text-white/70 text-base md:text-lg font-medium">
                                {allStepsDone
                                    ? `You've earned ${stats.completed} certificate${stats.completed !== 1 ? 's' : ''}. Keep pushing forward!`
                                    : activeAdmissionsCount > 0 && nextStep
                                        ? `Next step: ${nextStep.label} — let's keep your momentum going.`
                                        : 'Explore programs, track your learning, and grow every day.'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-6 h-12 rounded-xl shadow-lg shadow-accent/20 border-0" asChild>
                                <Link href="/l/courses"><Sparkles className="h-4 w-4 mr-2" />Browse Courses</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stat chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Courses Enrolled', value: stats.enrolled, icon: BookCopy, color: 'text-accent', bg: 'bg-accent/20', href: '/l/courses' },
                            { label: 'Certificates Earned', value: stats.completed, icon: Award, color: 'text-yellow-300', bg: 'bg-yellow-400/20', href: '/l/certificates' },
                            { label: 'Events Attended', value: stats.events, icon: CalendarCheck, color: 'text-green-300', bg: 'bg-green-400/20', href: '/l/events' }
                        ].map((s, i) => (
                            <Link key={i} href={s.href}>
                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10 flex items-center gap-4 group hover:bg-white/20 transition-all cursor-pointer">
                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", s.bg, s.color)}>
                                        <s.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{s.value}</p>
                                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/70 ml-auto" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8 pb-16 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── MAIN COLUMN ──────────────────────────────────────────────────── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Onboarding Steps (active admission, incomplete) */}
                        {activeAdmissionsCount > 0 && !allStepsDone && (
                            <div className="bg-white border border-primary/10 rounded-2xl shadow-sm overflow-hidden p-6 relative">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                            <Rocket className="h-5 w-5 text-accent" />Getting Started
                                        </h2>
                                        <Badge variant="outline" className="border-accent/30 text-accent font-black text-[10px] uppercase tracking-widest bg-accent/5">
                                            {onboardingSteps.filter(s => s.done).length}/{onboardingSteps.length} Done
                                        </Badge>
                                    </div>
                                    <div className="w-full bg-primary/5 rounded-full h-1.5 mb-6 overflow-hidden">
                                        <div className="bg-accent h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(onboardingSteps.filter(s => s.done).length / onboardingSteps.length) * 100}%` }} />
                                    </div>
                                    <div className="space-y-3">
                                        {onboardingSteps.map((step, i) => {
                                            const isNext = !step.done && onboardingSteps.slice(0, i).every(s => s.done);
                                            return (
                                                <Link key={step.key} href={step.href} className={cn(
                                                    "flex items-center gap-4 p-4 rounded-xl border transition-all group",
                                                    step.done ? "border-green-100 bg-green-50/60 opacity-80" :
                                                        isNext ? "border-accent/30 bg-accent/5 hover:bg-accent/10" :
                                                            "border-primary/5 bg-gray-50 opacity-50 pointer-events-none"
                                                )}>
                                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                                        step.done ? "bg-green-500 text-white" : isNext ? "bg-accent text-white shadow-md shadow-accent/30" : "bg-primary/10 text-primary/30"
                                                    )}>
                                                        {step.done ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("font-bold", step.done ? "text-green-700" : isNext ? "text-primary text-base" : "text-primary/50")}>{step.label}</p>
                                                        <p className="text-xs text-primary/50 mt-0.5">{step.description}</p>
                                                    </div>
                                                    {step.done
                                                        ? <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-100 px-2 py-0.5 rounded-sm">Done</span>
                                                        : isNext && <ArrowRight className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* E-Learning Active Progress */}
                        {recentElearningProgress && (
                            <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-accent" />Resume Learning
                                        </h2>
                                        <p className="text-primary/60 text-sm mt-0.5">Pick up right where you left off</p>
                                    </div>
                                    <Button variant="ghost" asChild className="text-accent hover:text-accent hover:bg-accent/10 text-xs font-bold uppercase tracking-widest">
                                        <Link href={recentElearningProgress.url}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Link>
                                    </Button>
                                </div>
                                <div className="border border-primary/10 rounded-xl bg-gray-50/60 p-5 flex flex-col md:flex-row gap-5">
                                    <div className="w-full md:w-28 h-20 shrink-0 bg-primary/10 rounded-lg overflow-hidden relative">
                                        {(recentElearningProgress.program as any).imageUrl ? (
                                            <img src={(recentElearningProgress.program as any).imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-primary/20"><BookOpen className="h-8 w-8" /></div>}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <span className="absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-widest text-white/90">E-Learning</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-extrabold text-primary mb-3 leading-tight">{recentElearningProgress.program.title}</h3>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/50">{recentElearningProgress.pct}% Completed</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/50">{recentElearningProgress.completedCount}/{recentElearningProgress.totalModules} modules</span>
                                        </div>
                                        <Progress value={recentElearningProgress.pct} className="h-2 bg-primary/10 [&>div]:bg-accent" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Program (Fallback for non-elearning) */}
                        {!recentElearningProgress && mostRecentEnrollment && (
                            <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6">
                                <div className="flex justify-between items-start mb-5">
                                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-accent" />Recent Program
                                    </h2>
                                    <Button variant="ghost" asChild className="text-accent hover:bg-accent/10 text-xs font-bold uppercase tracking-widest">
                                        <Link href={mostRecentEnrollment.url}>Go to Program <ArrowRight className="ml-1 h-4 w-4" /></Link>
                                    </Button>
                                </div>
                                <div className="bg-primary/5 rounded-xl p-6 border border-primary/5">
                                    <h3 className="text-lg font-bold text-primary mb-2">{mostRecentEnrollment.title}</h3>
                                    <p className="text-sm text-primary/60 mb-4 line-clamp-2">{(mostRecentEnrollment as any).description || 'Continue your learning journey.'}</p>
                                    <Button className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-accent/20" asChild>
                                        <Link href={mostRecentEnrollment.url}>Continue Learning</Link>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* No enrollments CTA */}
                        {!mostRecentEnrollment && !recentElearningProgress && (
                            <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-10 text-center">
                                <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="h-10 w-10 text-primary/20" />
                                </div>
                                <h3 className="font-bold text-primary text-xl mb-2">Start Your Learning Journey</h3>
                                <p className="text-primary/60 text-sm max-w-sm mx-auto mb-6">Browse our catalog of programs and courses to find the perfect fit for your career goals.</p>
                                <Button className="bg-accent text-white font-bold px-8 rounded-xl h-12 shadow-lg shadow-accent/20" asChild>
                                    <Link href="/l/courses"><Sparkles className="mr-2 h-4 w-4" />Explore Programs</Link>
                                </Button>
                            </div>
                        )}

                        {/* Live Classroom Sessions Widget */}
                        <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <Video className="h-5 w-5 text-accent" />Upcoming Live Classes
                                </h2>
                                <Button variant="ghost" size="sm" asChild className="text-accent hover:bg-accent/10 font-bold text-xs uppercase tracking-widest">
                                    <Link href="/l/classroom">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {upcomingSessions && upcomingSessions.length > 0 ? upcomingSessions.map((session: any, i: number) => (
                                    <div key={i} className="flex gap-4 p-4 border border-primary/10 rounded-xl hover:border-accent/40 hover:bg-accent/5 transition-all group">
                                        <div className="bg-primary/5 rounded-lg px-3 py-2 text-center shrink-0 min-w-[56px] border border-primary/5">
                                            <p className="text-[9px] font-black text-primary/50 uppercase">{format(session.startDateTime.toDate(), 'MMM')}</p>
                                            <p className="text-2xl font-black text-primary leading-none my-0.5">{format(session.startDateTime.toDate(), 'dd')}</p>
                                            <p className="text-[9px] font-bold text-accent uppercase">{format(session.startDateTime.toDate(), 'h:mm a')}</p>
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <p className="text-sm font-bold text-primary truncate group-hover:text-accent transition-colors">{session.title}</p>
                                            <p className="text-[10px] text-primary/50 mt-1 flex items-center gap-1.5"><Clock className="h-3 w-3" />Live interactive session · {formatDistanceToNow(session.startDateTime.toDate(), { addSuffix: true })}</p>
                                        </div>
                                        <Button size="icon" className="shrink-0 rounded-full h-10 w-10 bg-primary/5 text-primary group-hover:bg-accent group-hover:text-white transition-all" asChild>
                                            <Link href={`/l/classroom/${session.id}`}><PlayCircle className="h-5 w-5" /></Link>
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                                        <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                        <p className="font-bold text-gray-400 text-sm">No upcoming live classes scheduled</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enrolled Programs List */}
                        {allEnrolledPrograms.length > 0 && (
                            <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                        <BookCopy className="h-5 w-5 text-accent" />My Programs
                                    </h2>
                                    <Button variant="ghost" size="sm" asChild className="text-accent hover:bg-accent/10 font-bold text-xs uppercase tracking-widest">
                                        <Link href="/l/courses">All Programs<ArrowRight className="ml-1 h-4 w-4" /></Link>
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {allEnrolledPrograms.map((prog, i) => {
                                        const url = prog.programType === 'E-Learning' ? `/l/e-learning/${prog.slug}` : prog.programType === 'Event' ? `/l/events/${prog.slug}` : `/l/courses/${prog.slug}`;
                                        const typeColor = prog.programType === 'E-Learning' ? 'bg-blue-50 text-blue-600' : prog.programType === 'Event' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600';
                                        return (
                                            <Link key={i} href={url} className="flex items-center gap-4 p-3.5 rounded-xl border border-primary/5 hover:border-accent/30 hover:bg-accent/5 transition-all group">
                                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", typeColor)}>
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-primary text-sm truncate">{prog.title}</p>
                                                    <Badge variant="outline" className="text-[8px] font-black border-none px-1.5 py-0 bg-primary/5 text-primary/50 uppercase tracking-widest mt-1">{prog.programType}</Badge>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-primary/30 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Analytics Row — Finance bar + Programs pie */}
                        {(programFinances.length > 0 || programTypePieData.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Finance bar chart */}
                                {paymentBarData.length > 0 && (
                                    <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6">
                                        <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
                                            <BarChart2 className="h-5 w-5 text-accent" />Fee Payments (KES '000)
                                        </h2>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={paymentBarData} barSize={12}>
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                                                <YAxis tick={{ fontSize: 9 }} />
                                                <Tooltip
                                                    formatter={(val: any) => [`KES ${(val * 1000).toLocaleString()}`, '']}
                                                    contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid #e5e7eb' }}
                                                />
                                                <Bar dataKey="paid" name="Paid" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="balance" name="Balance" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Programs donut */}
                                {programTypePieData.length > 0 && (
                                    <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6">
                                        <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
                                            <Target className="h-5 w-5 text-accent" />My Enrollment Mix
                                        </h2>
                                        <div className="flex items-center gap-4">
                                            <ResponsiveContainer width="50%" height={160}>
                                                <PieChart>
                                                    <Pie data={programTypePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                                        {programTypePieData.map((_, idx) => (
                                                            <Cell key={idx} fill={ACCENT_COLORS[idx % ACCENT_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-2">
                                                {programTypePieData.map((entry, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ACCENT_COLORS[idx % ACCENT_COLORS.length] }} />
                                                        <span className="text-xs font-bold text-primary">{entry.name}</span>
                                                        <span className="text-xs text-primary/50 ml-auto">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Outstanding balance alert */}
                        {totalOutstanding > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-xl" />
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-red-800 text-sm">Outstanding Balance</p>
                                        <p className="text-red-700 font-black text-2xl mt-0.5">KES {totalOutstanding.toLocaleString()}</p>
                                        <p className="text-red-600/70 text-xs mt-1">Across {programFinances.filter(f => f.balance > 0).length} program{programFinances.filter(f => f.balance > 0).length > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <Button size="sm" className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl" asChild>
                                    <Link href="/l/finance">Pay Now</Link>
                                </Button>
                            </div>
                        )}

                        {/* Finance summary */}
                        {totalPaid > 0 && (
                            <Card className="border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-primary flex items-center gap-2 text-base">
                                        <Wallet className="h-5 w-5 text-accent" />Financial Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center py-3 border-b border-primary/5">
                                        <span className="text-sm text-primary/60 font-medium">Total Invested</span>
                                        <span className="font-black text-primary">KES {totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-primary/5">
                                        <span className="text-sm text-primary/60 font-medium">Outstanding</span>
                                        <span className={cn("font-black", totalOutstanding > 0 ? "text-red-500" : "text-green-600")}>
                                            {totalOutstanding > 0 ? `KES ${totalOutstanding.toLocaleString()}` : 'Fully Paid'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-sm text-primary/60 font-medium">Programs</span>
                                        <span className="font-black text-primary">{programFinances.length}</span>
                                    </div>
                                    <Button variant="outline" className="w-full border-primary/10 text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-widest rounded-xl h-10" asChild>
                                        <Link href="/l/finance"><FileText className="mr-2 h-4 w-4" />View Full Statement</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card className="border-primary/10 rounded-2xl shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-primary flex items-center gap-2 text-base"><Target className="h-5 w-5 text-accent" />Quick Access</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 pb-4">
                                {[
                                    { href: "/l/classroom", icon: Video, label: "My Classroom", desc: "Join live sessions" },
                                    { href: "/l/e-learning", icon: BookOpen, label: "E-Learning", desc: "Self-paced courses" },
                                    { href: "/l/timetable", icon: Calendar, label: "Timetable", desc: "View schedule" },
                                    { href: "/l/finance", icon: Briefcase, label: "Finance", desc: "Payments & receipts" },
                                    { href: "/l/certificates", icon: Award, label: "Certificates", desc: "Your achievements" },
                                    { href: "/l/profile", icon: UserIcon, label: "My Profile", desc: "Manage your account" },
                                ].map((item) => (
                                    <Link key={item.href} href={item.href}>
                                        <Button variant="ghost" className="w-full justify-start h-auto py-2.5 px-3 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-xl group transition-all">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="h-9 w-9 flex items-center justify-center bg-primary/5 rounded-lg text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors shrink-0">
                                                    <item.icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold text-sm text-primary leading-none">{item.label}</p>
                                                    <p className="text-[10px] text-primary/50 mt-0.5 uppercase font-bold tracking-wider">{item.desc}</p>
                                                </div>
                                                <ArrowRight className="h-3.5 w-3.5 text-primary/30 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                                            </div>
                                        </Button>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Certificates */}
                        <Card className="border-primary/10 rounded-2xl shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-primary flex items-center gap-2 text-base"><Award className="h-5 w-5 text-yellow-500" />Achievements</CardTitle>
                                <CardDescription>Your earned certificates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {certificates && certificates.length > 0 ? (
                                    <div className="space-y-3">
                                        {certificates.slice(0, 3).map((cert, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors group cursor-pointer">
                                                <div className="h-10 w-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-500 shrink-0 group-hover:scale-110 transition-transform">
                                                    <Star className="h-5 w-5 fill-current" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-primary truncate">{cert.programTitle}</p>
                                                    <p className="text-[10px] text-primary/50 font-black uppercase">{cert.issuedDate ? format(cert.issuedDate.toDate(), 'MMM yyyy') : '—'}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <Button variant="outline" className="w-full mt-2 border-primary/10 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[10px] rounded-xl h-10" asChild>
                                            <Link href="/l/certificates">View All</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Award className="h-6 w-6 text-yellow-200" />
                                        </div>
                                        <p className="text-xs text-primary/40 font-bold uppercase tracking-widest">No certificates yet</p>
                                        <p className="text-[10px] text-primary/30 mt-1">Complete programs to earn certificates</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Events Notice Board */}
                        <Card className="border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                                <CardTitle className="flex items-center gap-2 text-base text-white">
                                    <Bell className="h-5 w-5 text-white/70" />Events & Workshops
                                </CardTitle>
                                <CardDescription className="text-white/60">Open for registration</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {upcomingEvents && upcomingEvents.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingEvents.slice(0, 3).map((event: any, i: number) => (
                                            <Link key={i} href={`/e-learning/${event.slug}`} className="flex gap-3 group">
                                                <div className="h-12 w-12 bg-purple-50 rounded-xl shrink-0 overflow-hidden">
                                                    {event.imageUrl ? <img src={event.imageUrl} alt="" className="w-full h-full object-cover" /> :
                                                        <div className="w-full h-full flex items-center justify-center text-purple-300"><Zap className="h-5 w-5" /></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-primary truncate group-hover:text-purple-600 transition-colors">{event.title || event.programName}</p>
                                                    <p className="text-[10px] text-primary/50 font-medium mt-0.5">{event.price ? `KES ${event.price}` : 'Free Registration'}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-primary/20 group-hover:text-purple-500 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                                            </Link>
                                        ))}
                                        <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 font-bold text-[10px] uppercase tracking-widest rounded-xl h-10 mt-2" asChild>
                                            <Link href="/l/events">Browse All Events</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                        <p className="text-xs text-primary/40 font-bold uppercase tracking-widest">No upcoming events</p>
                                        <p className="text-[10px] text-primary/30 mt-1">Check back soon for new workshops</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
