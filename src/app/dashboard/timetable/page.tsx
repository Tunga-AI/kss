'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Video,
    Users,
    BookOpen,
    ExternalLink,
    X,
    PlayCircle,
    Monitor
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
    isToday,
    isPast,
    isFuture
} from 'date-fns';
import { cn } from "@/lib/utils";
import type { LearningModule, LearningCourse } from '@/lib/learning-types';
import type { User } from '@/lib/user-types';
import type { Program } from '@/lib/program-types';
import type { Cohort } from '@/lib/cohort-types';

export default function LearnerTimetablePage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user: currentUser } = useUser();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<LearningModule | null>(null);

    // Fetch learning courses for the current user's cohort
    const coursesQuery = useMemo(() => {
        if (!firestore || !currentUser?.cohortId) return null;
        return query(collection(firestore, 'learningCourses'), where('cohortId', '==', currentUser.cohortId));
    }, [firestore, currentUser?.cohortId]);
    const { data: courses } = useCollection<LearningCourse>(coursesQuery as any);

    const courseIds = useMemo(() => courses?.map(c => c.id) || [], [courses]);

    // Fetch ALL scheduled units globally (if too many we could fetch by chunking courseIds, but querying all scheduled ones is fine for now)
    const sessionsQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits'), orderBy('scheduledStartDate', 'asc')) : null, [firestore]);
    const { data: allSessionsRaw, loading: sessionsLoading } = useCollection<LearningModule>(sessionsQuery as any);

    // Filter modules to ONLY include those matching the user's cohort courses
    const allSessions = useMemo(() => {
        if (!allSessionsRaw || courseIds.length === 0) return [];
        return allSessionsRaw.filter(s => s.scheduledStartDate && courseIds.includes(s.courseId));
    }, [allSessionsRaw, courseIds]);

    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery as any);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts')) : null, [firestore]);
    const { data: cohorts } = useCollection<Cohort>(cohortsQuery as any);

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    const handleViewSession = (e: React.MouseEvent, session: LearningModule) => {
        e.stopPropagation();
        setSelectedSession(session);
        setIsModalOpen(true);
    };

    const handleOpenClass = () => {
        if (selectedSession) {
            router.push(`/dashboard/learning`); // Adjust to course/module view if necessary, or just main learning tab
        }
    };

    // Filter sessions for a specific day
    const getSessionsForDay = (day: Date) => {
        if (!allSessions) return [];
        return allSessions.filter(s => s.scheduledStartDate && isSameDay(s.scheduledStartDate.toDate(), day));
    };

    // Get supplementary info for the selected session
    const selectedFacilitator = useMemo(() => {
        if (!selectedSession?.facilitatorId || !facilitators) return null;
        return facilitators.find(f => f.id === selectedSession.facilitatorId);
    }, [selectedSession, facilitators]);

    const selectedProgram = useMemo(() => {
        // Module doesn't have programId, but its parent course does
        const course = courses?.find(c => c.id === selectedSession?.courseId);
        if (!course?.programId || !programs) return null;
        return programs.find(p => p.id === course.programId);
    }, [selectedSession, programs, courses]);

    const selectedCohort = useMemo(() => {
        if (!currentUser?.cohortId || !cohorts) return null;
        return cohorts.find(c => c.id === currentUser.cohortId);
    }, [currentUser, cohorts]);

    // Determine session status for display
    const getSessionDisplayStatus = (session: LearningModule) => {
        // Status checks for learning module
        const start = session.scheduledStartDate?.toDate();
        const end = session.scheduledEndDate?.toDate();
        const now = new Date();

        let isLive = false;
        let isCompleted = false;
        if (start && end) {
            isLive = now >= start && now <= end;
            isCompleted = now > end;
        } else if (start) {
            // fallback if no end date
            const estimatedEnd = new Date(start.getTime() + (session.estimatedDuration || 60) * 60000);
            isLive = now >= start && now <= estimatedEnd;
            isCompleted = now > estimatedEnd;
        }

        if (isLive) return { label: 'Live Now', color: 'bg-green-500 text-white animate-pulse' };
        if (isCompleted) return { label: 'Completed', color: 'bg-gray-400 text-white' };
        return { label: 'Scheduled', color: 'bg-blue-500 text-white' };
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            {/* Hero Section */}
            <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                My Timetable
                            </h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            View your class schedule and join sessions
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            asChild
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                        >
                            <Link href="/dashboard/learning">
                                <BookOpen className="h-4 w-4 mr-2" />
                                View Curriculum
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-end gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm mb-6 w-fit ml-auto">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-black w-32 text-center text-primary uppercase tracking-wide">
                    {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg">
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <Button variant="ghost" size="sm" onClick={jumpToToday} className="h-8 text-xs font-bold uppercase text-accent hover:text-accent hover:bg-accent/10">
                    Today
                </Button>
            </div>

            {/* Calendar View */}
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
                    {calendarDays.map((day) => {
                        const daySessions = getSessionsForDay(day);
                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "min-h-[120px] bg-white p-2 relative hover:bg-gray-50 transition-colors",
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
                                        <span className="text-[10px] font-bold text-gray-400">{daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}</span>
                                    )}
                                </div>

                                <div className="space-y-1 mt-1">
                                    {daySessions.slice(0, 3).map(session => {
                                        const status = getSessionDisplayStatus(session);
                                        return (
                                            <div
                                                key={session.id}
                                                onClick={(e) => handleViewSession(e, session)}
                                                className={cn(
                                                    "text-[10px] p-1.5 rounded truncate font-medium border-l-2 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
                                                    session.deliveryType === 'Virtual' ? "bg-blue-50 border-blue-500 text-blue-700" :
                                                        session.deliveryType === 'Physical' ? "bg-orange-50 border-orange-500 text-orange-700" :
                                                            "bg-purple-50 border-purple-500 text-purple-700"
                                                )}
                                            >
                                                {(status.label === 'Live Now') && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                                                )}
                                                <span className="font-bold">{format(session.scheduledStartDate!.toDate(), 'HH:mm')}</span>
                                                <span className="truncate">{session.title}</span>
                                            </div>
                                        );
                                    })}
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

            {/* Class Summary Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10">
                    {selectedSession && (() => {
                        const status = getSessionDisplayStatus(selectedSession);
                        const canJoin = status.label === 'Live Now';
                        const isScheduled = status.label === 'Scheduled';
                        const isCompleted = status.label === 'Completed';

                        return (
                            <>
                                {/* Header with Session Type Color */}
                                <div className={cn(
                                    "p-6 relative",
                                    selectedSession.deliveryType === 'Virtual' ? "bg-blue-600" :
                                        selectedSession.deliveryType === 'Physical' ? "bg-orange-600" :
                                            "bg-purple-600"
                                )}>
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <Badge className={cn("text-[10px] uppercase font-bold tracking-wider shadow-lg", status.color)}>
                                                {status.label}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px] uppercase font-bold">
                                                {selectedSession.deliveryType || 'Virtual'}
                                            </Badge>
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-1">{selectedSession.title}</h2>
                                        <p className="text-white/70 text-sm line-clamp-2">{selectedSession.description || 'No description provided'}</p>
                                    </div>
                                </div>

                                {/* Session Details */}
                                <div className="p-6 space-y-4">
                                    {/* Date & Time */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <CalendarIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Date & Time</p>
                                            <p className="text-sm font-bold text-primary">
                                                {format(selectedSession.scheduledStartDate!.toDate(), 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            <p className="text-xs text-primary/60 font-medium">
                                                {format(selectedSession.scheduledStartDate!.toDate(), 'h:mm a')}
                                                {selectedSession.scheduledEndDate && ` — ${format(selectedSession.scheduledEndDate.toDate(), 'h:mm a')}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Facilitator */}
                                    {(selectedFacilitator || selectedSession.facilitatorName) && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <Users className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Facilitator</p>
                                                <p className="text-sm font-bold text-primary">{selectedFacilitator?.name || selectedSession.facilitatorName}</p>
                                                {selectedFacilitator?.email && (
                                                    <p className="text-xs text-primary/60">{selectedFacilitator.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Program & Cohort */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedProgram && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                                    <BookOpen className="h-5 w-5 text-accent" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Program</p>
                                                    <p className="text-xs font-bold text-primary truncate">{selectedProgram.title}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedCohort && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                                    <Users className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Cohort</p>
                                                    <p className="text-xs font-bold text-primary truncate">{selectedCohort.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Location for Physical/Hybrid */}
                                    {selectedSession.location && (selectedSession.deliveryType === 'Physical' || selectedSession.deliveryType === 'Hybrid') && (
                                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                                                <MapPin className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-orange-800/60 uppercase tracking-wider">Location</p>
                                                <p className="text-sm font-bold text-orange-800">{selectedSession.location}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Live indicator for active session */}
                                    {canJoin && (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 animate-pulse">
                                            <div className="h-3 w-3 rounded-full bg-green-500 animate-ping" />
                                            <p className="text-sm font-bold text-green-700">This class is currently live — join now!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="px-6 pb-6">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold text-primary border-primary/20 hover:bg-primary/5"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Close
                                        </Button>
                                        <Button
                                            onClick={handleOpenClass}
                                            className={cn(
                                                "flex-1 h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all",
                                                canJoin
                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                    : isCompleted
                                                        ? "bg-primary hover:bg-primary/90 text-white"
                                                        : "bg-accent hover:bg-accent/90 text-white"
                                            )}
                                        >
                                            {canJoin ? (
                                                <>
                                                    <PlayCircle className="h-4 w-4 mr-2" />
                                                    Class Material
                                                </>
                                            ) : isCompleted ? (
                                                <>
                                                    <Monitor className="h-4 w-4 mr-2" />
                                                    View Details
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Class Material
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
