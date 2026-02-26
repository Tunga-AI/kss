'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Users,
    Shield,
    Activity,
    ArrowLeft,
    Save,
    RefreshCw,
    Settings2,
    UserCheck,
    Briefcase,
    LayoutGrid,
    Search,
    FileCheck
} from 'lucide-react';
import type { Cohort, ProgramSettings } from '@/lib/cohort-types';
import type { User } from '@/lib/user-types';
import type { Assessment } from '@/lib/assessment-types';
import type { Program } from '@/lib/program-types';
import { addCohort, updateCohort } from '@/lib/cohorts';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CohortFormProps {
    cohort?: Cohort;
}

export function CohortForm({ cohort }: CohortFormProps) {
    const isNew = !cohort;
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useUsersFirestore(); // kenyasales DB — programs, assessments, users, cohorts all live here

    const [name, setName] = useState(cohort?.name || '');
    const [status, setStatus] = useState<Cohort['status']>(cohort?.status || 'Accepting Applications');
    const [programIds, setProgramIds] = useState<string[]>(cohort?.programIds || (cohort?.programId ? [cohort.programId] : []));
    const [programSettings, setProgramSettings] = useState<Record<string, ProgramSettings>>(
        cohort?.programSettings || {}
    );
    const [globalCouncil, setGlobalCouncil] = useState<string[]>(cohort?.council || []);
    const [globalInstructors, setGlobalInstructors] = useState<string[]>(cohort?.instructors || []);

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('global');

    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator'));
    }, [firestore]);

    const { data: facilitators, loading: facilitatorsLoading } = useCollection<User>(facilitatorsQuery as any);

    const assessmentsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'assessments'));
    }, [firestore]);

    const { data: assessments } = useCollection<Assessment>(assessmentsQuery as any);

    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'));
    }, [firestore]);

    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    const handleProgramChange = (programId: string) => {
        setProgramIds(prev => {
            const newIds = prev.includes(programId)
                ? prev.filter(id => id !== programId)
                : [...prev, programId];

            // Initialize program settings if adding a new program
            if (!prev.includes(programId)) {
                setProgramSettings(settings => ({
                    ...settings,
                    [programId]: {
                        programId,
                        council: [],
                        instructors: [],
                        assessmentId: ''
                    }
                }));
            } else {
                // Remove program settings if removing a program
                setProgramSettings(settings => {
                    const newSettings = { ...settings };
                    delete newSettings[programId];
                    return newSettings;
                });
            }

            return newIds;
        });
    };

    const handleGlobalCouncilChange = (facilitatorId: string) => {
        setGlobalCouncil(prev =>
            prev.includes(facilitatorId)
                ? prev.filter(id => id !== facilitatorId)
                : [...prev, facilitatorId]
        );
    };

    const handleGlobalInstructorChange = (instructorId: string) => {
        setGlobalInstructors(prev =>
            prev.includes(instructorId)
                ? prev.filter(id => id !== instructorId)
                : [...prev, instructorId]
        );
    };

    const handleProgramAssessmentChange = (programId: string, assessmentId: string) => {
        setProgramSettings(prev => {
            const current = prev[programId] || { programId, council: [], instructors: [] };
            return {
                ...prev,
                [programId]: { ...current, assessmentId }
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        setIsSaving(true);

        if (programIds.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one program for this cohort.' });
            setIsSaving(false);
            return;
        }

        // Sanitize programSettings to ensure no undefined values (Firestore crashes on undefined)
        const sanitizedSettings = { ...programSettings };
        Object.keys(sanitizedSettings).forEach(key => {
            if (sanitizedSettings[key].assessmentId === undefined) {
                sanitizedSettings[key].assessmentId = '';
            }
            // Also ensure other fields are not undefined
            if (!sanitizedSettings[key].council) sanitizedSettings[key].council = [];
            if (!sanitizedSettings[key].instructors) sanitizedSettings[key].instructors = [];
        });

        const cohortData = {
            name,
            status,
            programIds,
            programId: programIds[0], // Legacy support - first program
            programSettings: sanitizedSettings,
            // Global facilitation and council fields override legacy/program-specific structures
            council: globalCouncil,
            instructors: globalInstructors,
            assessmentId: sanitizedSettings[programIds[0]]?.assessmentId || '' // Keeps primary assessment ID at root
        };

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
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save cohort.' });
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
                                    <LayoutGrid className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{isNew ? 'Cohort Initialization' : 'Sync Management'}</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {isNew ? 'Create New Intake' : <>{cohort?.name} <span className="text-white/40 font-mono text-2xl">#{cohort?.id}</span></>}
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
                                    <><Save className="h-5 w-5 mr-2" /> {isNew ? 'Create Cohort' : 'Save Changes'}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Primary Configuration */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6 md:p-8">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-accent" />
                                    Intake Designation
                                </h2>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Official Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold text-lg"
                                            placeholder="e.g. Q3 2026 Engineering Batch"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Lifecycle Phase</Label>
                                        <Select value={status} onValueChange={(value: Cohort['status']) => setStatus(value)} required>
                                            <SelectTrigger id="status" className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-4 w-4 text-accent" />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                                <SelectItem value="Accepting Applications" className="font-bold">Accepting Applications</SelectItem>
                                                <SelectItem value="In Review" className="font-bold">Evaluation In Progress</SelectItem>
                                                <SelectItem value="Closed" className="font-bold">Intake Terminated (Closed)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-50" />

                                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 relative z-10">
                                    <Briefcase className="h-5 w-5 text-white" />
                                    Program Selection
                                </h2>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Target Programs</Label>
                                        <Badge variant="outline" className="border-white text-white text-[8px] font-black">{programIds.length} Selected</Badge>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                                        <ScrollArea className="h-64">
                                            <div className="p-4 space-y-4">
                                                {programsLoading && (
                                                    <div className="flex flex-col items-center justify-center h-40">
                                                        <RefreshCw className="h-6 w-6 text-white animate-spin mb-2" />
                                                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Loading Programs...</span>
                                                    </div>
                                                )}

                                                {programs?.map(program => (
                                                    <div
                                                        key={program.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl transition-all border border-transparent",
                                                            programIds.includes(program.id) ? "bg-white/20 border-white/20" : "hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">
                                                                {(program.programName || program.title || '?').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`program-${program.id}`} className="font-bold text-sm cursor-pointer block">{program.programName || program.title || 'Untitled'}</Label>
                                                                <span className="text-[9px] text-white/50 uppercase tracking-wider">{program.programType}</span>
                                                            </div>
                                                        </div>
                                                        <Checkbox
                                                            id={`program-${program.id}`}
                                                            checked={programIds.includes(program.id)}
                                                            onCheckedChange={() => handleProgramChange(program.id)}
                                                            className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white h-5 w-5"
                                                        />
                                                    </div>
                                                ))}

                                                {!programsLoading && programs?.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center h-40">
                                                        <Briefcase className="h-6 w-6 text-white/10 mb-2" />
                                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">No programs found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    <p className="text-[10px] text-white/30 mt-6 leading-relaxed italic">
                                        Select all programs that will be available in this cohort/intake. For example, April 2026 can have Sales Foundation 2, Sales 3, etc.
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* Program-Specific Settings */}
                        {programIds.length > 0 && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6 md:p-8">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-accent" />
                                    Program-Specific Settings
                                </h2>

                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${programIds.length}, minmax(0, 1fr))` }}>
                                        {programIds.map(programId => {
                                            const program = programs?.find(p => p.id === programId);
                                            return (
                                                <TabsTrigger key={programId} value={programId} className="text-xs">
                                                    {program?.programName || program?.title || programId}
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>

                                    {programIds.map(programId => {
                                        const program = programs?.find(p => p.id === programId);
                                        const programDisplayName = program?.programName || program?.title || programId;
                                        const settings = programSettings[programId] || { programId, council: [], instructors: [] };

                                        return (
                                            <TabsContent key={programId} value={programId} className="space-y-6 mt-6">
                                                {/* Assessment Selection */}
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">
                                                        Admission Assessment for {programDisplayName}
                                                    </Label>
                                                    <Select
                                                        value={settings.assessmentId || ''}
                                                        onValueChange={(value) => handleProgramAssessmentChange(programId, value)}
                                                    >
                                                        <SelectTrigger className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                                            <div className="flex items-center gap-2">
                                                                <FileCheck className="h-4 w-4 text-accent" />
                                                                <SelectValue placeholder="Select an assessment..." />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {assessments?.map(a => (
                                                                <SelectItem key={a.id} value={a.id} className="font-bold">
                                                                    {a.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </Card>
                        )}

                        {/* Global Settings */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6 md:p-8">
                            <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-accent" />
                                Global Cohort Settings
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                                {/* Review Council */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">
                                            Admissions Committee
                                        </Label>
                                        <Badge className="bg-primary/10 text-primary text-[8px]">
                                            {globalCouncil.length} Selected
                                        </Badge>
                                    </div>
                                    <div className="border border-primary/10 rounded-xl overflow-hidden">
                                        <ScrollArea className="h-64">
                                            <div className="p-4 space-y-2">
                                                {facilitators?.map(f => (
                                                    <div
                                                        key={f.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg transition-all",
                                                            globalCouncil.includes(f.id)
                                                                ? "bg-primary/10"
                                                                : "hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                {f.name.charAt(0)}
                                                            </div>
                                                            <Label
                                                                htmlFor={`global-council-${f.id}`}
                                                                className="font-medium text-sm cursor-pointer"
                                                            >
                                                                {f.name}
                                                            </Label>
                                                        </div>
                                                        <Checkbox
                                                            id={`global-council-${f.id}`}
                                                            checked={globalCouncil.includes(f.id)}
                                                            onCheckedChange={() => handleGlobalCouncilChange(f.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>

                                {/* Instructors */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">
                                            Facilitators (Placements)
                                        </Label>
                                        <Badge className="bg-accent/10 text-accent text-[8px]">
                                            {globalInstructors.length} Selected
                                        </Badge>
                                    </div>
                                    <div className="border border-primary/10 rounded-xl overflow-hidden">
                                        <ScrollArea className="h-64">
                                            <div className="p-4 space-y-2">
                                                {facilitators?.map(f => (
                                                    <div
                                                        key={f.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg transition-all",
                                                            globalInstructors.includes(f.id)
                                                                ? "bg-accent/10"
                                                                : "hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                                                {f.name.charAt(0)}
                                                            </div>
                                                            <Label
                                                                htmlFor={`global-instructor-${f.id}`}
                                                                className="font-medium text-sm cursor-pointer"
                                                            >
                                                                {f.name}
                                                            </Label>
                                                        </div>
                                                        <Checkbox
                                                            id={`global-instructor-${f.id}`}
                                                            checked={globalInstructors.includes(f.id)}
                                                            onCheckedChange={() => handleGlobalInstructorChange(f.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </form>
            </div >
        </div >
    );
}

function Badge({ children, variant = "default", className }: any) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-sm text-[8px] uppercase font-black tracking-widest inline-flex items-center",
            variant === "default" ? "bg-accent text-white" : "border text-white",
            className
        )}>
            {children}
        </span>
    );
}
