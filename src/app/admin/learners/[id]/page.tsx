'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, query, collection } from 'firebase/firestore';
import type { Learner } from '@/lib/learners-types';
import type { Program } from '@/lib/program-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { updateLearner } from '@/lib/learners';

export default function LearnerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const learnerRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'learners', id);
    }, [firestore, id]);

    const { data: learner, loading } = useDoc<Learner>(learnerRef);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, "programs")) : null, [firestore]);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery);

    const handleStatusChange = async (newStatus: Learner['status']) => {
        if (firestore && id) {
            updateLearner(firestore, id, { status: newStatus });
        }
    };
    
    const handleProgramChange = async (newProgram: string) => {
        if (firestore && id) {
            updateLearner(firestore, id, { program: newProgram });
        }
    };

    if (loading) {
        return (
             <div className="grid gap-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!learner) {
        notFound();
    }

    return (
        <div className="grid gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={learner.avatar} alt={learner.name} />
                        <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-headline text-xl sm:text-2xl font-bold">{learner.name}</h1>
                        <p className="text-muted-foreground">{learner.email}</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Learner Details</CardTitle>
                    <CardDescription>Manage this learner's information and enrollment status.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Name</Label>
                            <p className="font-medium">{learner.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <p className="font-medium">{learner.email}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="program-select">Enrolled Program</Label>
                             <Select value={learner.program} onValueChange={handleProgramChange} disabled={programsLoading}>
                                <SelectTrigger id="program-select" className="w-[200px]">
                                    <SelectValue placeholder="Select program" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {programs?.map(p => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label>Joined Date</Label>
                            <p className="font-medium">{learner.joinedDate ? new Date(learner.joinedDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status-select">Status</Label>
                        <div className="flex items-center gap-4">
                            <Select value={learner.status} onValueChange={handleStatusChange}>
                                <SelectTrigger id="status-select" className="w-[200px]">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Alumni">Alumni</SelectItem>
                                </SelectContent>
                            </Select>
                             <Badge variant={learner.status === 'Active' ? 'default' : 'secondary'}>
                                {learner.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
