'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { Cohort } from '@/lib/cohort-types';
import type { User } from '@/lib/user-types';
import { addCohort, updateCohort } from '@/lib/cohorts';

interface CohortFormProps {
    cohort?: Cohort;
}

export function CohortForm({ cohort }: CohortFormProps) {
    const isNew = !cohort;
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [name, setName] = useState(cohort?.name || '');
    const [status, setStatus] = useState<Cohort['status']>(cohort?.status || 'Accepting Applications');
    const [council, setCouncil] = useState<string[]>(cohort?.council || []);
    const [isSaving, setIsSaving] = useState(false);

    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator'));
    }, [firestore]);

    const { data: facilitators, loading: facilitatorsLoading } = useCollection<User>(facilitatorsQuery);

    const handleCouncilChange = (facilitatorId: string) => {
        setCouncil(prev => 
            prev.includes(facilitatorId) 
                ? prev.filter(id => id !== facilitatorId)
                : [...prev, facilitatorId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        setIsSaving(true);
        
        const cohortData = { name, status, council };

        try {
            if (isNew) {
                await addCohort(firestore, cohortData);
                toast({ title: 'Success', description: 'Cohort created successfully.' });
            } else if (cohort?.id) {
                await updateCohort(firestore, cohort.id, cohortData);
                toast({ title: 'Success', description: 'Cohort updated successfully.' });
            }
            router.push('/a/cohorts');
        } catch (error) {
            console.error("Error saving cohort:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save cohort.'});
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{isNew ? 'Create New Cohort' : `Edit "${cohort?.name}"`}</CardTitle>
                    <CardDescription>{isNew ? 'Define a new program intake and assign its admissions council.' : 'Update the cohort details and council members.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="grid gap-3">
                                <Label htmlFor="name">Cohort Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={(value: Cohort['status']) => setStatus(value)} required>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Accepting Applications">Accepting Applications</SelectItem>
                                        <SelectItem value="In Review">In Review</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                         <div className="grid gap-3">
                            <Label>Admissions Council</Label>
                            <Card>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-48">
                                        <div className="p-4 space-y-3">
                                            {facilitatorsLoading && <p>Loading facilitators...</p>}
                                            {facilitators?.map(f => (
                                                <div key={f.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`facilitator-${f.id}`}
                                                        checked={council.includes(f.id)}
                                                        onCheckedChange={() => handleCouncilChange(f.id)}
                                                    />
                                                    <Label htmlFor={`facilitator-${f.id}`} className="font-normal">{f.name}</Label>
                                                </div>
                                            ))}
                                            {!facilitatorsLoading && facilitators?.length === 0 && <p className="text-sm text-muted-foreground">No facilitators found.</p>}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="flex gap-4 mt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isNew ? 'Create Cohort' : 'Save Changes'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
