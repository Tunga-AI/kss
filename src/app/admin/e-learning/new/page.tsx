'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, Video, FileText, ChevronDown, ChevronUp, X, Upload, Image as ImageIcon, Music } from "lucide-react";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Program } from '@/lib/program-types';
import type { User } from '@/lib/user-types';
import type { ContentItem } from '@/lib/content-library-types';
import type { DeliveryType, TimingType } from '@/lib/learning-types';
import { createLearningCourse, createLearningUnit } from '@/lib/learning';
import Link from 'next/link';

// Unit data structure for inline creation
interface UnitDraft {
    id: string; // Temp client-side ID
    title: string;
    description: string;
    unitNumber: number; // Sequential: Unit 1, Unit 2, etc.
    sessionType: TimingType; // The type label (Day, Week, Session, Module)
    sessionNumber: number; // The number for that type (Day 1, Week 2, etc.)
    deliveryType: DeliveryType;
    location: string;
    facilitatorId: string;
    facilitatorName: string;
    facilitatorEmail: string;
    contentIds: string[];
    estimatedDuration: number; // in minutes
}

export default function NewElearningCoursePage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        programId: '',
        status: 'Draft' as 'Draft' | 'Active' | 'Completed' | 'Archived',
        isPublished: false,
        level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
        category: '',
        thumbnailUrl: '',
        defaultSessionType: 'Module' as TimingType, // Default to Module for MOOCs
    });

    const [units, setUnits] = useState<UnitDraft[]>([]);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [showContentPicker, setShowContentPicker] = useState<string | null>(null);

    // Upload state
    const [uploadingUnitId, setUploadingUnitId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Fetch programs (E-Learning or Short courses)
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'), where('programType', 'in', ['E-Learning', 'Short', 'Core'])) as any;
    }, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery as any);

    // Fetch facilitators
    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) as any;
    }, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    // Fetch content library
    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentLibrary'), where('status', '==', 'published')) as any;
    }, [firestore]);
    const { data: contentItems } = useCollection<ContentItem>(contentQuery as any);

    const selectedProgram = programs?.find(p => p.id === formData.programId);

    // Add a new unit
    const addUnit = () => {
        const unitNumber = units.length + 1;
        const newUnit: UnitDraft = {
            id: `temp_${Date.now()}`,
            title: '',
            description: '',
            unitNumber,
            sessionType: formData.defaultSessionType,
            sessionNumber: unitNumber,
            deliveryType: 'Self-paced', // Default for MOOC
            location: '',
            facilitatorId: '',
            facilitatorName: '',
            facilitatorEmail: '',
            contentIds: [],
            estimatedDuration: 60,
        };
        setUnits([...units, newUnit]);
        setExpandedUnits(prev => new Set([...prev, newUnit.id]));
    };

    // Remove a unit
    const removeUnit = (unitId: string) => {
        const updatedUnits = units.filter(u => u.id !== unitId);
        // Renumber remaining units
        const renumberedUnits = updatedUnits.map((u, index) => ({
            ...u,
            unitNumber: index + 1,
            sessionNumber: index + 1
        }));
        setUnits(renumberedUnits);
        setExpandedUnits(prev => {
            const next = new Set(prev);
            next.delete(unitId);
            return next;
        });
    };

    // Update a unit
    const updateUnit = (unitId: string, updates: Partial<UnitDraft>) => {
        setUnits(units.map(u => u.id === unitId ? { ...u, ...updates } : u));
    };

    // Toggle unit expansion
    const toggleUnitExpansion = (unitId: string) => {
        setExpandedUnits(prev => {
            const next = new Set(prev);
            if (next.has(unitId)) {
                next.delete(unitId);
            } else {
                next.add(unitId);
            }
            return next;
        });
    };

    // Add content to unit
    const addContentToUnit = (unitId: string, contentId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (unit && !unit.contentIds.includes(contentId)) {
            updateUnit(unitId, { contentIds: [...unit.contentIds, contentId] });
        }
    };

    // Remove content from unit
    const removeContentFromUnit = (unitId: string, contentId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            updateUnit(unitId, { contentIds: unit.contentIds.filter(id => id !== contentId) });
        }
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, unitId: string) => {
        if (!e.target.files || !e.target.files[0] || !firestore || !user) return;

        const file = e.target.files[0];
        setUploadingUnitId(unitId);
        setUploadProgress(0);

        try {
            // 1. Determine Type
            let contentType: any = 'document';
            const fileType = file.type;
            if (fileType.startsWith('video/')) contentType = 'video';
            else if (fileType.startsWith('image/')) contentType = 'image';
            else if (fileType.startsWith('audio/')) contentType = 'audio';
            else if (file.name.endsWith('.zip')) contentType = 'scorm';

            // 2. Upload to Storage
            const storage = getStorage();
            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `content-library/${contentType}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    alert('Upload failed: ' + error.message);
                    setUploadingUnitId(null);
                },
                async () => {
                    // 3. Create Content Item
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    const contentData: any = {
                        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
                        description: 'Uploaded directly from course creator',
                        type: contentType,
                        status: 'published', // Auto-publish
                        fileUrl: downloadURL,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        categories: [],
                        tags: ['quick-upload'],
                        visibility: 'public',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        createdBy: user.uid,
                        version: 1,
                        viewCount: 0,
                        downloadCount: 0,
                        usedInCourses: [],
                    };

                    // Add video duration if needed
                    if (contentType === 'video') {
                        const video = document.createElement('video');
                        video.preload = 'metadata';
                        video.onloadedmetadata = async function () {
                            contentData.videoData = { duration: video.duration };
                            const docRef = await addDoc(collection(firestore, 'contentLibrary'), contentData);
                            // 4. Add to Unit
                            addContentToUnit(unitId, docRef.id);
                            setUploadingUnitId(null);
                            setUploadProgress(0);
                        };
                        video.src = downloadURL;
                    } else {
                        const docRef = await addDoc(collection(firestore, 'contentLibrary'), contentData);
                        // 4. Add to Unit
                        addContentToUnit(unitId, docRef.id);
                        setUploadingUnitId(null);
                        setUploadProgress(0);
                    }
                }
            );
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('An error occurred during upload.');
            setUploadingUnitId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user) return;

        if (!formData.title) {
            alert('Please fill in the required fields (Title)');
            return;
        }

        try {
            setSaving(true);

            // Create the course first
            const courseId = await createLearningCourse(firestore, {
                title: formData.title,
                description: formData.description,
                programId: formData.programId,
                programTitle: selectedProgram?.title || '',
                // No cohort for E-Learning
                cohortId: '',
                cohortName: '',
                totalWeeks: units.length || 1,
                moduleIds: [],
                status: formData.status,
                isPublished: formData.isPublished,
                isSelfPaced: true, // Always true for MOOC
                allowSkipUnits: true, // Default true for MOOC

                // E-Learning Specifics
                level: formData.level,
                category: formData.category || selectedProgram?.title || 'General',
                thumbnailUrl: formData.thumbnailUrl,

                createdBy: user.id,
            });

            // Create units
            for (let i = 0; i < units.length; i++) {
                const unit = units[i];
                await createLearningUnit(firestore, {
                    courseId,
                    title: unit.title || `Module ${unit.unitNumber}`,
                    description: unit.description,
                    orderIndex: i,
                    timingType: unit.sessionType,
                    timingNumber: unit.sessionNumber,
                    deliveryType: unit.deliveryType,
                    location: unit.location,
                    facilitatorId: unit.facilitatorId || undefined,
                    facilitatorName: unit.facilitatorName || undefined,
                    facilitatorEmail: unit.facilitatorEmail || undefined,
                    contentIds: unit.contentIds,
                    estimatedDuration: unit.estimatedDuration,
                    status: 'Draft',
                    isRequired: true,
                    createdBy: user.id,
                });
            }

            // Redirect to the general learning manager which handles units and details
            router.push(`/a/curriculum/${courseId}`);
        } catch (error) {
            console.error('Error creating course:', error);
            alert('Failed to create course');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-tl-lg rounded-br-lg"
                    >
                        <Link href="/admin/e-learning">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">Create E-Learning Course</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Course Details */}
                    <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                        <CardHeader className="border-b border-primary/10 bg-primary/5">
                            <CardTitle className="text-primary">Course Details</CardTitle>
                            <CardDescription>Basic information about this MOOC / E-Learning course</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-primary font-bold text-xs uppercase tracking-widest">
                                    Course Title *
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Introduction to Digital Marketing"
                                    required
                                    className="border-primary/20 rounded-tl-lg rounded-br-lg"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-primary font-bold text-xs uppercase tracking-widest">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed description of the course content..."
                                    className="border-primary/20 rounded-tl-lg rounded-br-lg"
                                    rows={3}
                                />
                            </div>

                            {/* Program and Level */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="program" className="text-primary font-bold text-xs uppercase tracking-widest">
                                        Program / Parent Category
                                    </Label>
                                    <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
                                        <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                            <SelectValue placeholder="Select program context" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {programs?.map((program) => (
                                                <SelectItem key={program.id} value={program.id}>
                                                    {program.title} ({program.programType})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        The program determines pricing and enrollment rules.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                        Difficulty Level
                                    </Label>
                                    <Select
                                        value={formData.level}
                                        onValueChange={(value: any) => setFormData({ ...formData, level: value })}
                                    >
                                        <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Category and Thumbnail */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-primary font-bold text-xs uppercase tracking-widest">
                                        Sub-Category (Optional)
                                    </Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. SEO, Social Media"
                                        className="border-primary/20 rounded-tl-lg rounded-br-lg"
                                    />
                                </div>


                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                        Status
                                    </Label>
                                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                                        <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Draft">Draft</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Units Section */}
                    <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                        <CardHeader className="border-b border-primary/10 bg-primary/5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-primary">Course Modules</CardTitle>
                                    <CardDescription>Add modules or units to the curriculum</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addUnit}
                                    className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Module
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {units.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 mb-4">No content added yet</p>
                                    <Button
                                        type="button"
                                        onClick={addUnit}
                                        variant="outline"
                                        className="rounded-tl-lg rounded-br-lg"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Module
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {units.map((unit) => (
                                        <Card key={unit.id} className="border-primary/10">
                                            {/* Unit Header */}
                                            <div
                                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                                                onClick={() => toggleUnitExpansion(unit.id)}
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white font-bold">
                                                        {unit.unitNumber}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-xs bg-primary/5">
                                                            Module {unit.unitNumber}
                                                        </Badge>
                                                        {unit.contentIds.length > 0 && (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                                {unit.contentIds.length} materials
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-primary truncate mt-1">
                                                        {unit.title || `Module ${unit.unitNumber}`}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeUnit(unit.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                {expandedUnits.has(unit.id) ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>

                                            {/* Unit Details - Expandable */}
                                            {expandedUnits.has(unit.id) && (
                                                <CardContent className="border-t border-primary/10 p-4 space-y-4 bg-gray-50/50">
                                                    {/* Title Row */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase tracking-widest text-primary/60">
                                                                Module Title
                                                            </Label>
                                                            <Input
                                                                value={unit.title}
                                                                onChange={(e) => updateUnit(unit.id, { title: e.target.value })}
                                                                placeholder={`Module ${unit.unitNumber} Title`}
                                                                className="border-primary/20 rounded-tl-lg rounded-br-lg bg-white"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase tracking-widest text-primary/60">
                                                                Duration (mins)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={unit.estimatedDuration}
                                                                onChange={(e) => updateUnit(unit.id, { estimatedDuration: parseInt(e.target.value) || 60 })}
                                                                className="border-primary/20 rounded-tl-lg rounded-br-lg bg-white"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase tracking-widest text-primary/60">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            value={unit.description}
                                                            onChange={(e) => updateUnit(unit.id, { description: e.target.value })}
                                                            placeholder="Topics covered..."
                                                            className="border-primary/20 rounded-tl-lg rounded-br-lg bg-white"
                                                            rows={2}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>

                                                    {/* Content Picker */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs uppercase tracking-widest text-primary/60">
                                                                Content / Materials
                                                            </Label>
                                                            <div className="flex gap-2">
                                                                {/* Upload New Button */}
                                                                <div className="relative">
                                                                    <input
                                                                        type="file"
                                                                        id={`upload-${unit.id}`}
                                                                        className="hidden"
                                                                        onChange={(e) => handleFileUpload(e, unit.id)}
                                                                        disabled={uploadingUnitId === unit.id}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            document.getElementById(`upload-${unit.id}`)?.click();
                                                                        }}
                                                                        disabled={uploadingUnitId !== null}
                                                                        className="rounded-tl-md rounded-br-md text-xs border-dashed"
                                                                    >
                                                                        {uploadingUnitId === unit.id ? (
                                                                            <>
                                                                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                                                {Math.round(uploadProgress)}%
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Upload className="h-3 w-3 mr-1" />
                                                                                Upload New
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowContentPicker(showContentPicker === unit.id ? null : unit.id);
                                                                    }}
                                                                    className="rounded-tl-md rounded-br-md text-xs"
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                    Add from Library
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Selected Content */}
                                                        {unit.contentIds.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {unit.contentIds.map(contentId => {
                                                                    const content = contentItems?.find(c => c.id === contentId);
                                                                    return (
                                                                        <Badge
                                                                            key={contentId}
                                                                            variant="secondary"
                                                                            className="flex items-center gap-1 pr-1"
                                                                        >
                                                                            {content?.type === 'video' && <Video className="h-3 w-3" />}
                                                                            {content?.type === 'document' && <FileText className="h-3 w-3" />}
                                                                            {content?.title || contentId}
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeContentFromUnit(unit.id, contentId);
                                                                                }}
                                                                                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </Badge>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Content Picker Dropdown */}
                                                        {showContentPicker === unit.id && (
                                                            <div className="border rounded-lg p-3 bg-white max-h-48 overflow-y-auto mt-2 shadow-sm relative z-10">
                                                                {contentItems && contentItems.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {contentItems
                                                                            .filter(c => !unit.contentIds.includes(c.id))
                                                                            .map(content => (
                                                                                <div
                                                                                    key={content.id}
                                                                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        addContentToUnit(unit.id, content.id);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        {content.type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                                                                                        {content.type === 'document' && <FileText className="h-4 w-4 text-blue-500" />}
                                                                                        <span className="text-sm">{content.title}</span>
                                                                                    </div>
                                                                                    <Plus className="h-4 w-4 text-green-500" />
                                                                                </div>
                                                                            ))}
                                                                        {contentItems.filter(c => !unit.contentIds.includes(c.id)).length === 0 && (
                                                                            <p className="text-sm text-gray-500 text-center py-2">All content already added</p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500 text-center py-4">
                                                                        No published content available
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/admin/e-learning')}
                            className="rounded-tl-lg rounded-br-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg min-w-[150px]"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Course
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
