'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, RefreshCw, Search, ChevronDown, Video, Calendar, Clock, Edit, Trash2, PlayCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { deleteClassroomSession } from '@/lib/classroom';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function AdminClassroomPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const classroomQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'classroom'), orderBy('startDateTime', 'desc'));
  }, [firestore]);

  const { data: allSessions, loading } = useCollection<ClassroomSession>(classroomQuery as any);

  const filteredSessions = useMemo(() => {
    if (!allSessions) return [];
    return allSessions.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [allSessions, searchQuery]);

  const handleDelete = (id: string) => {
    if (firestore && confirm('Are you sure you want to delete this session?')) {
      deleteClassroomSession(firestore, id);
    }
  };

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
        {/* Admin Classroom Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Video className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Session Scheduling</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Coordinate live interactive sessions across all learning tracks</p>
            </div>
            <div className="flex items-center gap-3">

              <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                <Link href="/a/classroom/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Search Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
          <div className="relative flex-1 group w-full">
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Masterclasses</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by session title..."
                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Classroom Sessions Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Session Topic</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Temporal Metadata</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Lifecycle</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {filteredSessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                      #{session.id}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                          <Video className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{session.title}</p>
                          <p className="text-[10px] text-primary/40 uppercase font-black mt-1">Live Event</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary/80">
                          <Calendar className="h-3 w-3 text-accent" />
                          {session.startDateTime ? format(session.startDateTime.toDate(), 'MMM d, yyyy') : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-primary/50">
                          <Clock className="h-3 w-3" />
                          {session.startDateTime ? format(session.startDateTime.toDate(), 'h:mm a') : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge className={cn(
                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                        session.status === 'Completed' ? 'bg-green-500 text-white' :
                          session.status === 'Cancelled' ? 'bg-destructive text-white' :
                            'bg-accent text-white'
                      )}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2  transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 shadow-none hover:bg-green-500 hover:text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                          <Link href={`/a/classroom/session/${session.id}`}>
                            <PlayCircle className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                          <Link href={`/a/classroom/${session.id}`}>
                            <Edit className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                          onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                      No sessions found in archive
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
