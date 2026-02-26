'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, FileText, Video, Image as ImageIcon, Music, LayoutList } from "lucide-react";
import { useUsersFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, documentId, getDocs } from 'firebase/firestore';
import type { LearningCourse, LearningModule } from '@/lib/learning-types';
import type { ContentItem } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";

interface CoursePlayerProps {
    id: string; // Course ID
    backUrl: string; // URL to go back to (e.g. /f/curriculum or /admin/curriculum)
}

export function CoursePlayer({ id, backUrl }: CoursePlayerProps) {
    const router = useRouter();
    const firestore = useUsersFirestore();

    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [contentItems, setContentItems] = useState<Record<string, ContentItem>>({});
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Fetch course
    const courseDoc = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'learningCourses', id);
    }, [firestore, id]);
    const { data: course, loading: courseLoading } = useDoc<LearningCourse>(courseDoc as any);

    // Fetch modules
    const modulesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'learningUnits'),
            where('courseId', '==', id),
            orderBy('orderIndex', 'asc')
        );
    }, [firestore, id]);
    const { data: modules, loading: modulesLoading } = useCollection<LearningModule>(modulesQuery as any);

    // Fetch all needed content items
    useEffect(() => {
        const fetchContent = async () => {
            if (!firestore || !modules || modules.length === 0) return;

            const allContentIds = modules.flatMap(m => m.contentIds || []);
            if (allContentIds.length === 0) return;

            // Firestore 'in' queries are limited to 10 items.
            // We should chunk them or fetch individually.
            const uniqueIds = Array.from(new Set(allContentIds));
            const itemsMap: Record<string, ContentItem> = {};

            // Simple chunking for Firestore `in` max 10
            for (let i = 0; i < uniqueIds.length; i += 10) {
                const chunk = uniqueIds.slice(i, i + 10);
                const q = query(collection(firestore, 'contentLibrary'), where(documentId(), 'in', chunk));
                const snap = await getDocs(q);
                snap.forEach(doc => {
                    itemsMap[doc.id] = { id: doc.id, ...doc.data() } as ContentItem;
                });
            }
            setContentItems(itemsMap);
        };
        fetchContent();
    }, [firestore, modules]);

    // Select first module/content automatically when loaded
    useEffect(() => {
        if (modules && modules.length > 0 && !selectedModule) {
            setSelectedModule(modules[0]);
            const firstContentId = modules[0].contentIds?.[0];
            if (firstContentId && contentItems[firstContentId]) {
                setSelectedContent(contentItems[firstContentId]);
            }
        }
    }, [modules, contentItems, selectedModule]);

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />;
            case 'document': return <FileText className="h-4 w-4" />;
            case 'image': return <ImageIcon className="h-4 w-4" />;
            case 'audio': return <Music className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    if (courseLoading || modulesLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 flex-col gap-4">
                <p className="text-primary/60 font-bold">Course not found</p>
                <Button variant="outline" onClick={() => router.push(backUrl)}>Go Back</Button>
            </div>
        );
    }

    const renderContentArea = () => {
        if (!selectedContent) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-primary/40">
                    <PlayCircle className="h-16 w-16 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold mb-2">Welcome to {course.title}</h3>
                    <p className="max-w-md">Select a content item from the curriculum outline on the left to begin learning.</p>
                </div>
            );
        }

        const isPdf = selectedContent.mimeType === 'application/pdf' || selectedContent.fileName?.endsWith('.pdf');

        return (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-black/5 p-4 md:p-8">
                <div className="w-full max-w-5xl h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl border border-primary/10">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center bg-white z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-lg text-accent">
                                {getContentTypeIcon(selectedContent.type)}
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-primary leading-tight">{selectedContent.title}</h2>
                                <p className="text-xs text-primary/50 uppercase tracking-widest font-bold">
                                    {selectedContent.type} • {selectedModule?.title}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Viewer body */}
                    <div className="flex-1 bg-slate-50 w-full relative overflow-hidden flex items-center justify-center">
                        {selectedContent.type === 'video' ? (
                            <video
                                src={selectedContent.fileUrl}
                                controls
                                controlsList="nodownload"
                                className="w-full h-full bg-black outline-none"
                            />
                        ) : selectedContent.type === 'image' ? (
                            <img
                                src={selectedContent.fileUrl}
                                alt={selectedContent.title}
                                className="max-w-full max-h-full object-contain p-4"
                            />
                        ) : selectedContent.type === 'audio' ? (
                            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-primary/5 flex flex-col items-center">
                                <Music className="h-16 w-16 text-accent/50 mb-6" />
                                <audio src={selectedContent.fileUrl} controls className="w-full outline-none" />
                            </div>
                        ) : isPdf ? (
                            <iframe
                                src={`${selectedContent.fileUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                            />
                        ) : (
                            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-primary/5 max-w-sm">
                                <FileText className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                                <p className="text-sm text-primary/60 mb-4">This document type cannot be previewed directly in the browser.</p>
                                <Button asChild className="bg-accent hover:bg-accent/90">
                                    <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">
                                        Download File
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Footer Description */}
                    {selectedContent.description && (
                        <div className="px-6 py-4 bg-white border-t border-primary/10 shrink-0 overflow-y-auto max-h-32 shadow-[0_-10px_10px_rgba(0,0,0,0.02)]">
                            <p className="text-sm text-primary/70">{selectedContent.description}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-body fixed top-0 left-0 right-0 bottom-0 z-50">
            {/* Top Navigation Bar */}
            <div className="h-16 bg-primary text-white flex items-center px-4 justify-between shrink-0 shadow-md z-20">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10"
                        onClick={() => router.push(`${backUrl}/${id}`)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-white/20 mx-2"></div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight line-clamp-1">{course.title}</h1>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest font-black line-clamp-1">
                            {course.programTitle || course.programId}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white hover:text-primary transition-colors text-xs font-bold"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <LayoutList className="h-4 w-4 mr-2" />
                        {sidebarOpen ? 'Hide Curriculum' : 'Show Curriculum'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Curriculum */}
                <div className={cn(
                    "w-80 bg-white border-r border-primary/10 flex flex-col shrink-0 transition-transform duration-300 z-10 overflow-hidden",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full absolute h-full shadow-2xl"
                )}>
                    <div className="p-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center shrink-0">
                        <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Curriculum Outline</h2>
                        <Badge className="bg-primary/10 text-primary border-none text-xs">{modules?.length || 0} Modules</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 space-y-2">
                            {modules?.map((module, index) => (
                                <div key={module.id} className="border border-primary/10 rounded-lg overflow-hidden flex flex-col">
                                    {/* Module Header */}
                                    <button
                                        className={cn(
                                            "w-full text-left p-3 hover:bg-primary/5 transition-colors flex items-start gap-3",
                                            selectedModule?.id === module.id ? "bg-primary/5 border-b border-primary/10" : ""
                                        )}
                                        onClick={() => setSelectedModule(module)}
                                    >
                                        <div className="bg-primary/10 text-primary font-bold text-xs h-6 w-6 rounded flex items-center justify-center shrink-0 mt-0.5">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm font-bold line-clamp-2",
                                                selectedModule?.id === module.id ? "text-accent" : "text-primary"
                                            )}>
                                                {module.title}
                                            </p>
                                            <p className="text-[10px] text-primary/50 font-medium uppercase mt-1">
                                                {module.contentIds?.length || 0} Items
                                            </p>
                                        </div>
                                    </button>

                                    {/* Module Content List (Expanded if selected or has content) */}
                                    {selectedModule?.id === module.id && module.contentIds && module.contentIds.length > 0 && (
                                        <div className="bg-slate-50 flex flex-col py-1">
                                            {module.contentIds.map((contentId) => {
                                                const content = contentItems[contentId];
                                                if (!content) return null;

                                                const isSelected = selectedContent?.id === content.id;

                                                return (
                                                    <button
                                                        key={content.id}
                                                        onClick={() => setSelectedContent(content)}
                                                        className={cn(
                                                            "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-primary/5 transition-colors relative",
                                                            isSelected ? "bg-accent/5" : ""
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                                                        )}
                                                        <div className={cn(
                                                            "mt-0.5 shrink-0",
                                                            isSelected ? "text-accent" : "text-primary/40"
                                                        )}>
                                                            {getContentTypeIcon(content.type)}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className={cn(
                                                                "text-sm font-medium line-clamp-2",
                                                                isSelected ? "text-accent font-bold" : "text-primary/80"
                                                            )}>
                                                                {content.title}
                                                            </p>
                                                            <div className="flex items-center mt-1">
                                                                <span className="text-[9px] uppercase font-bold tracking-widest text-primary/40 bg-white px-1.5 py-0.5 rounded border border-primary/10">
                                                                    {content.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {selectedModule?.id === module.id && (!module.contentIds || module.contentIds.length === 0) && (
                                        <div className="p-4 text-center text-xs text-primary/40 italic bg-slate-50">
                                            No content uploaded yet.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={cn(
                    "flex-1 transition-all duration-300 h-full",
                    sidebarOpen ? "ml-0" : "w-full"
                )}>
                    {renderContentArea()}
                </div>
            </div>
        </div>
    );
}
