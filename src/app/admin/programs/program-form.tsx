'use client';
import type { Program, CurriculumModule } from '@/lib/program-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage, useUsersFirestore } from '@/firebase';
import { addProgram, updateProgram } from '@/lib/programs';
import React, { useState, useMemo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Organization } from '@/lib/organization-types';
import {
    BookOpen,
    Tag,
    ArrowLeft,
    Save,
    Image as ImageIcon,
    UploadCloud,
    Clock,
    Target,
    Layers,
    FileText,
    Settings2,
    Plus,
    Trash2,
    Globe,
    Hash,
    Layout,
    Users
} from "lucide-react";

export function ProgramForm({ program }: { program: Partial<Program> }) {
    const isNew = !program.id;
    const [formData, setFormData] = useState<Partial<Program>>({
        programName: '',
        slug: '',
        shortDescription: '',
        image: '',
        programCode: '',
        status: 'draft',
        programType: undefined,
        price: 0,
        currency: 'KES',
        admissionCost: 0,
        programDuration: '',
        programFormat: [],
        level: 1,
        whoIsItFor: [],
        objectives: [],
        completionRequirements: [],
        curriculumBreakdown: [],
        intakes: [],
        ...program,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();
    const storage = useStorage();
    const usersFirestore = useUsersFirestore();

    const orgsQuery = useMemo(() => {
        if (!usersFirestore) return null;
        return query(collection(usersFirestore, "organizations"), orderBy("createdAt", "desc"));
    }, [usersFirestore]);

    const { data: organizations } = useCollection<Organization>(orgsQuery as any);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        let finalValue: string | number = value;
        if (id === 'slug') {
            finalValue = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        }
        if (id === 'price' || id === 'level' || id === 'admissionCost') {
            finalValue = Number(value) || 0;
        }
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value as any }));
    };

    // Simple array fields (one item per line in textarea)
    const handleArrayField = (field: keyof Program) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value.split('\n').filter(l => l.trim() !== '') }));
    };

    // programFormat is array but only one entry in schema
    const handleProgramFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, programFormat: e.target.value ? [e.target.value] : [] }));
    };

    // curriculumBreakdown handlers
    const addCurriculumModule = () => {
        setFormData(prev => ({
            ...prev,
            curriculumBreakdown: [...(prev.curriculumBreakdown || []), { name: '', themes: '', keyModules: '' }]
        }));
    };

    const removeCurriculumModule = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            curriculumBreakdown: (prev.curriculumBreakdown || []).filter((_, i) => i !== idx)
        }));
    };

    const updateCurriculumModule = (idx: number, field: keyof CurriculumModule, value: string) => {
        setFormData(prev => {
            const updated = [...(prev.curriculumBreakdown || [])];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, curriculumBreakdown: updated };
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
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

        // Clean array fields
        const arrayFields: (keyof Program)[] = ['whoIsItFor', 'objectives', 'completionRequirements', 'programFormat'];
        arrayFields.forEach(f => {
            if (Array.isArray(dataToSave[f])) {
                (dataToSave as any)[f] = ((dataToSave as any)[f] as string[]).filter((v: string) => v.trim() !== '');
            }
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

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero Header */}
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
                                    <Layers className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{isNew ? 'New Program' : 'Edit Program'}</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {isNew ? 'Create Program' : <>{formData.programName} <span className="text-white/40 font-mono text-2xl">#{program.id}</span></>}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 font-bold px-6" disabled={isUploading}>
                                Discard
                            </Button>
                            <Button onClick={handleSubmit} disabled={isUploading} className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95">
                                {isUploading ? <><UploadCloud className="h-5 w-5 mr-2 animate-spin" /> Saving...</> : <><Save className="h-5 w-5 mr-2" /> Save Program</>}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* LEFT: Main content */}
                    <div className="xl:col-span-8 space-y-6">

                        {/* Core Identity */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-accent" />
                                    Core Identity
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="programName" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Program Name</Label>
                                        <Input
                                            id="programName"
                                            value={formData.programName || ''}
                                            onChange={handleChange}
                                            required
                                            className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium"
                                            placeholder="Sales Mastery Program - Level 3"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">URL Slug</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input
                                                id="slug"
                                                value={formData.slug || ''}
                                                onChange={handleChange}
                                                required
                                                className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-mono text-sm"
                                                placeholder="salesmastery"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="programCode" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Program Code</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input
                                                id="programCode"
                                                value={formData.programCode || ''}
                                                onChange={handleChange}
                                                className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-mono text-sm"
                                                placeholder="SMP-L3"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Status</Label>
                                        <Select value={formData.status || 'draft'} onValueChange={(v) => handleSelectChange('status', v)}>
                                            <SelectTrigger className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shortDescription" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Short Description</Label>
                                    <Textarea
                                        id="shortDescription"
                                        value={formData.shortDescription || ''}
                                        onChange={handleChange}
                                        rows={4}
                                        className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium p-4"
                                        placeholder="Designed for experienced sales professionals..."
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Program Content */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8 space-y-6">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-accent" />
                                    Program Content
                                </h2>

                                <div className="space-y-2">
                                    <Label htmlFor="objectives" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Objectives (One per line)</Label>
                                    <Textarea
                                        id="objectives"
                                        value={(formData.objectives || []).join('\n')}
                                        onChange={handleArrayField('objectives')}
                                        rows={4}
                                        className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium p-4"
                                        placeholder="Develop ability for strategic decision-making..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whoIsItFor" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Who Is It For? (One per line)</Label>
                                    <Textarea
                                        id="whoIsItFor"
                                        value={(formData.whoIsItFor || []).join('\n')}
                                        onChange={handleArrayField('whoIsItFor')}
                                        rows={4}
                                        className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium p-4"
                                        placeholder="Key Account Managers&#10;Territory Sales Managers&#10;Senior Sales Executives (5–10 years' experience)"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="completionRequirements" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Completion Requirements (One per line)</Label>
                                    <Textarea
                                        id="completionRequirements"
                                        value={(formData.completionRequirements || []).join('\n')}
                                        onChange={handleArrayField('completionRequirements')}
                                        rows={4}
                                        className="bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium p-4"
                                        placeholder="Complete the full program, including all core learning sessions&#10;Successfully deliver all required program outputs..."
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Curriculum Breakdown */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Layout className="h-5 w-5 text-accent" />
                                        Curriculum Breakdown
                                    </h2>
                                    <Button type="button" onClick={addCurriculumModule} className="bg-accent text-white h-9 px-4 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none text-sm font-bold">
                                        <Plus className="h-4 w-4 mr-1" /> Add Module
                                    </Button>
                                </div>

                                {(formData.curriculumBreakdown || []).length === 0 && (
                                    <p className="text-sm text-primary/40 italic text-center py-8">No curriculum modules yet. Click "Add Module" to begin.</p>
                                )}

                                <div className="space-y-6">
                                    {(formData.curriculumBreakdown || []).map((mod, idx) => (
                                        <div key={idx} className="p-5 bg-primary/5 border border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Module {idx + 1}</span>
                                                <Button type="button" variant="ghost" onClick={() => removeCurriculumModule(idx)} className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent rounded-full">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Module Name</Label>
                                                    <Input
                                                        value={mod.name}
                                                        onChange={(e) => updateCurriculumModule(idx, 'name', e.target.value)}
                                                        className="h-12 bg-white border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-bold"
                                                        placeholder="e.g. Self, Leadership, Core, Business"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Themes</Label>
                                                    <Input
                                                        value={mod.themes}
                                                        onChange={(e) => updateCurriculumModule(idx, 'themes', e.target.value)}
                                                        className="h-12 bg-white border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium"
                                                        placeholder="Personal Performance, Ethics and Integrity"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Key Modules</Label>
                                                    <Textarea
                                                        value={mod.keyModules}
                                                        onChange={(e) => updateCurriculumModule(idx, 'keyModules', e.target.value)}
                                                        rows={3}
                                                        className="bg-white border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium p-3 text-sm"
                                                        placeholder="Developing Personal Resilience, Self Management, Understanding and Building Agility..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div className="xl:col-span-4 space-y-6">

                        {/* Logistics */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-accent" />
                                Logistics
                            </h2>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="level" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Level (Number)</Label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input
                                            id="level"
                                            type="number"
                                            min="1"
                                            value={formData.level || 1}
                                            onChange={handleChange}
                                            className="pl-12 h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                        />
                                    </div>
                                    <p className="text-[10px] text-primary/40 italic ml-1">e.g. 1, 2, 3, 4</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="programDuration" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Duration</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input
                                            id="programDuration"
                                            value={formData.programDuration || ''}
                                            onChange={handleChange}
                                            className="pl-12 h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                            placeholder="12 Weeks"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Program Format</Label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input
                                            value={(formData.programFormat || [])[0] || ''}
                                            onChange={handleProgramFormatChange}
                                            className="pl-12 h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium text-sm"
                                            placeholder="12 Weeks 4 In-person Sessions 8 Virtual Sessions"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Price</Label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price || ''}
                                            onChange={handleChange}
                                            className="pl-12 h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                            placeholder="104400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Currency</Label>
                                    <Select value={formData.currency || 'KES'} onValueChange={(v) => handleSelectChange('currency', v)}>
                                        <SelectTrigger className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KES">KES</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admissionCost" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Admission Cost</Label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input
                                            id="admissionCost"
                                            type="number"
                                            min="0"
                                            value={formData.admissionCost || ''}
                                            onChange={handleChange}
                                            className="pl-12 h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                            placeholder="e.g. 5000"
                                        />
                                    </div>
                                    <p className="text-[10px] text-primary/40 italic ml-1">Non-refundable application fee</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Program Type</Label>
                                    <Select value={formData.programType || ''} onValueChange={(v) => handleSelectChange('programType', v)}>
                                        <SelectTrigger className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
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
                                        <Select
                                            value={formData.organizationId || ''}
                                            onValueChange={(v) => handleSelectChange('organizationId', v)}
                                        >
                                            <SelectTrigger className="h-12 bg-white border-accent/20 rounded-tl-xl rounded-br-xl font-bold">
                                                <SelectValue placeholder="Select Client..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizations?.map(org => (
                                                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                                ))}
                                                {(!organizations || organizations.length === 0) && (
                                                    <SelectItem value="none" disabled>No organizations found</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Image */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-accent" />
                                Program Image
                            </h2>
                            <div className="space-y-4">
                                <div className="relative aspect-video bg-primary/5 rounded-tl-2xl rounded-br-2xl border border-primary/10 flex items-center justify-center overflow-hidden group">
                                    {(formData.image || imageFile) ? (
                                        <img
                                            src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            alt="Preview"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-primary/20">
                                            <ImageIcon className="h-10 w-10" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Upload Image</Label>
                                    <Input
                                        type="file"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium file:mr-4 file:py-1 file:px-3 file:rounded-tl-md file:rounded-br-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-white"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
