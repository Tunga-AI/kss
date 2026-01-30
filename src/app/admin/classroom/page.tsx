'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { deleteClassroomSession } from '@/lib/classroom';
import { format } from 'date-fns';

export default function AdminClassroomPage() {
  const firestore = useFirestore();
  const classroomQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'classroom'), orderBy('startDateTime', 'desc'));
  }, [firestore]);

  const { data: sessions, loading } = useCollection<ClassroomSession>(classroomQuery);

  const handleDelete = (id: string) => {
    if (firestore && confirm('Are you sure you want to delete this session?')) {
      deleteClassroomSession(firestore, id);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-xl sm:text-2xl">Classroom Management</CardTitle>
              <CardDescription className="text-primary-foreground/80">Schedule, view, and manage all virtual classroom sessions.</CardDescription>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/a/classroom/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Schedule Session
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Title</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={4}>Loading sessions...</TableCell></TableRow>}
              {sessions && sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{session.startDateTime ? format(session.startDateTime.toDate(), 'MMM d, yyyy h:mm a') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'Completed' ? 'secondary' : 'default'}>{session.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/a/classroom/session/${session.id}`}>Join Session</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/a/classroom/${session.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(session.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No sessions scheduled yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
