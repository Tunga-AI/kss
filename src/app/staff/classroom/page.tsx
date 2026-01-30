'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format } from 'date-fns';

export default function StaffClassroomPage() {
  const firestore = useFirestore();
  const classroomQuery = useMemo(() => {
    if (!firestore) return null;
    // For now, show all upcoming sessions. This could be filtered by facilitatorId later.
    return query(collection(firestore, 'classroom'), where('startDateTime', '>=', Timestamp.now()), orderBy('startDateTime', 'asc'));
  }, [firestore]);

  const { data: sessions, loading } = useCollection<ClassroomSession>(classroomQuery);

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-xl sm:text-2xl">My Classroom</CardTitle>
              <CardDescription className="text-primary-foreground/80">Manage your upcoming live sessions.</CardDescription>
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
      <Card>
        <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                      <Button asChild variant="outline" size="sm" disabled={session.status === 'Completed' || session.status === 'Cancelled'}>
                          <Link href={`/f/classroom/${session.id}`}>Start Session</Link>
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">There are no upcoming sessions scheduled.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
