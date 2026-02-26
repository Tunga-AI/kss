'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Video,
    FileText,
    Link as LinkIcon,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';

function FacilitatorSessionDialog({ open, onOpenChange, session }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: ClassroomSession | null;
}) {
    if (!session) return null;

    const isVirtual = session.type === 'Virtual' || session.type === 'Hybrid';
    const isPhysical = session.type === 'Physical' || session.type === 'Hybrid';
    const canStart = session.status === 'Scheduled' || session.status === 'In Progress';

    const formatDate = (ts: any) => format(ts.toDate(), 'EEEE, MMMM do, yyyy');
    const formatTime = (ts: any) => format(ts.toDate(), 'h:mm a');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white" aria-describedby={undefined}>
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={
                            session.type === 'Virtual' ? "bg-blue-100 text-blue-700 border-none" :
                                session.type === 'Physical' ? "bg-orange-100 text-orange-700 border-none" :
                                    "bg-purple-100 text-purple-700 border-none"
                        }>
                            {session.type || 'Session'}
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none">{session.status}</Badge>
                    </div>
                    <DialogTitle className="text-xl font-bold text-primary">{session.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg text-primary">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Time</p>
                            <p className="font-medium text-sm">{formatDate(session.startDateTime)}</p>
                            <p className="text-sm font-bold text-primary">
                                {formatTime(session.startDateTime)} - {formatTime(session.endDateTime)}
                            </p>
                        </div>
                    </div>

                    {isVirtual && (
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <Video className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Virtual Session</p>
                                <Link
                                    href={`/f/classroom/${session.id}`}
                                    className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                >
                                    <LinkIcon className="h-3 w-3" />
                                    Go to Session Room
                                </Link>
                                <p className="text-xs text-blue-400 mt-1">Live video session</p>
                            </div>
                        </div>
                    )}

                    {isPhysical && session.location && (
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Location</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">{session.location}</p>
                            </div>
                        </div>
                    )}

                    {session.description && (
                        <div className="flex items-start gap-3">
                            <div className="bg-gray-50 p-2 rounded-lg text-gray-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Details</p>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{session.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    {canStart && (
                        <Button className="bg-accent hover:bg-accent/90 text-white" asChild>
                            <Link href={`/f/classroom/${session.id}`}>
                                {session.status === 'In Progress' ? 'Rejoin Session' : 'Start Session'}
                            </Link>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function StaffTimetablePage() {
    const firestore = useFirestore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'agenda'>('month');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ClassroomSession | null>(null);

    const sessionsQuery = useMemo(() =>
        firestore ? query(collection(firestore, 'classroom'), orderBy('startDateTime', 'asc')) : null,
        [firestore]
    );
    const { data: sessions, loading } = useCollection<ClassroomSession>(sessionsQuery as any);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    const handleSessionClick = (e: React.MouseEvent, session: ClassroomSession) => {
        e.stopPropagation();
        setSelectedSession(session);
        setIsDialogOpen(true);
    };

    const getSessionsForDay = (day: Date) => {
        if (!sessions) return [];
        return sessions.filter(s => isSameDay(s.startDateTime.toDate(), day));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            {/* Hero Section */}
            <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Timetable</h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">View and manage your scheduled sessions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                            <p className="text-2xl font-bold">{format(new Date(), 'd')}</p>
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/60">{format(new Date(), 'MMMM yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
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
                        onClick={() => setView('agenda')}
                        className={cn("h-8 rounded-md text-xs font-bold uppercase transition-all", view === 'agenda' ? "bg-primary text-white shadow-md" : "text-gray-500 hover:text-primary hover:bg-gray-50")}
                    >
                        Agenda View
                    </Button>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
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
            </div>

            {/* Month View */}
            {view === 'month' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
                        {calendarDays.map((day) => {
                            const daySessions = getSessionsForDay(day);
                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "min-h-[120px] bg-white p-2 relative hover:bg-gray-50 transition-colors cursor-default",
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
                                            <span className="text-[10px] font-bold text-gray-400">{daySessions.length} session{daySessions.length > 1 ? 's' : ''}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1 mt-1">
                                        {daySessions.slice(0, 3).map(session => (
                                            <div
                                                key={session.id}
                                                onClick={(e) => handleSessionClick(e, session)}
                                                className={cn(
                                                    "text-[10px] p-1.5 rounded truncate font-medium border-l-2 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
                                                    session.type === 'Virtual' ? "bg-blue-50 border-blue-500 text-blue-700" :
                                                        session.type === 'Physical' ? "bg-orange-50 border-orange-500 text-orange-700" :
                                                            "bg-purple-50 border-purple-500 text-purple-700"
                                                )}
                                            >
                                                <span className="font-bold">{format(session.startDateTime.toDate(), 'HH:mm')}</span>
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

            {/* Agenda View */}
            {view === 'agenda' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                    {sessions && sessions.filter(s => isSameMonth(s.startDateTime.toDate(), currentDate)).length > 0 ? (
                        sessions
                            .filter(s => isSameMonth(s.startDateTime.toDate(), currentDate))
                            .map(session => (
                                <div
                                    key={session.id}
                                    onClick={(e) => handleSessionClick(e, session)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex flex-col items-center justify-center w-16 bg-gray-50 rounded-lg p-2 text-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">{format(session.startDateTime.toDate(), 'MMM')}</span>
                                        <span className="text-2xl font-bold text-primary">{format(session.startDateTime.toDate(), 'dd')}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] py-0 px-2 uppercase tracking-wide border-none font-bold",
                                                session.type === 'Virtual' ? "bg-blue-100 text-blue-700" :
                                                    session.type === 'Physical' ? "bg-orange-100 text-orange-700" :
                                                        "bg-purple-100 text-purple-700"
                                            )}>
                                                {session.type || 'Session'}
                                            </Badge>
                                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(session.startDateTime.toDate(), 'h:mm a')} - {format(session.endDateTime.toDate(), 'h:mm a')}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-primary">{session.title}</h3>
                                        {session.description && <p className="text-sm text-gray-500 line-clamp-1">{session.description}</p>}
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500 font-medium">
                                            {session.type === 'Virtual' && (
                                                <span className="flex items-center gap-1 text-blue-600"><Video className="h-3 w-3" /> Live Classroom</span>
                                            )}
                                            {session.location && (
                                                <span className="flex items-center gap-1 text-orange-600"><MapPin className="h-3 w-3" /> {session.location}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                    ) : (
                        <div className="text-center py-20 text-gray-400">No sessions scheduled for this month.</div>
                    )}
                </div>
            )}

            <FacilitatorSessionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                session={selectedSession}
            />
        </div>
    );
}
