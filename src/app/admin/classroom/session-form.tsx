'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Clock,
    Calendar,
    Users,
    Shield,
    ArrowLeft,
    Save,
    RefreshCw,
    Settings2,
    GraduationCap,
    LayoutGrid,
    FileText,
    Activity,
    BookOpen,
    Video,
    MapPin,
    Layers
} from 'lucide-react';
import type { ClassroomSession } from '@/lib/classroom-types';
import type { Program } from '@/lib/program-types';
import type { User } from '@/lib/user-types';
import type { Cohort } from '@/lib/cohort-types';
import { addClassroomSession, updateClassroomSession } from '@/lib/classroom';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

type SessionFormData = Omit<ClassroomSession, 'id' | 'startDateTime' | 'endDateTime'> & {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

export function SessionForm({ session }: { session?: ClassroomSession }) {
    const { toast } = useToast();
    const router = useRouter();
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const isNew = !session?.id;

    // Fetch Programs for dropdown
    const programsQuery = useMemo(() => firestore ? query(collection(firestore, "programs")) : null, [firestore]);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    // Fetch Cohorts for dropdown
    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, "cohorts")) : null, [firestore]);
    const { data: cohorts, loading: cohortsLoading } = useCollection<Cohort>(cohortsQuery as any);

    // Fetch Facilitators for dropdown
    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators, loading: facilitatorsLoading } = useCollection<User>(facilitatorsQuery as any);

    const [formData, setFormData] = useState<Partial<SessionFormData>>({
        title: session?.title ?? '',
        description: session?.description ?? '',
        programId: session?.programId ?? '',
        cohortId: session?.cohortId || '',
        facilitatorId: session?.facilitatorId || 'none',
        status: session?.status ?? 'Scheduled',
        type: session?.type ?? 'Virtual',
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

    const handleSelectChange = (id: 'programId' | 'cohortId' | 'facilitatorId' | 'status' | 'type', value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all date and time fields.' });
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
                cohortId: (formData.cohortId === 'none' || !formData.cohortId) ? undefined : formData.cohortId,
                type: formData.type as any,
                startDateTime,
                endDateTime,
                status: formData.status!,
            };

            if (formData.facilitatorId && formData.facilitatorId !== 'none') {
                sessionData.facilitatorId = formData.facilitatorId;
            }

            if (isNew) {
                addClassroomSession(firestore, sessionData);
                toast({ title: 'Success', description: 'Classroom session scheduled.' });
            } else {
                updateClassroomSession(firestore, session.id, sessionData);
                toast({ title: 'Success', description: 'Classroom session updated.' });
            }

            if (currentUser?.role === 'Facilitator') {
                router.push('/f/calendar');
            } else {
                router.push('/a/calendar');
            }

        } catch (error) {
            console.error("Error saving session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save session.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero Header Section */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{isNew ? 'New Session Registry' : 'Active Registry Edit'}</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {isNew ? 'Schedule Classroom' : <>{session?.title} <span className="text-white/40 font-mono text-2xl">#{session?.id}</span></>}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95"
                            >
                                {isSaving ? (
                                    <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Committing...</>
                                ) : (
                                    <><Save className="h-5 w-5 mr-2" /> {isNew ? 'Schedule Session' : 'Save Changes'}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Primary Config */}
                    <div className="xl:col-span-8 space-y-6">
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-accent" />
                                    Session Parameters
                                </h2>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Session Designation</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold text-lg"
                                            placeholder="e.g. Week 4: Strategic Positioning Masterclass"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Learning Brief</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium p-6 focus:ring-accent"
                                            placeholder="Overview of the core concepts to be explored in this assembly..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-accent" />
                                    Commencement
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Start Date</Label>
                                        <Input id="startDate" type="date" value={formData.startDate} onChange={handleChange} required className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="startTime" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Start Time (EAT)</Label>
                                        <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} required className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-accent" />
                                    Conclusion
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">End Date</Label>
                                        <Input id="endDate" type="date" value={formData.endDate} onChange={handleChange} required className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endTime" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">End Time (EAT)</Label>
                                        <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} required className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Meta Sidebar */}
                    <div className="xl:col-span-4 space-y-6">
                        <Card className="bg-primary text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl opacity-20" />

                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-accent" />
                                Logistics
                            </h2>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Class Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)} required>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <div className="flex items-center gap-2">
                                                {formData.type === 'Virtual' ? <Video className="h-4 w-4 text-accent" /> :
                                                    formData.type === 'Physical' ? <MapPin className="h-4 w-4 text-accent" /> :
                                                        <Layers className="h-4 w-4 text-accent" />}
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="Virtual" className="font-bold">Virtual (Remote)</SelectItem>
                                            <SelectItem value="Physical" className="font-bold">Physical (On-Campus)</SelectItem>
                                            <SelectItem value="Hybrid" className="font-bold">Hybrid (Mixed)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(formData.type === 'Virtual' || formData.type === 'Hybrid') && (
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Virtual Classroom</Label>
                                        <div className="bg-white/10 text-white p-4 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none text-sm font-medium border border-white/10">
                                            A secure live video classroom will be automatically created for this session. Students and facilitators can join directly from the portal.
                                        </div>
                                    </div>
                                )}

                                {(formData.type === 'Physical' || formData.type === 'Hybrid') && (
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Physical Location</Label>
                                        <Input
                                            value={formData.location || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                            className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold placeholder:text-white/20"
                                            placeholder="e.g. Room 304, Main Campus"
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Target Cohort</Label>
                                    <Select value={formData.cohortId} onValueChange={(value) => handleSelectChange('cohortId', value)}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold" disabled={cohortsLoading}>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Select Cohort" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            {cohorts?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Curriculum Pillar</Label>
                                    <Select value={formData.programId} onValueChange={(value) => handleSelectChange('programId', value)} required>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold" disabled={programsLoading}>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Link to Program" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            {programs?.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Assigned Facilitator</Label>
                                    <Select value={formData.facilitatorId} onValueChange={(value) => handleSelectChange('facilitatorId', value)}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold" disabled={facilitatorsLoading}>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Assign Operative" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="none">De-assign Facilitator</SelectItem>
                                            {facilitators?.map(f => <SelectItem key={f.id} value={f.id} className="font-bold">{f.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Operational Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} required>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-accent" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="Scheduled" className="font-bold">Scheduled</SelectItem>
                                            <SelectItem value="In Progress" className="font-bold">Active Stream</SelectItem>
                                            <SelectItem value="Completed" className="font-bold">Terminated (Success)</SelectItem>
                                            <SelectItem value="Cancelled" className="font-bold">Terminated (Aborted)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-lg">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary/40 mb-4 flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-accent" />
                                Integrity Check
                            </h3>
                            <p className="text-[10px] text-primary/60 leading-relaxed italic">
                                Double-check temporal slots for conflicts with other concurrent sessions in the same curriculum track.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
