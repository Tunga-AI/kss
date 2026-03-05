'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowLeft, PlayCircle, FileText, Video, Image as ImageIcon, Music,
    LayoutList, Download, Send, MessageSquare, ChevronRight, CheckCircle2,
    Clock, BookOpen, ChevronDown, Play, Pause, Volume2, Maximize2, Users, Calendar
} from "lucide-react";
import { useUsersFirestore, useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy, documentId, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { LearningCourse, LearningModule } from '@/lib/learning-types';
import type { ContentItem } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CoursePlayerProps {
    id: string;
    backUrl: string;
}

export function CoursePlayer({ id, backUrl }: CoursePlayerProps) {
    const router = useRouter();
    const firestore = useUsersFirestore();
    const { user } = useUser();

    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [playMode, setPlayMode] = useState(false);
    const [contentItems, setContentItems] = useState<Record<string, ContentItem>>({});
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [chatMessage, setChatMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    // Fetch course
    const courseDoc = useMemo(() => firestore ? doc(firestore, 'learningCourses', id) : null, [firestore, id]);
    const { data: course, loading: courseLoading } = useDoc<LearningCourse>(courseDoc as any);

    // Fetch modules
    const modulesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'learningUnits'), where('courseId', '==', id), orderBy('orderIndex', 'asc'));
    }, [firestore, id]);
    const { data: modules, loading: modulesLoading } = useCollection<LearningModule>(modulesQuery as any);

    // Fetch chat messages for selected module
    const [messages, setMessages] = useState<any[]>([]);
    const chatQuery = useMemo(() => {
        if (!firestore || !selectedModule) return null;
        return query(collection(firestore, 'chatMessages'), where('sessionId', '==', selectedModule.id), orderBy('timestamp', 'asc'));
    }, [firestore, selectedModule]);
    const { data: chatMessages } = useCollection<any>(chatQuery as any);

    useEffect(() => {
        if (chatMessages) setMessages(chatMessages);
    }, [chatMessages]);

    // Fetch all needed content items
    useEffect(() => {
        const fetchContent = async () => {
            if (!firestore || !modules || modules.length === 0) return;
            const allContentIds = modules.flatMap(m => m.contentIds || []);
            if (allContentIds.length === 0) return;
            const uniqueIds = Array.from(new Set(allContentIds));
            const itemsMap: Record<string, ContentItem> = {};
            for (let i = 0; i < uniqueIds.length; i += 10) {
                const chunk = uniqueIds.slice(i, i + 10);
                const q = query(collection(firestore, 'contentLibrary'), where(documentId(), 'in', chunk));
                const snap = await getDocs(q);
                snap.forEach(d => { itemsMap[d.id] = { id: d.id, ...d.data() } as ContentItem; });
            }
            setContentItems(itemsMap);
        };
        fetchContent();
    }, [firestore, modules]);

    // Select first module/content automatically
    useEffect(() => {
        if (playMode && modules && modules.length > 0 && !selectedModule) {
            const first = modules[0];
            setSelectedModule(first);
            setExpandedModules(new Set([first.id]));
        }
    }, [modules, selectedModule, playMode]);

    // Auto-select first content of selected module
    useEffect(() => {
        if (playMode && selectedModule && selectedModule.contentIds && selectedModule.contentIds.length > 0 && !selectedContent) {
            const firstId = selectedModule.contentIds[0];
            if (contentItems[firstId]) setSelectedContent(contentItems[firstId]);
        }
    }, [selectedModule, contentItems, selectedContent, playMode]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !firestore || !user || isSending || !selectedModule) return;
        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'chatMessages'), {
                sessionId: selectedModule.id,
                userId: user.uid,
                userName: user.displayName || user.email || 'Learner',
                message: chatMessage.trim(),
                timestamp: serverTimestamp(),
                type: 'text',
            });
            setChatMessage('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />;
            case 'image': return <ImageIcon className="h-4 w-4" />;
            case 'audio': return <Music className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const isPdf = selectedContent?.mimeType === 'application/pdf' || selectedContent?.fileName?.endsWith('.pdf');

    if (courseLoading || modulesLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-primary/60 font-semibold">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 flex-col gap-4">
                <BookOpen className="h-12 w-12 text-primary/20" />
                <p className="text-primary/60 font-bold">Course not found</p>
                <Button variant="outline" onClick={() => router.push(backUrl)}>Go Back</Button>
            </div>
        );
    }

    // Count total content items
    const totalItems = modules?.reduce((acc, m) => acc + (m.contentIds?.length || 0), 0) || 0;

    if (!playMode) {
        const upcomingModules = modules?.filter(m => m.status === 'Scheduled' || m.status === 'In Progress') || [];
        const pastModules = modules?.filter(m => m.status === 'Completed') || [];

        return (
            <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-body fixed top-0 left-0 right-0 bottom-0 z-50">
                {/* Top Navigation Bar */}
                <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 rounded-lg h-9 w-9" onClick={() => router.push(`${backUrl}/${id}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <h1 className="font-bold text-sm text-slate-800 leading-tight line-clamp-1">{course.title}</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold line-clamp-1">
                                Course Overview
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto w-full space-y-8 pb-10">
                            {/* Upcoming Classes */}
                            <section>
                                <h2 className="text-lg font-bold text-slate-800 mb-4">{course.isSelfPaced ? 'Current Modules' : 'Upcoming Classes'}</h2>
                                <div className="space-y-4">
                                    {(upcomingModules.length > 0 || !pastModules.length ? modules || [] : upcomingModules).map((mod) => (
                                        <div key={mod.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-800 text-base">{mod.title}</h3>
                                                    {mod.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{mod.description}</p>}
                                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                                        {mod.facilitatorName && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                                    {mod.facilitatorName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-xs text-slate-600 font-medium">{mod.facilitatorName}</span>
                                                            </div>
                                                        )}
                                                        {mod.scheduledStartDate && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-xs text-slate-600 font-medium">
                                                                    {new Date(mod.scheduledStartDate.toDate()).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-xs text-slate-600 font-medium">0/30 registered</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 w-full md:w-auto">
                                                    <Button
                                                        className="w-full md:w-auto bg-primary hover:bg-primary/90 rounded-lg shadow-sm font-bold"
                                                        onClick={() => {
                                                            setSelectedModule(mod);
                                                            setPlayMode(true);
                                                            if (mod.contentIds?.length) {
                                                                setSelectedContent(contentItems[mod.contentIds[0]]);
                                                            }
                                                        }}
                                                    >
                                                        {(mod.deliveryType === 'Virtual' || mod.deliveryType === 'Hybrid') ? 'Join When Live' : 'Start Module'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Past Classes */}
                            {pastModules.length > 0 && (
                                <section>
                                    <h2 className="text-lg font-bold text-slate-800 mb-4">Past Classes & Recordings</h2>
                                    <div className="space-y-4">
                                        {pastModules.map((mod) => (
                                            <div key={mod.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow opacity-75 hover:opacity-100">
                                                <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-slate-800 text-base">{mod.title}</h3>
                                                        {mod.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{mod.description}</p>}
                                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                                            {mod.facilitatorName && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                                        {mod.facilitatorName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-xs text-slate-600 font-medium">{mod.facilitatorName}</span>
                                                                </div>
                                                            )}
                                                            {mod.scheduledStartDate && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                    <span className="text-xs text-slate-600 font-medium">
                                                                        {new Date(mod.scheduledStartDate.toDate()).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-xs text-slate-600 font-medium">Recorded</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 w-full md:w-auto">
                                                        <Button
                                                            variant="outline"
                                                            className="w-full md:w-auto border-primary text-primary hover:bg-primary/5 rounded-lg shadow-sm font-bold"
                                                            onClick={() => {
                                                                setSelectedModule(mod);
                                                                setPlayMode(true);
                                                                if (mod.contentIds?.length) {
                                                                    setSelectedContent(contentItems[mod.contentIds[0]]);
                                                                }
                                                            }}
                                                        >
                                                            Watch Recording
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Course Outline */}
                    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden hidden lg:flex">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h2 className="font-bold text-sm text-slate-800">Curriculum Outline</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{modules?.length || 0} items structured</p>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                {modules?.map((module, index) => (
                                    <div key={module.id} className="relative pl-6">
                                        <div className="absolute left-[11px] top-4 bottom-[-16px] w-[2px] bg-slate-100" />
                                        <div className="absolute left-[7px] top-1 h-2.5 w-2.5 rounded-full bg-primary/20 border-[2px] border-primary z-10" />
                                        <p className="font-bold text-xs text-slate-800">{module.title}</p>
                                        <div className="mt-2 space-y-2">
                                            {module.contentIds?.map((contentId, i) => {
                                                const content = contentItems[contentId];
                                                if (!content) return null;
                                                return (
                                                    <div key={content.id} className="flex gap-2.5 group">
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 shrink-0 w-3 text-right">{i + 1}</span>
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-600 group-hover:text-primary transition-colors cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedModule(module);
                                                                    setSelectedContent(content);
                                                                    setPlayMode(true);
                                                                }}
                                                            >
                                                                {content.title}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5 uppercase flex items-center gap-1">
                                                                {getContentIcon(content.type)}
                                                                {content.type} • {(content as any)?.estimatedMinutes || 5} min
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-body fixed top-0 left-0 right-0 bottom-0 z-50">
            {/* Top Navigation Bar */}
            <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 rounded-lg h-9 w-9" onClick={() => router.push(`${backUrl}/${id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                        <h1 className="font-bold text-sm text-slate-800 leading-tight line-clamp-1">{course.title}</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold line-clamp-1">
                            {selectedModule ? selectedModule.title : 'Select a module'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedContent && (
                        <Badge className="bg-accent/10 text-accent border-none text-[10px] uppercase font-bold tracking-wider px-2.5 py-1">
                            {selectedContent.type}
                        </Badge>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold h-9 rounded-lg shadow-none"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <LayoutList className="h-3.5 w-3.5 mr-1.5" />
                        {sidebarOpen ? 'Hide' : 'Show'} Outline
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Course Outline */}
                <div className={cn(
                    "bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
                    sidebarOpen ? "w-72" : "w-0"
                )}>
                    {/* Sidebar Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                        <h2 className="font-bold text-xs text-slate-500 uppercase tracking-widest">Course Content</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-slate-700">{modules?.length || 0} Modules</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-500">{totalItems} Items</span>
                        </div>
                    </div>

                    {/* Modules List */}
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {modules?.map((module, index) => {
                                const isExpanded = expandedModules.has(module.id);
                                const isSelected = selectedModule?.id === module.id;
                                return (
                                    <div key={module.id}>
                                        {/* Module Header */}
                                        <button
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 hover:bg-slate-50 transition-colors",
                                                isSelected && "bg-primary/5"
                                            )}
                                            onClick={() => { setSelectedModule(module); toggleModule(module.id); setSelectedContent(null); }}
                                        >
                                            <div className={cn(
                                                "h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5",
                                                isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-bold line-clamp-2 leading-snug", isSelected ? "text-primary" : "text-slate-700")}>{module.title}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{module.contentIds?.length || 0} items • {module.deliveryType}</p>
                                            </div>
                                            <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
                                        </button>

                                        {/* Content List */}
                                        {isExpanded && module.contentIds && module.contentIds.length > 0 && (
                                            <div className="ml-6 border-l-2 border-slate-100 pl-2 my-1 space-y-0.5">
                                                {module.contentIds.map((contentId) => {
                                                    const content = contentItems[contentId];
                                                    if (!content) return null;
                                                    const isActive = selectedContent?.id === content.id;
                                                    return (
                                                        <button
                                                            key={content.id}
                                                            onClick={() => { setSelectedContent(content); setSelectedModule(module); }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2.5 flex items-start gap-2.5 rounded-lg hover:bg-slate-50 transition-colors group",
                                                                isActive && "bg-accent/10"
                                                            )}
                                                        >
                                                            <div className={cn("mt-0.5 shrink-0", isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-600")}>
                                                                {getContentIcon(content.type)}
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className={cn("text-xs font-medium line-clamp-2 leading-snug", isActive ? "text-accent font-bold" : "text-slate-600")}>{content.title}</p>
                                                            </div>
                                                            {isActive && <Play className="h-3 w-3 text-accent shrink-0 mt-0.5" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Content + Right Panel */}
                <div className="flex flex-1 overflow-hidden min-w-0">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        {!selectedContent ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-slate-100 rounded-full p-6 mb-5">
                                    <PlayCircle className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Ready to learn?</h3>
                                <p className="text-slate-400 text-sm max-w-xs">Select a lesson from the course outline to start learning</p>
                            </div>
                        ) : selectedContent.type === 'video' ? (
                            /* Video Player */
                            <div className="flex-1 flex flex-col bg-black overflow-hidden">
                                <video
                                    key={selectedContent.id}
                                    src={selectedContent.fileUrl}
                                    controls
                                    controlsList="nodownload"
                                    className="flex-1 w-full h-full outline-none"
                                    autoPlay
                                />
                                {/* Video Info Bar */}
                                <div className="bg-slate-900 px-5 py-3 flex items-start justify-between shrink-0">
                                    <div>
                                        <h2 className="font-bold text-white text-sm">{selectedContent.title}</h2>
                                        <p className="text-slate-400 text-[11px] mt-0.5">{selectedModule?.title}</p>
                                    </div>
                                    {selectedContent.fileUrl && (
                                        <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 text-xs">
                                                <Maximize2 className="h-3.5 w-3.5 mr-1.5" />Full Screen
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : selectedContent.type === 'audio' ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8">
                                <div className="bg-white/10 backdrop-blur rounded-3xl p-10 flex flex-col items-center max-w-md w-full border border-white/10 shadow-2xl">
                                    <div className="h-24 w-24 bg-white/10 rounded-full flex items-center justify-center mb-6 border-2 border-white/20">
                                        <Music className="h-10 w-10 text-white/70" />
                                    </div>
                                    <h2 className="font-bold text-white text-lg mb-1 text-center">{selectedContent.title}</h2>
                                    <p className="text-white/50 text-xs mb-8">{selectedModule?.title}</p>
                                    <audio src={selectedContent.fileUrl} controls className="w-full outline-none" />
                                </div>
                            </div>
                        ) : isPdf ? (
                            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
                                <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-red-50 p-1.5 rounded-lg">
                                            <FileText className="h-4 w-4 text-red-500" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm text-slate-800">{selectedContent.title}</h2>
                                            <p className="text-[10px] text-slate-400">{selectedModule?.title}</p>
                                        </div>
                                    </div>
                                    <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="h-8 text-xs shadow-none border-slate-200 font-bold rounded-lg">
                                            <Download className="h-3.5 w-3.5 mr-1.5" />Download
                                        </Button>
                                    </a>
                                </div>
                                <iframe src={`${selectedContent.fileUrl}#toolbar=0`} className="flex-1 border-none" />
                            </div>
                        ) : selectedContent.type === 'image' ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-blue-50 p-1.5 rounded-lg">
                                            <ImageIcon className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <h2 className="font-bold text-sm text-slate-800">{selectedContent.title}</h2>
                                    </div>
                                    <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="h-8 text-xs shadow-none border-slate-200 font-bold rounded-lg">
                                            <Maximize2 className="h-3.5 w-3.5 mr-1.5" />View Full
                                        </Button>
                                    </a>
                                </div>
                                <div className="flex-1 flex items-center justify-center bg-slate-100 p-6">
                                    <img src={selectedContent.fileUrl} alt={selectedContent.title} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-8">
                                <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 flex flex-col items-center text-center max-w-sm">
                                    <FileText className="h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="font-bold text-slate-700 mb-2">{selectedContent.title}</h3>
                                    <p className="text-sm text-slate-400 mb-5">This file cannot be previewed in the browser.</p>
                                    <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-accent hover:bg-accent/90 rounded-lg font-bold">
                                            <Download className="h-4 w-4 mr-2" />Download File
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Chat + Materials */}
                    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
                        {/* Live Chat Section */}
                        <div className="flex flex-col h-1/2 border-b border-slate-200">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-slate-500" />
                                <h3 className="font-bold text-xs text-slate-600 uppercase tracking-wider">Discussion</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={chatScrollRef}>
                                {!messages || messages.length === 0 ? (
                                    <div className="text-center py-6">
                                        <MessageSquare className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400">No messages yet</p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">Start the discussion!</p>
                                    </div>
                                ) : (
                                    messages.map((msg: any) => (
                                        <div key={msg.id} className="flex gap-2.5">
                                            <Avatar className="h-6 w-6 shrink-0">
                                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                                    {(msg.userName || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={cn("text-[11px] font-bold", msg.userId === user?.uid ? "text-accent" : "text-primary")}>
                                                        {msg.userName}
                                                    </span>
                                                    {msg.timestamp && (
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 shrink-0">
                                <div className="flex gap-2">
                                    <Input
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 h-9 text-xs rounded-lg border-slate-200 focus:border-primary"
                                        disabled={isSending || !selectedModule}
                                    />
                                    <Button type="submit" size="icon" className="h-9 w-9 bg-primary rounded-lg shrink-0" disabled={!chatMessage.trim() || isSending || !selectedModule}>
                                        <Send className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Class Materials Section */}
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-500" />
                                <h3 className="font-bold text-xs text-slate-600 uppercase tracking-wider">Class Materials</h3>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-3 space-y-2">
                                    {selectedModule?.contentIds && selectedModule.contentIds.length > 0 ? (
                                        selectedModule.contentIds.map((contentId) => {
                                            const content = contentItems[contentId];
                                            if (!content) return null;
                                            const isActive = selectedContent?.id === content.id;
                                            return (
                                                <button
                                                    key={content.id}
                                                    onClick={() => setSelectedContent(content)}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2.5 rounded-lg border flex items-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all group",
                                                        isActive
                                                            ? "border-accent/30 bg-accent/5"
                                                            : "border-slate-100 bg-white"
                                                    )}
                                                >
                                                    <div className={cn("p-1.5 rounded-md shrink-0", isActive ? "bg-accent/10 text-accent" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary")}>
                                                        {getContentIcon(content.type)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden text-left">
                                                        <p className={cn("text-xs font-bold leading-snug line-clamp-1", isActive ? "text-accent" : "text-slate-700")}>{content.title}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase">{content.type}</p>
                                                    </div>
                                                    {content.fileUrl && (
                                                        <a href={content.fileUrl} target="_blank" rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="text-slate-300 hover:text-slate-600 shrink-0">
                                                            <Download className="h-3.5 w-3.5" />
                                                        </a>
                                                    )}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6">
                                            <FileText className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                            <p className="text-xs text-slate-400">No materials for this module</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
