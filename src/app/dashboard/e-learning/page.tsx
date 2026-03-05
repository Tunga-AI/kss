'use client';
import { useMemo } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Laptop, RefreshCw, Play, CheckCircle, ArrowRight } from "lucide-react";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { LearnerEnrollment, LearningCourse } from '@/lib/learning-types';
import type { Program } from '@/lib/program-types';
import { cn } from "@/lib/utils";

export default function LearnerElearningPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch ALL available courses (Active courses)
    const allCoursesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'programs'),
            where('programType', '==', 'E-Learning'),
            where('status', 'in', ['active', 'draft'])
        ) as any;
    }, [firestore]);
    const { data: allCourses, loading: coursesLoading } = useCollection<Program>(allCoursesQuery);

    // Fetch elearning enrollments
    const enrollmentsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'elearningEnrollments'), where('userId', '==', user.id)) as any;
    }, [firestore, user]);
    const { data: enrollments, loading: enrollmentsLoading } = useCollection<any>(enrollmentsQuery);

    // Create a map of courseId -> enrollment for quick lookup
    const enrollmentMap = useMemo(() => {
        const map = new Map<string, any>();
        enrollments?.forEach(e => map.set(e.programId, e));
        return map;
    }, [enrollments]);

    // Separate courses into enrolled and available (E-Learning ONLY - i.e. Self-Paced)
    const enrolledCourses = useMemo(() => {
        if (!allCourses || !enrollments) return [];
        return allCourses
            .filter(course => enrollmentMap.has(course.id))
            .map(course => ({
                course,
                enrollment: enrollmentMap.get(course.id)!
            }));
    }, [allCourses, enrollments, enrollmentMap]);

    // Separate enrolled by status for counters
    const activeCourses = enrolledCourses.filter(item => item.enrollment.status === 'active');
    const completedCourses = enrolledCourses.filter(item => item.enrollment.status === 'completed');

    if (coursesLoading || enrollmentsLoading) {
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
                                <Laptop className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My E-Learning</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Continue your self-paced courses.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{activeCourses.length}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">In Progress</p>
                            </div>
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{completedCourses.length}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Courses Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Course Title</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Units</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-48">Progress</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {enrolledCourses.length > 0 ? (
                                    enrolledCourses.map(({ course, enrollment }) => {
                                        // Determine status and progress
                                        const status = enrollment.status || 'active';
                                        const progress = enrollment.progressPct || 0;
                                        let statusColor = 'bg-green-100 text-green-700 border-green-200';

                                        if (status === 'completed') statusColor = 'bg-blue-100 text-blue-700 border-blue-200';

                                        return (
                                            <TableRow key={course.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                            <Laptop className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary leading-tight">{course.title || course.programName}</p>
                                                            <p className="text-[10px] text-primary/40 uppercase font-black mt-1">
                                                                Self-Paced
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <p className="text-sm font-medium text-primary/80">E-Learning</p>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <span className="text-sm font-bold text-primary/80">{course.elearningModules?.length || 0}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 border",
                                                        statusColor
                                                    )}>
                                                        {status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="w-full">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold text-primary/60 uppercase">Completed</span>
                                                            <span className="text-[10px] font-bold text-primary">{progress}%</span>
                                                        </div>
                                                        <Progress value={progress} className="h-1.5" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant={status === 'completed' ? "outline" : "default"}
                                                        className={cn(
                                                            "h-8 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none transition-all shadow-none",
                                                            status !== 'completed' ? "bg-accent hover:bg-accent/90 text-white" : "",
                                                            status === 'completed' && "border-primary/20 hover:bg-primary/5"
                                                        )}
                                                    >
                                                        <Link href={`/e-learning/${course.slug}/learn`}>
                                                            {status === 'completed' ? (
                                                                <>
                                                                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                                                    Review
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Play className="h-3.5 w-3.5 mr-2" />
                                                                    Continue
                                                                </>
                                                            )}
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Laptop className="h-12 w-12 text-primary/10" />
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No active e-learning courses</p>
                                                <Button variant="outline" size="sm" asChild className="mt-4">
                                                    <Link href="/dashboard/programs">Browse Programs</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
