'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';
import { format } from 'date-fns';

export default function AdmissionsPage() {
  const firestore = useFirestore();
  const admissionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sales'), where('status', '==', 'Admitted'));
  }, [firestore]);

  const { data: admissions, loading } = useCollection<SaleLead>(admissionsQuery);

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Admissions</CardTitle>
          <CardDescription className="text-primary-foreground/80">Review newly admitted learners.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
          <CardHeader>
              <CardTitle>Recently Admitted</CardTitle>
          </CardHeader>
          <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Learner</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admission Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                    {admissions && admissions.map((admission) => (
                        <TableRow key={admission.id}>
                            <TableCell className="font-medium">{admission.name}</TableCell>
                            <TableCell>{admission.program}</TableCell>
                            <TableCell>
                                <Badge>{admission.status}</Badge>
                            </TableCell>
                            <TableCell>{admission.createdAt ? format(admission.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                    {!loading && admissions?.length === 0 && <TableRow><TableCell colSpan={4}>No admissions found.</TableCell></TableRow>}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
