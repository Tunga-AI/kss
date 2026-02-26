'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import {
    ChevronLeft,
    Save,
    Calendar as CalendarIcon,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';

import type { ClassroomSession } from '@/lib/classroom-types';
import type { Cohort } from '@/lib/cohort-types';
import type { LearningCourse, LearningUnit } from '@/lib/learning-types';
import type { User } from '@/lib/user-types';
import type { Program } from '@/lib/program-types';
import { addClassroomSession, updateClassroomSession } from '@/lib/classroom';

export default function SchedulePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Initial State from URL
    const initialCourseId = searchParams.get('courseId') || '';

    const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);

    // Manage local schedule state (unitId -> Draft Session Data)
    const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, Partial<ClassroomSession> & { startDate?: string, startTime?: string, endTime?: string }>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({}); // Track saving state per unit

    // Fetch All Courses for Selection
    const coursesQuery = useMemo(() => firestore ? query(collection(firestore, 'learningCourses'), orderBy('title')) : null, [firestore]);
    const { data: courses, loading: coursesLoading } = useCollection<LearningCourse>(coursesQuery as any);

    const facilitatorsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) : null, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    // Derived Data
    const selectedCourse = useMemo(() => courses?.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);
    const selectedCohortId = selectedCourse?.cohortId;
    const selectedProgramId = selectedCourse?.programId;

    // Fetch Modules for Selected Course
    const courseModulesQuery = useMemo(() => {
        if (!firestore || !selectedCourseId) return null;
        return query(
            collection(firestore, 'learningUnits'),
            where('courseId', '==', selectedCourseId)
        );
    }, [firestore, selectedCourseId]);
    const { data: courseModules } = useCollection<LearningUnit>(courseModulesQuery as any);

    // Fetch Existing Sessions for the Cohort (to check overlap/existing)
    // Note: We filter by cohortId. If course has no cohort, we can't really fetch "scheduled" sessions for it unless they are unassigned?
    const existingSessionsQuery = useMemo(() => {
        if (!firestore || !selectedCohortId) return null;
        return query(collection(firestore, 'classroom'), where('cohortId', '==', selectedCohortId));
    }, [firestore, selectedCohortId]);
    const { data: existingSessions } = useCollection<ClassroomSession>(existingSessionsQuery as any);

    // Helper: Get Session for Module
    const getSessionForModule = (unitId: string) => existingSessions?.find(s => s.unitId === unitId);

    // Handle Input Change for a specific row
    const handleScheduleChange = (unitId: string, field: string, value: string) => {
        setScheduleDrafts(prev => {
            const currentDraft = prev[unitId] || {};
            const unit = courseModules?.find(u => u.id === unitId);

            // Initialize draft if starting fresh
            const draft = {
                ...currentDraft,
                [field]: value
            };

            // Auto-calculate End Time if Start Time changes
            if (field === 'startTime' && unit?.estimatedDuration) {
                const startTime = value;
                const start = new Date(`2000-01-01T${startTime}`);
                const end = new Date(start.getTime() + unit.estimatedDuration * 60000);
                draft.endTime = format(end, 'HH:mm');
            }

            return { ...prev, [unitId]: draft };
        });
    };

    // Save a Single Row
    const handleSaveRow = async (unit: LearningUnit) => {
        if (!firestore) return;

        if (!selectedCohortId) {
            toast({ variant: 'destructive', title: 'Action needed', description: 'This course is not assigned to a cohort. Cannot schedule classes.' });
            return;
        }

        const draft = scheduleDrafts[unit.id];
        const existingSession = getSessionForModule(unit.id);

        let startDateStr = draft?.startDate;
        let startTimeStr = draft?.startTime;
        let endTimeStr = draft?.endTime;

        // Use existing if not in draft
        if (!startDateStr && existingSession) startDateStr = format(existingSession.startDateTime.toDate(), 'yyyy-MM-dd');
        if (!startTimeStr && existingSession) startTimeStr = format(existingSession.startDateTime.toDate(), 'HH:mm');

        // Calculate End Time if missing
        if (!endTimeStr && existingSession) {
            endTimeStr = format(existingSession.endDateTime.toDate(), 'HH:mm');
        } else if (!endTimeStr && unit.estimatedDuration && startTimeStr) {
            const start = new Date(`2000-01-01T${startTimeStr}`);
            const end = new Date(start.getTime() + unit.estimatedDuration * 60000);
            endTimeStr = format(end, 'HH:mm');
        }

        if (!startDateStr || !startTimeStr || !endTimeStr) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please set a date and start time.' });
            return;
        }

        setSaving(prev => ({ ...prev, [unit.id]: true }));

        try {
            const startDateTime = Timestamp.fromDate(new Date(`${startDateStr}T${startTimeStr}`));
            const endDateTime = Timestamp.fromDate(new Date(`${startDateStr}T${endTimeStr}`));

            const sessionData: any = {
                title: unit.title,
                description: unit.description || '',
                programId: selectedProgramId,
                cohortId: selectedCohortId,
                facilitatorId: unit.facilitatorId || null,
                type: unit.deliveryType === 'Self-paced' ? 'Virtual' : (unit.deliveryType || 'Virtual'),
                location: unit.location || null,
                unitId: unit.id,
                startDateTime,
                endDateTime,
                status: 'Scheduled',
            };

            if (existingSession) {
                await updateClassroomSession(firestore, existingSession.id, sessionData);
                toast({ title: 'Success', description: 'Schedule updated.' });
            } else {
                await addClassroomSession(firestore, sessionData);
                toast({ title: 'Success', description: 'Class scheduled.' });
            }

            // Clear draft to show "Saved" state (button turns green)
            setScheduleDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[unit.id];
                return newDrafts;
            });

        } catch (error) {
            console.error("Error saving session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save schedule.' });
        } finally {
            setSaving(prev => ({ ...prev, [unit.id]: false }));
        }
    };

    const sortedModules = useMemo(() => {
        if (!courseModules) return [];
        return [...courseModules].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }, [courseModules]);


    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            {/* Hero Section */}
            <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <CalendarIcon className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                {selectedCourse ? selectedCourse.title : 'Course Schedule'}
                            </h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            {selectedCourse
                                ? `Scheduling for ${selectedCourse.cohortName || 'Unassigned Cohort'}`
                                : 'Select a course to manage its schedule'}
                        </p>
                    </div>

                    {selectedCourse && (
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{sortedModules.length}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Modules</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Controls */}
            <div className="mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
                <div className="space-y-2">
                    <Label className="text-primary font-bold uppercase text-xs tracking-widest">Select Course</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="h-12 text-lg"><SelectValue placeholder="Search or select a course..." /></SelectTrigger>
                        <SelectContent>
                            {courses?.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    <span className="font-bold">{c.title}</span>
                                    {c.cohortName && <span className="ml-2 text-gray-400 font-normal">({c.cohortName})</span>}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Schedule Table/List */}
            {selectedCourseId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-6xl mx-auto">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-accent" />
                            Module Schedule
                        </h2>
                        <div className="text-sm text-gray-500">
                            {existingSessions?.length || 0} / {sortedModules.length} Scheduled
                        </div>
                    </div>

                    {!selectedCohortId && (
                        <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2 text-orange-700 text-sm font-bold">
                            <AlertCircle className="h-5 w-5" />
                            Warning: This course is not assigned to a cohort. You cannot save schedules yet.
                        </div>
                    )}

                    <div className="divide-y divide-gray-100">
                        {/* Header Row */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:grid">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-4">Module Details</div>
                            <div className="col-span-2">Facilitator</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2">Time</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>

                        {sortedModules.length > 0 ? (
                            sortedModules.map((module, idx) => {
                                const session = getSessionForModule(module.id);
                                const draft = scheduleDrafts[module.id];
                                const isSaved = !!session;
                                const isModified = draft && (draft.startDate || draft.startTime);

                                // Values to Display (Draft > Session > Empty)
                                const dateValue = draft?.startDate ?? (session ? format(session.startDateTime.toDate(), 'yyyy-MM-dd') : '');
                                const timeValue = draft?.startTime ?? (session ? format(session.startDateTime.toDate(), 'HH:mm') : '');

                                // Calculate End Time for display
                                let endTimeDisplay = '';
                                if (draft?.endTime) {
                                    endTimeDisplay = draft.endTime;
                                } else if (session) {
                                    endTimeDisplay = format(session.endDateTime.toDate(), 'HH:mm');
                                } else if (timeValue && module.estimatedDuration) {
                                    const start = new Date(`2000-01-01T${timeValue}`);
                                    const end = new Date(start.getTime() + module.estimatedDuration * 60000);
                                    endTimeDisplay = format(end, 'HH:mm');
                                }

                                return (
                                    <div key={module.id} className={cn(
                                        "grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors border-b md:border-b-0",
                                        isSaved ? "bg-white" : "bg-orange-50/10"
                                    )}>
                                        <div className="col-span-1 flex justify-center md:block">
                                            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-xs font-bold text-primary">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <p className="font-bold text-sm text-primary">{module.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{module.deliveryType}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {module.estimatedDuration}m</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-sm text-gray-600">
                                            <div className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Facilitator</div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                {facilitators?.find(f => f.id === (module.facilitatorId))?.name || 'Unassigned'}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Date</div>
                                            <Input
                                                type="date"
                                                value={dateValue}
                                                onChange={(e) => handleScheduleChange(module.id, 'startDate', e.target.value)}
                                                className={cn("h-9 border-gray-200", !dateValue && "border-orange-200 bg-orange-50")}
                                                disabled={!selectedCohortId}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Time</div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={timeValue}
                                                    onChange={(e) => handleScheduleChange(module.id, 'startTime', e.target.value)}
                                                    className={cn("h-9 border-gray-200", !timeValue && "border-orange-200 bg-orange-50")}
                                                    disabled={!selectedCohortId}
                                                />
                                                {endTimeDisplay && <span className="text-xs text-gray-400 whitespace-nowrap">- {endTimeDisplay}</span>}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveRow(module)}
                                                disabled={saving[module.id] || (!isModified && isSaved) || !selectedCohortId}
                                                className={cn(
                                                    "h-9 w-9 p-0 rounded-full shadow-sm transition-all",
                                                    isSaved && !isModified ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-primary text-white hover:bg-primary/90"
                                                )}
                                            >
                                                {saving[module.id] ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : isSaved && !isModified ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center text-gray-400">
                                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                                <p>No modules found for this course.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
