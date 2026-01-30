'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function LearnerClassroomPage() {
  const firestore = useFirestore();

  const classroomQuery = useMemo(() => {
      if (!firestore) return null;
      // Show all upcoming sessions for testing purposes
      return query(collection(firestore, 'classroom'), where('startDateTime', '>=', Timestamp.now()), orderBy('startDateTime', 'asc'));
  }, [firestore]);
  const { data: mySessions, loading } = useCollection<ClassroomSession>(classroomQuery);

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">My Classroom</CardTitle>
          <CardDescription className="text-primary-foreground/80">Join your live sessions and access class materials.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>All upcoming sessions are shown for testing purposes.</CardDescription>
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
              {loading && [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
              ))}
              {!loading && mySessions && mySessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{session.startDateTime ? format(session.startDateTime.toDate(), 'MMM d, yyyy h:mm a') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'Completed' ? 'secondary' : 'default'}>{session.status}</Badge>
                  </TableCell>
                  <TableCell>
                      <Button asChild variant="default" size="sm" disabled={session.status === 'Completed' || session.status === 'Cancelled'}>
                          <Link href={`/l/classroom/${session.id}`}>Join Session</Link>
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && (!mySessions || mySessions.length === 0) && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        There are no upcoming sessions scheduled.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
