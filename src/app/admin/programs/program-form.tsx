'use client';
import type { Program, CurriculumModule, ElearningModule, ElearningMaterial, InstructorProfile } from '@/lib/program-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage, useUsersFirestore } from '@/firebase';
import { addProgram, updateProgram } from '@/lib/programs';
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, orderBy, where, getDocs, limit as fsLimit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Organization } from '@/lib/organization-types';
import {
    BookOpen, Tag, ArrowLeft, Save, Image as ImageIcon, UploadCloud, Clock, Target, Layers,
    FileText, Settings2, Plus, Trash2, Globe, Hash, Layout, Users, Video,
    FileDown, Eye, EyeOff, UserCircle, Camera, Paperclip, Play, Lock,
    AlertCircle, CheckCircle2
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
function uuid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

// ─── Component ──────────────────────────────────────────────────────────────
export function ProgramForm({ program }: { program: Partial<Program> }) {
    const isNew = !program.id;
    const [formData, setFormData] = useState<Partial<Program>>({
        programName: '', slug: '', shortDescription: '', image: '', programCode: '',
        status: 'draft', programType: undefined, price: 0, currency: 'KES',
        admissionCost: 0, programDuration: '', programFormat: [], level: 1,
        whoIsItFor: [], objectives: [], completionRequirements: [],
        curriculumBreakdown: [], elearningModules: [], instructorProfiles: [],
        intakes: [],
        ...program,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingModuleId, setUploadingModuleId] = useState<string | null>(null);
    // Overview video
    const [overviewVideoFile, setOverviewVideoFile] = useState<File | null>(null);
    const [uploadingOverview, setUploadingOverview] = useState(false);
    // Slug check
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const slugCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();
    const firestore = useFirestore();
    const storage = useStorage();
    const usersFirestore = useUsersFirestore();

    const isElearning = formData.programType === 'E-Learning';

    const orgsQuery = useMemo(() => {
        if (!usersFirestore) return null;
        return query(collection(usersFirestore, "organizations"), orderBy("createdAt", "desc"));
    }, [usersFirestore]);
    const { data: organizations } = useCollection<Organization>(orgsQuery as any);

    // ─── Standard field handlers ─────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        let finalValue: string | number = value;
        if (id === 'slug') {
            finalValue = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
            // Debounce slug availability check
            setSlugAvailable(null);
            if (slugCheckRef.current) clearTimeout(slugCheckRef.current);
            if (finalValue && usersFirestore) {
                setSlugChecking(true);
                slugCheckRef.current = setTimeout(async () => {
                    try {
                        const q = query(collection(usersFirestore!, 'programs'), where('slug', '==', finalValue), fsLimit(1));
                        const snap = await getDocs(q);
                        // Allow if no doc found, or only doc found is the current program being edited
                        const taken = !snap.empty && snap.docs[0].id !== (program.id || '');
                        setSlugAvailable(!taken);
                    } catch { setSlugAvailable(null); } finally { setSlugChecking(false); }
                }, 600);
            } else { setSlugChecking(false); }
        }
        if (id === 'price' || id === 'admissionCost') finalValue = Number(value) || 0;
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };
    const handleSelectChange = (id: string, value: string) => setFormData(prev => ({ ...prev, [id]: value as any }));
    const handleArrayField = (field: keyof Program) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value.split('\n').filter(l => l.trim() !== '') }));
    const handleProgramFormatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData(prev => ({ ...prev, programFormat: e.target.value ? [e.target.value] : [] }));

    // ─── Core curriculum handlers ─────────────────────────────────────────
    const addCurriculumModule = () =>
        setFormData(prev => ({ ...prev, curriculumBreakdown: [...(prev.curriculumBreakdown || []), { name: '', themes: '', keyModules: '' }] }));
    const removeCurriculumModule = (idx: number) =>
        setFormData(prev => ({ ...prev, curriculumBreakdown: (prev.curriculumBreakdown || []).filter((_, i) => i !== idx) }));
    const updateCurriculumModule = (idx: number, field: keyof CurriculumModule, value: string) =>
        setFormData(prev => {
            const updated = [...(prev.curriculumBreakdown || [])]; updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, curriculumBreakdown: updated };
        });

    // ─── E-Learning module handlers ───────────────────────────────────────
    const addElearningModule = () =>
        setFormData(prev => ({
            ...prev,
            elearningModules: [...(prev.elearningModules || []), { id: uuid(), title: '', description: '', duration: '', isPreview: false, videoUrl: '', materials: [] }]
        }));
    const removeElearningModule = (id: string) =>
        setFormData(prev => ({ ...prev, elearningModules: (prev.elearningModules || []).filter(m => m.id !== id) }));
    const updateElearningModule = (id: string, field: keyof ElearningModule, value: any) =>
        setFormData(prev => ({
            ...prev,
            elearningModules: (prev.elearningModules || []).map(m => m.id === id ? { ...m, [field]: value } : m)
        }));

    // Upload video for a module
    const handleModuleVideoUpload = async (moduleId: string, file: File) => {
        if (!storage) return;
        setUploadingModuleId(moduleId);
        try {
            const storageRef = ref(storage, `elearning/modules/${moduleId}/video_${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            updateElearningModule(moduleId, 'videoUrl', url);
        } finally { setUploadingModuleId(null); }
    };

    // Upload a supporting material for a module
    const handleModuleMaterialUpload = async (moduleId: string, file: File) => {
        if (!storage) return;
        setUploadingModuleId(moduleId + '-mat');
        try {
            const storageRef = ref(storage, `elearning/modules/${moduleId}/materials/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const fileType: ElearningMaterial['fileType'] = ext === 'pdf' ? 'pdf' : ['xlsx', 'docx', 'doc'].includes(ext) ? 'workbook' : ['ppt', 'pptx'].includes(ext) ? 'slide' : 'other';
            const material: ElearningMaterial = { name: file.name, fileUrl: url, fileType, sizeBytes: file.size };
            setFormData(prev => ({
                ...prev,
                elearningModules: (prev.elearningModules || []).map(m =>
                    m.id === moduleId ? { ...m, materials: [...m.materials, material] } : m
                )
            }));
        } finally { setUploadingModuleId(null); }
    };

    const removeModuleMaterial = (moduleId: string, matIdx: number) =>
        setFormData(prev => ({
            ...prev,
            elearningModules: (prev.elearningModules || []).map(m =>
                m.id === moduleId ? { ...m, materials: m.materials.filter((_, i) => i !== matIdx) } : m
            )
        }));

    // ─── Instructor profile handlers ──────────────────────────────────────
    const addInstructor = () =>
        setFormData(prev => ({ ...prev, instructorProfiles: [...(prev.instructorProfiles || []), { name: '', title: '', bio: '', imageUrl: '' }] }));
    const removeInstructor = (idx: number) =>
        setFormData(prev => ({ ...prev, instructorProfiles: (prev.instructorProfiles || []).filter((_, i) => i !== idx) }));
    const updateInstructor = (idx: number, field: keyof InstructorProfile, value: string) =>
        setFormData(prev => {
            const updated = [...(prev.instructorProfiles || [])];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, instructorProfiles: updated };
        });
    const handleInstructorImageUpload = async (idx: number, file: File) => {
        if (!storage) return;
        setUploadingModuleId(`instructor-${idx}`);
        try {
            const storageRef = ref(storage, `elearning/instructors/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            updateInstructor(idx, 'imageUrl', url);
        } finally { setUploadingModuleId(null); }
    };

    // ─── Image & Submit ───────────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setImageFile(e.target.files[0]);
    };

    // Overview video upload
    const handleOverviewVideoUpload = async (file: File) => {
        if (!storage) return;
        setUploadingOverview(true);
        try {
            const storageRef = ref(storage, `elearning/overview/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setFormData(prev => ({ ...prev, overviewVideoUrl: url }));
        } finally { setUploadingOverview(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !storage) return;
        setIsUploading(true);
        let dataToSave = { ...formData };
        if (imageFile) {
            const storageRef = ref(storage, `programs/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            dataToSave.image = await getDownloadURL(storageRef);
        }
        if (dataToSave.id === '') delete dataToSave.id;
        const arrayFields: (keyof Program)[] = ['whoIsItFor', 'objectives', 'completionRequirements', 'programFormat', 'instructors'];
        arrayFields.forEach(f => {
            if (Array.isArray(dataToSave[f]))
                (dataToSave as any)[f] = ((dataToSave as any)[f] as string[]).filter((v: string) => v.trim() !== '');
        });
        if (isNew) {
            addProgram(firestore, dataToSave as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>);
        } else if (dataToSave.id) {
            const { id, ...rest } = dataToSave;
            updateProgram(firestore, id, rest);
        }
        setIsUploading(false);
        router.push('/a/programs');
    };

    // ─── UI helpers ───────────────────────────────────────────────────────
    const sectionCls = "bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden";
    const inputCls = "h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium";
    const labelCls = "text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1";

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* ── Hero Header ─────────────────────────────────────────── */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button variant="outline" size="icon" className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" onClick={() => router.back()}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Layers className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{isNew ? 'New Program' : 'Edit Program'}</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {isNew ? 'Create Program' : <>{formData.programName} <span className="text-white/40 font-mono text-2xl">#{program.id}</span></>}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 font-bold px-6" disabled={isUploading}>Discard</Button>
                            <Button onClick={handleSubmit} disabled={isUploading} className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl font-bold shadow-lg">
                                {isUploading ? <><UploadCloud className="h-5 w-5 mr-2 animate-spin" />Saving...</> : <><Save className="h-5 w-5 mr-2" />Save Program</>}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* ── LEFT: Main content ───────────────────────────── */}
                    <div className="xl:col-span-8 space-y-6">

                        {/* Core Identity */}
                        <Card className={sectionCls}>
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />Core Identity</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="programName" className={labelCls}>Program Name</Label>
                                        <Input id="programName" value={formData.programName || ''} onChange={handleChange} required className={`h-14 ${inputCls}`} placeholder="Sales Mastery Program" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className={labelCls}>URL Slug</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input
                                                id="slug"
                                                value={formData.slug || ''}
                                                onChange={handleChange}
                                                required
                                                className={`pl-12 pr-10 h-14 ${inputCls} ${slugAvailable === false ? 'border-red-300 bg-red-50' : slugAvailable === true ? 'border-green-300 bg-green-50' : ''}`}
                                                placeholder="salesmastery"
                                            />
                                            {slugChecking && <UploadCloud className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 animate-spin" />}
                                            {!slugChecking && slugAvailable === true && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />}
                                            {!slugChecking && slugAvailable === false && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />}
                                        </div>
                                        {slugAvailable === false && <p className="text-[10px] text-red-500 font-bold ml-1">⚠ This URL slug is already taken. Choose a different one.</p>}
                                        {slugAvailable === true && <p className="text-[10px] text-green-600 font-bold ml-1">✓ URL slug is available</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="programCode" className={labelCls}>Program Code</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input id="programCode" value={formData.programCode || ''} onChange={handleChange} className={`pl-12 h-14 ${inputCls}`} placeholder="SMP-L3" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className={labelCls}>Status</Label>
                                        <Select value={formData.status || 'draft'} onValueChange={v => handleSelectChange('status', v)}>
                                            <SelectTrigger className={`h-14 ${inputCls}`}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shortDescription" className={labelCls}>Short Description</Label>
                                    <Textarea id="shortDescription" value={formData.shortDescription || ''} onChange={handleChange} rows={4} className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl p-4 font-medium" placeholder="Designed for experienced sales professionals..." />
                                </div>
                            </div>
                        </Card>

                        {/* Program Content */}
                        <Card className={sectionCls}>
                            <div className="p-6 md:p-8 space-y-6">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" />Program Content</h2>
                                <div className="space-y-2">
                                    <Label htmlFor="objectives" className={labelCls}>{isElearning ? 'What You Will Learn (One per line)' : 'Objectives (One per line)'}</Label>
                                    <Textarea id="objectives" value={(formData.objectives || []).join('\n')} onChange={handleArrayField('objectives')} rows={4} className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl p-4 font-medium" placeholder={isElearning ? "Master modern sales techniques..." : "Develop ability for strategic decision-making..."} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whoIsItFor" className={labelCls}>Who Is It For? (One per line)</Label>
                                    <Textarea id="whoIsItFor" value={(formData.whoIsItFor || []).join('\n')} onChange={handleArrayField('whoIsItFor')} rows={4} className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl p-4 font-medium" placeholder="Key Account Managers&#10;Territory Sales Managers" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="completionRequirements" className={labelCls}>{isElearning ? 'Certificate Requirements (One per line)' : 'Completion Requirements (One per line)'}</Label>
                                    <Textarea id="completionRequirements" value={(formData.completionRequirements || []).join('\n')} onChange={handleArrayField('completionRequirements')} rows={4} className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl p-4 font-medium" placeholder="Complete all modules with ≥80% score&#10;Pass the final assessment" />
                                </div>
                            </div>
                        </Card>

                        {/* ── E-LEARNING: Instructors (with photo) ──────────── */}
                        {isElearning && (
                            <Card className={sectionCls}>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2"><UserCircle className="h-5 w-5 text-accent" />Instructors</h2>
                                        <Button type="button" onClick={addInstructor} className="bg-accent text-white h-9 px-4 rounded-tl-lg rounded-br-lg text-sm font-bold">
                                            <Plus className="h-4 w-4 mr-1" /> Add Instructor
                                        </Button>
                                    </div>
                                    {(formData.instructorProfiles || []).length === 0 && (
                                        <p className="text-sm text-primary/40 italic text-center py-8">No instructors yet. Click "Add Instructor" to begin.</p>
                                    )}
                                    <div className="space-y-6">
                                        {(formData.instructorProfiles || []).map((inst, idx) => (
                                            <div key={idx} className="p-5 bg-primary/5 border border-primary/10 rounded-tl-2xl rounded-br-2xl relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`${labelCls}`}>Instructor {idx + 1}</span>
                                                    <Button type="button" variant="ghost" onClick={() => removeInstructor(idx)} className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                                <div className="flex gap-5">
                                                    {/* Photo */}
                                                    <div className="shrink-0">
                                                        <Label className={labelCls}>Photo</Label>
                                                        <div className="relative mt-1 w-24 h-24 rounded-full bg-white border-2 border-primary/10 flex items-center justify-center overflow-hidden group cursor-pointer">
                                                            {inst.imageUrl ? (
                                                                <img src={inst.imageUrl} alt={inst.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserCircle className="h-10 w-10 text-primary/20" />
                                                            )}
                                                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                                                <Camera className="h-5 w-5 text-white" />
                                                                <input type="file" accept="image/*" className="sr-only" onChange={e => e.target.files?.[0] && handleInstructorImageUpload(idx, e.target.files[0])} />
                                                            </label>
                                                            {uploadingModuleId === `instructor-${idx}` && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                                                    <UploadCloud className="h-5 w-5 text-white animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Details */}
                                                    <div className="flex-1 space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className={labelCls}>Full Name</Label>
                                                                <Input value={inst.name} onChange={e => updateInstructor(idx, 'name', e.target.value)} className={inputCls} placeholder="Jane Doe" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className={labelCls}>Title / Role</Label>
                                                                <Input value={inst.title || ''} onChange={e => updateInstructor(idx, 'title', e.target.value)} className={inputCls} placeholder="Senior Sales Trainer" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className={labelCls}>Short Bio</Label>
                                                            <Textarea value={inst.bio || ''} onChange={e => updateInstructor(idx, 'bio', e.target.value)} rows={3} className="bg-white border-primary/10 rounded-tl-lg rounded-br-lg p-3 font-medium text-sm" placeholder="15+ years in sales leadership across East Africa..." />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* ── E-LEARNING: Modules with video & materials ─────── */}
                        {isElearning ? (
                            <Card className={sectionCls}>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Video className="h-5 w-5 text-accent" />Course Modules</h2>
                                        <Button type="button" onClick={addElearningModule} className="bg-accent text-white h-9 px-4 rounded-tl-lg rounded-br-lg text-sm font-bold">
                                            <Plus className="h-4 w-4 mr-1" /> Add Module
                                        </Button>
                                    </div>
                                    {(formData.elearningModules || []).length === 0 && (
                                        <p className="text-sm text-primary/40 italic text-center py-8">No modules yet. Click "Add Module" to start building your course.</p>
                                    )}
                                    <div className="space-y-6">
                                        {(formData.elearningModules || []).map((mod, idx) => (
                                            <div key={mod.id} className="border border-primary/10 rounded-tl-2xl rounded-br-2xl overflow-hidden">
                                                {/* Module header */}
                                                <div className="bg-primary/5 px-5 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                                        <span className={labelCls}>Module {idx + 1}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {/* Preview toggle */}
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            {mod.isPreview ? <Eye className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-primary/30" />}
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">{mod.isPreview ? 'Free Preview' : 'Paid'}</span>
                                                            <Switch checked={mod.isPreview} onCheckedChange={v => updateElearningModule(mod.id, 'isPreview', v)} />
                                                        </label>
                                                        <Button type="button" variant="ghost" onClick={() => removeElearningModule(mod.id)} className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                                <div className="p-5 space-y-4">
                                                    {/* Title + Duration */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="col-span-2 space-y-1">
                                                            <Label className={labelCls}>Module Title</Label>
                                                            <Input value={mod.title} onChange={e => updateElearningModule(mod.id, 'title', e.target.value)} className={inputCls} placeholder="Introduction to Sales Strategy" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className={labelCls}>Duration</Label>
                                                            <div className="relative">
                                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/30" />
                                                                <Input value={mod.duration || ''} onChange={e => updateElearningModule(mod.id, 'duration', e.target.value)} className={`pl-9 ${inputCls}`} placeholder="12 min" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Description */}
                                                    <div className="space-y-1">
                                                        <Label className={labelCls}>Description</Label>
                                                        <Textarea value={mod.description || ''} onChange={e => updateElearningModule(mod.id, 'description', e.target.value)} rows={2} className="bg-primary/5 border-primary/10 rounded-tl-lg rounded-br-lg p-3 text-sm font-medium" placeholder="What learners will cover in this module..." />
                                                    </div>
                                                    {/* Video Upload */}
                                                    <div className="space-y-1">
                                                        <Label className={labelCls}>Lesson Video</Label>
                                                        <div className="flex items-center gap-3">
                                                            {mod.videoUrl ? (
                                                                <div className="flex items-center gap-2 text-sm text-green-600 font-bold bg-green-50 border border-green-200 rounded-tl-lg rounded-br-lg px-4 py-2 flex-1">
                                                                    <Play className="h-4 w-4" />
                                                                    Video uploaded
                                                                    <Button type="button" variant="ghost" size="sm" onClick={() => updateElearningModule(mod.id, 'videoUrl', '')} className="ml-auto h-6 text-red-400 hover:text-red-600 p-0"><Trash2 className="h-3 w-3" /></Button>
                                                                </div>
                                                            ) : (
                                                                <label className={`flex items-center gap-2 px-4 py-2 ${inputCls} cursor-pointer text-primary/50 text-sm flex-1`}>
                                                                    <Video className="h-4 w-4" />
                                                                    {uploadingModuleId === mod.id ? 'Uploading...' : 'Upload video (MP4, MOV, WebM)'}
                                                                    <input type="file" accept="video/*" className="sr-only"
                                                                        onChange={e => e.target.files?.[0] && handleModuleVideoUpload(mod.id, e.target.files[0])}
                                                                        disabled={uploadingModuleId === mod.id}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Materials */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className={labelCls}>Supporting Materials</Label>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-accent cursor-pointer flex items-center gap-1 hover:underline">
                                                                <Plus className="h-3 w-3" /> Add File
                                                                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx" className="sr-only"
                                                                    onChange={e => e.target.files?.[0] && handleModuleMaterialUpload(mod.id, e.target.files[0])}
                                                                    disabled={uploadingModuleId === mod.id + '-mat'}
                                                                />
                                                            </label>
                                                        </div>
                                                        {mod.materials.length === 0 ? (
                                                            <p className="text-xs text-primary/30 italic">No materials yet — add PDFs, workbooks, or slides.</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {mod.materials.map((mat, mIdx) => (
                                                                    <div key={mIdx} className="flex items-center gap-3 bg-primary/5 rounded-lg px-3 py-2 text-sm">
                                                                        <FileDown className="h-4 w-4 text-accent shrink-0" />
                                                                        <span className="flex-1 font-medium text-primary/70 truncate">{mat.name}</span>
                                                                        <span className="text-[9px] uppercase font-black text-primary/30 bg-white rounded px-1.5 py-0.5">{mat.fileType}</span>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeModuleMaterial(mod.id, mIdx)} className="h-6 w-6 p-0 hover:text-red-500"><Trash2 className="h-3 w-3" /></Button>
                                                                    </div>
                                                                ))}
                                                                {uploadingModuleId === mod.id + '-mat' && (
                                                                    <div className="flex items-center gap-2 text-xs text-primary/50"><UploadCloud className="h-3 w-3 animate-spin" /> Uploading file...</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            /* Core/Short/Corporate: Classic Curriculum Breakdown */
                            <Card className={sectionCls}>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Layout className="h-5 w-5 text-accent" />Curriculum Breakdown</h2>
                                        <Button type="button" onClick={addCurriculumModule} className="bg-accent text-white h-9 px-4 rounded-tl-lg rounded-br-lg text-sm font-bold">
                                            <Plus className="h-4 w-4 mr-1" /> Add Module
                                        </Button>
                                    </div>
                                    {(formData.curriculumBreakdown || []).length === 0 && (
                                        <p className="text-sm text-primary/40 italic text-center py-8">No curriculum modules yet.</p>
                                    )}
                                    <div className="space-y-6">
                                        {(formData.curriculumBreakdown || []).map((mod, idx) => (
                                            <div key={idx} className="p-5 bg-primary/5 border border-primary/10 rounded-tl-2xl rounded-br-2xl relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={labelCls}>Module {idx + 1}</span>
                                                    <Button type="button" variant="ghost" onClick={() => removeCurriculumModule(idx)} className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <Label className={labelCls}>Module Name</Label>
                                                        <Input value={mod.name} onChange={e => updateCurriculumModule(idx, 'name', e.target.value)} className={`h-12 bg-white border-primary/10 rounded-tl-lg rounded-br-lg font-bold`} placeholder="e.g. Self, Leadership, Core, Business" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className={labelCls}>Themes</Label>
                                                        <Input value={mod.themes} onChange={e => updateCurriculumModule(idx, 'themes', e.target.value)} className={`h-12 bg-white border-primary/10 rounded-tl-lg rounded-br-lg font-medium`} placeholder="Personal Performance, Ethics and Integrity" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className={labelCls}>Key Modules</Label>
                                                        <Textarea value={mod.keyModules} onChange={e => updateCurriculumModule(idx, 'keyModules', e.target.value)} rows={3} className="bg-white border-primary/10 rounded-tl-lg rounded-br-lg font-medium p-3 text-sm" placeholder="Developing Personal Resilience, Self Management..." />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ── RIGHT: Sidebar ───────────────────────────────────── */}
                    <div className="xl:col-span-4 space-y-6">

                        {/* Logistics */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2"><Settings2 className="h-5 w-5 text-accent" />Logistics</h2>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="level" className={labelCls}>Level {isElearning ? '(Text, e.g. Beginner)' : '(Number)'}</Label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="level" type={isElearning ? 'text' : 'number'} min={isElearning ? undefined : "1"} value={formData.level || ''} onChange={handleChange} className={`pl-12 ${inputCls}`} placeholder={isElearning ? "Beginner / Advanced" : "1"} />
                                    </div>
                                    <p className="text-[10px] text-primary/40 italic ml-1">{isElearning ? 'e.g. Beginner, Intermediate, Advanced' : 'e.g. 1, 2, 3, 4'}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="programDuration" className={labelCls}>Duration</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="programDuration" value={formData.programDuration || ''} onChange={handleChange} className={`pl-12 ${inputCls}`} placeholder={isElearning ? "3 Hours" : "12 Weeks"} />
                                    </div>
                                </div>

                                {!isElearning && (
                                    <div className="space-y-2">
                                        <Label className={labelCls}>Program Format</Label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input value={(formData.programFormat || [])[0] || ''} onChange={handleProgramFormatChange} className={`pl-12 ${inputCls}`} placeholder="4 In-person + 8 Virtual Sessions" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="price" className={labelCls}>Price {isElearning && '(Set 0 for Free)'}</Label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="price" type="number" value={formData.price || ''} onChange={handleChange} className={`pl-12 ${inputCls}`} placeholder={isElearning ? "2500" : "104400"} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency" className={labelCls}>Currency</Label>
                                    <Select value={formData.currency || 'KES'} onValueChange={v => handleSelectChange('currency', v)}>
                                        <SelectTrigger className={`${inputCls}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KES">KES</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!isElearning && (
                                    <div className="space-y-2">
                                        <Label htmlFor="admissionCost" className={labelCls}>Admission Cost</Label>
                                        <div className="relative">
                                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input id="admissionCost" type="number" min="0" value={formData.admissionCost || ''} onChange={handleChange} className={`pl-12 ${inputCls}`} placeholder="e.g. 5000" />
                                        </div>
                                        <p className="text-[10px] text-primary/40 italic ml-1">Non-refundable application fee</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className={labelCls}>Program Type</Label>
                                    <Select value={formData.programType || ''} onValueChange={v => handleSelectChange('programType', v)}>
                                        <SelectTrigger className={`${inputCls}`}><SelectValue placeholder="Select type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Core">Core Program</SelectItem>
                                            <SelectItem value="E-Learning">E-Learning</SelectItem>
                                            <SelectItem value="Short">Short Course</SelectItem>
                                            <SelectItem value="Corporate">Corporate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.programType === 'Corporate' && (
                                    <div className="space-y-2 p-4 bg-accent/5 border border-accent/20 rounded-tl-xl rounded-br-xl mt-4">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-accent ml-1 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Target Organization
                                        </Label>
                                        <Select value={formData.organizationId || ''} onValueChange={v => handleSelectChange('organizationId', v)}>
                                            <SelectTrigger className="h-12 bg-white border-accent/20 rounded-tl-xl rounded-br-xl font-bold"><SelectValue placeholder="Select Client..." /></SelectTrigger>
                                            <SelectContent>
                                                {organizations?.map(org => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}
                                                {(!organizations || organizations.length === 0) && (<SelectItem value="none" disabled>No organizations found</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Program Image / Thumbnail */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-accent" />{isElearning ? 'Course Thumbnail' : 'Program Image'}</h2>
                            <div className="space-y-4">
                                <div className="relative aspect-video bg-primary/5 rounded-tl-2xl rounded-br-2xl border border-primary/10 flex items-center justify-center overflow-hidden group">
                                    {(formData.image || imageFile) ? (
                                        <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-primary/20">
                                            <ImageIcon className="h-10 w-10" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className={labelCls}>Upload Image</Label>
                                    <Input type="file" onChange={handleImageChange} accept="image/*" className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-medium file:mr-4 file:py-1 file:px-3 file:rounded-tl-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-white" />
                                </div>
                            </div>
                            {isElearning && (
                                <div className="mt-8 space-y-4 pt-8 border-t border-primary/10">
                                    <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2"><Video className="h-5 w-5 text-accent" />Course Overview Video</h2>
                                    <div className="relative aspect-video bg-primary/5 rounded-tl-2xl rounded-br-2xl border border-primary/10 flex items-center justify-center overflow-hidden group">
                                        {(formData.overviewVideoUrl) ? (
                                            <video src={formData.overviewVideoUrl} controls className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-primary/20">
                                                <Video className="h-10 w-10" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">No Video</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className={labelCls}>Upload Promotional Overview Video (.mp4, .webm)</Label>
                                        <Input
                                            type="file"
                                            accept="video/mp4,video/webm,"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleOverviewVideoUpload(e.target.files[0]);
                                            }}
                                            disabled={uploadingOverview}
                                            className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-medium file:mr-4 file:py-1 file:px-3 file:rounded-tl-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-white"
                                        />
                                        {uploadingOverview && <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">Uploading Video... Please wait.</p>}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
