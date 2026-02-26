'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock
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
import type { LearningModule } from '@/lib/learning-types';

export default function FacilitatorTimetablePage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user: currentUser } = useUser();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Fetch sessions for this facilitator only
    const sessionsQuery = useMemo(() => {
        if (!firestore || !currentUser?.id) return null;
        // Notice we query learningUnits that have a facilitator assigned
        return query(
            collection(firestore, 'learningUnits'),
            where('facilitatorId', '==', currentUser.id),
            orderBy('scheduledStartDate', 'asc')
        );
    }, [firestore, currentUser?.id]);
    const { data: allSessionsRaw, loading: sessionsLoading } = useCollection<LearningModule>(sessionsQuery as any);

    const allSessions = useMemo(() => {
        return allSessionsRaw?.filter(s => s.scheduledStartDate) || [];
    }, [allSessionsRaw]);

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
        if (!allSessions) return [];
        return allSessions.filter(s => s.scheduledStartDate && isSameDay(s.scheduledStartDate.toDate(), day));
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
                                My Teaching Schedule
                            </h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            View your assigned classes and upcoming sessions
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            asChild
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                        >
                            <Link href="/staff/learning">
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
                    {calendarDays.map((day, dayIdx) => {
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
                                        <span className="text-[10px] font-bold text-gray-400">{daySessions.length} classes</span>
                                    )}
                                </div>

                                <div className="space-y-1 mt-1">
                                    {daySessions.slice(0, 3).map(session => (
                                        <div
                                            key={session.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push('/staff/learning'); // Simplification for now
                                            }}
                                            className={cn(
                                                "text-[10px] p-1.5 rounded truncate font-medium border-l-2 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
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
        </div>
    );
}
