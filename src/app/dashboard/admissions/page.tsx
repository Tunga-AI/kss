'use client';
import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Admission } from '@/lib/admission-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, FileText, Loader2, XCircle } from 'lucide-react';
import { ProgramRegistration } from '@/components/payments/ProgramRegistration';
import type { Program } from '@/lib/program-types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const StatusStep = ({ icon, title, description, isComplete, isActive }: { icon: React.ElementType, title: string, description: string, isComplete?: boolean, isActive?: boolean }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isComplete ? 'bg-primary text-primary-foreground' : isActive ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

export default function LearnerAdmissionPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const admissionQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'admissions'), where('userId', '==', user.id), limit(1));
    }, [firestore, user]);
    
    const { data: admissions, loading: admissionLoading } = useCollection<Admission>(admissionQuery);
    const admission = useMemo(() => admissions?.[0], [admissions]);

    const programQuery = useMemo(() => {
        if (!firestore || !admission?.recommendedProgramId) return null;
        return query(collection(firestore, 'programs'), where('__name__', '==', admission.recommendedProgramId));
    }, [firestore, admission]);

    const { data: programs, loading: programLoading } = useCollection<Program>(programQuery);
    const recommendedProgram = useMemo(() => programs?.[0], [programs]);

    const loading = userLoading || admissionLoading || programLoading;

    if (loading) {
        return (
             <div className="grid gap-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!admission) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Application Found</CardTitle>
                    <CardDescription>It looks like you haven't applied for a Core Program yet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You can start an application by visiting one of our Core Program pages.</p>
                    <Button asChild className="mt-4"><Link href="/courses">Explore Core Programs</Link></Button>
                </CardContent>
            </Card>
        );
    }
    
    const status = admission.status;
    const steps = [
        { key: 'Pending Payment', title: 'Application Fee', description: 'Complete payment for the assessment fee.', icon: FileText, complete: status !== 'Pending Payment', active: status === 'Pending Payment'},
        { key: 'Pending Review', title: 'Application Review', description: 'Our admissions council is reviewing your profile.', icon: Clock, complete: ['Admitted', 'Rejected'].includes(status), active: status === 'Pending Review' },
        { key: 'Admitted', title: 'Decision', description: 'Your application has been reviewed.', icon: CheckCircle, complete: status === 'Admitted', active: ['Admitted', 'Rejected'].includes(status) },
    ];

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Application Status</CardTitle>
                    <CardDescription>Track your application progress for the {admission.cohortId} intake.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                   {steps.map(step => (
                       <StatusStep key={step.key} icon={step.icon} title={step.title} description={step.description} isComplete={step.complete} isActive={step.active} />
                   ))}
                </CardContent>
            </Card>
            
            {status === 'Admitted' && recommendedProgram && (
                <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-900 flex items-center gap-2"><CheckCircle /> Congratulations! You're Admitted!</CardTitle>
                        <CardDescription className="text-green-800">You have been accepted into the following program. Complete your enrollment by paying the tuition fee.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-bold text-lg">{recommendedProgram.title}</h3>
                        <p className="text-muted-foreground mt-1">{recommendedProgram.description}</p>
                        <div className="mt-4">
                           <ProgramRegistration program={recommendedProgram} />
                        </div>
                    </CardContent>
                </Card>
            )}
            {status === 'Rejected' && (
                 <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-900 flex items-center gap-2"><XCircle /> Application Update</CardTitle>
                        <CardDescription className="text-red-800">After careful review, we are unable to offer you a spot at this time. We encourage you to explore our e-learning courses and apply for a future cohort.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}
