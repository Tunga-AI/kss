'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeekView } from './week-view';

export default function StaffCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const firestore = useFirestore();

    const sessionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'classroom'), orderBy('startDateTime', 'asc'));
    }, [firestore]);

    const { data: allSessions, loading } = useCollection<ClassroomSession>(sessionsQuery);

    const sessionsByDate = useMemo(() => {
        const grouped: { [key: string]: ClassroomSession[] } = {};
        allSessions?.forEach(session => {
            const sessionDate = format(session.startDateTime.toDate(), 'yyyy-MM-dd');
            if (!grouped[sessionDate]) {
                grouped[sessionDate] = [];
            }
            grouped[sessionDate].push(session);
        });
        return grouped;
    }, [allSessions]);
    
    const selectedDaySessions = useMemo(() => {
        if (!currentDate) return [];
        const selectedDateStr = format(currentDate, 'yyyy-MM-dd');
        return sessionsByDate[selectedDateStr] || [];
    }, [currentDate, sessionsByDate]);

    const daysWithEvents = useMemo(() => {
        return Object.keys(sessionsByDate).map(dateStr => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        });
    }, [sessionsByDate]);

    const sessionsForWeekView = useMemo(() => {
        if (!allSessions) return [];
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return allSessions.filter(s => {
            const sessionDate = s.startDateTime.toDate();
            return sessionDate >= start && sessionDate <= end;
        });
    }, [allSessions, currentDate]);

    const handlePrev = () => {
        if (view === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    };

    const handleNext = () => {
        if (view === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };
    
    const handleToday = () => {
        setCurrentDate(new Date());
    }

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Calendar</CardTitle>
                            <CardDescription className="text-primary-foreground/80">View and manage the institution's schedule.</CardDescription>
                        </div>
                        <Button variant="secondary" asChild>
                            <Link href="/f/classroom/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Schedule Session
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={view} onValueChange={setView}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={handleToday}>Today</Button>
                            <div className="flex items-center gap-2">
                                 <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft/></Button>
                                 <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight/></Button>
                            </div>
                            <CardTitle className="font-headline text-lg sm:text-xl">
                                {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
                            </CardTitle>
                        </div>
                        <TabsList>
                            <TabsTrigger value="month">Month</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="month" className="mt-0">
                            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                                <Calendar
                                    mode="single"
                                    selected={currentDate}
                                    onSelect={(date) => date && setCurrentDate(date)}
                                    month={currentDate}
                                    onMonthChange={setCurrentDate}
                                    className="p-0"
                                    classNames={{
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                        day_today: "bg-accent/50 text-accent-foreground",
                                    }}
                                    modifiers={{
                                        hasEvent: daysWithEvents,
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: 'has-event'
                                    }}
                                />
                                <div>
                                    <h3 className="font-headline text-lg mb-4">
                                        Agenda for {format(currentDate, 'MMMM d, yyyy')}
                                    </h3>
                                    <div className="space-y-4">
                                        {loading && <p>Loading...</p>}
                                        {!loading && selectedDaySessions.length > 0 ? (
                                            selectedDaySessions.map(session => (
                                                <Link key={session.id} href={`/f/classroom/${session.id}`} className="block p-4 rounded-lg bg-muted hover:bg-accent/20 transition-colors">
                                                    <p className="font-semibold">{session.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(session.startDateTime.toDate(), 'h:mm a')} - {format(session.endDateTime.toDate(), 'h:mm a')}
                                                    </p>
                                                </Link>
                                            ))
                                        ) : (
                                        !loading && <p className="text-muted-foreground text-center py-8">No sessions scheduled for this day.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="week" className="mt-0">
                            {loading ? <p>Loading...</p> : <WeekView sessions={sessionsForWeekView} currentDate={currentDate} />}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
            <style jsx global>{`
                .has-event {
                    font-weight: bold;
                    text-decoration: underline;
                    text-decoration-color: hsl(var(--accent));
                    text-underline-offset: 0.2em;
                }
            `}</style>
        </div>
    );
}
