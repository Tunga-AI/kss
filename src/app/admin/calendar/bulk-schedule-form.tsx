'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, RefreshCw, Layers, Calendar, Clock, Video, MapPin, BookOpen, Users } from 'lucide-react';
import type { Program } from '@/lib/program-types';
import type { User } from '@/lib/user-types';
import type { Cohort } from '@/lib/cohort-types';
import { addClassroomSession } from '@/lib/classroom';
import { addDays, format, isSameDay } from 'date-fns';

const DAYS_OF_WEEK = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' },
];

export function BulkScheduleForm() {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();

    // Data fetching
    const programsQuery = useMemo(() => firestore ? query(collection(firestore, "programs")) : null, [firestore]);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, "cohorts")) : null, [firestore]);
    const { data: cohorts, loading: cohortsLoading } = useCollection<Cohort>(cohortsQuery as any);

    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators, loading: facilitatorsLoading } = useCollection<User>(facilitatorsQuery as any);

    // Form State
    const [programId, setProgramId] = useState('');
    const [cohortId, setCohortId] = useState('');
    const [facilitatorId, setFacilitatorId] = useState('none');
    const [type, setType] = useState('Virtual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [baseTitle, setBaseTitle] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);

    const toggleDay = (dayId: number) => {
        setSelectedDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
        );
    };

    const handleBulkCreate = async () => {
        if (!firestore || !programId || !cohortId || !startDate || !endDate || !startTime || !endTime || selectedDays.length === 0 || !baseTitle) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please fill all fields and select at least one day.' });
            return;
        }

        setIsGenerating(true);
        let createdCount = 0;

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            let current = start;

            // Simple loop from start to end date
            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (selectedDays.includes(dayOfWeek)) {
                    // Create session for this day
                    const sessionStart = Timestamp.fromDate(new Date(`${format(current, 'yyyy-MM-dd')}T${startTime}`));
                    const sessionEnd = Timestamp.fromDate(new Date(`${format(current, 'yyyy-MM-dd')}T${endTime}`));

                    // Construct a title, maybe append date or count if needed, or keep generic
                    // For now, keep generic "Base Title"

                    const sessionData = {
                        title: baseTitle,
                        description: `Bulk scheduled session for ${format(current, 'PPP')}`,
                        programId,
                        cohortId,
                        type: type as any,
                        facilitatorId: facilitatorId !== 'none' ? facilitatorId : undefined,
                        startDateTime: sessionStart,
                        endDateTime: sessionEnd,
                        status: 'Scheduled' as const,
                    };

                    await addClassroomSession(firestore, sessionData);
                    createdCount++;
                }
                current = addDays(current, 1);
            }

            toast({ title: 'Schedule Generated', description: `Successfully created ${createdCount} sessions.` });
            router.push('/a/calendar');

        } catch (error) {
            console.error("Bulk create error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate sessions.' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Header */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button variant="outline" size="icon" className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" onClick={() => router.back()}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Layers className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Bulk Operations</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Cohort Schedule Generator</h1>
                            </div>
                        </div>
                        <Button
                            onClick={handleBulkCreate}
                            disabled={isGenerating}
                            className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95"
                        >
                            {isGenerating ? <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Generating...</> : <><Save className="h-5 w-5 mr-2" /> Generate Timetable</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Config Form */}
                    <div className="xl:col-span-8 space-y-6">
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-accent" />
                                Timeline Configuration
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Start Date</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12 bg-primary/5 border-primary/10 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">End Date</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-12 bg-primary/5 border-primary/10 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Daily Start Time</Label>
                                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 bg-primary/5 border-primary/10 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Daily End Time</Label>
                                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12 bg-primary/5 border-primary/10 font-bold" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Recurring Days</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <div
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            className={`
                                                cursor-pointer h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2
                                                ${selectedDays.includes(day.id)
                                                    ? 'bg-primary text-white border-primary shadow-lg scale-105'
                                                    : 'bg-white text-primary/40 border-primary/10 hover:border-primary/30'}
                                            `}
                                        >
                                            {day.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-4 space-y-6">
                        <Card className="bg-primary text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Layers className="h-5 w-5 text-accent" />
                                Core Logistics
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Target Cohort</Label>
                                    <Select value={cohortId} onValueChange={setCohortId}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white font-bold"><SelectValue placeholder="Select Cohort" /></SelectTrigger>
                                        <SelectContent>
                                            {cohorts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Curriculum</Label>
                                    <Select value={programId} onValueChange={setProgramId}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white font-bold"><SelectValue placeholder="Select Program" /></SelectTrigger>
                                        <SelectContent>
                                            {programs?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Facilitator (Optional)</Label>
                                    <Select value={facilitatorId} onValueChange={setFacilitatorId}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white font-bold"><SelectValue placeholder="Assign Facilitator" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {facilitators?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Session Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white font-bold">
                                            <div className="flex items-center gap-2">
                                                {type === 'Virtual' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Virtual">Virtual</SelectItem>
                                            <SelectItem value="Physical">Physical</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Base Session Title</Label>
                                    <Input value={baseTitle} onChange={(e) => setBaseTitle(e.target.value)} placeholder="e.g. Daily Standup" className="h-14 bg-white/10 border-white/10 text-white font-bold placeholder:text-white/30" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
