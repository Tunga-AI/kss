'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, BookOpen, Users, CalendarDays, RefreshCw, LayoutDashboard, Calendar, Target, TrendingUp, Award, CheckCircle2, Video, MapPin } from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns';
import type { ClassroomSession } from '@/lib/classroom-types';
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area } from "recharts";

export default function StaffDashboardPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const upcomingQuery = useMemo(() => {
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

    const allSessionsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'classroom'),
            where('facilitatorId', '==', user.id),
            orderBy('startDateTime', 'desc')
        );
    }, [firestore, user]);

    const { data: upcomingSessions, loading: sessionsLoading } = useCollection<ClassroomSession>(upcomingQuery as any);
    const { data: allSessions } = useCollection<ClassroomSession>(allSessionsQuery as any);

    const todaySessions = useMemo(() => (
        upcomingSessions?.filter(s => s.startDateTime && isToday(s.startDateTime.toDate())) || []
    ), [upcomingSessions]);

    const thisWeekSessions = useMemo(() => {
        if (!allSessions) return [];
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        return allSessions.filter(s => {
            if (!s.startDateTime) return false;
            const d = s.startDateTime.toDate();
            return d >= weekStart && d <= weekEnd;
        });
    }, [allSessions]);

    const totalUpcoming = upcomingSessions?.length || 0;

    const uniquePrograms = useMemo(() => {
        if (!allSessions) return 0;
        return new Set(allSessions.map(s => s.programId).filter(Boolean)).size;
    }, [allSessions]);

    const completedCount = useMemo(() => (
        allSessions?.filter(s => s.status === 'Completed').length || 0
    ), [allSessions]);

    const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
        day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
        sessions: Math.floor(Math.random() * 5) + 1
    })), []);

    const loading = userLoading || sessionsLoading;

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero */}
                <div className="bg-primary text-white p-6 mb-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <LayoutDashboard className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome Back, {user?.name?.split(' ')[0]}!</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Here's what's on your plate today. Let's make it productive.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{todaySessions.length}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Today</p>
                            </div>
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{totalUpcoming}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Upcoming</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <StaffStatCard title="Today's Sessions" value={todaySessions.length} icon={Calendar} trend={`${todaySessions.length}`} description="Scheduled for today" chartData={weeklyData} chartType="area" />
                    <StaffStatCard title="This Week" value={thisWeekSessions.length} icon={TrendingUp} trend={`${thisWeekSessions.length}`} description="Sessions this week" chartData={weeklyData} chartType="bar" />
                    <StaffStatCard title="Active Programs" value={uniquePrograms} icon={BookOpen} trend={`${uniquePrograms}`} description="Unique programs" chartData={weeklyData.slice(0, 4)} chartType="line" />
                    <StaffStatCard title="Total Completed" value={completedCount} icon={Award} trend="+done" description="All-time sessions" highlight chartData={weeklyData.slice(0, 5)} chartType="area" />
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-12 gap-6 mb-6">
                    {/* Today's Timetable */}
                    <div className="lg:col-span-7">
                        <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-accent" />
                                    Today's Timetable
                                </CardTitle>
                                <CardDescription>Sessions scheduled for today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {todaySessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {todaySessions.map(session => (
                                            <div key={session.id} className="flex items-center gap-4 p-3 rounded-tl-xl rounded-br-xl border border-primary/5 hover:border-accent/20 hover:bg-accent/5 transition-all group">
                                                <div className="text-center min-w-[52px]">
                                                    <p className="text-lg font-black text-primary">{format(session.startDateTime.toDate(), 'h:mm')}</p>
                                                    <p className="text-[10px] font-bold text-primary/40 uppercase">{format(session.startDateTime.toDate(), 'a')}</p>
                                                </div>
                                                <div className={cn(
                                                    "h-10 w-10 rounded-tl-lg rounded-br-lg flex items-center justify-center shrink-0",
                                                    session.type === 'Virtual' ? 'bg-blue-50 text-blue-600' :
                                                        session.type === 'Physical' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                                                )}>
                                                    {session.type === 'Physical' ? <MapPin className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-primary truncate">{session.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5",
                                                            session.status === 'In Progress' ? 'bg-green-500 text-white animate-pulse' :
                                                                session.status === 'Completed' ? 'bg-gray-400 text-white' : 'bg-accent text-white'
                                                        )}>
                                                            {session.status}
                                                        </Badge>
                                                        {session.type && (
                                                            <span className="text-[10px] text-primary/40 font-bold uppercase">{session.type}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {(session.status === 'Scheduled' || session.status === 'In Progress') && (
                                                    <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white rounded-tl-md rounded-br-md font-bold h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/f/classroom/${session.id}`}>
                                                            {session.status === 'In Progress' ? 'Rejoin' : 'Start'}
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <CalendarDays className="h-12 w-12 text-primary/10 mx-auto mb-3" />
                                        <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No sessions today</p>
                                        <p className="text-xs text-primary/30 mt-1">Check your timetable for upcoming sessions</p>
                                    </div>
                                )}
                                <div className="mt-4 pt-4 border-t border-primary/5">
                                    <Button asChild className="bg-primary hover:bg-accent text-white rounded-tl-md rounded-br-md font-bold w-full">
                                        <Link href="/f/classroom">View Full Timetable <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-5">
                        <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <Target className="h-5 w-5 text-accent" />
                                    Quick Actions
                                </CardTitle>
                                <CardDescription>Common tasks and shortcuts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <QuickLinkButton href="/f/classroom" icon={CalendarDays} label="View Timetable" />
                                <QuickLinkButton href="/f/curriculum" icon={BookOpen} label="My Learning" />
                                <QuickLinkButton href="/f/classes" icon={Users} label="My Courses" />
                                <QuickLinkButton href="/f/library" icon={BookOpen} label="Content Library" />
                                <QuickLinkButton href="/f/feedback" icon={CheckCircle2} label="Feedback" />
                                <QuickLinkButton href="/f/calendar" icon={Calendar} label="Calendar" />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Timetable Overview */}
                <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-accent" />
                            Timetable Overview
                        </CardTitle>
                        <CardDescription>Your session statistics at a glance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-primary/5 p-4 rounded-tl-xl rounded-br-xl text-center">
                                <p className="text-2xl font-bold text-primary">{totalUpcoming}</p>
                                <p className="text-xs text-primary/60 uppercase font-bold mt-1">Upcoming</p>
                            </div>
                            <div className="bg-accent/5 p-4 rounded-tl-xl rounded-br-xl text-center">
                                <p className="text-2xl font-bold text-accent">{todaySessions.length}</p>
                                <p className="text-xs text-primary/60 uppercase font-bold mt-1">Today</p>
                            </div>
                            <div className="bg-green-500/5 p-4 rounded-tl-xl rounded-br-xl text-center">
                                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                                <p className="text-xs text-primary/60 uppercase font-bold mt-1">Completed</p>
                            </div>
                        </div>
                        <Button asChild className="bg-primary hover:bg-accent text-white rounded-tl-md rounded-br-md font-bold w-full">
                            <Link href="/f/classroom">Open Timetable <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StaffStatCard({ title, value, icon: Icon, trend, description, highlight = false, chartData = [], chartType = 'line' }: any) {
    return (
        <div className={cn(
            "p-6 border rounded-tl-2xl rounded-br-2xl shadow-lg transition-all hover:scale-105 cursor-pointer overflow-hidden",
            highlight ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary/10"
        )}>
            <div className="flex justify-between items-start mb-4">
                <Icon className="h-6 w-6 text-accent" />
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm",
                    highlight ? "bg-accent text-white" : "bg-green-500/10 text-green-500"
                )}>{trend}</span>
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">{title}</h3>
            <p className="text-3xl font-black mb-2 tracking-tighter">{value}</p>
            <p className="text-[9px] font-medium leading-relaxed opacity-40 uppercase tracking-wide mb-3">{description}</p>
            {chartData && chartData.length > 0 && (
                <div className="h-16 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' ? (
                            <AreaChart data={chartData}>
                                <Area type="monotone" dataKey="sessions" stroke={highlight ? "#ffffff" : "#0066cc"} fill={highlight ? "#ffffff" : "#0066cc"} fillOpacity={0.3} strokeWidth={2} />
                            </AreaChart>
                        ) : chartType === 'bar' ? (
                            <BarChart data={chartData}>
                                <Bar dataKey="sessions" fill={highlight ? "#ffffff" : "#ff6b35"} radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        ) : (
                            <LineChart data={chartData}>
                                <Line type="monotone" dataKey="sessions" stroke={highlight ? "#ffffff" : "#0066cc"} strokeWidth={2} dot={false} />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function QuickLinkButton({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link href={href}>
            <Button variant="ghost" className="w-full justify-start h-auto py-3 px-4 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-tl-lg rounded-br-lg group transition-all">
                <div className="flex items-center gap-3 w-full">
                    <div className="h-10 w-10 flex items-center justify-center bg-primary/5 rounded-lg text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm text-primary flex-1 text-left">{label}</span>
                    <ArrowRight className="h-4 w-4 text-primary/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
            </Button>
        </Link>
    );
}
