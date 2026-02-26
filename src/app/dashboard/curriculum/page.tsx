'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Settings
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { cn } from "@/lib/utils";
import type { ClassroomSession } from '@/lib/classroom-types';
import { Badge } from '@/components/ui/badge';
import { LearningSessionDialog } from '@/components/learning/session-dialog';
import {
    Users as UsersIcon,
    BookOpen,
    ChevronRight as ChevronRightIcon,
    LayoutGrid,
    Search,
    AlertCircle
} from 'lucide-react';
import { Input as SearchInput } from "@/components/ui/input";
import type { Cohort } from '@/lib/cohort-types';
import type { LearningCourse, LearningModule } from '@/lib/learning-types';
import type { User } from '@/lib/user-types';
import type { Program } from '@/lib/program-types';
import type { Admission } from '@/lib/admission-types';

export default function LearnerCurriculumPage() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ClassroomSession | null>(null);

    // Fetch Global Data
    const sessionsQuery = useMemo(() => firestore ? query(collection(firestore, 'classroom'), orderBy('startDateTime', 'asc')) : null, [firestore]);
    const { data: allSessions } = useCollection<ClassroomSession>(sessionsQuery as any);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts')) : null, [firestore]);
    const { data: cohorts } = useCollection<Cohort>(cohortsQuery as any);

    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery as any);

    const admissionsQuery = useMemo(() => firestore && currentUser ? query(collection(firestore, 'admissions'), where('userId', '==', currentUser.id)) : null, [firestore, currentUser]);
    const { data: admissions } = useCollection<Admission>(admissionsQuery as any);

    // Filtered Cohorts for listing (only placed/admitted cohorts for the current learner)
    const filteredCohorts = useMemo(() => {
        if (!cohorts || !admissions) return [];

        // Find cohorts the user has been placed/admitted into
        const userCohortIds = new Set(
            admissions
                .filter(a => ['Placed', 'Admitted'].includes(a.status))
                .map(a => a.finalCohortId || a.cohortId)
                .filter(Boolean)
        );

        return cohorts.filter(c =>
            userCohortIds.has(c.id) &&
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.status.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [cohorts, admissions, searchQuery]);

    // Data for Selected Cohort
    const selectedCohort = useMemo(() => cohorts?.find(c => c.id === selectedCohortId), [cohorts, selectedCohortId]);

    const cohortCoursesQuery = useMemo(() => {
        if (!firestore || !selectedCohortId) return null;
        return query(collection(firestore, 'learningCourses'), where('cohortId', '==', selectedCohortId));
    }, [firestore, selectedCohortId]);
    const { data: cohortCourses } = useCollection<LearningCourse>(cohortCoursesQuery as any);

    const cohortModulesQuery = useMemo(() => {
        if (!firestore || !cohortCourses || cohortCourses.length === 0) return null;
        const courseIds = cohortCourses.map(c => c.id).slice(0, 10);
        return query(
            collection(firestore, 'learningUnits'),
            where('courseId', 'in', courseIds)
        );
    }, [firestore, cohortCourses]);
    const { data: cohortModules } = useCollection<LearningModule>(cohortModulesQuery as any);

    const cohortSessions = useMemo(() => {
        if (!allSessions || !selectedCohortId) return [];
        return allSessions.filter(s => s.cohortId === selectedCohortId);
    }, [allSessions, selectedCohortId]);

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    const handleEditSession = (e: React.MouseEvent, session: ClassroomSession) => {
        e.stopPropagation();
        setSelectedSession(session);
        setIsDialogOpen(true);
    };

    // Filter sessions for a specific day
    const getSessionsForDay = (day: Date) => {
        const source = selectedCohortId ? cohortSessions : allSessions;
        if (!source) return [];
        return source.filter(s => isSameDay(s.startDateTime.toDate(), day));
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            {/* Hero Section */}
            <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {selectedCohortId ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedCohortId(null)}
                                    className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                            ) : (
                                <BookOpen className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                            )}
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                {selectedCohortId ? selectedCohort?.name : 'My Programs'}
                            </h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            {selectedCohortId ? `Curriculum for ${selectedCohort?.name}` : 'Access your learning materials and curriculum'}
                        </p>
                    </div>

                    {!selectedCohortId && (
                        <div className="flex items-center gap-3">
                            <Button
                                asChild
                                variant="outline"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                            >
                                <Link href="/dashboard/timetable">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    View Timetable
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar (Only in Cohort List) */}
            {!selectedCohortId && (
                <div className="flex justify-end mb-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <SearchInput
                            placeholder="Search programs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 border-gray-200 rounded-lg bg-white"
                        />
                    </div>
                </div>
            )}

            {/* Calendar Navigation (Only when cohort selected) */}
            {selectedCohortId && (
                <div className="flex items-center justify-end gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm mb-6 w-fit ml-auto">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-black w-32 text-center text-primary uppercase tracking-wide">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg">
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <Button variant="ghost" size="sm" onClick={jumpToToday} className="h-8 text-xs font-bold uppercase text-accent hover:text-accent hover:bg-accent/10">
                        Today
                    </Button>
                </div>
            )}

            {/* Cohort Listing View */}
            {!selectedCohortId && (
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-primary/5 border-b border-primary/10">
                                <tr className="hover:bg-transparent text-left">
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">#</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program Name</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Period</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Scheduled Classes</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/10">
                                {filteredCohorts.length > 0 ? (
                                    filteredCohorts.map((cohort, index) => {
                                        // Get program names for this cohort
                                        const cohortPrograms = cohort.programIds?.map(pid =>
                                            programs?.find(p => p.id === pid)?.title || 'Unknown Program'
                                        ) || [];

                                        // Get sessions for this cohort
                                        const cohortSessionsCount = allSessions?.filter(s => s.cohortId === cohort.id).length || 0;

                                        // Calculate period
                                        const startDate = cohort.startDate ? new Date(cohort.startDate) : null;
                                        const endDate = cohort.endDate ? new Date(cohort.endDate) : null;
                                        const periodText = startDate && endDate
                                            ? `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
                                            : startDate
                                                ? `Starts ${format(startDate, 'MMM d, yyyy')}`
                                                : 'Dates TBD';

                                        return (
                                            <tr
                                                key={cohort.id}
                                                className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10"
                                                onClick={() => setSelectedCohortId(cohort.id)}
                                            >
                                                <td className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary/10 border border-primary/5">
                                                            <BookOpen className="h-6 w-6 text-primary/40" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary leading-tight line-clamp-1">{cohort.name}</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {cohortPrograms.slice(0, 2).map((programName, idx) => (
                                                                    <Badge key={idx} variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 border-primary/20 text-primary/60 bg-primary/5">
                                                                        {programName}
                                                                    </Badge>
                                                                ))}
                                                                {cohortPrograms.length > 2 && (
                                                                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 border-primary/20 text-primary/60 bg-primary/5">
                                                                        +{cohortPrograms.length - 2} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-xs font-bold text-primary/80">{periodText}</p>
                                                        {startDate && endDate && (
                                                            <p className="text-[10px] text-primary/50 uppercase tracking-wider">
                                                                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                                                                <span className="text-sm font-black text-accent">{cohortSessionsCount}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-primary/50 uppercase tracking-wider font-bold">
                                                            {cohortSessionsCount === 1 ? 'Class' : 'Classes'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-primary/20 text-primary/60 bg-primary/5">
                                                        {cohort.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold"
                                                        >
                                                            View Details <ChevronRightIcon className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <BookOpen className="h-16 w-16 text-gray-200 mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest">No programs found</p>
                                                <p className="text-xs text-gray-400 mt-2">You haven't been enrolled in any programs yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cohort Detail View (Curriculum) */}
            {selectedCohortId && (
                <div className="space-y-6">
                    {/* Metrics/Overview for Cohort */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Modules</p>
                            <p className="text-3xl font-bold text-primary">{cohortModules?.length || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Scheduled Classes</p>
                            <p className="text-3xl font-bold text-accent">{cohortSessions.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Facilitators</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {new Set(cohortSessions.map(s => s.facilitatorId).filter(Boolean)).size}
                            </p>
                        </div>
                    </div>

                    {/* Program Setup List */}
                    <div className="bg-white rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-xl overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b border-primary/10">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Settings className="h-5 w-5 text-accent" />
                                Program Configuration
                            </h2>
                            <p className="text-sm text-primary/60 mt-1">View programs within this cohort</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {selectedCohort?.programIds?.map(pid => {
                                const program = programs?.find(p => p.id === pid);
                                const course = cohortCourses?.find(c => c.programId === pid);

                                return (
                                    <div key={pid} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                <BookOpen className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary">{program?.title || 'Unknown Program'}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {course ? (
                                                        <Badge className="bg-green-500 text-[10px] uppercase font-bold py-0 h-4">Active</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 border-orange-200 text-orange-600 bg-orange-50">Not Configured</Badge>
                                                    )}
                                                    <span className="text-xs text-gray-400">• {course?.unitIds?.length || 0} Modules</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Modules List Management */}
                    <div className="bg-white rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-xl overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b border-primary/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-accent" />
                                    Curriculum & Schedule
                                </h2>
                                <p className="text-sm text-primary/60 mt-1">View your learning materials and schedule</p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {cohortModules && cohortModules.length > 0 ? (
                                cohortModules
                                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                    .map((module, idx) => {
                                        const session = cohortSessions.find(s => s.unitId === module.id);
                                        return (
                                            <div key={module.id} className="p-6 transition-colors hover:bg-gray-50/50 group">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-bold text-primary group-hover:text-accent transition-colors">{module.title}</h3>
                                                                <Badge variant="outline" className="text-[10px] bg-primary/5 border-none">
                                                                    {module.deliveryType}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-none">
                                                                    {module.estimatedDuration} mins
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-500 line-clamp-1">{module.description}</p>

                                                            {/* Scheduling Status */}
                                                            <div className="mt-3 flex flex-wrap gap-4">
                                                                {session ? (
                                                                    <>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                            {format(session.startDateTime.toDate(), 'MMM do, h:mm a')}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                                                            <UsersIcon className="h-3.5 w-3.5" />
                                                                            {facilitators?.find(f => f.id === session.facilitatorId)?.name || 'Needs Facilitator'}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 animate-pulse-subtle">
                                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                                        Not Scheduled
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-primary">
                                                            <ChevronRightIcon className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="p-20 text-center">
                                    <BookOpen className="h-16 w-16 mx-auto text-gray-100 mb-4" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest">No modules found for this program</p>
                                    <p className="text-xs text-gray-400 mt-2">Check back later for learning materials.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detailed Cohort Calendar */}
                    <div className="bg-white rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-xl overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b border-primary/10">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-accent" />
                                Program Schedule Preview
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px">
                                    {calendarDays.map((day) => {
                                        const daySessions = getSessionsForDay(day);
                                        return (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    "min-h-[80px] bg-white p-1 relative hover:bg-gray-50 transition-colors",
                                                    !isSameMonth(day, currentDate) && "bg-gray-50/50 text-gray-400"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={cn(
                                                        "text-[10px] font-bold flex h-5 w-5 items-center justify-center rounded-full",
                                                        isToday(day) ? "bg-accent text-white" : "text-gray-700",
                                                        !isSameMonth(day, currentDate) && "text-gray-400"
                                                    )}>
                                                        {format(day, 'd')}
                                                    </span>
                                                </div>

                                                <div className="space-y-0.5 mt-0.5">
                                                    {daySessions.map(session => (
                                                        <div
                                                            key={session.id}
                                                            onClick={(e) => handleEditSession(e, session)}
                                                            className={cn(
                                                                "text-[8px] p-1 rounded truncate font-medium border-l cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5",
                                                                session.type === 'Virtual' ? "bg-blue-50 border-blue-500 text-blue-700" :
                                                                    session.type === 'Physical' ? "bg-orange-50 border-orange-500 text-orange-700" :
                                                                        "bg-purple-50 border-purple-500 text-purple-700"
                                                            )}
                                                        >
                                                            <span className="font-bold">{format(session.startDateTime.toDate(), 'HH:mm')}</span>
                                                            {session.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LearningSessionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                session={selectedSession}
            />
        </div>
    );
}
