'use client';
import Link from "next/link";
import { useParams, notFound, useRouter } from "next/navigation";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program, ElearningModule } from "@/lib/program-types";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import {
    CheckCircle, ChevronLeft, ChevronRight, Lock, Play, FileDown,
    BookOpen, Clock, Award, ArrowLeft, Menu, X, CheckSquare2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";

// ─── Progress stored per learner ─────────────────────────────────────────────
// Firestore: kenyasales/elearningProgress/{learnerId}_{programId}
// Fields: completedModuleIds: string[], currentModuleId: string, lastAccessedAt

export default function ElearningLearnPage() {
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

    // ─── Progress state ────────────────────────────────────────────────────
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressKey = user?.uid && course?.id ? `${user.uid}_${course.id}` : null;

    // Load progress from Firestore
    useEffect(() => {
        if (!firestore || !progressKey || !course) return;

        async function loadProgress() {
            const ref = doc(firestore!, 'elearningProgress', progressKey!);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                setCompletedIds(new Set(data.completedModuleIds || []));
                setCurrentModuleId(data.currentModuleId || course!.elearningModules?.[0]?.id || null);
            } else {
                // First time: start from module 0
                setCurrentModuleId(course!.elearningModules?.[0]?.id || null);
            }
            setProgressLoaded(true);
        }
        loadProgress();
    }, [firestore, progressKey, course]);

    // Save progress helper
    const saveProgress = useCallback(async (completedSet: Set<string>, moduleId: string) => {
        if (!firestore || !progressKey) return;
        const ref = doc(firestore, 'elearningProgress', progressKey);
        await setDoc(ref, {
            learnerId: user?.uid,
            programId: course?.id,
            completedModuleIds: Array.from(completedSet),
            currentModuleId: moduleId,
            lastAccessedAt: serverTimestamp(),
        }, { merge: true });
    }, [firestore, progressKey, user, course]);

    // Mark current module complete
    const markComplete = useCallback(async () => {
        if (!currentModuleId) return;
        const next = new Set(completedIds);
        next.add(currentModuleId);
        setCompletedIds(next);
        await saveProgress(next, currentModuleId);
    }, [currentModuleId, completedIds, saveProgress]);

    // Navigate to a module
    const goToModule = useCallback(async (moduleId: string) => {
        setCurrentModuleId(moduleId);
        if (progressKey) await saveProgress(completedIds, moduleId);
        if (videoRef.current) { videoRef.current.pause(); videoRef.current.load(); }
    }, [completedIds, progressKey, saveProgress]);

    if (loading || !progressLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1C1D1F]">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-accent animate-spin" />
                    <p className="text-white/50 font-bold uppercase tracking-widest text-xs">Loading your course...</p>
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
        <div className="flex flex-col h-screen bg-[#1C1D1F] overflow-hidden">

            {/* ─── TOP BAR ────────────────────────────────────────────────── */}
            <header className="h-14 bg-[#2D2F31] border-b border-white/10 flex items-center gap-4 px-4 shrink-0 z-50">
                <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
                    <Link href={`/e-learning/${slug}`}><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{course.title || course.programName}</p>
                </div>
                {/* Progress bar */}
                <div className="hidden sm:flex items-center gap-3">
                    <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-white/60 text-xs font-bold">{completedCount}/{modules.length}</span>
                </div>
                {/* Sidebar toggle */}
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSidebarOpen(o => !o)}>
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* ─── MAIN VIDEO / CONTENT AREA ──────────────────────────── */}
                <main className="flex-1 overflow-y-auto bg-black">
                    {activeModule ? (
                        <>
                            {/* Video player */}
                            {activeModule.videoUrl ? (
                                <div className="w-full bg-black flex items-center justify-center" style={{ maxHeight: '65vh' }}>
                                    <video
                                        ref={videoRef}
                                        key={activeModule.id}
                                        src={activeModule.videoUrl}
                                        controls
                                        className="w-full max-h-[65vh] object-contain"
                                        poster={activeModule.thumbnailUrl}
                                        onEnded={markComplete}
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-video bg-[#2D2F31] flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3 text-white/30">
                                        <BookOpen className="h-12 w-12" />
                                        <p className="font-medium">No video for this module</p>
                                    </div>
                                </div>
                            )}

                            {/* Module details */}
                            <div className="bg-white max-w-4xl mx-auto m-6 rounded-2xl p-6 md:p-8 shadow-xl">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-xs font-black text-primary/40 uppercase tracking-widest mb-1">Module {activeIdx + 1}</p>
                                        <h1 className="text-2xl font-bold text-primary leading-tight">{activeModule.title}</h1>
                                        {activeModule.duration && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Clock className="h-3.5 w-3.5" />{activeModule.duration}</p>
                                        )}
                                    </div>
                                    {completedIds.has(activeModule.id) ? (
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold bg-green-50 rounded-full px-3 py-1 shrink-0">
                                            <CheckCircle className="h-4 w-4" /> Completed
                                        </span>
                                    ) : (
                                        <Button onClick={markComplete} className="bg-primary text-white font-bold rounded-tl-lg rounded-br-lg text-sm px-5 h-10 shrink-0">
                                            Mark Complete
                                        </Button>
                                    )}
                                </div>

                                {activeModule.description && (
                                    <p className="text-gray-600 leading-relaxed mb-6">{activeModule.description}</p>
                                )}

                                {/* Materials */}
                                {activeModule.materials.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black text-primary/40 uppercase tracking-widest mb-3">Supporting Materials</h3>
                                        <div className="space-y-2">
                                            {activeModule.materials.map((mat, i) => (
                                                <a key={i} href={mat.fileUrl} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group">
                                                    <FileDown className="h-5 w-5 text-accent shrink-0" />
                                                    <span className="flex-1 font-medium text-primary text-sm group-hover:underline">{mat.name}</span>
                                                    <span className="text-[9px] uppercase font-black text-primary/30 bg-white rounded px-2 py-0.5">{mat.fileType}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Prev / Next navigation */}
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                                    <Button variant="outline" onClick={() => prevModule && goToModule(prevModule.id)} disabled={!prevModule} className="rounded-tl-lg rounded-br-lg">
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                    </Button>
                                    {nextModule ? (
                                        <Button onClick={() => goToModule(nextModule.id)} className="bg-accent text-white rounded-tl-lg rounded-br-lg">
                                            Next <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    ) : (
                                        <Button onClick={markComplete} className="bg-green-600 text-white rounded-tl-lg rounded-br-lg">
                                            <Award className="h-4 w-4 mr-1" /> Finish Course
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/30">
                            <p>No modules available.</p>
                        </div>
                    )}
                </main>

                {/* ─── SIDEBAR: Module list ────────────────────────────────── */}
                {sidebarOpen && (
                    <aside className="w-80 bg-[#2D2F31] border-l border-white/10 overflow-y-auto shrink-0 flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-white/10">
                            <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">Course Content</p>
                            <div className="flex items-center justify-between">
                                <p className="text-white text-sm font-bold">{completedCount}/{modules.length} completed</p>
                                <span className="text-accent text-sm font-black">{progressPct}%</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>

                        {/* Module list */}
                        <div className="flex-1 overflow-y-auto py-2">
                            {modules.map((mod, idx) => {
                                const isActive = mod.id === activeModule?.id;
                                const isDone = completedIds.has(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => goToModule(mod.id)}
                                        className={cn(
                                            "w-full text-left flex items-start gap-3 px-5 py-4 transition-colors",
                                            isActive ? "bg-white/10 border-l-2 border-accent" : "hover:bg-white/5 border-l-2 border-transparent"
                                        )}
                                    >
                                        {/* Status icon */}
                                        <div className="shrink-0 mt-0.5">
                                            {isDone ? (
                                                <CheckSquare2 className="h-5 w-5 text-green-400" />
                                            ) : isActive ? (
                                                <div className="w-5 h-5 rounded-full border-2 border-accent bg-accent flex items-center justify-center">
                                                    <Play className="h-2.5 w-2.5 text-white fill-white" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-sm font-medium leading-snug truncate", isActive ? "text-white" : "text-white/60")}>
                                                {idx + 1}. {mod.title || `Module ${idx + 1}`}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {mod.duration && <span className="text-white/30 text-[10px]">{mod.duration}</span>}
                                                {mod.isPreview && <span className="text-accent text-[9px] font-black uppercase">Preview</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Completion banner */}
                        {completedCount === modules.length && modules.length > 0 && (
                            <div className="p-5 border-t border-white/10 bg-green-900/30">
                                <div className="flex items-center gap-2 text-green-400">
                                    <Award className="h-5 w-5" />
                                    <p className="text-sm font-bold">Course Complete! 🎉</p>
                                </div>
                                <p className="text-green-400/60 text-xs mt-1">You've completed all modules. Your certificate is ready.</p>
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}
