'use client';
import { useMemo, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { LearningCourse, LearnerEnrollment } from '@/lib/learning-types';
import type { Program } from '@/lib/program-types';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search, BookOpen, Loader2, ChevronDown,
    RefreshCw, User, Calendar, MapPin, Tag, Eye, Zap
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

interface LearnerProgramViewProps {
    pageTitle: string;
    pageDescription: string;
    programTypes: Program['programType'][];
}

export function LearnerProgramView({ pageTitle, pageDescription, programTypes }: LearnerProgramViewProps) {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // 1. Fetch all programs, filter by type client-side (avoids missing programType field issues)
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "programs"), orderBy("createdAt", "desc"));
    }, [firestore]);

    const { data: allPrograms, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    // 2. Fetch Learning Courses (to check content availability)
    const coursesQuery = useMemo(() => {
        if (!firestore) return null;
        // Fetch all self-paced/e-learning courses
        return query(collection(firestore, 'learningCourses'), where('isSelfPaced', '==', true));
    }, [firestore]);

    const { data: learningCourses, loading: coursesLoading } = useCollection<LearningCourse>(coursesQuery as any);

    // 3. Fetch User Enrollments
    const enrollmentsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'learnerEnrollments'), where('learnerId', '==', user.uid));
    }, [firestore, user]);

    const { data: enrollments, loading: enrollmentsLoading } = useCollection<LearnerEnrollment>(enrollmentsQuery as any);

    const filteredData = useMemo(() => {
        if (!allPrograms) return [];
        return allPrograms.filter(p => {
            // Client-side type filter — matches programType OR includes programs with no type set
            const matchesType = programTypes.length === 0 || programTypes.includes(p.programType as any) || !p.programType;
            const title = p.programName || p.title || '';
            const desc = p.shortDescription || p.description || '';
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                desc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = selectedLevel === 'all' || String(p.level) === selectedLevel;

            // Determine enrollment status for filtering
            let isEnrolled = false;
            // First check direct enrollment via course
            if (learningCourses && enrollments) {
                const course = learningCourses.find(c => c.programId === p.id);
                if (course) {
                    isEnrolled = enrollments.some(e => e.courseId === course.id && e.status !== 'Dropped');
                } else {
                    // Fallback to program ID matching (legacy or direct program enrollment)
                    isEnrolled = enrollments.some(e => e.programId === p.id && e.status !== 'Dropped');
                }
            }

            const matchesStatus = selectedStatus === 'all' ||
                (selectedStatus === 'enrolled' && isEnrolled) ||
                (selectedStatus === 'explore' && !isEnrolled);

            return matchesType && matchesSearch && matchesLevel && matchesStatus;
        });
    }, [allPrograms, searchQuery, selectedLevel, selectedStatus, learningCourses, enrollments]);

    const loading = userLoading || programsLoading || coursesLoading || enrollmentsLoading;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
            <div className="w-full">
                {/* Programs Management Hero */}
                <div className="bg-primary text-white p-8 mb-8 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">{pageTitle}</h1>
                            <p className="text-white/80 text-lg font-medium">{pageDescription}</p>
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

                {/* Search & Filters Row */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Filter Search</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search courses, modules, skills..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Expertise Level"
                            value={selectedLevel}
                            onChange={(val: string) => setSelectedLevel(val)}
                            options={[
                                { value: 'all', label: 'All Levels' },
                                { value: 'Beginner', label: 'Beginner' },
                                { value: 'Intermediate', label: 'Intermediate' },
                                { value: 'Advanced', label: 'Advanced' }
                            ]}
                            className="w-full sm:w-56"
                        />

                        <DropdownCard
                            label="Learning Status"
                            value={selectedStatus}
                            onChange={(val: string) => setSelectedStatus(val)}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'enrolled', label: 'Enrolled' },
                                { value: 'explore', label: 'Not Enrolled' }
                            ]}
                            className="w-full sm:w-56"
                        />
                    </div>
                </div>

                {/* Programs List Container */}
                <div className="w-full space-y-12">
                    {/* My Programs Section */}
                    {filteredData.some(p => {
                        // Check enrollment logic again for inline usage
                        const course = learningCourses?.find(c => c.programId === p.id);
                        const isEnrolled = course
                            ? enrollments?.some(e => e.courseId === course.id && e.status !== 'Dropped')
                            : enrollments?.some(e => e.programId === p.id && e.status !== 'Dropped');
                        return isEnrolled;
                    }) && (
                            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <User className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-primary">My Programs</h2>
                                        <p className="text-sm text-primary/60">Programs you are currently enrolled in</p>
                                    </div>
                                </div>
                                <ProgramList
                                    programs={filteredData.filter(p => {
                                        const course = learningCourses?.find(c => c.programId === p.id);
                                        return course
                                            ? enrollments?.some(e => e.courseId === course.id && e.status !== 'Dropped')
                                            : enrollments?.some(e => e.programId === p.id && e.status !== 'Dropped');
                                    })}
                                    learningCourses={learningCourses || []}
                                    enrollments={enrollments || []}
                                    isEnrolledSection={true}
                                />
                            </div>
                        )}

                    {/* Available Programs Section */}
                    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
                        <ProgramList
                            programs={filteredData.filter(p => {
                                const course = learningCourses?.find(c => c.programId === p.id);
                                const isEnrolled = course
                                    ? enrollments?.some(e => e.courseId === course.id && e.status !== 'Dropped')
                                    : enrollments?.some(e => e.programId === p.id && e.status !== 'Dropped');
                                return !isEnrolled;
                            })}
                            learningCourses={learningCourses || []}
                            enrollments={enrollments || []}
                            isEnrolledSection={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

function ProgramList({
    programs,
    learningCourses,
    enrollments,
    isEnrolledSection = false,
    startIndex = 1
}: {
    programs: Program[],
    learningCourses: LearningCourse[],
    enrollments: LearnerEnrollment[],
    isEnrolledSection?: boolean,
    startIndex?: number
}) {
    if (programs.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50/50 border border-dashed border-primary/10 rounded-2xl">
                <BookOpen className="h-12 w-12 text-primary/20 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-primary mb-1 uppercase tracking-wider">
                    {isEnrolledSection ? "No Active Enrollments" : "No Programs Available"}
                </h3>
                <p className="text-sm text-primary/50 max-w-sm mx-auto">
                    {isEnrolledSection
                        ? "You are not enrolled in any programs yet. Check out the available programs below."
                        : "There are no new programs available at the moment. Please check back later."}
                </p>
            </div>
        )
    }

    if (isEnrolledSection) {
        return (
            <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader className="bg-primary/5 border-b border-primary/10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="px-4 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">#</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Type / Status</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Progress</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date / Location</TableHead>
                                <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-primary/10">
                            {programs.map((program, idx) => {
                                const course = learningCourses.find(c => c.programId === program.id);
                                const enrollment = course
                                    ? enrollments.find(e => e.courseId === course.id && e.status !== 'Dropped')
                                    : enrollments.find(e => e.programId === program.id && e.status !== 'Dropped');

                                return (
                                    <ProgramTableRow
                                        key={program.id}
                                        program={program}
                                        course={course}
                                        enrollment={enrollment}
                                        isEnrolled={true}
                                        rowNumber={startIndex + idx}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    // Available Programs - Table View
    return (
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <div className="overflow-x-auto">
                <Table className="w-full">
                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-4 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">#</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Type</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Pricing</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date / Location</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-primary/10">
                        {programs.map((program, idx) => (
                            <ProgramTableRow
                                key={program.id}
                                program={program}
                                course={learningCourses.find(c => c.programId === program.id)}
                                isEnrolled={false}
                                rowNumber={startIndex + idx}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Enrolled Program Row (Table View)
// ----------------------------------------------------------------------

function ProgramTableRow({
    program,
    course,
    enrollment,
    isEnrolled,
    rowNumber = 1
}: {
    program: Program,
    course?: LearningCourse,
    enrollment?: LearnerEnrollment,
    isEnrolled: boolean,
    rowNumber?: number
}) {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Ongoing';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const title = program.programName || program.title || 'Untitled';
    const description = program.shortDescription || program.description || '';
    const imageUrl = program.imageUrl || program.image || '';

    return (
        <TableRow className={cn(
            "hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10",
            isEnrolled && "hover:bg-green-50/50 bg-green-50/10"
        )}>
            {/* P-number column */}
            <TableCell className="px-4 py-4">
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-sm">
                    P{rowNumber}
                </span>
            </TableCell>
            <TableCell className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border",
                        isEnrolled ? "bg-green-500 text-white border-green-600" : "bg-primary/10 border-primary/5"
                    )}>
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className={cn("h-6 w-6", isEnrolled ? "text-white" : "text-primary/40")} />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-primary leading-tight line-clamp-1">
                            {title}
                        </span>
                        <span className="text-[10px] text-primary/60 mt-0.5 line-clamp-1 max-w-[250px] text-ellipsis">{description}</span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "w-fit text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                        program.programType === 'Event' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                    )}>
                        {program.programType}
                    </span>
                    {enrollment && (
                        <span className={cn(
                            "w-fit text-[9px] font-bold uppercase px-2 py-0.5 text-white rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                            enrollment.status === 'Completed' ? "bg-blue-500" : "bg-green-500"
                        )}>
                            {enrollment.status}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
                {isEnrolled ? (
                    enrollment ? (
                        <div className="w-full max-w-[140px] mx-auto">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-primary/60 uppercase">Progress</span>
                                <span className="text-[9px] font-bold text-primary">{enrollment.overallProgress || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent transition-all duration-500"
                                    style={{ width: `${enrollment.overallProgress || 0}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-primary/40">-</span>
                    )
                ) : (
                    <div className="flex items-center gap-1 font-bold text-primary justify-center">
                        <Tag className="h-3 w-3 text-accent" />
                        <span>{program.price || 'FREE'}</span>
                    </div>
                )}
            </TableCell>
            <TableCell className="px-6 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-primary/70">
                        <Calendar className="h-3 w-3" />
                        {(() => {
                            const d = (program as any).date || program.intakes?.[0]?.startDate;
                            if (!d) return 'Ongoing';
                            const dateObj = (d as any).toDate ? (d as any).toDate() : new Date(d);
                            return !isNaN(dateObj.getTime()) ? formatDate(dateObj.toISOString()) : 'Ongoing';
                        })()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-primary/50 text-ellipsis line-clamp-1">
                        <MapPin className="h-3 w-3" />
                        {(program as any).location || 'Online / Remote'}
                    </div>
                </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                    {/* View button — always visible */}
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        title="View"
                    >
                        <Link href={`/l/programs/${program.slug || program.id}`}>
                            <Eye className="h-4 w-4 text-primary" />
                        </Link>
                    </Button>

                    {/* Register / Continue button */}
                    {course && isEnrolled ? (
                        <Button
                            asChild
                            size="sm"
                            className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold text-[10px] uppercase tracking-widest"
                        >
                            <Link href={`/dashboard/curriculum/${course.id}`}>
                                <BookOpen className="h-4 w-4 mr-1" />
                                Continue
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            asChild
                            size="sm"
                            className="h-8 bg-accent hover:bg-accent/90 text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold text-[10px] uppercase tracking-widest"
                            title="Register"
                        >
                            <Link href={`/l/programs/${program.slug || program.id}`}>
                                <Zap className="h-4 w-4 mr-1" />
                                Register
                            </Link>
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}



function DropdownCard({ label, value, onChange, options, className }: any) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative group">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2 text-sm md:text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm h-14"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="font-medium">{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
                </div>
            </div>
        </div>
    );
}
