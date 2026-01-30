'use client';
import { useState, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Admission } from '@/lib/admission-types';
import type { Program } from '@/lib/program-types';
import { updateAdmission } from '@/lib/admissions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffAdmissionReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();
    
    const [decision, setDecision] = useState<'Admitted' | 'Rejected'>();
    const [recommendedProgramId, setRecommendedProgramId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const admissionRef = useMemo(() => firestore && id ? doc(firestore, 'admissions', id) : null, [firestore, id]);
    const { data: admission, loading: admissionLoading } = useDoc<Admission>(admissionRef);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs'), where('programType', '==', 'Core')) : null, [firestore]);
    const { data: corePrograms, loading: programsLoading } = useCollection<Program>(programsQuery);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !id || !decision) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please make a decision.' });
            return;
        }
        if (decision === 'Admitted' && !recommendedProgramId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please recommend a program for admitted applicants.' });
            return;
        }
        setIsSaving(true);
        try {
            await updateAdmission(firestore, id, {
                status: decision,
                recommendedProgramId: decision === 'Admitted' ? recommendedProgramId : undefined,
            });
            toast({ title: 'Success', description: 'Decision has been recorded.' });
            router.push('/f/admissions');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the decision.' });
        } finally {
            setIsSaving(false);
        }
    }
    
    const loading = admissionLoading || programsLoading;

    if (loading) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    if (!admission) notFound();

    return (
        <div className="grid gap-6 max-w-3xl mx-auto">
             <Card>
                <CardHeader>
                    <CardTitle>{admission.name}</CardTitle>
                    <CardDescription>{admission.email} • Applied on {admission.createdAt ? format(admission.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p><span className="font-semibold">Initial Program of Interest:</span> {admission.interestedProgramTitle || 'N/A'}</p>
                </CardContent>
            </Card>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Review and Decision</CardTitle>
                        <CardDescription>Make a decision for this applicant.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="space-y-2">
                             <Label>Decision</Label>
                             <RadioGroup value={decision} onValueChange={(v: 'Admitted' | 'Rejected') => setDecision(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Admitted" id="admitted" />
                                    <Label htmlFor="admitted">Admit</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Rejected" id="rejected" />
                                    <Label htmlFor="rejected">Reject</Label>
                                </div>
                             </RadioGroup>
                        </div>
                        {decision === 'Admitted' && (
                             <div className="space-y-2">
                                <Label htmlFor="recommendedProgram">Recommended Program</Label>
                                <Select value={recommendedProgramId} onValueChange={setRecommendedProgramId} required>
                                    <SelectTrigger id="recommendedProgram" disabled={programsLoading}>{programsLoading ? 'Loading...' : <SelectValue placeholder="Select a core program" />}</SelectTrigger>
                                    <SelectContent>
                                        {corePrograms?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                     <CardContent>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Decision
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
