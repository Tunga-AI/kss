'use client';
import { useMemo, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, CheckCircle, Lock, Play, FileText, Award, Clock, Monitor, MapPin, BookOpen, Video, Users, PlayCircle } from "lucide-react";
import { useFirestore, useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { LearnerEnrollment, LearningCourse, LearningUnit, UnitProgress } from '@/lib/learning-types';
import { cn } from "@/lib/utils";

export default function DashboardCurriculumDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: courseId } = use(params);
    const searchParams = useSearchParams();
    const enrollmentIdParam = searchParams.get('enrollment');
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch course directly by ID
    const courseDoc = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'learningCourses', courseId);
    }, [firestore, courseId]);
    const { data: course, loading: courseLoading } = useDoc<LearningCourse>(courseDoc as any);

    // Fetch enrollment for this user and course (if exists)
    const enrollmentQuery = useMemo(() => {
        if (!firestore || !user || !courseId) return null;
        return query(
            collection(firestore, 'learnerEnrollments'),
            where('learnerId', '==', user.id),
            where('courseId', '==', courseId)
        );
    }, [firestore, user, courseId]);
    const { data: enrollments, loading: enrollmentLoading } = useCollection<LearnerEnrollment>(enrollmentQuery as any);
    const enrollment = enrollments?.[0]; // Get first enrollment if exists

    // Fetch units
    const unitsQuery = useMemo(() => {
        if (!firestore || !courseId) return null;
        return query(
            collection(firestore, 'learningUnits'),
            where('courseId', '==', courseId),
            orderBy('orderIndex', 'asc')
        );
    }, [firestore, courseId]);
    const { data: units, loading: unitsLoading } = useCollection<LearningUnit>(unitsQuery as any);

    // Fetch unit progress (only if enrolled)
    const progressQuery = useMemo(() => {
        if (!firestore || !user || !enrollment) return null;
        return query(
            collection(firestore, 'unitProgress'),
            where('enrollmentId', '==', enrollment.id),
            where('learnerId', '==', user.id)
        );
    }, [firestore, enrollment, user]);
    const { data: progressRecords } = useCollection<UnitProgress>(progressQuery as any);

    // Map progress to units
    const unitsWithProgress = useMemo(() => {
        if (!units) return [];

        return units.map(unit => {
            const progress = progressRecords?.find(p => p.unitId === unit.id);
            return { unit, progress };
        });
    }, [units, progressRecords]);

    // Check if unit is accessible (for enrolled users)
    const isUnitAccessible = (index: number) => {
        if (!enrollment) return true; // Non-enrolled users can browse all
        if (!course) return false;
        if (course.allowSkipUnits) return true; // Can skip to any unit

        // Sequential: must complete previous units
        if (index === 0) return true; // First unit always accessible

        const previousUnit = unitsWithProgress[index - 1];
        return previousUnit?.progress?.status === 'Completed' || previousUnit?.progress?.status === 'Passed';
    };

    const getUnitStatusIcon = (unitProgress?: UnitProgress) => {
        if (!unitProgress || unitProgress.status === 'Not Started') {
            return <div className="h-8 w-8 rounded-full border-2 border-primary/20 bg-white" />;
        }
        if (unitProgress.status === 'In Progress') {
            return <div className="h-8 w-8 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-blue-500" />
            </div>;
        }
        return <CheckCircle className="h-8 w-8 text-green-600" />;
    };

    const getDeliveryIcon = (type: string) => {
        switch (type) {
            case 'Virtual': return <Monitor className="h-3 w-3 mr-1" />;
            case 'Physical': return <MapPin className="h-3 w-3 mr-1" />;
            case 'Self-paced': return <Video className="h-3 w-3 mr-1" />;
            default: return <Monitor className="h-3 w-3 mr-1" />;
        }
    };

    if (courseLoading || unitsLoading || enrollmentLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <BookOpen className="h-16 w-16 text-primary/20 mx-auto mb-4" />
                    <p className="text-primary/60 text-lg">Course not found</p>
                    <Button asChild variant="outline" className="mt-4 rounded-tl-lg rounded-br-lg">
                        <Link href="/dashboard/curriculum">Back to Curriculum</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <Button
                            variant="ghost"
                            asChild
                            className="mb-4 gap-2 text-white/80 hover:text-white hover:bg-white/10 p-0 h-auto font-normal hover:bg-transparent"
                        >
                            <Link href="/dashboard/curriculum">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Curriculum
                            </Link>
                        </Button>

                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                        <BookOpen className="h-6 w-6 text-accent" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {enrollment ? (
                                            <Badge className="bg-green-500/20 text-green-100 hover:bg-green-500/30 border-green-500/20 rounded-tl-sm rounded-br-sm text-xs">
                                                Enrolled
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-white/60 border-white/20 rounded-tl-sm rounded-br-sm text-xs">
                                                Preview Mode
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-white/60 border-white/20 rounded-tl-sm rounded-br-sm text-xs uppercase tracking-wider">
                                            {course.status}
                                        </Badge>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">{course.title}</h1>
                                <p className="text-white/80 text-lg font-medium max-w-2xl">{course.description}</p>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {course.programTitle && (
                                        <Badge variant="secondary" className="bg-white/10 text-white border-none hover:bg-white/20">
                                            {course.programTitle}
                                        </Badge>
                                    )}
                                    {course.cohortName && (
                                        <Badge variant="secondary" className="bg-white/10 text-white border-none hover:bg-white/20">
                                            {course.cohortName}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                {enrollment && (
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-tl-xl rounded-br-xl w-full border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Progress</span>
                                            <span className="text-lg font-bold text-accent">{enrollment.overallProgress}%</span>
                                        </div>
                                        <Progress value={enrollment.overallProgress} className="h-2 bg-white/10" indicatorClassName="bg-accent" />
                                    </div>
                                )}
                                <Button
                                    asChild
                                    className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg font-bold shadow-lg shadow-accent/20 w-full"
                                >
                                    <Link href={`/dashboard/curriculum/${courseId}/play`}>
                                        <PlayCircle className="h-5 w-5 mr-3" />
                                        <span>{enrollment && enrollment.overallProgress > 0 ? "Continue Learning" : "Start Learning"}</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Total Units</p>
                                <p className="font-bold text-primary text-xl">{units?.length || 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {enrollment ? (
                        <>
                            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Completed</p>
                                        <p className="font-bold text-primary text-xl">{enrollment.completedUnitIds?.length || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <Award className="h-6 w-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Avg Score</p>
                                        <p className="font-bold text-primary text-xl">{enrollment.averageScore || 0}%</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <Clock className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Time Spent</p>
                                        <p className="font-bold text-primary text-xl">{Math.round((enrollment.totalTimeSpent || 0) / 60)}m</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <>
                            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <Clock className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Est. Time</p>
                                        <p className="font-bold text-primary text-xl">{units?.reduce((acc, u) => acc + (u.estimatedDuration || 0), 0) || 0}m</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <Users className="h-6 w-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Instructors</p>
                                        <p className="font-bold text-primary text-xl">{units?.filter(u => u.facilitatorId).length || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Materials</p>
                                        <p className="font-bold text-primary text-xl">{units?.reduce((acc, u) => acc + (u.contentIds?.length || 0), 0) || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Units List */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="p-4 border-b border-primary/10 bg-primary/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-primary uppercase tracking-widest text-sm">Course Content</h2>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {units?.length || 0} Units
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            {course.isSelfPaced && (
                                <Badge variant="outline" className="text-[10px] text-primary/60 border-primary/20">Self-paced</Badge>
                            )}
                            {course.allowSkipUnits ? (
                                <Badge variant="outline" className="text-[10px] text-primary/60 border-primary/20">Flexible Order</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] text-primary/60 border-primary/20">Sequential</Badge>
                            )}
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-gray-50/30">
                        {units && units.length > 0 ? (
                            <div className="space-y-3">
                                {unitsWithProgress.map(({ unit, progress }, index) => {
                                    const isAccessible = isUnitAccessible(index) || enrollment?.status === 'Completed';
                                    const isCompleted = progress?.status === 'Completed' || progress?.status === 'Passed' || enrollment?.status === 'Completed';

                                    return (
                                        <div
                                            key={unit.id}
                                            className={cn(
                                                "group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all duration-200",
                                                isAccessible
                                                    ? "bg-white border-primary/5 hover:border-accent/30 hover:shadow-md"
                                                    : "bg-gray-50 border-gray-100 opacity-60 grayscale-[0.5]"
                                            )}
                                        >
                                            {/* Status Indicator Line */}
                                            <div className={cn(
                                                "absolute left-0 top-4 bottom-4 w-1 rounded-r-full",
                                                isCompleted ? "bg-green-500" : isAccessible ? "bg-accent" : "bg-gray-200"
                                            )} />

                                            <div className="flex-shrink-0 ml-3">
                                                {enrollment ? (
                                                    isAccessible ? (
                                                        getUnitStatusIcon(progress)
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            <Lock className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="h-12 w-12 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-lg border border-primary/10">
                                                        {index + 1}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/40">
                                                        Unit {index + 1}
                                                    </span>
                                                    {(unit.timingType || unit.weekNumber) && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-primary/5 text-primary/60 hover:bg-primary/10">
                                                            {unit.timingType || 'Week'} {unit.timingNumber || unit.weekNumber}
                                                        </Badge>
                                                    )}
                                                    {unit.deliveryType && (
                                                        <Badge variant="secondary" className={cn(
                                                            "text-[10px] h-5",
                                                            unit.deliveryType === 'Virtual' && "bg-blue-50 text-blue-700",
                                                            unit.deliveryType === 'Physical' && "bg-green-50 text-green-700",
                                                            unit.deliveryType === 'Hybrid' && "bg-purple-50 text-purple-700",
                                                            unit.deliveryType === 'Self-paced' && "bg-orange-50 text-orange-700"
                                                        )}>
                                                            {getDeliveryIcon(unit.deliveryType)}
                                                            {unit.deliveryType}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-accent transition-colors">
                                                    {unit.title}
                                                </h3>

                                                {unit.description && (
                                                    <p className="text-sm text-primary/60 line-clamp-2 mb-3 max-w-2xl">{unit.description}</p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-primary/50">
                                                    {unit.estimatedDuration && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>{unit.estimatedDuration} min</span>
                                                        </div>
                                                    )}
                                                    {unit.contentIds && unit.contentIds.length > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span>{unit.contentIds.length} materials</span>
                                                        </div>
                                                    )}
                                                    {unit.facilitatorName && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="h-3.5 w-3.5" />
                                                            <span>{unit.facilitatorName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 min-w-[140px] justify-center">
                                                {/* Progress Bar (enrolled only) */}
                                                {enrollment && progress && progress.status !== 'Not Started' && (
                                                    <div className="w-full">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] text-primary/50 uppercase tracking-wider font-bold">Progress</span>
                                                            <span className="text-[10px] font-bold text-primary">{progress.progress}%</span>
                                                        </div>
                                                        <Progress value={progress.progress} className="h-1.5" />
                                                    </div>
                                                )}

                                                {enrollment ? (
                                                    <Button
                                                        asChild
                                                        disabled={!isAccessible}
                                                        className={cn(
                                                            "w-full rounded-tl-lg rounded-br-lg shadow-md transition-all",
                                                            !isAccessible && "opacity-50 cursor-not-allowed",
                                                            isCompleted ? "bg-green-600 hover:bg-green-700 text-white" : ""
                                                        )}
                                                        variant={isCompleted ? "default" : isAccessible ? "default" : "outline"}
                                                    >
                                                        {isAccessible ? (
                                                            <Link href={`/dashboard/curriculum/unit/${unit.id}?enrollment=${enrollment.id}`}>
                                                                {isCompleted ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                        Review
                                                                    </>
                                                                ) : progress && progress.status !== 'Not Started' ? (
                                                                    <>
                                                                        <Play className="h-4 w-4 mr-2 fill-current" />
                                                                        Continue
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play className="h-4 w-4 mr-2 fill-current" />
                                                                        Start Unit
                                                                    </>
                                                                )}
                                                            </Link>
                                                        ) : (
                                                            <span>
                                                                <Lock className="h-3 w-3 mr-2" />
                                                                Locked
                                                            </span>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="w-full rounded-tl-lg rounded-br-lg hover:bg-primary hover:text-white transition-colors border-primary/20 text-primary"
                                                    >
                                                        <Link href={`/dashboard/curriculum/unit/${unit.id}?preview=true`}>
                                                            <Play className="h-3 w-3 mr-2" />
                                                            Preview
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <BookOpen className="h-16 w-16 text-primary/10 mx-auto mb-4" />
                                <p className="text-primary/40 font-bold uppercase tracking-widest text-sm">No content available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
