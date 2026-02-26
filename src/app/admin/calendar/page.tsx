'use client';
import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Video, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { LearningModule } from '@/lib/learning-types';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

export default function CalendarPage() {
    const firestore = useFirestore();
    const sessionsQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits'), orderBy('scheduledStartDate', 'asc')) : null, [firestore]);
    const { data: sessions, loading } = useCollection<LearningModule>(sessionsQuery as any);

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CalendarIcon className="h-6 w-6 text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Master Timetable</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Calendar & Scheduling</h1>
                            <p className="text-white/70 mt-2 font-medium max-w-xl">View all cohort sessions, virtual classrooms, and physical lectures scheduled from the curriculum.</p>
                        </div>
                    </div>
                </div>

                {/* Timeline / List View */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="p-12 text-center text-primary/40 font-bold uppercase tracking-widest animate-pulse">
                            Synchronizing Calendar Events...
                        </div>
                    ) : sessions && sessions.length > 0 ? (
                        sessions.map((session) => (
                            <Link href={`/a/curriculum/${session.courseId}/live/${session.id}`} key={session.id}>
                                <div className="group bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-6 shadow-sm hover:shadow-md transition-all hover:border-accent/50 flex flex-col md:flex-row gap-6 items-start md:items-center">

                                    {/* Date Box */}
                                    <div className="flex-shrink-0 w-full md:w-24 bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-primary/5 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                        <span className="text-xs font-black uppercase tracking-widest text-primary/40 group-hover:text-accent/60 mb-1">
                                            {session.scheduledStartDate ? format(session.scheduledStartDate.toDate(), 'MMM') : 'TBD'}
                                        </span>
                                        <span className="text-3xl font-black text-primary group-hover:text-accent">
                                            {session.scheduledStartDate ? format(session.scheduledStartDate.toDate(), 'dd') : '-'}
                                        </span>
                                        <span className="text-xs font-bold text-primary/40 group-hover:text-accent/60 mt-1">
                                            {session.scheduledStartDate ? format(session.scheduledStartDate.toDate(), 'EEE') : ''}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap gap-2 mb-1">
                                            <Badge variant="outline" className={cn(
                                                "rounded-md border-transparent font-bold uppercase tracking-tighter text-[10px]",
                                                session.deliveryType === 'Virtual' ? 'bg-blue-50 text-blue-700' :
                                                    session.deliveryType === 'Physical' ? 'bg-orange-50 text-orange-700' :
                                                        'bg-purple-50 text-purple-700'
                                            )}>
                                                {session.deliveryType === 'Virtual' ? <Video className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                                                {session.deliveryType || 'Virtual'}
                                            </Badge>
                                            <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-tighter">
                                                {session.status}
                                            </Badge>
                                        </div>

                                        <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{session.title}</h3>

                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-primary/60">
                                            {session.scheduledStartDate && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4 text-primary/30" />
                                                    {format(session.scheduledStartDate.toDate(), 'h:mm a')}
                                                    {session.scheduledEndDate ? ` - ${format(session.scheduledEndDate.toDate(), 'h:mm a')}` : ''}
                                                </div>
                                            )}
                                            {session.facilitatorId && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-4 w-4 text-primary/30" />
                                                    Facilitator Assigned
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="hidden md:block">
                                        <div className={cn(
                                            "h-3 w-3 rounded-full",
                                            session.status === 'Scheduled' ? 'bg-blue-500' :
                                                session.status === 'In Progress' ? 'bg-green-500 animate-pulse' :
                                                    session.status === 'Completed' ? 'bg-gray-300' : 'bg-red-500'
                                        )} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-tl-3xl rounded-br-3xl text-center border border-dashed border-primary/20">
                            <CalendarIcon className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-primary mb-2">No Sessions Scheduled</h3>
                            <p className="text-primary/60 max-w-md mx-auto mb-6">Your calendar is currently clear. Schedule a new module in the curriculum to begin managing timelines.</p>
                            <Link href="/a/curriculum">
                                <Button variant="outline" className="font-bold border-primary/20 text-primary hover:bg-primary/5">
                                    Go to Curriculum
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
