'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { ClassroomSession } from '@/lib/classroom-types';
import type { Program } from '@/lib/program-types';
import type { User } from '@/lib/user-types';
import { addClassroomSession, updateClassroomSession } from '@/lib/classroom';
import { format, parseISO } from 'date-fns';

type SessionFormData = Omit<ClassroomSession, 'id' | 'startDateTime' | 'endDateTime'> & {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

export function SessionForm({ session }: { session?: ClassroomSession }) {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const isNew = !session?.id;

    // Fetch Programs for dropdown
    const programsQuery = useMemo(() => firestore ? query(collection(firestore, "programs")) : null, [firestore]);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery);

    // Fetch Facilitators for dropdown
    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators, loading: facilitatorsLoading } = useCollection<User>(facilitatorsQuery);
    
    const [formData, setFormData] = useState<Partial<SessionFormData>>({
        title: session?.title ?? '',
        description: session?.description ?? '',
        programId: session?.programId ?? '',
        facilitatorId: session?.facilitatorId ?? '',
        status: session?.status ?? 'Scheduled',
        startDate: session?.startDateTime ? format(session.startDateTime.toDate(), 'yyyy-MM-dd') : '',
        startTime: session?.startDateTime ? format(session.startDateTime.toDate(), 'HH:mm') : '',
        endDate: session?.endDateTime ? format(session.endDateTime.toDate(), 'yyyy-MM-dd') : '',
        endTime: session?.endDateTime ? format(session.endDateTime.toDate(), 'HH:mm') : '',
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: 'programId' | 'facilitatorId' | 'status', value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all date and time fields.'});
            return;
        };

        setIsSaving(true);

        try {
            const startDateTime = Timestamp.fromDate(new Date(`${formData.startDate}T${formData.startTime}`));
            const endDateTime = Timestamp.fromDate(new Date(`${formData.endDate}T${formData.endTime}`));

            const sessionData: Omit<ClassroomSession, 'id'> = {
                title: formData.title!,
                description: formData.description!,
                programId: formData.programId!,
                facilitatorId: formData.facilitatorId!,
                startDateTime,
                endDateTime,
                status: formData.status!,
            };

            if (isNew) {
                addClassroomSession(firestore, sessionData);
                toast({ title: 'Success', description: 'Classroom session scheduled.'});
            } else {
                updateClassroomSession(firestore, session.id, sessionData);
                toast({ title: 'Success', description: 'Classroom session updated.'});
            }
            router.push('/a/classroom');

        } catch (error) {
            console.error("Error saving session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save session.'});
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{isNew ? 'Schedule New Session' : 'Edit Session'}</CardTitle>
                    <CardDescription>{isNew ? 'Fill in the details to create a new classroom session.' : `Editing "${session?.title}".`}</CardDescription>
                </CardHeader>
                <CardContent>
                     <form className="grid gap-6" onSubmit={handleSubmit}>
                        <div className="grid gap-3">
                            <Label htmlFor="title">Session Title</Label>
                            <Input id="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description} onChange={handleChange} />
                        </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="programId">Program</Label>
                                <Select value={formData.programId} onValueChange={(value) => handleSelectChange('programId', value)} required>
                                    <SelectTrigger disabled={programsLoading}>{programsLoading ? 'Loading...' : <SelectValue placeholder="Select a program" />}</SelectTrigger>
                                    <SelectContent>
                                        {programs?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="facilitatorId">Facilitator</Label>
                                 <Select value={formData.facilitatorId} onValueChange={(value) => handleSelectChange('facilitatorId', value)} required>
                                    <SelectTrigger disabled={facilitatorsLoading}>{facilitatorsLoading ? 'Loading...' : <SelectValue placeholder="Assign a facilitator" />}</SelectTrigger>
                                    <SelectContent>
                                        {facilitators?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="grid gap-2">
                                     <Label htmlFor="startDate">Start Date</Label>
                                     <Input id="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                                 </div>
                                  <div className="grid gap-2">
                                     <Label htmlFor="startTime">Start Time</Label>
                                     <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                  <div className="grid gap-2">
                                     <Label htmlFor="endDate">End Date</Label>
                                     <Input id="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                                 </div>
                                  <div className="grid gap-2">
                                     <Label htmlFor="endTime">End Time</Label>
                                     <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
                                 </div>
                             </div>
                        </div>
                        
                        <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                         <div className="flex gap-4 mt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isNew ? 'Schedule Session' : 'Save Changes'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
