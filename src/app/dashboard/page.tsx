'use client';
import { useMemo } from 'react';
import Link from "next/link";
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { Certificate } from '@/lib/certificate-types';
import type { Program } from '@/lib/program-types';
import type { Admission } from '@/lib/admission-types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookCopy, Award, CalendarCheck, RefreshCw, Star, TrendingUp, BookOpen, CheckCircle2, Circle, User as UserIcon, ClipboardList, GraduationCap, Rocket, Calendar, Bell, FileText, Video, Users, Target, Briefcase } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

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
        return query(collection(firestore, 'certificates'), where('learnerEmail', '==', user.email));
    }, [firestore, user]);

    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'));
    }, [firestore]);

    const admissionsQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'admissions'), where('userId', '==', user.id));
    }, [firestore, user]);

    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery as any);
    const { data: certificates, loading: certificatesLoading } = useCollection<Certificate>(certificatesQuery as any);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);
    const { data: admissions } = useCollection<Admission>(admissionsQuery as any);

    const loading = userLoading || transactionsLoading || certificatesLoading || programsLoading;

    // Onboarding steps logic
    const onboardingSteps = useMemo(() => {
        if (!user) return [];
        const profile = user.professionalProfile;
        const hasProfile = !!(profile?.summary || (profile?.experience && profile.experience.length > 0) || (profile?.education && profile.education.length > 0));
        const hasAdmission = admissions && admissions.length > 0;
        const admission = admissions?.[0];
        const hasAssessment = !!(admission?.assessmentCompleted || admission?.assessmentScore !== undefined);
        const isPlaced = admission?.status === 'Placed' || admission?.status === 'Admitted';

        return [
            {
                key: 'admission',
                label: 'Apply for Admission',
                description: 'Submit your application to join a programme intake',
                icon: ClipboardList,
                done: hasAdmission,
                href: '/l/admissions',
            },
            {
                key: 'profile',
                label: 'Complete Your Profile',
                description: 'Add your professional background, education & experience',
                icon: UserIcon,
                done: hasProfile,
                href: '/l/profile',
            },
            {
                key: 'assessment',
                label: 'Complete Assessment',
                description: 'Take the skills assessment to qualify for placement',
                icon: GraduationCap,
                done: hasAssessment,
                href: '/l/assessment',
            },
            {
                key: 'placement',
                label: 'Await Placement',
                description: 'Council reviews your application and places you in a cohort',
                icon: Rocket,
                done: isPlaced,
                href: '/l/admissions',
            },
        ];
    }, [user, admissions]);

    const allStepsDone = onboardingSteps.length > 0 && onboardingSteps.every(s => s.done);
    const nextStep = onboardingSteps.find(s => !s.done);

    const stats = useMemo(() => {
        if (!transactions || !certificates || !programs) return { enrolled: 0, completed: 0, events: 0 };
        const courseTransactions = transactions.filter(t => t.program && !programs.find(p => p.title === t.program && p.programType === 'Event'));
        const eventTransactions = transactions.filter(t => t.program && programs.find(p => p.title === t.program && p.programType === 'Event'));

        return {
            enrolled: courseTransactions.length,
            completed: certificates.length,
            events: eventTransactions.length,
        };
    }, [transactions, certificates, programs]);

    const mostRecentEnrollment = useMemo(() => {
        if (!transactions || transactions.length === 0 || !programs) return null;
        const mostRecentTransaction = transactions[0];
        const programDetails = programs.find(p => p.title === mostRecentTransaction.program);
        if (!programDetails) return null;

        let url = '/l/courses';
        if (programDetails.programType === 'E-Learning') url = `/l/e-learning/${programDetails.slug}`;
        if (programDetails.programType === 'Core' || programDetails.programType === 'Short') url = `/l/courses/${programDetails.slug}`;
        if (programDetails.programType === 'Event') url = `/l/events/${programDetails.slug}`;

        return {
            title: programDetails.title,
            description: programDetails.description,
            url,
            programType: programDetails.programType,
        };
    }, [transactions, programs]);

    const allEnrolledPrograms = useMemo(() => {
        if (!transactions || !programs) return [];
        return transactions
            .map(t => programs.find(p => p.title === t.program))
            .filter((p): p is Program => p !== undefined)
            .slice(0, 4);
    }, [transactions, programs]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-8 mb-8 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Welcome Back, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-white/80 text-lg font-medium max-w-2xl">
                            {allStepsDone
                                ? `Ready to continue your learning journey? You've earned ${stats.completed} certificates so far. Keep pushing!`
                                : nextStep
                                    ? `Your next step: ${nextStep.label}. Complete your onboarding to start learning.`
                                    : 'Complete your onboarding to start learning.'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                            {[
                                { label: 'Courses Enrolled', value: stats.enrolled, icon: BookCopy, color: 'text-accent' },
                                { label: 'Certificates Won', value: stats.completed, icon: Award, color: 'text-yellow-400' },
                                { label: 'Events Attended', value: stats.events, icon: CalendarCheck, color: 'text-green-400' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-tl-2xl rounded-br-2xl border border-white/10 flex items-center gap-4 group hover:bg-white/20 transition-all cursor-default">
                                    <div className={cn("group-hover:scale-110 transition-transform", stat.color)}>
                                        <stat.icon className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm font-medium text-white/60 uppercase tracking-widest text-[10px]">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Onboarding Steps — always show if not all done, or show collapsed summary if all done */}
                        {!allStepsDone && (
                            <div className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm overflow-hidden p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Rocket className="h-5 w-5 text-accent" />
                                        Getting Started
                                    </h2>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">
                                        {onboardingSteps.filter(s => s.done).length} / {onboardingSteps.length} Complete
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-primary/5 rounded-full h-2 mb-8">
                                    <div
                                        className="bg-accent h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${(onboardingSteps.filter(s => s.done).length / onboardingSteps.length) * 100}%` }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    {onboardingSteps.map((step, i) => {
                                        const isNext = !step.done && onboardingSteps.slice(0, i).every(s => s.done);
                                        return (
                                            <Link
                                                key={step.key}
                                                href={step.href}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border transition-all group",
                                                    step.done
                                                        ? "border-green-100 bg-green-50/50 opacity-70"
                                                        : isNext
                                                            ? "border-accent/30 bg-accent/5 hover:bg-accent/10 cursor-pointer"
                                                            : "border-primary/5 bg-primary/2 opacity-50 cursor-not-allowed pointer-events-none"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-tl-lg rounded-br-lg flex items-center justify-center shrink-0 transition-all",
                                                    step.done ? "bg-green-500 text-white" : isNext ? "bg-accent text-white" : "bg-primary/10 text-primary/30"
                                                )}>
                                                    {step.done
                                                        ? <CheckCircle2 className="h-5 w-5" />
                                                        : <step.icon className="h-5 w-5" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "font-bold leading-tight",
                                                        step.done ? "text-green-700" : isNext ? "text-primary" : "text-primary/40"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                    <p className="text-[10px] text-primary/40 mt-0.5 uppercase font-bold tracking-widest">{step.description}</p>
                                                </div>
                                                {isNext && (
                                                    <ArrowRight className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                                {step.done && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Done</span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Resume Learning section */}
                        <div className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm overflow-hidden p-6 relative group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-accent" />
                                        Recent Program
                                    </h2>
                                    <p className="text-primary/60 text-sm">Pick up where you left off</p>
                                </div>
                                {mostRecentEnrollment && (
                                    <Button variant="ghost" asChild className="text-accent hover:text-accent hover:bg-accent/10">
                                        <Link href={mostRecentEnrollment.url} className="font-bold text-xs uppercase tracking-widest">
                                            Go to Program <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>

                            {mostRecentEnrollment ? (
                                <div className="bg-primary/5 rounded-xl p-6 border border-primary/5 relative">
                                    <h3 className="text-lg font-bold text-primary mb-2">{mostRecentEnrollment.title}</h3>
                                    <p className="text-sm text-primary/70 line-clamp-2 max-w-xl mb-4">
                                        {mostRecentEnrollment.description || "Continue exploring the modules and resources in this program to complete your certification."}
                                    </p>
                                    <Button className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold px-8 h-12 shadow-lg hover:shadow-accent/20 transition-all" asChild>
                                        <Link href={mostRecentEnrollment.url}>Continue Learning</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="bg-primary/5 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="h-8 w-8 text-primary/30" />
                                    </div>
                                    <h3 className="font-bold text-primary">No enrollments yet</h3>
                                    <p className="text-primary/60 text-sm max-w-xs mx-auto mt-2">Explore our catalog to start your learning journey with us today.</p>
                                    <Button className="mt-6 bg-primary text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold px-8" asChild>
                                        <Link href="/l/courses">Explore Programs</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Quick Actions Card */}
                        <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <Target className="h-5 w-5 text-accent" />
                                    Quick Actions
                                </CardTitle>
                                <CardDescription>Access key features</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <QuickActionButton href="/l/classroom" icon={Video} label="My Classroom" description="Join live sessions" />
                                <QuickActionButton href="/l/e-learning" icon={BookOpen} label="E-Learning" description="Self-paced courses" />
                                <QuickActionButton href="/l/timetable" icon={Calendar} label="Timetable" description="View schedule" />
                                <QuickActionButton href="/l/finance" icon={Briefcase} label="Finance" description="Payments & receipts" />
                                <QuickActionButton href="/l/certificates" icon={Award} label="Certificates" description="Your achievements" />
                            </CardContent>
                        </Card>

                        {/* Achievements */}
                        <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <Award className="h-5 w-5 text-accent" />
                                    Achievements
                                </CardTitle>
                                <CardDescription>Your earned certificates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {certificates && certificates.length > 0 ? (
                                        certificates.slice(0, 3).map((cert, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer group">
                                                <div className="h-10 w-10 flex-shrink-0 bg-yellow-400/10 rounded-lg flex items-center justify-center text-yellow-500">
                                                    <Star className="h-5 w-5 fill-current" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-primary truncate">{cert.programTitle}</p>
                                                    <p className="text-[10px] text-primary/60 uppercase font-black">{format(cert.issuedDate.toDate(), 'MMM yyyy')}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="bg-primary/5 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Award className="h-6 w-6 text-primary/30" />
                                            </div>
                                            <p className="text-xs text-primary/40 font-bold uppercase tracking-widest">No certificates yet</p>
                                            <p className="text-[10px] text-primary/30 mt-1">Complete programs to earn certificates</p>
                                        </div>
                                    )}
                                </div>
                                {certificates && certificates.length > 0 && (
                                    <Button variant="outline" className="w-full mt-6 border-primary/10 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[10px] rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-11" asChild>
                                        <Link href="/l/certificates">View All Certificates</Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Enrolled Programs */}
                        <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <BookCopy className="h-5 w-5 text-accent" />
                                    My Programs
                                </CardTitle>
                                <CardDescription>Currently enrolled</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {allEnrolledPrograms.length > 0 ? (
                                        allEnrolledPrograms.map((program, i) => (
                                            <Link
                                                key={i}
                                                href={
                                                    program.programType === 'E-Learning' ? `/l/e-learning/${program.slug}` :
                                                        program.programType === 'Event' ? `/l/events/${program.slug}` :
                                                            `/l/courses/${program.slug}`
                                                }
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors group border border-primary/5"
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center",
                                                    program.programType === 'E-Learning' ? 'bg-blue-50 text-blue-600' :
                                                        program.programType === 'Event' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-green-50 text-green-600'
                                                )}>
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-primary truncate">{program.title}</p>
                                                    <Badge className="text-[8px] font-black uppercase mt-1 border-none px-2 py-0.5">
                                                        {program.programType}
                                                    </Badge>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-primary/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="bg-primary/5 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <BookCopy className="h-6 w-6 text-primary/30" />
                                            </div>
                                            <p className="text-xs text-primary/40 font-bold uppercase tracking-widest">No enrollments</p>
                                            <p className="text-[10px] text-primary/30 mt-1">Browse our catalog to get started</p>
                                        </div>
                                    )}
                                </div>
                                {allEnrolledPrograms.length > 4 && (
                                    <Button variant="outline" className="w-full mt-4 border-primary/10 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[10px] rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-11" asChild>
                                        <Link href="/l/courses">View All Programs</Link>
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

function QuickActionButton({ href, icon: Icon, label, description }: { href: string; icon: any; label: string; description: string }) {
    return (
        <Link href={href}>
            <Button variant="ghost" className="w-full justify-start h-auto py-3 px-4 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-tl-lg rounded-br-lg group transition-all">
                <div className="flex items-center gap-3 w-full">
                    <div className="h-10 w-10 flex items-center justify-center bg-primary/5 rounded-lg text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors shrink-0">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className="font-bold text-sm text-primary">{label}</p>
                        <p className="text-[10px] text-primary/50 uppercase font-bold tracking-wider">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/40 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                </div>
            </Button>
        </Link>
    );
}
