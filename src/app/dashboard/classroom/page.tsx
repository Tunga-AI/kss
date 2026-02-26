'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format } from 'date-fns';
import { Video, Calendar, Clock, RefreshCw, ChevronRight, PlayCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function LearnerClassroomPage() {
  const firestore = useFirestore();

  const upcomingQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'classroom'), where('startDateTime', '>=', Timestamp.now()), orderBy('startDateTime', 'asc'));
  }, [firestore]);

  const pastQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'classroom'), where('startDateTime', '<', Timestamp.now()), orderBy('startDateTime', 'desc'));
  }, [firestore]);

  const { data: upcomingSessions, loading: loadingUpcoming } = useCollection<ClassroomSession>(upcomingQuery as any);
  const { data: pastSessions, loading: loadingPast } = useCollection<ClassroomSession>(pastQuery as any);

  const stats = useMemo(() => {
    const scheduled = upcomingSessions?.length || 0;
    const completed = pastSessions?.length || 0;
    const total = scheduled + completed;
    return { total, scheduled, completed };
  }, [upcomingSessions, pastSessions]);

  const loading = loadingUpcoming || loadingPast;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
      <div className="w-full">
        {/* Hero Section */}
        <div className="bg-primary text-white p-8 mb-8 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Video className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Virtual Classroom</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Access your live sessions, recordings and class materials</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Upcoming Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Tabs */}
        <div className="w-full">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md">
              <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
              <TabsTrigger value="past">Past Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Session Title</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Schedule</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-primary/10">
                      {upcomingSessions && upcomingSessions.map((session) => (
                        <TableRow key={session.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                <Video className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-primary leading-tight">{session.title}</p>
                                <p className="text-[10px] text-primary/40 uppercase font-black mt-1">Live Interactive Session</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-sm font-bold text-primary/80">
                                <Calendar className="h-3 w-3 text-accent" />
                                {session.startDateTime ? format(session.startDateTime.toDate(), 'EEEE, MMM d, yyyy') : 'N/A'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-primary/50">
                                <Clock className="h-3 w-3" />
                                {session.startDateTime ? format(session.startDateTime.toDate(), 'h:mm a') : 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <Badge className={cn(
                              "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none shadow-none px-2",
                              session.status === 'In Progress' ? 'bg-green-500 text-white animate-pulse' :
                                session.status === 'Completed' ? 'bg-gray-500 text-white' :
                                  session.status === 'Cancelled' ? 'bg-destructive text-white' :
                                    'bg-accent text-white'
                            )}>
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              asChild
                              size="sm"
                              disabled={session.status === 'Cancelled'}
                              className="bg-primary hover:bg-accent text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold h-9 px-4 transition-all active:scale-95"
                            >
                              <Link href={`/l/classroom/${session.id}`} className="flex items-center gap-2">
                                Join Session <PlayCircle className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {upcomingSessions && upcomingSessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20">
                            <div className="flex flex-col items-center gap-2">
                              <Video className="h-12 w-12 text-primary/10" />
                              <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No upcoming sessions found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="past">
              <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Session Title</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date Ended</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-primary/10">
                      {pastSessions && pastSessions.map((session) => (
                        <TableRow key={session.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-gray-100 text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                <Video className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-primary leading-tight">{session.title}</p>
                                <p className="text-[10px] text-primary/40 uppercase font-black mt-1">Archived Session</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-sm font-bold text-primary/80">
                                <Calendar className="h-3 w-3 text-primary/40" />
                                {session.endDateTime ? format(session.endDateTime.toDate(), 'MMM d, yyyy') : 'Unknown'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <Badge className="bg-gray-100 text-gray-500 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none shadow-none px-2">
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-primary/20 text-primary hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold h-9 px-4 transition-all"
                            >
                              <Link href={`/l/classroom/${session.id}`} className="flex items-center gap-2">
                                View Archive <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pastSessions && pastSessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20">
                            <div className="flex flex-col items-center gap-2">
                              <Video className="h-12 w-12 text-primary/10" />
                              <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No past sessions found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
