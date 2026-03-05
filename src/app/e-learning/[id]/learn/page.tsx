'use client';
import Link from "next/link";
import { useParams, notFound, useRouter } from "next/navigation";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import {
    CheckCircle, ChevronLeft, ChevronRight, Play, FileDown,
    BookOpen, Clock, Award, ArrowLeft, Menu, X, CheckSquare2,
    Maximize2, Layout, FileText, MessageCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";
import { issueCertificate } from "@/lib/certificates";
import { useToast } from "@/hooks/use-toast";

export default function ElearningLearnPage() {
    const { toast } = useToast();
    const params = useParams();
    const router = useRouter();
    const slug = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useUsersFirestore();
    const { user } = useUser();

    const programQuery = useMemo(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);

    const { data: programs, loading } = useCollection<Program>(programQuery as any);
    const course = useMemo(() => programs?.[0], [programs]);

    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isPip, setIsPip] = useState(false);
    const [certificateIssued, setCertificateIssued] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const progressKey = user?.uid && course?.id ? `${user.uid}_${course.id}` : null;

    useEffect(() => {
        if (!firestore || !progressKey || !course) return;
        async function loadProgress() {
            const ref = doc(firestore!, 'elearningProgress', progressKey!);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                setCompletedIds(new Set(data.completedModuleIds || []));
                setCurrentModuleId(data.currentModuleId || course!.elearningModules?.[0]?.id || null);
                setCertificateIssued(!!data.certificateIssued);
            } else {
                setCurrentModuleId(course!.elearningModules?.[0]?.id || null);
            }
            setProgressLoaded(true);
        }
        loadProgress();
    }, [firestore, progressKey, course]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the top placeholder is out of view, we switch to PIP
                setIsPip(!entry.isIntersecting && entry.boundingClientRect.y < 0);
            },
            { threshold: 0 }
        );
        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    const saveProgress = useCallback(async (completedSet: Set<string>, moduleId: string, certIssuedState: boolean) => {
        if (!firestore || !progressKey) return;
        const ref = doc(firestore, 'elearningProgress', progressKey);
        await setDoc(ref, {
            learnerId: user?.uid,
            programId: course?.id,
            completedModuleIds: Array.from(completedSet),
            currentModuleId: moduleId,
            certificateIssued: certIssuedState,
            lastAccessedAt: serverTimestamp(),
        }, { merge: true });
    }, [firestore, progressKey, user, course]);

    const markComplete = useCallback(async () => {
        if (!currentModuleId || !course || !user || !firestore) return;
        const next = new Set(completedIds);
        next.add(currentModuleId);
        setCompletedIds(next);

        let issuedNow = false;
        // Auto-generate certificate if 100% complete
        if (next.size === course.elearningModules?.length && !certificateIssued) {
            try {
                // Ensure we don't duplicate
                const certsQuery = query(collection(firestore, 'certificates'), where('learnerId', '==', user.uid), where('programId', '==', course.id));
                const existing = await getDocs(certsQuery);
                if (existing.empty) {
                    const learnerDoc = await getDoc(doc(firestore, 'learners', user.uid));
                    const learnerName = learnerDoc.exists() ? learnerDoc.data().name : user.displayName || 'Learner';

                    await issueCertificate(firestore, {
                        learnerName,
                        learnerEmail: user.email || '',
                        learnerId: user.uid,
                        programTitle: course.title || course.programName,
                        programId: course.id,
                        programType: course.programType,
                        isSystemGenerated: true,
                    });
                }

                issuedNow = true;
                setCertificateIssued(true);
                toast({ title: 'Course Completed! 🎉', description: 'Your certificate has been automatically generated.' });
            } catch (error) {
                console.error("Certificate auto-generation error:", error);
            }
        }

        await saveProgress(next, currentModuleId, issuedNow || certificateIssued);
    }, [currentModuleId, completedIds, saveProgress, course, certificateIssued, firestore, user, toast]);

    const goToModule = useCallback(async (moduleId: string) => {
        setCurrentModuleId(moduleId);
        if (progressKey) await saveProgress(completedIds, moduleId, certificateIssued);
        // Do not force reload to allow smooth transitions if we used custom players, 
        // but generic HTML5 might need explicit pause/play handling.
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.load();
            videoRef.current.play().catch(e => console.error("Autoplay prevented"));
        }
        // Force scroll back to top of container
        document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [completedIds, progressKey, saveProgress]);

    // Track video time if we want to save it
    const handleTimeUpdate = () => {
        // Here we could sync videoRef.current.currentTime to Firestore occasionally
    }

    if (loading || !progressLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-accent animate-spin" />
                    <p className="font-bold uppercase tracking-widest text-xs">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course || course.programType !== 'E-Learning') notFound();

    const modules = course.elearningModules || [];
    const activeModule = modules.find(m => m.id === currentModuleId) || modules[0];
    const activeIdx = modules.findIndex(m => m.id === activeModule?.id);
    const prevModule = activeIdx > 0 ? modules[activeIdx - 1] : null;
    const nextModule = activeIdx < modules.length - 1 ? modules[activeIdx + 1] : null;
    const completedCount = modules.filter(m => completedIds.has(m.id)).length;
    const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden font-body text-gray-800">
            {/* ─── TOP HEADER ─────────────────────────────────────────────── */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-40 shadow-sm relative w-full">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" asChild className="text-gray-500 hover:text-primary hover:bg-gray-100">
                        <Link href={`/dashboard/e-learning`}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="hidden sm:block border-l border-gray-200 h-8 mx-2" />
                    <div>
                        <p className="text-xs font-black text-primary/40 uppercase tracking-widest leading-none mb-1">E-Learning</p>
                        <h1 className="text-gray-900 font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md md:max-w-xl">{course.title || course.programName}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Progress Desktop */}
                    <div className="hidden md:flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold text-xs">{progressPct}% Complete</span>
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{completedCount}/{modules.length} Modules</span>
                        </div>
                        <Progress value={progressPct} className="h-2 w-48" />
                    </div>

                    <Button variant="outline" size="icon" className="md:hidden" onClick={() => setSidebarOpen(o => !o)}>
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </header>

            {/* ─── MAIN WORKSPACE ─────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Main Video & Content Area */}
                <main className="flex-1 overflow-y-auto relative bg-gray-50/30" id="main-scroll-area">
                    {/* Sentinel for PIP tracking */}
                    <div ref={sentinelRef} className="absolute top-0 w-full h-[50px] pointer-events-none" />

                    {!sidebarOpen && (
                        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)} className="fixed top-20 left-4 z-40 bg-white shadow-md md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}

                    {activeModule ? (
                        <div className="max-w-6xl mx-auto pb-24">
                            {/* Video Hero Section */}
                            <div className={cn(
                                "w-full bg-black relative shadow-sm transition-all duration-300 md:rounded-b-2xl overflow-hidden shrink-0",
                                isPip
                                    ? "fixed bottom-6 right-6 w-[320px] md:w-[400px] rounded-xl z-[100] shadow-2xl ring-4 ring-white/10"
                                    : "aspect-video md:aspect-[21/9] lg:aspect-[16/9]"
                            )}>
                                {activeModule.videoUrl ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            key={activeModule.id}
                                            src={activeModule.videoUrl}
                                            controls
                                            className="w-full h-full object-contain bg-black"
                                            poster={activeModule.thumbnailUrl}
                                            onEnded={markComplete}
                                            onTimeUpdate={handleTimeUpdate}
                                            controlsList="nodownload"
                                            playsInline
                                        />
                                        {/* Overlay for PIP maximization */}
                                        {isPip && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute top-3 right-3 h-8 w-8 bg-black/60 hover:bg-black/90 text-white border-none rounded-md z-10"
                                                onClick={() => {
                                                    document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                <Maximize2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center border-b border-gray-200">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <BookOpen className="h-16 w-16 text-gray-300" />
                                            <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Text or resource based lesson</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* If PIP, keep a placeholder so layout doesn't jump drastically */}
                            {isPip && <div className="aspect-video md:aspect-[21/9] lg:aspect-[16/9] w-full bg-gray-100/50 flex flex-col items-center justify-center border border-dashed border-gray-300 md:rounded-b-2xl mb-8 group cursor-pointer" onClick={() => document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <Layout className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Playing in Mini Player</p>
                                <p className="text-gray-400 text-xs mt-1">Click to scroll back to video</p>
                            </div>}

                            {/* Content Below Video */}
                            <div className="p-6 md:px-8 md:py-10">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-primary/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            Module {activeIdx + 1}
                                            {completedIds.has(activeModule.id) && <span className="text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-bold tracking-normal leading-none"><CheckCircle className="h-3 w-3" /> Completed</span>}
                                        </p>
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight md:leading-snug mb-3">{activeModule.title}</h1>
                                        {activeModule.duration && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-gray-100 w-fit px-3 py-1 rounded-md">
                                                <Clock className="h-4 w-4" /> {activeModule.duration}
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0 flex items-center gap-3">
                                        {!completedIds.has(activeModule.id) && (
                                            <Button onClick={markComplete} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-bold h-12 px-6 rounded-xl transition-colors">
                                                Mark as Complete
                                            </Button>
                                        )}
                                        {nextModule ? (
                                            <Button onClick={() => goToModule(nextModule.id)} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5">
                                                Next Module <ChevronRight className="h-4 w-4 ml-1.5" />
                                            </Button>
                                        ) : (
                                            <Button onClick={markComplete} variant="default" className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-6 rounded-xl shadow-[0_8px_16px_rgba(34,197,94,0.2)] transition-transform hover:-translate-y-0.5">
                                                <Award className="h-5 w-5 mr-1.5" /> Finish Course
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Tabs for Details */}
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="w-full justify-start h-12 bg-transparent border-b border-gray-200 rounded-none p-0 space-x-6 overflow-x-auto hide-scrollbar">
                                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 font-bold text-gray-500 uppercase tracking-widest text-xs min-w-max hover:text-gray-700">Overview</TabsTrigger>
                                        <TabsTrigger value="materials" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 font-bold text-gray-500 uppercase tracking-widest text-xs min-w-max hover:text-gray-700 flex items-center gap-2">
                                            Resources
                                            {activeModule.materials?.length > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] leading-none">{activeModule.materials.length}</span>}
                                        </TabsTrigger>
                                        <TabsTrigger value="transcript" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 font-bold text-gray-500 uppercase tracking-widest text-xs min-w-max hover:text-gray-700 hidden sm:flex">Transcript</TabsTrigger>
                                        <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 font-bold text-gray-500 uppercase tracking-widest text-xs min-w-max hover:text-gray-700">Q&A Comments</TabsTrigger>
                                    </TabsList>

                                    <div className="pt-8">
                                        <TabsContent value="overview" className="m-0 focus:outline-none">
                                            <h3 className="text-lg font-extrabold text-gray-900 mb-4">About this module</h3>
                                            <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-[15px]">
                                                {activeModule.description ? (
                                                    <div dangerouslySetInnerHTML={{ __html: activeModule.description.replace(/\ng/g, '<br />') }} />
                                                ) : (
                                                    <p className="italic text-gray-400">No description provided for this module.</p>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="materials" className="m-0 focus:outline-none">
                                            {activeModule.materials && activeModule.materials.length > 0 ? (
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {activeModule.materials.map((mat, i) => (
                                                        <a key={i} href={mat.fileUrl} target="_blank" rel="noreferrer"
                                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-accent hover:shadow-md transition-all group bg-white">
                                                            <div className="w-12 h-12 rounded-lg bg-gray-50 group-hover:bg-accent/10 border border-gray-100 flex items-center justify-center shrink-0 transition-colors">
                                                                <FileDown className="h-5 w-5 text-gray-400 group-hover:text-accent transition-colors" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-gray-900 text-sm truncate group-hover:text-accent transition-colors">{mat.name}</p>
                                                                <p className="text-[10px] uppercase font-black text-gray-400 mt-0.5 tracking-widest">{mat.fileType} Document</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-gray-900 font-bold mb-1">No downloadable materials</p>
                                                    <p className="text-gray-500 font-medium text-sm">This module does not include any accompanying files.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="transcript" className="m-0 focus:outline-none">
                                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center min-h-[300px]">
                                                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-gray-900 font-bold mb-2">Transcript Generation</h3>
                                                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">Transcripts and closed captions for video streams are automatically generated and will be available here soon.</p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="notes" className="m-0 focus:outline-none">
                                            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
                                                <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-gray-900 font-bold mb-2">Community Q&A</h3>
                                                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">Take timestamped notes or ask questions. Instructors and other students can reply to create a shared knowledge base.</p>
                                                <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-lg shadow-sm">Start a Discussion</Button>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400 font-medium pb-20">Course has no modules yet.</p>
                        </div>
                    )}
                </main>

                {/* Right/Left Sidebar - Course Modules List */}
                <aside className={cn(
                    "absolute md:relative z-30 h-full bg-white border-l border-gray-200 flex flex-col transition-all duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] md:shadow-none w-80 shrink-0 right-0",
                    sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-l-0"
                )}>
                    <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-10 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-extrabold text-gray-900 flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Modules</h2>
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden h-8 w-8 text-gray-400 hover:text-gray-700">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-black uppercase tracking-widest text-primary/40">{completedCount}/{modules.length} Completed</span>
                            <span className="text-xs font-black text-primary">{progressPct}%</span>
                        </div>
                        <Progress value={progressPct} className="h-1.5 w-full bg-gray-100" />
                    </div>

                    <div className="flex-1 overflow-y-auto w-80 pt-2 pb-10">
                        <div className="px-3 space-y-1.5">
                            {modules.map((mod, idx) => {
                                const isActive = mod.id === activeModule?.id;
                                const isDone = completedIds.has(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => goToModule(mod.id)}
                                        className={cn(
                                            "w-full text-left flex items-start gap-4 px-4 py-3.5 rounded-xl transition-all group relative border",
                                            isActive ? "bg-primary/5 border-primary/20 shadow-sm" : "border-transparent hover:bg-gray-50 text-gray-500 hover:text-gray-900"
                                        )}
                                    >
                                        <div className="shrink-0 mt-0.5 relative">
                                            {isDone ? (
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </div>
                                            ) : isActive ? (
                                                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-md shadow-accent/20">
                                                    <Play className="h-2.5 w-2.5 text-white fill-white ml-0.5" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border border-gray-300 group-hover:border-gray-400 transition-colors flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                    {idx + 1}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-bold leading-snug mb-1 truncate",
                                                isActive ? "text-primary" : "text-gray-700 group-hover:text-gray-900 transition-colors"
                                            )}>
                                                {mod.title || `Module ${idx + 1}`}
                                            </p>
                                            <div className="flex items-center gap-2.5 text-[11px] font-medium opacity-80">
                                                {mod.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3 opacity-70" />{mod.duration}</span>}
                                                {mod.materials?.length > 0 && <span className="flex items-center gap-1"><FileText className="h-3 w-3 opacity-70" />{mod.materials.length} res</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {completedCount === modules.length && modules.length > 0 && (
                            <div className="m-4 mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl flex flex-col items-center text-center shadow-inner">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-[0_4px_10px_rgba(34,197,94,0.1)]">
                                    <Award className="h-6 w-6 text-green-600" />
                                </div>
                                <p className="font-bold text-green-900 mb-1">Course Completed! 🎉</p>
                                <p className="text-xs text-green-700 font-medium mb-4 leading-relaxed">You've finished everything. Your certificate is unlocked and ready to download.</p>
                                <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-[0_4px_12px_rgba(34,197,94,0.2)] h-10"
                                    asChild
                                >
                                    <Link href="/dashboard/certificates">View Certificate</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
