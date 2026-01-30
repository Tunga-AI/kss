'use client';
import { useMemo, useState }from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

export default function StaffCalendarPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const firestore = useFirestore();

    const sessionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'classroom'), orderBy('startDateTime', 'asc'));
    }, [firestore]);

    const { data: sessions, loading } = useCollection<ClassroomSession>(sessionsQuery);

    const sessionsByDate = useMemo(() => {
        const grouped: { [key: string]: ClassroomSession[] } = {};
        sessions?.forEach(session => {
            const sessionDate = format(session.startDateTime.toDate(), 'yyyy-MM-dd');
            if (!grouped[sessionDate]) {
                grouped[sessionDate] = [];
            }
            grouped[sessionDate].push(session);
        });
        return grouped;
    }, [sessions]);

    const selectedDaySessions = useMemo(() => {
        if (!date) return [];
        const selectedDateStr = format(date, 'yyyy-MM-dd');
        return sessionsByDate[selectedDateStr] || [];
    }, [date, sessionsByDate]);

    const daysWithEvents = useMemo(() => {
        return Object.keys(sessionsByDate).map(dateStr => new Date(dateStr));
    }, [sessionsByDate]);

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">My Calendar</CardTitle>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-[1fr_400px] gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="p-0"
                            classNames={{
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent/50 text-accent-foreground",
                            }}
                            modifiers={{
                                hasEvent: daysWithEvents,
                            }}
                            modifiersStyles={{
                                hasEvent: { 
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    textDecorationColor: 'hsl(var(--accent))',
                                    textUnderlineOffset: '0.2em'
                                }
                            }}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">
                            {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
