'use client';
import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import type { Transaction } from '@/lib/transactions-types';
import type { Program } from '@/lib/program-types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function LearnerClassroomPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  // 1. Get user's successful transactions
  const transactionsQuery = useMemo(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'transactions'), where('learnerEmail', '==', user.email), where('status', '==', 'Success'));
  }, [firestore, user]);
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  // 2. Get all programs to map titles to IDs
  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);
  const { data: allPrograms, loading: programsLoading } = useCollection<Program>(programsQuery);
  
  // 3. Get all upcoming classroom sessions
  const classroomQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'classroom'), where('startDateTime', '>=', Timestamp.now()), orderBy('startDateTime', 'asc'));
  }, [firestore]);
  const { data: allSessions, loading: sessionsLoading } = useCollection<ClassroomSession>(classroomQuery);

  // 4. Filter sessions based on user's enrolled programs
  const mySessions = useMemo(() => {
    if (!transactions || !allPrograms || !allSessions) return [];
    
    const enrolledProgramTitles = transactions.map(t => t.program);
    const enrolledProgramIds = allPrograms
      .filter(p => enrolledProgramTitles.includes(p.title))
      .map(p => p.id);
      
    return allSessions.filter(session => enrolledProgramIds.includes(session.programId));
  }, [transactions, allPrograms, allSessions]);

  const loading = userLoading || transactionsLoading || programsLoading || sessionsLoading;

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
            <CardTitle>My Upcoming Sessions</CardTitle>
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
              {!loading && mySessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{session.startDateTime ? format(session.startDateTime.toDate(), 'MMM d, yyyy h:mm a') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'Completed' ? 'secondary' : 'default'}>{session.status}</Badge>
                  </TableCell>
                  <TableCell>
                      <Button variant="default" size="sm" disabled={session.status !== 'In Progress'}>
                          Join Session
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && mySessions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        You have no upcoming sessions for your enrolled programs.
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
