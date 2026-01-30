'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Learner } from '@/lib/learners-types';
import type { Program } from '@/lib/program-types';
import { issueCertificate } from '@/lib/certificates';

export default function IssueCertificatePage() {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();

    const learnersQuery = useMemo(() => firestore ? query(collection(firestore, "learners")) : null, [firestore]);
    const { data: learners, loading: learnersLoading } = useCollection<Learner>(learnersQuery);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs'), where('programType', 'in', ['Core', 'Short', 'E-Learning'])) : null, [firestore]);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery);
    
    const [selectedLearnerId, setSelectedLearnerId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !selectedLearnerId || !selectedProgramId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a learner and a program.'});
            return;
        };

        setIsSaving(true);
        const learner = learners?.find(l => l.id === selectedLearnerId);
        const program = programs?.find(p => p.id === selectedProgramId);

        if (!learner || !program) {
             toast({ variant: 'destructive', title: 'Error', description: 'Selected learner or program not found.'});
             setIsSaving(false);
             return;
        }

        try {
            issueCertificate(firestore, {
                learnerName: learner.name,
                learnerEmail: learner.email,
                programTitle: program.title,
            });
            
            toast({ title: 'Success', description: 'Certificate has been issued.'});
            router.push('/a/certificates');

        } catch (error) {
            console.error("Error issuing certificate:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to issue certificate.'});
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Issue New Certificate</CardTitle>
                    <CardDescription>Select a learner and a completed program to issue a new certificate.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form className="grid gap-6" onSubmit={handleSubmit}>
                        <div className="grid gap-3">
                            <Label htmlFor="learner">Learner</Label>
                            <Select value={selectedLearnerId} onValueChange={setSelectedLearnerId} required>
                                <SelectTrigger id="learner" disabled={learnersLoading}>{learnersLoading ? 'Loading learners...' : <SelectValue placeholder="Select a learner" />}</SelectTrigger>
                                <SelectContent>
                                    {learners?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.email})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="program">Program</Label>
                            <Select value={selectedProgramId} onValueChange={setSelectedProgramId} required>
                                <SelectTrigger id="program" disabled={programsLoading}>{programsLoading ? 'Loading programs...' : <SelectValue placeholder="Select a program" />}</SelectTrigger>
                                <SelectContent>
                                    {programs?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Issue Certificate
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
