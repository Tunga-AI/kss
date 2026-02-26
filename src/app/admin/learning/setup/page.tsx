'use client';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    Video,
    FileText,
    ChevronDown,
    ChevronUp,
    X,
    Upload,
    MapPin,
    Users,
    Clock,
    LayoutDashboard,
    Settings,
    Layers,
    Calendar,
    AlertCircle
} from "lucide-react";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, doc, getDocs, Timestamp, serverTimestamp, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Program } from '@/lib/program-types';
import type { User } from '@/lib/user-types';
import type { ContentItem } from '@/lib/content-library-types';
import type { DeliveryType, LearningCourse, LearningModule } from '@/lib/learning-types';
import type { Cohort } from '@/lib/cohort-types';
import type { ClassroomSession } from '@/lib/classroom-types';
import { addClassroomSession, updateClassroomSession } from '@/lib/classroom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Unit data structure for cohort-specific configuration
interface UnitConfig {
    id: string; // Firestore ID if existing, or temp ID
    title: string;
    description: string;
    deliveryType: DeliveryType;
    location: string;
    facilitatorId: string;
    facilitatorName: string;
    contentIds: string[];
    estimatedDuration: number;
    startDate: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endDate: string; // YYYY-MM-DD
    endTime: string; // HH:mm
    orderIndex: number;
    sessionId?: string; // Linked ClassroomSession ID
}

function ProgramSetupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cohortId = searchParams.get('cohortId');
    const programId = searchParams.get('programId');

    const firestore = useFirestore();
    const { user } = useUser();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [courseId, setCourseId] = useState<string | null>(null);
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [program, setProgram] = useState<Program | null>(null);
    const [units, setUnits] = useState<UnitConfig[]>([]);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
    const [showContentPicker, setShowContentPicker] = useState<string | null>(null);

    // Fetch Global Data for reference
    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) as any;
    }, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentLibrary'), where('status', '==', 'published')) as any;
    }, [firestore]);
    const { data: contentItems } = useCollection<ContentItem>(contentQuery as any);

    // Initialization
    useEffect(() => {
        const init = async () => {
            if (!firestore || !cohortId || !programId) return;

            try {
                setLoading(true);

                // 1. Fetch Cohort and Program metadata
                const [cohortSnap, programSnap] = await Promise.all([
                    getDoc(doc(firestore, 'cohorts', cohortId)),
                    getDoc(doc(firestore, 'programs', programId))
                ]);

                if (cohortSnap.exists()) setCohort({ id: cohortSnap.id, ...cohortSnap.data() } as Cohort);
                if (programSnap.exists()) setProgram({ id: programSnap.id, ...programSnap.data() } as Program);

                // 2. Check for existing Course instance for this cohort/program
                const courseQ = query(
                    collection(firestore, 'learningCourses'),
                    where('cohortId', '==', cohortId),
                    where('programId', '==', programId)
                );
                const courseSnap = await getDocs(courseQ);

                let currentCourseId: string | null = null;
                let existingUnits: UnitConfig[] = [];

                if (!courseSnap.empty) {
                    const courseDoc = courseSnap.docs[0];
                    currentCourseId = courseDoc.id;
                    setCourseId(currentCourseId);

                    // Fetch units for this course
                    const unitsQ = query(
                        collection(firestore, 'learningUnits'),
                        where('courseId', '==', currentCourseId)
                    );
                    const unitsSnap = await getDocs(unitsQ);
                    existingUnits = unitsSnap.docs.map(u => {
                        const data = u.data() as LearningModule;
                        return {
                            id: u.id,
                            title: data.title,
                            description: data.description,
                            deliveryType: data.deliveryType,
                            location: data.location || '',
                            facilitatorId: data.facilitatorId || '',
                            facilitatorName: data.facilitatorName || '',
                            contentIds: data.contentIds || [],
                            estimatedDuration: data.estimatedDuration || 60,
                            startDate: data.scheduledStartDate ? format(data.scheduledStartDate.toDate(), 'yyyy-MM-dd') : '',
                            startTime: data.scheduledStartDate ? format(data.scheduledStartDate.toDate(), 'HH:mm') : '09:00',
                            endDate: data.scheduledEndDate ? format(data.scheduledEndDate.toDate(), 'yyyy-MM-dd') : '',
                            endTime: data.scheduledEndDate ? format(data.scheduledEndDate.toDate(), 'HH:mm') : '11:00',
                            orderIndex: data.orderIndex || 0,
                            sessionId: data.classroomSessionId
                        };
                    }).sort((a, b) => a.orderIndex - b.orderIndex);
                } else {
                    // Try to find a BLUEPRINT (Course with same programId but no cohortId)
                    const blueprintQ = query(
                        collection(firestore, 'learningCourses'),
                        where('programId', '==', programId),
                        where('cohortId', '==', '')
                    );
                    const blueprintSnap = await getDocs(blueprintQ);

                    if (!blueprintSnap.empty) {
                        const blueprintDoc = blueprintSnap.docs[0];
                        // Fetch blueprint units
                        const bUnitsQ = query(
                            collection(firestore, 'learningUnits'),
                            where('courseId', '==', blueprintDoc.id)
                        );
                        const bUnitsSnap = await getDocs(bUnitsQ);
                        existingUnits = bUnitsSnap.docs.map((u, idx) => {
                            const data = u.data() as LearningModule;
                            return {
                                id: `new_${idx}`,
                                title: data.title,
                                description: data.description,
                                deliveryType: data.deliveryType,
                                location: data.location || '',
                                facilitatorId: data.facilitatorId || '',
                                facilitatorName: data.facilitatorName || '',
                                contentIds: data.contentIds || [],
                                estimatedDuration: data.estimatedDuration || 60,
                                startDate: '',
                                startTime: '09:00',
                                endDate: '',
                                endTime: '11:00',
                                orderIndex: data.orderIndex || idx
                            };
                        }).sort((a, b) => a.orderIndex - b.orderIndex);
                    }
                }

                setUnits(existingUnits);

            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [firestore, cohortId, programId]);

    // Handlers
    const addUnit = () => {
        const nextIndex = units.length;
        const newUnit: UnitConfig = {
            id: `temp_${Date.now()}`,
            title: '',
            description: '',
            deliveryType: 'Virtual',
            location: '',
            facilitatorId: '',
            facilitatorName: '',
            contentIds: [],
            estimatedDuration: 60,
            startDate: '',
            startTime: '09:00',
            endDate: '',
            endTime: '11:00',
            orderIndex: nextIndex
        };
        setUnits([...units, newUnit]);
        setExpandedUnits(prev => new Set([...prev, newUnit.id]));
    };

    const removeUnit = (id: string) => {
        setUnits(units.filter(u => u.id !== id));
    };

    const updateUnit = (id: string, updates: Partial<UnitConfig>) => {
        setUnits(units.map(u => u.id === id ? { ...u, ...updates } : u));
    };

    const toggleUnitExpansion = (id: string) => {
        setExpandedUnits(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!firestore || !user || !cohort || !program) return;

        try {
            setSaving(true);

            // 1. Create or Update LearningCourse
            let currentCourseId = courseId;
            const courseData = {
                title: program.title,
                description: program.description,
                programId: program.id,
                programTitle: program.title,
                cohortId: cohort.id,
                cohortName: cohort.name,
                status: 'Active' as const,
                isPublished: true,
                isSelfPaced: false,
                allowSkipUnits: true,
                updatedAt: Timestamp.now(),
                updatedBy: user.uid,
            };

            if (currentCourseId) {
                await updateDoc(doc(firestore, 'learningCourses', currentCourseId), courseData);
            } else {
                const newCourseRef = await addDoc(collection(firestore, 'learningCourses'), {
                    ...courseData,
                    createdAt: Timestamp.now(),
                    createdBy: user.uid,
                    moduleIds: [],
                    unitIds: []
                });
                currentCourseId = newCourseRef.id;
                setCourseId(currentCourseId);
            }

            // 2. Sync Units and Sessions
            const finalUnitIds: string[] = [];

            for (let i = 0; i < units.length; i++) {
                const unit = units[i];
                const isNew = unit.id.startsWith('temp_') || unit.id.startsWith('new_');

                const startDateTime = (unit.startDate && unit.startTime) ? Timestamp.fromDate(new Date(`${unit.startDate}T${unit.startTime}`)) : null;
                const endDateTime = (unit.endDate && unit.endTime) ? Timestamp.fromDate(new Date(`${unit.endDate}T${unit.endTime}`)) : null;

                // Create/Update ClassroomSession if scheduled
                let sessionId = unit.sessionId;
                if (startDateTime && endDateTime) {
                    const sessionData: any = {
                        title: unit.title || program.title,
                        description: unit.description,
                        programId: program.id,
                        cohortId: cohort.id,
                        facilitatorId: unit.facilitatorId || null,
                        type: unit.deliveryType === 'Self-paced' ? 'Virtual' : unit.deliveryType,
                        location: unit.location || null,
                        startDateTime,
                        endDateTime,
                        status: 'Scheduled',
                        updatedAt: serverTimestamp(),
                    };

                    if (sessionId) {
                        await updateClassroomSession(firestore, sessionId, sessionData);
                    } else {
                        sessionId = await addClassroomSession(firestore, {
                            ...sessionData,
                            createdAt: serverTimestamp(),
                            createdBy: user.uid,
                            attendees: [],
                            recordingUrl: '',
                            meetingLink: ''
                        });
                    }
                }

                const unitData: any = {
                    courseId: currentCourseId,
                    title: unit.title || `Module ${i + 1}`,
                    description: unit.description,
                    deliveryType: unit.deliveryType,
                    location: unit.location,
                    facilitatorId: unit.facilitatorId,
                    facilitatorName: facilitators?.find(f => f.id === unit.facilitatorId)?.name || '',
                    contentIds: unit.contentIds,
                    estimatedDuration: unit.estimatedDuration,
                    scheduledStartDate: startDateTime,
                    scheduledEndDate: endDateTime,
                    orderIndex: i,
                    classroomSessionId: sessionId || null,
                    updatedAt: Timestamp.now(),
                    updatedBy: user.uid,
                    status: startDateTime ? 'Scheduled' : 'Draft',
                    isRequired: true
                };

                let actualUnitId = unit.id;
                if (isNew) {
                    const newUnitRef = await addDoc(collection(firestore, 'learningUnits'), {
                        ...unitData,
                        createdAt: Timestamp.now(),
                        createdBy: user.uid
                    });
                    actualUnitId = newUnitRef.id;
                } else {
                    await updateDoc(doc(firestore, 'learningUnits', unit.id), unitData);
                }

                finalUnitIds.push(actualUnitId);
            }

            // 3. Update course with unit list
            await updateDoc(doc(firestore, 'learningCourses', currentCourseId), {
                moduleIds: finalUnitIds,
                unitIds: finalUnitIds // for legacy apps
            });

            // Success
            router.push('/admin/learning');

        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save program configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen bg-white">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body pb-20">
            <div className="max-w-6xl mx-auto">
                {/* Fixed Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 z-50 shadow-2xl">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                <ArrowLeft className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Status</p>
                                <p className="text-xs font-bold text-accent">{courseId ? 'Updating Instance' : 'Creating New Instance'}</p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-tl-2xl rounded-br-2xl font-bold shadow-xl min-w-[200px]"
                            >
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {saving ? 'Finalizing Setup...' : courseId ? 'Update Program Setup' : 'Create Program Setup'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <Settings className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-primary tracking-tight">Program Setup</h1>
                            <p className="text-gray-500 font-medium">Configure <span className="text-accent">{program?.title}</span> for <span className="text-primary">{cohort?.name}</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Metadata */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl overflow-hidden">
                            <CardHeader className="bg-primary text-white p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="h-5 w-5 text-accent" />
                                    Program Blueprint
                                </CardTitle>
                                <CardDescription className="text-white/60">Core information from the curriculum</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Description</Label>
                                    <p className="text-sm text-primary/80 mt-1 leading-relaxed">{program?.description || 'No description provided'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Duration</Label>
                                        <p className="text-sm font-bold text-primary">{program?.duration || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Level</Label>
                                        <p className="text-sm font-bold text-primary">{program?.competencyLevelName || 'Foundation'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        You are currently configuring the cohort-specific instance of this program. Any changes made here only affect the <strong>{cohort?.name}</strong> cohort.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Card */}
                        <Card className="border-accent/10 shadow-md rounded-tl-2xl rounded-br-2xl overflow-hidden">
                            <CardHeader className="bg-accent/5 p-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-accent">Setup Summary</h3>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                    <span className="text-sm font-bold text-gray-600">Total Modules</span>
                                    <span className="text-lg font-black text-primary">{units.length}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                    <span className="text-sm font-bold text-gray-600">Scheduled Sessions</span>
                                    <span className="text-lg font-black text-green-600">{units.filter(u => u.startDate).length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Modules Listing */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-primary flex items-center gap-2">
                                <Layers className="h-6 w-6 text-accent" />
                                Learning Journey & Schedule
                            </h2>
                            <Button
                                onClick={addUnit}
                                variant="outline"
                                className="border-accent text-accent hover:bg-accent hover:text-white rounded-tl-lg rounded-br-lg font-bold"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Learning Module
                            </Button>
                        </div>

                        {units.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <AlertCircle className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest">No modules defined for this program instance</p>
                                <Button onClick={addUnit} className="mt-4 bg-primary text-white">Get Started</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {units.map((unit, idx) => (
                                    <Card
                                        key={unit.id}
                                        className={cn(
                                            "border-l-4 transition-all overflow-hidden bg-white shadow-sm",
                                            unit.startDate ? "border-l-green-500" : "border-l-orange-500"
                                        )}
                                    >
                                        {/* Unit Header */}
                                        <div
                                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 group"
                                            onClick={() => toggleUnitExpansion(unit.id)}
                                        >
                                            <div className="flex-shrink-0">
                                                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all font-black text-lg">
                                                    {idx + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                                                        {unit.title || `Untitled Module ${idx + 1}`}
                                                    </h3>
                                                    {unit.startDate ? (
                                                        <Badge className="bg-green-500 rounded-lg text-[9px] uppercase font-black h-5">Scheduled</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50 rounded-lg text-[9px] uppercase font-black h-5">Draft</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {unit.deliveryType === 'Virtual' ? <Video className="h-3 w-3" /> : unit.deliveryType === 'Physical' ? <MapPin className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                                                        {unit.deliveryType}
                                                    </div>
                                                    {unit.startDate && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(unit.startDate + 'T00:00:00'), 'MMM do, yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); removeUnit(unit.id); }}
                                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                {expandedUnits.has(unit.id) ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                            </div>
                                        </div>

                                        {/* Unit Config - Expandable */}
                                        {expandedUnits.has(unit.id) && (
                                            <div className="border-t border-gray-100 p-6 bg-gray-50/50 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block">Module Basics</Label>
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold text-gray-600">Title</Label>
                                                                    <Input
                                                                        value={unit.title}
                                                                        onChange={(e) => updateUnit(unit.id, { title: e.target.value })}
                                                                        placeholder="e.g. Closing Techniques"
                                                                        className="rounded-xl border-gray-200 bg-white"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold text-gray-600">Description</Label>
                                                                    <Textarea
                                                                        value={unit.description}
                                                                        onChange={(e) => updateUnit(unit.id, { description: e.target.value })}
                                                                        placeholder="Short agenda for this specific class..."
                                                                        className="rounded-xl border-gray-200 bg-white"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block font-bold">Logistics & Delivery</Label>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold text-gray-600">Type</Label>
                                                                    <Select value={unit.deliveryType} onValueChange={(val: DeliveryType) => updateUnit(unit.id, { deliveryType: val })}>
                                                                        <SelectTrigger className="rounded-xl border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Virtual">Virtual Class</SelectItem>
                                                                            <SelectItem value="Physical">Physical (Campus)</SelectItem>
                                                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                                                            <SelectItem value="Self-paced">E-Learning</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold text-gray-600">Facilitator</Label>
                                                                    <Select value={unit.facilitatorId} onValueChange={(val) => updateUnit(unit.id, { facilitatorId: val })}>
                                                                        <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                                                                            <SelectValue placeholder="Assign Expert" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">Unassigned</SelectItem>
                                                                            {facilitators?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block font-bold">Schedule Setup</Label>
                                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold text-gray-600">Start Date</Label>
                                                                        <Input
                                                                            type="date"
                                                                            value={unit.startDate}
                                                                            onChange={(e) => updateUnit(unit.id, { startDate: e.target.value, endDate: e.target.value })}
                                                                            className="rounded-xl border-gray-200"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold text-gray-600">End Date</Label>
                                                                        <Input
                                                                            type="date"
                                                                            value={unit.endDate}
                                                                            onChange={(e) => updateUnit(unit.id, { endDate: e.target.value })}
                                                                            className="rounded-xl border-gray-200"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold text-gray-600">Start Time</Label>
                                                                        <Input
                                                                            type="time"
                                                                            value={unit.startTime}
                                                                            onChange={(e) => updateUnit(unit.id, { startTime: e.target.value })}
                                                                            className="rounded-xl border-gray-200"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold text-gray-600">End Time</Label>
                                                                        <Input
                                                                            type="time"
                                                                            value={unit.endTime}
                                                                            onChange={(e) => updateUnit(unit.id, { endTime: e.target.value })}
                                                                            className="rounded-xl border-gray-200"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold text-gray-600">Estimated Duration (min)</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={unit.estimatedDuration}
                                                                            onChange={(e) => updateUnit(unit.id, { estimatedDuration: parseInt(e.target.value) || 60 })}
                                                                            className="rounded-xl border-gray-200"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {(unit.deliveryType === 'Virtual' || unit.deliveryType === 'Hybrid') && (
                                                                    <div className="mt-2 text-[10px] text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
                                                                        <Video className="h-3 w-3" />
                                                                        A live virtual classroom will be created for this module.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block font-bold">Course Materials</Label>
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {unit.contentIds.map(cid => {
                                                                        const c = contentItems?.find(item => item.id === cid);
                                                                        return (
                                                                            <Badge key={cid} variant="secondary" className="pl-2 pr-1 py-1 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center gap-1">
                                                                                {c?.type === 'video' ? <Video className="h-3 w-3 text-purple-600" /> : <FileText className="h-3 w-3 text-blue-600" />}
                                                                                <span className="text-[10px] font-bold truncate max-w-[80px]">{c?.title || cid}</span>
                                                                                <button onClick={() => updateUnit(unit.id, { contentIds: unit.contentIds.filter(id => id !== cid) })} className="hover:text-red-500">
                                                                                    <X className="h-3 w-3" />
                                                                                </button>
                                                                            </Badge>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setShowContentPicker(showContentPicker === unit.id ? null : unit.id)}
                                                                    className="w-full rounded-xl border-dashed text-xs text-primary/60"
                                                                >
                                                                    <Plus className="h-3 w-3 mr-2" /> Add Material from Library
                                                                </Button>

                                                                {showContentPicker === unit.id && (
                                                                    <div className="border rounded-2xl p-2 bg-white max-h-40 overflow-y-auto shadow-2xl space-y-1">
                                                                        {contentItems?.filter(c => !unit.contentIds.includes(c.id)).map(c => (
                                                                            <div
                                                                                key={c.id}
                                                                                onClick={() => { updateUnit(unit.id, { contentIds: [...unit.contentIds, c.id] }); setShowContentPicker(null); }}
                                                                                className="p-2 text-xs flex items-center justify-between hover:bg-gray-50 rounded-lg cursor-pointer group"
                                                                            >
                                                                                <span className="truncate">{c.title}</span>
                                                                                <Plus className="h-3 w-3 text-accent opacity-0 group-hover:opacity-100" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProgramSetupPage() {
    return (
        <Suspense fallback={
            <div className="p-8 flex items-center justify-center min-h-screen bg-white">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ProgramSetupContent />
        </Suspense>
    );
}
