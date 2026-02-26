'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Layout, Type, Video, Image as ImageIcon, FileQuestion,
    Save, ArrowLeft, Plus, Trash2, GripVertical, Settings,
    Eye, MoreVertical, RefreshCw, CheckCircle2, ChevronRight, ChevronDown
} from "lucide-react";
import { useUsersFirestore, useUser, useStorage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from '@/components/ui/use-toast';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CourseContent, CourseSection, ContentBlock, ContentBlockType, QuizQuestion } from '@/lib/content-library-types';

export default function CreateCoursePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const firestore = useUsersFirestore();
    const { user } = useUser();
    const storage = useStorage();

    const handleImageUpload = async (file: File, sectionId: string, blockId: string) => {
        if (!storage || !user) {
            toast({ title: "Error", description: "Storage not initialized or user not logged in.", variant: "destructive" });
            return;
        }

        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const path = `course-content/${courseId || 'temp'}/${timestamp}_${safeFileName}`;
        const storageRef = ref(storage, path);

        try {
            const uploadTask = uploadBytesResumable(storageRef, file);
            toast({ title: "Uploading...", description: "Please wait while your image is being uploaded." });

            uploadTask.on('state_changed',
                (snapshot) => { },
                (error) => {
                    console.error("Upload error:", error);
                    toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    updateBlock(sectionId, blockId, { imageUrl: downloadURL });
                    toast({ title: "Success", description: "Image uploaded successfully." });
                }
            );
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
        }
    };


    // Course State
    const [courseId, setCourseId] = useState<string | null>(null);
    const [title, setTitle] = useState('Untitled Course');
    const [description, setDescription] = useState('');
    const [sections, setSections] = useState<CourseSection[]>([]);

    // UI State
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    // Metadata State
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('private');

    // Refs for autosave
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDirtyRef = useRef(false);
    const loadedRef = useRef(false);

    // Load existing course when editing
    useEffect(() => {
        if (!editId || !firestore || loadedRef.current) return;
        loadedRef.current = true;
        (async () => {
            const snap = await getDoc(doc(firestore, 'contentLibrary', editId));
            if (snap.exists()) {
                const data = snap.data() as any;
                setCourseId(editId);
                setTitle(data.title || 'Untitled Course');
                setDescription(data.description || '');
                setDifficulty(data.difficulty || 'beginner');
                setVisibility(data.visibility || 'private');
                const loadedSections: CourseSection[] = data.sections || [];
                setSections(loadedSections);
                if (loadedSections.length > 0) setActiveSectionId(loadedSections[0].id);
                isDirtyRef.current = false;
            }
        })();
    }, [editId, firestore]);

    // Initialize first section (only for new courses)
    useEffect(() => {
        if (editId) return; // skip when editing existing
        if (sections.length === 0) {
            const initialSection: CourseSection = {
                id: crypto.randomUUID(),
                title: 'Introduction',
                order: 0,
                blocks: []
            };
            setSections([initialSection]);
            setActiveSectionId(initialSection.id);
        }
    }, []);

    // Autosave Logic
    useEffect(() => {
        autoSaveTimerRef.current = setInterval(() => {
            if (isDirtyRef.current && courseId) {
                saveCourse(false);
            } else if (isDirtyRef.current && !courseId) {
                // If no ID yet, creates the doc first
                createInitialDoc();
            }
        }, 20000); // 20 seconds

        return () => {
            if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
        };
    }, [courseId, title, description, sections, difficulty, visibility]);

    // Mark as dirty when content changes
    useEffect(() => {
        isDirtyRef.current = true;
    }, [title, description, sections, difficulty, visibility]);

    const createInitialDoc = async () => {
        if (!firestore || !user) return;
        setIsSaving(true);
        try {
            const courseData: Partial<CourseContent> = {
                title,
                description,
                type: 'course',
                status: 'draft',
                sections,
                difficulty,
                visibility,
                tags: [],
                categories: [],
                createdAt: serverTimestamp() as Timestamp,
                updatedAt: serverTimestamp() as Timestamp,
                createdBy: user.uid,
                version: 1,
                viewCount: 0,
                enrollmentCount: 0,
                completionCount: 0,
            };

            const docRef = await addDoc(collection(firestore, 'contentLibrary'), courseData);
            setCourseId(docRef.id);
            setLastSaved(new Date());
            isDirtyRef.current = false;
            toast({ title: "Draft Created", description: "Course draft initialized." });
        } catch (error) {
            console.error("Error creating course:", error);
            toast({ title: "Error", description: "Failed to create draft.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const saveCourse = async (manual: boolean = false) => {
        if (!firestore || !courseId) {
            if (manual && !courseId) createInitialDoc();
            return;
        }

        if (manual) setIsSaving(true);

        try {
            const courseRef = doc(firestore, 'contentLibrary', courseId);
            await updateDoc(courseRef, {
                title,
                description,
                sections,
                difficulty,
                visibility,
                updatedAt: serverTimestamp(),
                lastAutoSavedAt: serverTimestamp(),
            });

            setLastSaved(new Date());
            isDirtyRef.current = false;
            if (manual) toast({ title: "Saved", description: "Course saved successfully." });
        } catch (error) {
            console.error("Error saving course:", error);
            if (manual) toast({ title: "Error", description: "Failed to save course.", variant: "destructive" });
        } finally {
            if (manual) setIsSaving(false);
        }
    };

    const addSection = () => {
        const newSection: CourseSection = {
            id: crypto.randomUUID(),
            title: `Section ${sections.length + 1}`,
            order: sections.length,
            blocks: []
        };
        setSections([...sections, newSection]);
        setActiveSectionId(newSection.id);
    };

    const updateSection = (id: string, updates: Partial<CourseSection>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSection = (id: string) => {
        if (sections.length <= 1) {
            toast({ title: "Cannot delete", description: "Course must have at least one section.", variant: "destructive" });
            return;
        }
        if (confirm("Delete this section and all its contents?")) {
            const newSections = sections.filter(s => s.id !== id);
            setSections(newSections);
            if (activeSectionId === id) setActiveSectionId(newSections[0].id);
        }
    };

    const addBlock = (sectionId: string, type: ContentBlockType) => {
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;

        const newBlock: ContentBlock = {
            id: crypto.randomUUID(),
            type,
            order: sections[sectionIndex].blocks.length,
            content: '',
        };

        // Initialize specific fields based on type
        if (type === 'heading') newBlock.headingLevel = 2;
        if (type === 'quiz') newBlock.quizQuestions = [];

        const newSections = [...sections];
        newSections[sectionIndex] = {
            ...newSections[sectionIndex],
            blocks: [...newSections[sectionIndex].blocks, newBlock]
        };
        setSections(newSections);
    };

    const updateBlock = (sectionId: string, blockId: string, updates: Partial<ContentBlock>) => {
        const newSections = sections.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                blocks: section.blocks.map(block =>
                    block.id === blockId ? { ...block, ...updates } : block
                )
            };
        });
        setSections(newSections);
    };

    const deleteBlock = (sectionId: string, blockId: string) => {
        const newSections = sections.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                blocks: section.blocks.filter(b => b.id !== blockId)
            };
        });
        setSections(newSections);
    };

    const moveBlock = (sectionId: string, blockId: string, direction: 'up' | 'down') => {
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;

        const section = sections[sectionIndex];
        const blockIndex = section.blocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return;

        if (direction === 'up' && blockIndex === 0) return;
        if (direction === 'down' && blockIndex === section.blocks.length - 1) return;

        const newBlocks = [...section.blocks];
        const swapIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;

        [newBlocks[blockIndex], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[blockIndex]];

        // Update orders
        newBlocks.forEach((b, idx) => b.order = idx);

        const newSections = [...sections];
        newSections[sectionIndex] = { ...section, blocks: newBlocks };
        setSections(newSections);
    };

    // Rendering Helpers
    const renderBlockEditor = (sectionId: string, block: ContentBlock) => {
        switch (block.type) {
            case 'text':
                return (
                    <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Textarea
                            value={block.content || ''}
                            onChange={(e) => updateBlock(sectionId, block.id, { content: e.target.value })}
                            placeholder="Write your content here..."
                            rows={5}
                            className="font-body"
                        />
                    </div>
                );
            case 'heading':
                return (
                    <div className="space-y-2">
                        <Label>Heading Text (Level {block.headingLevel})</Label>
                        <div className="flex gap-2">
                            <select
                                value={block.headingLevel}
                                onChange={(e) => updateBlock(sectionId, block.id, { headingLevel: Number(e.target.value) as 1 | 2 | 3 })}
                                className="border p-2 rounded"
                            >
                                <option value={1}>H1</option>
                                <option value={2}>H2</option>
                                <option value={3}>H3</option>
                            </select>
                            <Input
                                value={block.content || ''}
                                onChange={(e) => updateBlock(sectionId, block.id, { content: e.target.value })}
                                placeholder="Heading text..."
                                className="font-bold text-lg"
                            />
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                                value={block.videoUrl || ''}
                                onChange={(e) => updateBlock(sectionId, block.id, { videoUrl: e.target.value })}
                                placeholder="https://youtube.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Caption (Optional)</Label>
                            <Input
                                value={block.content || ''}
                                onChange={(e) => updateBlock(sectionId, block.id, { content: e.target.value })}
                                placeholder="Video caption..."
                            />
                        </div>
                        {block.videoUrl && (
                            <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center border border-dashed">
                                <p className="text-sm text-gray-500">Video Preview: {block.videoUrl}</p>
                            </div>
                        )}
                    </div>
                );
            case 'image':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Image</Label>

                            {/* Drag & Drop / Paste Zone */}
                            {!block.imageUrl ? (
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative"
                                    onPaste={(e) => {
                                        const items = e.clipboardData.items;
                                        for (const item of items) {
                                            if (item.type.indexOf('image') !== -1) {
                                                const file = item.getAsFile();
                                                if (file) handleImageUpload(file, sectionId, block.id);
                                            }
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type.startsWith('image/')) {
                                            handleImageUpload(file, sectionId, block.id);
                                        }
                                    }}
                                    onClick={() => document.getElementById(`file-upload-${block.id}`)?.click()}
                                >
                                    <input
                                        type="file"
                                        id={`file-upload-${block.id}`}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, sectionId, block.id);
                                        }}
                                    />
                                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-primary">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">Click to upload or drag & drop</p>
                                    <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 4MB)</p>
                                    <p className="text-xs text-blue-500 mt-4 font-medium">You can also paste an image here</p>
                                </div>
                            ) : (
                                <div className="relative group rounded-xl overflow-hidden border bg-gray-100">
                                    <img src={block.imageUrl} alt="Preview" className="w-full h-auto max-h-[400px] object-contain" />
                                    <button
                                        onClick={() => updateBlock(sectionId, block.id, { imageUrl: '' })}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Remove image"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Alt Text</Label>
                            <Input
                                value={block.imageAlt || ''}
                                onChange={(e) => updateBlock(sectionId, block.id, { imageAlt: e.target.value })}
                                placeholder="Description for accessibility"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Caption (Optional)</Label>
                            <Input
                                value={block.imageCaption || ''}
                                onChange={(e) => updateBlock(sectionId, block.id, { imageCaption: e.target.value })}
                                placeholder="Image caption..."
                            />
                        </div>
                    </div>
                );

            case 'quiz':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Quiz/Question Title</Label>
                            <Input
                                value={block.quizTitle || ''}
                                onChange={(e) => updateBlock(sectionId, block.id, { quizTitle: e.target.value })}
                                placeholder="Knowledge Check"
                            />
                        </div>
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-800">
                            Detailed quiz editor implementation would go here (adding questions, options, etc).
                        </div>
                    </div>
                );
            default:
                return <div>Unknown block type</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-body">
            {/* Top Bar */}
            <div className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 h-8"
                            placeholder="Course Title"
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{isSaving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Not saved yet"}</span>
                            {isDirtyRef.current && <span className="text-amber-500">• Unsaved changes</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                        {previewMode ? <Settings className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {previewMode ? "Edit Mode" : "Preview"}
                    </Button>
                    <Button onClick={() => saveCourse(true)} disabled={isSaving} className="bg-primary text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Save Course
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
                {/* Left Sidebar - Course Structure */}
                <div className="w-80 bg-white border-r overflow-y-auto flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Course Structure</h2>
                        <Button
                            variant="outline"
                            className="w-full justify-start border-dashed text-primary/70 hover:text-primary hover:bg-primary/5"
                            onClick={addSection}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                        </Button>
                    </div>

                    <div className="p-2 space-y-2">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className={cn(
                                    "group rounded-lg border transition-all hover:shadow-sm",
                                    activeSectionId === section.id ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20" : "bg-white border-gray-100"
                                )}
                            >
                                <div
                                    className="p-3 cursor-pointer flex items-center justify-between"
                                    onClick={() => setActiveSectionId(section.id)}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 shrink-0">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium truncate text-sm">{section.title}</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => deleteSection(section.id)} className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                    {activeSectionId && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Section Header */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Section Title</Label>
                                <Input
                                    value={sections.find(s => s.id === activeSectionId)?.title}
                                    onChange={(e) => updateSection(activeSectionId, { title: e.target.value })}
                                    className="text-2xl font-bold border-none px-0 h-auto focus-visible:ring-0 placeholder:text-gray-300"
                                    placeholder="Enter section title..."
                                />
                                <Input
                                    value={sections.find(s => s.id === activeSectionId)?.description || ''}
                                    onChange={(e) => updateSection(activeSectionId, { description: e.target.value })}
                                    className="text-gray-500 border-none px-0 h-auto focus-visible:ring-0 mt-2"
                                    placeholder="Add a brief description..."
                                />
                            </div>

                            {/* Section Blocks */}
                            <div className="space-y-4">
                                {sections.find(s => s.id === activeSectionId)?.blocks.map((block) => (
                                    <div key={block.id} className="group relative">
                                        {/* Block Controls */}
                                        <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-md border p-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(activeSectionId, block.id, 'up')}>
                                                <ChevronDown className="h-3 w-3 rotate-180" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(activeSectionId, block.id, 'down')}>
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                            <div className="w-px h-4 bg-gray-200 my-auto mx-1" />
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteBlock(activeSectionId, block.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        {/* Block Content */}
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-gray-50">
                                                    {block.type}
                                                </Badge>
                                            </div>
                                            {renderBlockEditor(activeSectionId, block)}
                                        </div>
                                    </div>
                                ))}

                                {/* Add Block Menu */}
                                <div className="py-8 text-center">
                                    <div className="inline-flex items-center gap-2 p-1 bg-white rounded-full shadow-lg border border-gray-100">
                                        <Button
                                            variant="ghost"
                                            className="rounded-full gap-2 hover:bg-blue-50 hover:text-blue-600"
                                            onClick={() => addBlock(activeSectionId, 'text')}
                                        >
                                            <Type className="h-4 w-4" />
                                            Text
                                        </Button>
                                        <div className="w-px h-4 bg-gray-200" />
                                        <Button
                                            variant="ghost"
                                            className="rounded-full gap-2 hover:bg-purple-50 hover:text-purple-600"
                                            onClick={() => addBlock(activeSectionId, 'heading')}
                                        >
                                            <Type className="h-4 w-4 font-bold" />
                                            Heading
                                        </Button>
                                        <div className="w-px h-4 bg-gray-200" />
                                        <Button
                                            variant="ghost"
                                            className="rounded-full gap-2 hover:bg-red-50 hover:text-red-600"
                                            onClick={() => addBlock(activeSectionId, 'video')}
                                        >
                                            <Video className="h-4 w-4" />
                                            Video
                                        </Button>
                                        <div className="w-px h-4 bg-gray-200" />
                                        <Button
                                            variant="ghost"
                                            className="rounded-full gap-2 hover:bg-green-50 hover:text-green-600"
                                            onClick={() => addBlock(activeSectionId, 'image')}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            Image
                                        </Button>
                                        <div className="w-px h-4 bg-gray-200" />
                                        <Button
                                            variant="ghost"
                                            className="rounded-full gap-2 hover:bg-orange-50 hover:text-orange-600"
                                            onClick={() => addBlock(activeSectionId, 'quiz')}
                                        >
                                            <FileQuestion className="h-4 w-4" />
                                            Quiz
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!activeSectionId && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Layout className="h-16 w-16 mb-4 opacity-20" />
                            <p className="font-medium">Select a section to start editing content</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
