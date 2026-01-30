'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Download } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Certificate } from '@/lib/certificate-types';
import { format } from 'date-fns';

export default function AdminCertificatesPage() {
  const firestore = useFirestore();
  const certificatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'certificates'), orderBy('issuedDate', 'desc'));
  }, [firestore]);

  const { data: certificates, loading } = useCollection<Certificate>(certificatesQuery);

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-xl sm:text-2xl">Certificate Management</CardTitle>
              <CardDescription className="text-primary-foreground/80">Issue and manage learner certificates.</CardDescription>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/a/certificates/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Issue Certificate
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Issued Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={4}>Loading certificates...</TableCell></TableRow>}
              {certificates && certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.learnerName}</TableCell>
                  <TableCell>{cert.programTitle}</TableCell>
                  <TableCell>{cert.issuedDate ? format(cert.issuedDate.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled>
                      <Download className="mr-2 h-4 w-4"/>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && certificates?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No certificates have been issued yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
