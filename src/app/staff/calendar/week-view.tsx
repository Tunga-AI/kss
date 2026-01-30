'use client';

import { useMemo } from 'react';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeekViewProps {
    sessions: ClassroomSession[];
    currentDate: Date;
}

export function WeekView({ sessions, currentDate }: WeekViewProps) {
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [currentDate]);

    const sessionsByDay = useMemo(() => {
        const grouped: { [key: string]: ClassroomSession[] } = {};
        sessions.forEach(session => {
            const sessionDateStr = format(session.startDateTime.toDate(), 'yyyy-MM-dd');
            if (!grouped[sessionDateStr]) {
                grouped[sessionDateStr] = [];
            }
            grouped[sessionDateStr].push(session);
        });
        return grouped;
    }, [sessions]);

    return (
        <div className="grid grid-cols-7 border-l border-t border-border">
            {weekDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const daySessions = sessionsByDay[dayKey] || [];
                return (
                    <div key={dayKey} className="border-r border-b border-border min-h-[400px]">
                        <div className="text-center p-2 border-b border-border">
                            <p className="text-sm text-muted-foreground">{format(day, 'EEE')}</p>
                            <p className={`font-bold text-lg ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                        </div>
                        <div className="p-2 space-y-2">
                            {daySessions.map(session => (
                                <Link key={session.id} href={`/f/classroom/${session.id}`} className="block p-2 rounded-md bg-muted hover:bg-accent/20 transition-colors">
                                    <p className="font-semibold text-xs truncate">{session.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(session.startDateTime.toDate(), 'h:mm a')}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
