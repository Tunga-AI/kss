'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Admission } from '@/lib/admission-types';
import type { Cohort } from '@/lib/cohort-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function StaffAdmissionsPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const myCohortsQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'cohorts'), where('council', 'array-contains', user.id));
    }, [firestore, user]);

    const { data: myCohorts, loading: cohortsLoading } = useCollection<Cohort>(myCohortsQuery);

    const myCohortIds = useMemo(() => myCohorts?.map(c => c.id) || [], [myCohorts]);

    const applicationsQuery = useMemo(() => {
        if (!firestore || myCohortIds.length === 0) return null;
        return query(
            collection(firestore, 'admissions'), 
            where('cohortId', 'in', myCohortIds),
            where('status', '==', 'Pending Review')
        );
    }, [firestore, myCohortIds]);
    
    const { data: applications, loading: appsLoading } = useCollection<Admission>(applicationsQuery);
    
    const loading = userLoading || cohortsLoading || appsLoading;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admissions Council Review</CardTitle>
                    <CardDescription>Review applications for the cohorts you are a part of.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Applicant</TableHead>
                                <TableHead>Date Applied</TableHead>
                                <TableHead>Interested In</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                            {!loading && applications && applications.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell>
                                        <Link href={`/f/admissions/${app.id}`} className="font-medium text-primary hover:underline">{app.name}</Link>
                                        <p className="text-sm text-muted-foreground">{app.email}</p>
                                    </TableCell>
                                    <TableCell>{app.createdAt ? format(app.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                                    <TableCell>{app.interestedProgramTitle || 'N/A'}</TableCell>
                                    <TableCell><Badge variant="secondary">{app.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                             {!loading && (!applications || applications.length === 0) && (
                                 <TableRow>
                                     <TableCell colSpan={4} className="text-center h-24">
                                         There are no applications pending your review.
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
