'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, BookOpen, Users, Video } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday } from 'date-fns';
import type { ClassroomSession } from '@/lib/classroom-types';

export default function StaffDashboardPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const mySessionsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        return query(
            collection(firestore, 'classroom'),
            where('facilitatorId', '==', user.id),
            where('startDateTime', '>=', Timestamp.fromDate(todayStart)),
            orderBy('startDateTime', 'asc')
        );
    }, [firestore, user]);

    const { data: mySessions, loading: sessionsLoading } = useCollection<ClassroomSession>(mySessionsQuery);

    const todaySchedule = useMemo(() => {
        return mySessions?.filter(session => session.startDateTime && isToday(session.startDateTime.toDate())) || [];
    }, [mySessions]);

    const totalUpcomingSessions = mySessions?.length || 0;
    
    // As a proxy for 'my courses', we count the unique programs from upcoming sessions.
    const myCoursesCount = useMemo(() => {
        if (!mySessions) return 0;
        const programIds = new Set(mySessions.map(session => session.programId));
        return programIds.size;
    }, [mySessions]);

    const loading = userLoading || sessionsLoading;

    if (loading) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }
    
    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Welcome Back, {user?.name?.split(' ')[0]}!</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Here's what's on your plate. Let's make it a productive one.</CardDescription>
                </CardHeader>
            </Card>
      
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline"><Clock /> Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Time</TableHead>
                                    <TableHead>Session</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todaySchedule.length > 0 ? todaySchedule.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{format(item.startDateTime.toDate(), 'h:mm a')}</TableCell>
                                        <TableCell>
                                            <p className="font-semibold">{item.title}</p>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">No sessions scheduled for today.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardContent>
                        <Button asChild variant="secondary">
                            <Link href="/f/schedule">View Full Schedule <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline"><Video /> Upcoming Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center h-full gap-4">
                         <div className="text-6xl font-bold">{totalUpcomingSessions}</div>
                         <p className="text-muted-foreground">Total upcoming sessions assigned to you.</p>
                         <Button asChild>
                            <Link href="/f/classroom">Go to Classroom <ArrowRight className="ml-2"/></Link>
                         </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><BookOpen/> Class Management</CardTitle>
                    <CardDescription>Quick access to manage your assigned classes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">You are assigned to sessions in {myCoursesCount} unique programs.</p>
                    <p className="text-sm text-muted-foreground mt-1">View rosters, post announcements, and manage course materials.</p>
                </CardContent>
                <CardContent>
                    <Button asChild>
                        <Link href="/f/classes">Manage My Classes <ArrowRight className="ml-2"/></Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
