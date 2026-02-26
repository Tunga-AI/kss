'use client';
import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import {
    Clock,
    Calendar,
    Users,
    Video,
    MapPin,
    Layers,
    Save,
    RefreshCw,
    Trash,
    PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import type { ClassroomSession } from '@/lib/classroom-types';
import type { Program } from '@/lib/program-types';
import type { User } from '@/lib/user-types';
import type { Cohort } from '@/lib/cohort-types';
import type { LearningCourse, LearningUnit } from '@/lib/learning-types';
import { addClassroomSession, updateClassroomSession, deleteClassroomSession } from '@/lib/classroom';
import { format } from 'date-fns';

type SessionFormData = Omit<ClassroomSession, 'id' | 'startDateTime' | 'endDateTime'> & {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

interface LearningSessionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session?: ClassroomSession | null;
    initialDate?: Date;
    refresh?: () => void;
    cohortId?: string;
    unitId?: string;
}

export function LearningSessionDialog({
    open,
    onOpenChange,
    session,
    initialDate,
    refresh,
    cohortId: propCohortId,
    unitId: propUnitId
}: LearningSessionDialogProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: currentUser } = useUser();

    // Determine if creating new or editing
    const isNew = !session;

    // Fetch Programs
    const programsQuery = useMemo(() => firestore ? query(collection(firestore, "programs")) : null, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery as any);

    // Fetch Cohorts
    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, "cohorts")) : null, [firestore]);
    const { data: cohorts } = useCollection<Cohort>(cohortsQuery as any);

    // Fetch Facilitators
    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    const [mode, setMode] = useState<'cohort' | 'custom'>('cohort');

    // Reset mode based on whether creating new or editing
    useEffect(() => {
        if (open) {
            setMode(isNew ? 'cohort' : 'custom');
        }
    }, [isNew, open]);

    // Initial Form State
    const [formData, setFormData] = useState<Partial<SessionFormData>>({
        title: '',
        description: '',
        programId: '',
        cohortId: '',
        facilitatorId: 'none',
        status: 'Scheduled',
        type: 'Virtual',
        location: '',
        googleMeetLink: '',
        unitId: '',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '10:00', // Default 1 hour
    });

    // Load session data when dialog opens
    useMemo(() => {
        if (session) {
            setMode('custom'); // Editing is always full detail
            setFormData({
                title: session.title,
                description: session.description,
                programId: session.programId,
                cohortId: session.cohortId || '',
                facilitatorId: session.facilitatorId || 'none',
                status: session.status,
                type: session.type || 'Virtual',
                location: session.location || '',
                googleMeetLink: session.googleMeetLink || '',
                unitId: session.unitId || '',
                startDate: format(session.startDateTime.toDate(), 'yyyy-MM-dd'),
                startTime: format(session.startDateTime.toDate(), 'HH:mm'),
                endDate: format(session.endDateTime.toDate(), 'yyyy-MM-dd'),
                endTime: format(session.endDateTime.toDate(), 'HH:mm'),
            });
        } else if (initialDate || propCohortId || propUnitId) {
            const selectedCohort = cohorts?.find(c => c.id === propCohortId);
            setMode('cohort');
            setFormData(prev => ({
                ...prev,
                startDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                endDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                cohortId: propCohortId || prev.cohortId || '',
                unitId: propUnitId || prev.unitId || '',
                programId: selectedCohort?.programIds?.[0] || prev.programId || '',
            }));
        } else {
            // Reset
            setMode('cohort');
            setFormData({
                title: '',
                description: '',
                programId: '',
                cohortId: '',
                facilitatorId: 'none',
                status: 'Scheduled',
                type: 'Virtual',
                location: '',
                googleMeetLink: '',
                unitId: '',
                startDate: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endDate: new Date().toISOString().split('T')[0],
                endTime: '10:00',
            });
        }
    }, [session, initialDate, open]);

    // Fetch Courses for the selected cohort
    const coursesQuery = useMemo(() => {
        if (!firestore || !formData.cohortId || formData.cohortId === 'none') return null;
        return query(
            collection(firestore, "learningCourses"),
            where("cohortId", "==", formData.cohortId)
        );
    }, [firestore, formData.cohortId]);
    const { data: courses } = useCollection<LearningCourse>(coursesQuery as any);

    // Fetch Units for the selected cohort's courses
    const unitsQuery = useMemo(() => {
        if (!firestore || !courses || courses.length === 0) return null;
        const courseIds = courses.map(c => c.id);
        // Note: Firestore 'in' queries are limited to 10 items
        if (courseIds.length === 0) return null;
        return query(
            collection(firestore, "learningUnits"),
            where("courseId", "in", courseIds.slice(0, 10))
        );
    }, [firestore, courses]);
    const { data: cohortUnits } = useCollection<LearningUnit>(unitsQuery as any);

    // Auto-populate facilitator when unit is selected
    // Handled in handleSelectChange to avoid effects loops

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => {
            const updates: any = { [id]: value };

            // Recalculate end time if start time changes and we have a unit duration
            if (id === 'startTime' && prev.unitId && prev.unitId !== 'none' && cohortUnits) {
                const selectedUnit = cohortUnits.find((u: LearningUnit) => u.id === prev.unitId);
                if (selectedUnit?.estimatedDuration) {
                    const start = new Date(`2000-01-01T${value}`);
                    const end = new Date(start.getTime() + selectedUnit.estimatedDuration * 60000);
                    updates.endTime = format(end, 'HH:mm');
                }
            }
            return { ...prev, ...updates };
        });
    };

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => {
            const updates: any = { [id]: value };

            // Auto-populate when unit changes
            if (id === 'unitId' && value !== 'none' && cohortUnits) {
                const selectedUnit = cohortUnits.find((u: LearningUnit) => u.id === value);
                if (selectedUnit) {
                    updates.title = selectedUnit.title;
                    updates.description = selectedUnit.description;
                    updates.facilitatorId = selectedUnit.facilitatorId || 'none';
                    // Handle type mapping (LearningUnit treats Self-paced as a type, but Session uses Virtual/Physical/Hybrid)
                    const deliveryType = selectedUnit.deliveryType === 'Self-paced' ? 'Virtual' : (selectedUnit.deliveryType || 'Virtual');
                    updates.type = deliveryType;
                    updates.location = selectedUnit.location || '';

                    if (selectedUnit.estimatedDuration && prev.startTime) {
                        const start = new Date(`2000-01-01T${prev.startTime}`);
                        const end = new Date(start.getTime() + selectedUnit.estimatedDuration * 60000);
                        updates.endTime = format(end, 'HH:mm');
                    }
                }
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async () => {
        if (!firestore || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime || !formData.title || !formData.programId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }

        setIsSaving(true);
        try {
            const startDateTime = Timestamp.fromDate(new Date(`${formData.startDate}T${formData.startTime}`));
            const endDateTime = Timestamp.fromDate(new Date(`${formData.endDate}T${formData.endTime}`));

            const sessionData: any = {
                title: formData.title,
                description: formData.description || '',
                programId: formData.programId,
                cohortId: (formData.cohortId === 'none' || !formData.cohortId) ? null : formData.cohortId,
                facilitatorId: formData.facilitatorId === 'none' ? null : formData.facilitatorId,
                type: formData.type,
                location: formData.location || null,
                googleMeetLink: formData.googleMeetLink || null,
                unitId: formData.unitId || null,
                startDateTime,
                endDateTime,
                status: formData.status,
            };

            if (isNew) {
                await addClassroomSession(firestore, sessionData);
                toast({ title: 'Success', description: 'Session scheduled.' });
            } else if (session) {
                await updateClassroomSession(firestore, session.id, sessionData);
                toast({ title: 'Success', description: 'Session updated.' });
            }

            onOpenChange(false);
            if (refresh) refresh();
        } catch (error) {
            console.error("Error saving:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save session.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!firestore || !session) return;
        if (confirm('Are you sure you want to delete this session?')) {
            try {
                await deleteClassroomSession(firestore, session.id);
                toast({ title: 'Success', description: 'Session deleted.' });
                onOpenChange(false);
                if (refresh) refresh();
            } catch (error) {
                console.error("Error deleting:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete session.' });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Schedule New Class' : 'Edit Class Session'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Mode Toggle for New Sessions */}
                    {isNew && (
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                            <button
                                type="button"
                                onClick={() => setMode('cohort')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${mode === 'cohort' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Cohort Class
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('custom')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${mode === 'custom' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Custom Session
                            </button>
                        </div>
                    )}

                    {mode === 'cohort' ? (
                        /* SIMPLIFIED COHORT FLOW */
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                        Select Cohort
                                    </Label>
                                    <Select value={formData.cohortId} onValueChange={(val) => handleSelectChange('cohortId', val)}>
                                        <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg bg-blue-50/50">
                                            <SelectValue placeholder="Select Cohort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cohorts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                        Select Module
                                    </Label>
                                    <Select
                                        value={formData.unitId}
                                        onValueChange={(val) => handleSelectChange('unitId', val)}
                                        disabled={!formData.cohortId || formData.cohortId === 'none'}
                                    >
                                        <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg bg-blue-50/50">
                                            <SelectValue placeholder={formData.cohortId ? "Select Module" : "Select Cohort First"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cohortUnits?.map((u: LearningUnit) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Auto-filled details review */}
                            {formData.unitId && (
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Layers className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary">{formData.title}</p>
                                            <p className="text-xs text-primary/60 mt-0.5 line-clamp-1">{formData.description}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-primary/5">
                                            <Users className="h-3 w-3 text-primary/40" />
                                            <span className="font-bold text-primary">
                                                {facilitators?.find(f => f.id === formData.facilitatorId)?.name || 'Needs Facilitator'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-primary/5">
                                            {formData.type === 'Virtual' ? <Video className="h-3 w-3 text-blue-500" /> : <MapPin className="h-3 w-3 text-green-500" />}
                                            <span className="font-bold text-primary">{formData.type}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-primary font-bold text-xs uppercase tracking-widest">Date</Label>
                                    <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => {
                                        setFormData(prev => ({ ...prev, startDate: e.target.value, endDate: e.target.value }))
                                    }} className="border-primary/20 rounded-tl-lg rounded-br-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-primary font-bold text-xs uppercase tracking-widest">Time</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} className="border-primary/20 rounded-tl-lg rounded-br-lg" />
                                        <span className="text-primary/40">-</span>
                                        <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} className="border-primary/20 rounded-tl-lg rounded-br-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CUSTOM / FULL EDIT MODE */
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Class Title *</Label>
                                    <Input id="title" value={formData.title} onChange={handleChange} placeholder="e.g. Introduction to Sales" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={formData.type} onValueChange={(val) => handleSelectChange('type', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Virtual">Virtual Class</SelectItem>
                                            <SelectItem value="Physical">Physical (On-Campus)</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description/Agenda</Label>
                                <Textarea id="description" value={formData.description} onChange={handleChange} rows={3} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-gray-100">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input id="startDate" type="date" value={formData.startDate} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input id="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time *</Label>
                                    <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-gray-100">
                                {/* Dynamic Location/Link Fields */}
                                {(formData.type === 'Virtual' || formData.type === 'Hybrid') && (
                                    <div className="col-span-2 space-y-2">
                                        <Label className="flex items-center gap-2 text-blue-600"><Video className="h-4 w-4" /> Live Virtual Class</Label>
                                        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            A secure live video classroom will be automatically created for this session. Students can join directly from their dashboard.
                                        </div>
                                    </div>
                                )}
                                {(formData.type === 'Physical' || formData.type === 'Hybrid') && (
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="location" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Physical Location / Room</Label>
                                        <Input id="location" value={formData.location} onChange={handleChange} placeholder="e.g. Room 304, Main Building" />
                                    </div>
                                )}
                            </div>

                            {/* Cohort and Curriculum Section */}
                            <div className="border-t pt-4 border-gray-100">
                                <div className="mb-3 pb-2 border-b border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Layers className="h-4 w-4" />
                                        Target Audience & Curriculum
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Select a cohort to view available units and auto-assign facilitators</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="programId">Program * (Curriculum)</Label>
                                        <Select value={formData.programId} onValueChange={(val) => handleSelectChange('programId', val)}>
                                            <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                                            <SelectContent>
                                                {programs?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cohortId" className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5" />
                                            Cohort *
                                        </Label>
                                        <Select value={formData.cohortId} onValueChange={(val) => handleSelectChange('cohortId', val)}>
                                            <SelectTrigger><SelectValue placeholder="Select Cohort" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Open Class (No Cohort)</SelectItem>
                                                {cohorts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="unitId" className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5" />
                                            Learning Unit {formData.cohortId && formData.cohortId !== 'none' && <span className="text-xs text-blue-600">(from cohort)</span>}
                                        </Label>
                                        <Select
                                            value={formData.unitId}
                                            onValueChange={(val) => handleSelectChange('unitId', val)}
                                            disabled={!formData.cohortId || formData.cohortId === 'none'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={formData.cohortId && formData.cohortId !== 'none' ? "Select Learning Unit" : "Select a cohort first"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Specific Unit</SelectItem>
                                                {cohortUnits?.map((u: LearningUnit) => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        {u.title} {u.facilitatorName && `(${u.facilitatorName})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(!formData.cohortId || formData.cohortId === 'none') && (
                                            <p className="text-xs text-gray-500">Select a cohort to see available learning units</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="facilitatorId">Facilitator</Label>
                                        <Select value={formData.facilitatorId} onValueChange={(val) => handleSelectChange('facilitatorId', val)}>
                                            <SelectTrigger><SelectValue placeholder="Assign Facilitator" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Unassigned</SelectItem>
                                                {facilitators?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Status Field - Always Visible */}
                    <div className="grid grid-cols-2 gap-4 border-t pt-4 border-gray-100">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between">
                    {!isNew && (
                        <div className="flex gap-2 mr-auto">
                            <Button variant="destructive" size="sm" onClick={handleDelete} type="button">
                                <Trash className="h-4 w-4 mr-2" /> Delete
                            </Button>

                            {session && (session.type === 'Virtual' || session.type === 'Hybrid') && (
                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" asChild>
                                    <Link href={`/admin/classroom/session/${session.id}`}>
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                        {session.status === 'In Progress' ? 'Join Live Class' : 'Start Class'}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-white">
                            {isSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            {isNew ? 'Schedule Class' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
