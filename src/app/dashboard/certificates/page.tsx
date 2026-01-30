'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download } from 'lucide-react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Certificate } from '@/lib/certificate-types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function LearnerCertificatesPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const certificatesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'certificates'), where('learnerEmail', '==', user.email));
  }, [firestore, user]);

  const { data: certificates, loading: certsLoading } = useCollection<Certificate>(certificatesQuery);

  const loading = userLoading || certsLoading;

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">My Certificates</CardTitle>
          <CardDescription className="text-primary-foreground/80">View and download your earned certificates.</CardDescription>
        </CardHeader>
      </Card>
      
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      )}

      {!loading && certificates && certificates.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4">
                <Award className="h-12 w-12 text-accent" />
                <div>
                  <CardTitle className="font-headline text-lg">{cert.programTitle}</CardTitle>
                  <CardDescription>Issued on {cert.issuedDate ? format(cert.issuedDate.toDate(), 'MMMM d, yyyy') : 'N/A'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardContent>
                <Button className="w-full" disabled>
                  <Download className="mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (!certificates || certificates.length === 0) && (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>You have not earned any certificates yet.</p>
                <p className="text-sm mt-2">Complete a course to earn your first certificate!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
