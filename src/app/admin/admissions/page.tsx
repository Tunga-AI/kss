'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Admission } from '@/lib/admission-types';
import { format } from 'date-fns';
import { FolderKanban } from 'lucide-react';

export default function AdmissionsPage() {
  const firestore = useFirestore();
  const admissionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'admissions'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: admissions, loading } = useCollection<Admission>(admissionsQuery);

  const getStatusVariant = (status: Admission['status']) => {
    switch (status) {
      case 'Admitted': return 'default';
      case 'Rejected': return 'destructive';
      case 'Pending Review': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2"><FolderKanban /> Admissions Pipeline</CardTitle>
          <CardDescription className="text-primary-foreground/80">Monitor all learner applications from payment to admission.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
          <CardHeader>
              <CardTitle>All Applicants</CardTitle>
          </CardHeader>
          <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Application Date</TableHead>
                        <TableHead>Cohort</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && <TableRow><TableCell colSpan={4}>Loading applicants...</TableCell></TableRow>}
                    {admissions && admissions.map((admission) => (
                        <TableRow key={admission.id}>
                            <TableCell>
                                <p className="font-medium">{admission.name}</p>
                                <p className="text-sm text-muted-foreground">{admission.email}</p>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(admission.status)}>{admission.status}</Badge>
                            </TableCell>
                            <TableCell>{admission.createdAt ? format(admission.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                            <TableCell>{admission.cohortId || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                    {!loading && admissions?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No applications found.</TableCell></TableRow>}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
