'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Video,
    Plus,
    List,
    Settings,
    ArrowRight
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
import { Badge } from '@/components/ui/badge';
import {
    Users as UsersIcon,
    BookOpen,
    ChevronRight as ChevronRightIcon,
    LayoutGrid,
    Search,
    BookCheck,
    AlertCircle
} from 'lucide-react';
import { Input as SearchInput } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Cohort } from '@/lib/cohort-types';
import type { LearningCourse, LearningModule } from '@/lib/learning-types';
import type { User } from '@/lib/user-types';
import type { Program } from '@/lib/program-types';

export default function AdminLearningPage() {
    const firestore = useUsersFirestore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'cohorts'>('month');
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Global Data
    // Fetch all learning modules that have been scheduled
    const sessionsQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits'), orderBy('scheduledStartDate', 'asc')) : null, [firestore]);
    const { data: allSessionsRaw, loading: sessionsLoading } = useCollection<LearningModule>(sessionsQuery as any);

    // We only want modules that actually have a schedule
    const allSessions = useMemo(() => allSessionsRaw?.filter(m => m.scheduledStartDate) || [], [allSessionsRaw]);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts')) : null, [firestore]);
    const { data: cohorts, loading: cohortsLoading } = useCollection<Cohort>(cohortsQuery as any);

    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery as any);

    // Fetch all courses globally to be able to map modules to cohorts universally
    const allCoursesQuery = useMemo(() => firestore ? query(collection(firestore, 'learningCourses')) : null, [firestore]);
    const { data: allCourses } = useCollection<LearningCourse>(allCoursesQuery as any);

    // Filtered Cohorts for listing
    const filteredCohorts = useMemo(() => {
        if (!cohorts) return [];
        return cohorts.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.status.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [cohorts, searchQuery]);

    // Data for Selected Cohort
    const selectedCohort = useMemo(() => cohorts?.find(c => c.id === selectedCohortId), [cohorts, selectedCohortId]);

    const cohortCourses = useMemo(() => {
        if (!allCourses || !selectedCohortId) return [];
        return allCourses.filter(c => c.cohortId === selectedCohortId);
    }, [allCourses, selectedCohortId]);

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
        if (!allSessions || !selectedCohortId || !allCourses) return [];
        const cCourseIds = allCourses.filter(c => c.cohortId === selectedCohortId).map(c => c.id);
        return allSessions.filter(s => cCourseIds.includes(s.courseId));
    }, [allSessions, selectedCohortId, allCourses]);

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    // Filter sessions for a specific day
    const getSessionsForDay = (day: Date) => {
        const source = selectedCohortId ? cohortSessions : allSessions;
        if (!source) return [];
        return source.filter(s => s.scheduledStartDate && isSameDay(s.scheduledStartDate.toDate(), day));
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
                                <Clock className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                            )}
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                {selectedCohortId ? selectedCohort?.name : 'Learning Management'}
                            </h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            {selectedCohortId ? `Building program for ${selectedCohort?.name}` : 'Coordinate program units, resources and learning schedules'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 
                            Removed "New Class" button as calendar entries are now managed
                            directly via course modules / curriculum building.
                        */}
                    </div>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                {/* View Toggle */}
                {!selectedCohortId && (
                    <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('month')}
                            className={cn("h-8 rounded-md text-xs font-bold uppercase transition-all", view === 'month' ? "bg-primary text-white shadow-md" : "text-gray-500 hover:text-primary hover:bg-gray-50")}
                        >
                            Month View
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('cohorts')}
                            className={cn("h-8 rounded-md text-xs font-bold uppercase transition-all", view === 'cohorts' ? "bg-primary text-white shadow-md" : "text-gray-500 hover:text-primary hover:bg-gray-50")}
                        >
                            Cohorts / Programs
                        </Button>
                    </div>
                )}

                {/* Cohort Search (Only in Cohort List) */}
                {(view === 'cohorts' && !selectedCohortId) && (
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <SearchInput
                            placeholder="Search cohorts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 border-gray-200 rounded-lg bg-white"
                        />
                    </div>
                )}

                {/* Calendar Navigation */}
                {(view === 'month' || selectedCohortId) && (
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm ml-auto">
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
            </div>

            {/* Main Content Area */}
            {(!selectedCohortId && view === 'month') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
                        {calendarDays.map((day, dayIdx) => {
                            const daySessions = getSessionsForDay(day);
                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "min-h-[120px] bg-white p-2 relative hover:bg-gray-50 transition-colors group",
                                        !isSameMonth(day, currentDate) && "bg-gray-50/50 text-gray-400"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn(
                                            "text-sm font-bold flex h-7 w-7 items-center justify-center rounded-full",
                                            isToday(day) ? "bg-accent text-white" : "text-gray-700",
                                            !isSameMonth(day, currentDate) && "text-gray-400"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {daySessions.length > 0 && (
                                            <span className="text-[10px] font-bold text-gray-400">{daySessions.length} classes</span>
                                        )}
                                    </div>

                                    <div className="space-y-1 mt-1">
                                        {daySessions.slice(0, 3).map(session => (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "text-[10px] p-1.5 rounded truncate font-medium border-l-2 transition-opacity flex items-center gap-1",
                                                    session.deliveryType === 'Virtual' ? "bg-blue-50 border-blue-500 text-blue-700" :
                                                        session.deliveryType === 'Physical' ? "bg-orange-50 border-orange-500 text-orange-700" :
                                                            "bg-purple-50 border-purple-500 text-purple-700"
                                                )}
                                            >
                                                <span className="font-bold">{format(session.scheduledStartDate!.toDate(), 'HH:mm')}</span>
                                                {session.title}
                                            </div>
                                        ))}
                                        {daySessions.length > 3 && (
                                            <div className="text-[10px] text-center text-gray-400 font-medium">
                                                + {daySessions.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cohort Listing View */}
            {(view === 'cohorts' && !selectedCohortId) && (
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-primary/5 border-b border-primary/10">
                                <tr className="hover:bg-transparent text-left">
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">#</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Cohort Details</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Programs</th>
                                    <th className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/10">
                                {filteredCohorts.length > 0 ? (
                                    filteredCohorts.map((cohort, index) => (
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
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary/10 border border-primary/5">
                                                        <UsersIcon className="h-5 w-5 text-primary/40" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary leading-tight line-clamp-1">{cohort.name}</p>
                                                        <p className="text-[10px] text-primary/60 mt-0.5 uppercase tracking-tighter line-clamp-1 max-w-[300px]">
                                                            {cohort.description || 'No description provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-primary/20 text-primary/60 bg-primary/5">
                                                    {cohort.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary/70">
                                                        <LayoutGrid className="h-3 w-3" />
                                                        {cohort.programIds?.length || 0} Programs
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold"
                                                    >
                                                        Manage <ChevronRightIcon className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <UsersIcon className="h-16 w-16 text-gray-200 mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest">No cohorts found matching your search</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cohort Management View (Building the Program) */}
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
                            <p className="text-sm text-primary/60 mt-1">Configure individual programs within this cohort</p>
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
                                        <Button
                                            asChild
                                            className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg font-bold"
                                        >
                                            <Link href={`/admin/learning/setup?cohortId=${selectedCohortId}&programId=${pid}`}>
                                                <Settings className="h-4 w-4 mr-2" />
                                                Program Setup
                                            </Link>
                                        </Button>
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
                                    Learning Modules & Schedule
                                </h2>
                                <p className="text-sm text-primary/60 mt-1">Below are the modules for this cohort. Note: Setup their schedules from Curriculum page.</p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {cohortModules && cohortModules.length > 0 ? (
                                cohortModules
                                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                    .map((module, idx) => {
                                        const session = module.scheduledStartDate ? module : null;
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
                                                                {module.estimatedDuration && (
                                                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-none">
                                                                        {module.estimatedDuration} mins
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 line-clamp-1">{module.description}</p>

                                                            {/* Scheduling Status */}
                                                            <div className="mt-3 flex flex-wrap gap-4">
                                                                {session ? (
                                                                    <>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                            {format(session.scheduledStartDate!.toDate(), 'MMM do, h:mm a')}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                                                            <UsersIcon className="h-3.5 w-3.5" />
                                                                            {facilitators?.find(f => f.id === session.facilitatorId)?.name || session.facilitatorName || 'Needs Facilitator'}
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
                                                        <Button
                                                            size="sm"
                                                            asChild
                                                            className="h-9 px-4 rounded-tl-lg rounded-br-lg font-bold bg-accent hover:bg-accent/90 text-white shadow-lg"
                                                        >
                                                            <Link href={`/a/curriculum/${module.courseId}`}>
                                                                Manage Module
                                                            </Link>
                                                        </Button>
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
                                    <p className="text-gray-400 font-bold uppercase tracking-widest">No modules found for this cohort's courses</p>
                                    <p className="text-xs text-gray-400 mt-2">Ensure this cohort is assigned a program with valid courses.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detailed Cohort Calendar */}
                    <div className="bg-white rounded-tl-2xl rounded-br-2xl border border-primary/10 shadow-xl overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b border-primary/10">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-accent" />
                                Cohort Schedule Preview
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
                                                    "min-h-[80px] bg-white p-1 relative hover:bg-gray-50 transition-colors group",
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
                                                            className={cn(
                                                                "text-[8px] p-1 rounded truncate font-medium border-l transition-opacity flex items-center gap-0.5",
                                                                session.deliveryType === 'Virtual' ? "bg-blue-50 border-blue-500 text-blue-700" :
                                                                    session.deliveryType === 'Physical' ? "bg-orange-50 border-orange-500 text-orange-700" :
                                                                        "bg-purple-50 border-purple-500 text-purple-700"
                                                            )}
                                                        >
                                                            <span className="font-bold">{format(session.scheduledStartDate!.toDate(), 'HH:mm')}</span>
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
        </div>
    );
}
