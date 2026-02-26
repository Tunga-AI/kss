'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useFirestore, useUser, useAuth, useCollection, useDoc } from '@/firebase';
import { doc, addDoc, collection, updateDoc, serverTimestamp, getDocs, query, documentId, where, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    ArrowLeft, Video, Maximize2, Minimize2, PanelRightClose, PanelRightOpen,
    LayoutList, Mic, MicOff, VideoOff, Hand, PhoneOff, MessageSquare, Users, FileText,
    BarChart3, PlayCircle, ImageIcon, Music, BookOpen
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { LearningCourse, LearningModule } from '@/lib/learning-types';
import type { ContentItem } from '@/lib/content-library-types';
import type { User as Learner } from '@/lib/user-types';
import type { FeedbackCycle } from '@/lib/feedback-types';

import { ChatPanel } from './chat-panel';
import { ParticipantsList } from './participants-list';
import { DocumentPanel } from './document-panel';

interface ImmersiveLiveClassProps {
    courseId: string;
    moduleId: string;
    backUrl: string;
}

export function ImmersiveLiveClass({ courseId, moduleId, backUrl }: ImmersiveLiveClassProps) {
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();

    const [token, setToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [contentTab, setContentTab] = useState<'materials' | 'chat' | 'participants' | 'documents' | 'quiz' | 'feedback'>('materials');

    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [contentItems, setContentItems] = useState<Record<string, ContentItem>>({});

    const [raisedHands, setRaisedHands] = useState<{ id: string; name: string; timestamp: number }[]>([]);
    const [joinedAt] = useState(new Date());

    // Fetch course
    const courseDoc = useMemo(() => firestore ? doc(firestore, 'learningCourses', courseId) : null, [firestore, courseId]);
    const { data: course, loading: courseLoading } = useDoc<LearningCourse>(courseDoc as any);

    // Fetch modules
    const modulesQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits'), where('courseId', '==', courseId)) : null, [firestore, courseId]);
    const { data: modules, loading: modulesLoading } = useCollection<LearningModule>(modulesQuery as any);

    // Fetch allocated learners? (for attendance register)
    const learnersQuery = useMemo(() => firestore && course?.cohortId ? query(collection(firestore, 'users'), where('cohortId', '==', course.cohortId)) : null, [firestore, course]);
    const { data: allocatedLearners } = useCollection<Learner>(learnersQuery as any);

    // Ensure selectedModule starts as the given moduleId
    useEffect(() => {
        if (modules && modules.length > 0 && !selectedModule) {
            const mod = modules.find(m => m.id === moduleId);
            if (mod) setSelectedModule(mod);
            else setSelectedModule(modules[0]);
        }
    }, [modules, moduleId, selectedModule]);

    // Fetch content items map
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
                snap.forEach(doc => { itemsMap[doc.id] = { id: doc.id, ...doc.data() } as ContentItem; });
            }
            setContentItems(itemsMap);
        };
        fetchContent();
    }, [firestore, modules]);

    // Get LiveKit token
    useEffect(() => {
        const getToken = async () => {
            if (!user || !auth?.currentUser || !selectedModule) return;
            if (selectedModule.deliveryType === 'Physical' || selectedModule.deliveryType === 'Self-paced') {
                setIsLoading(false);
                return; // LiveKit not needed
            }

            try {
                const idToken = await auth.currentUser.getIdToken();
                const response = await fetch('/api/livekit/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: `course-${courseId}-module-${selectedModule.id}`,
                        participantName: user.displayName || user.email || 'Anonymous',
                        metadata: {
                            role: 'instructor', // assuming admin acts as instructor here
                            sessionId: selectedModule.id,
                        },
                        token: idToken,
                    }),
                });

                const data = await response.json();
                if (data.token) setToken(data.token);
                else throw new Error(data.error || 'Failed to get token');
            } catch (error: any) {
                console.error('Error getting LiveKit token:', error);
                toast({ title: 'Connection Error', description: error.message, variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedModule) {
            getToken();
        }
    }, [user, auth, selectedModule, courseId]);

    // Track attendance
    useEffect(() => {
        if (!firestore || !user || !selectedModule) return;
        const participantRef = collection(firestore, 'sessionParticipants');
        let participantDocId: string;

        const recordJoin = async () => {
            const docRef = await addDoc(participantRef, {
                sessionId: selectedModule.id, // using moduleId as sessionId
                userId: user.uid,
                userName: user.displayName || user.email,
                userEmail: user.email,
                role: 'instructor',
                joinedAt: serverTimestamp(),
                isOnline: true,
            });
            participantDocId = docRef.id;
        };
        recordJoin();

        return () => {
            if (participantDocId && firestore) {
                const docRef = doc(firestore, 'sessionParticipants', participantDocId);
                const duration = Math.floor((new Date().getTime() - joinedAt.getTime()) / 1000);
                updateDoc(docRef, { leftAt: serverTimestamp(), duration, isOnline: false }).catch(console.error);
            }
        };
    }, [firestore, user, selectedModule, joinedAt]);


    const handleDisconnect = () => router.push(backUrl);

    if (courseLoading || modulesLoading || isLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-primary/60 font-semibold">Connecting to class...</p>
            </div>
        );
    }
    if (!course || !selectedModule) return null;

    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

    return (
        <div className="min-h-screen w-full bg-gray-50/50 font-body flex flex-col">
            {/* Top Navigation Bar - Light Theme */}
            <div className="h-16 bg-white border-b border-primary/10 px-6 flex items-center justify-between shadow-sm shrink-0 sticky top-0 z-30">
                <div className="flex items-center gap-4 text-primary">
                    <Button variant="ghost" size="icon" className="hover:bg-primary/5 rounded-full" onClick={handleDisconnect}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-6 w-px bg-primary/10 mx-1"></div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight line-clamp-1">{course.title}</h1>
                        <p className="text-xs text-primary/60 font-medium line-clamp-1 flex gap-2 items-center">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live Session</span>
                            <span>•</span>
                            <span>{selectedModule.title || 'Untitled Module'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 transition-colors text-xs font-bold shadow-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <LayoutList className="h-4 w-4 mr-2" />
                        {sidebarOpen ? 'Hide Curriculum' : 'Show Curriculum'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 w-full mx-auto overflow-hidden">
                {/* Sidebar Curriculum (Left) - Scrollable list */}
                <div className={cn("w-80 bg-white border-r border-primary/10 flex flex-col shrink-0 lg:static fixed z-20 h-[calc(100vh-64px)] overflow-hidden transition-all duration-300", sidebarOpen ? "translate-x-0 ml-0 border-r" : "-translate-x-full lg:-ml-80 lg:translate-x-0 hidden lg:flex")}>
                    <div className="p-5 border-b border-primary/10 flex flex-col gap-2 shrink-0 bg-gray-50/50">
                        <h2 className="font-bold text-base text-primary">Course Content</h2>
                        <div className="flex gap-2 text-xs text-primary/60 font-medium">
                            <Badge className="bg-primary/5 text-primary border-none text-[10px] uppercase font-bold tracking-widest">{modules?.length || 0} Modules</Badge>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 p-3 pb-20">
                        {modules?.sort((a, b) => a.orderIndex - b.orderIndex).map((mod, index) => (
                            <div key={mod.id} className="rounded-xl overflow-hidden flex flex-col mb-2">
                                <button
                                    className={cn("w-full text-left p-4 hover:bg-primary/5 transition-colors flex items-start gap-4 rounded-xl", selectedModule?.id === mod.id ? "bg-primary text-white" : "text-primary")}
                                    onClick={() => setSelectedModule(mod)}
                                >
                                    <div className={cn("font-bold text-sm h-7 w-7 rounded flex items-center justify-center shrink-0 mt-0.5", selectedModule?.id === mod.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold line-clamp-2 leading-snug">{mod.title}</p>
                                        <p className={cn("text-[10px] uppercase tracking-widest font-black mt-1.5 flex gap-2 items-center", selectedModule?.id === mod.id ? "text-white/70" : "text-primary/40")}>
                                            <span>{mod.deliveryType}</span>
                                            <span>•</span>
                                            <span>{mod.contentIds?.length || 0} Items</span>
                                        </p>
                                    </div>
                                </button>
                                {selectedModule?.id === mod.id && mod.contentIds && mod.contentIds.length > 0 && (
                                    <div className="flex flex-col py-2 px-2 ml-4 border-l-2 border-primary/10 my-2 space-y-1">
                                        {mod.contentIds.map(contentId => {
                                            const content = contentItems[contentId];
                                            if (!content) return null;
                                            const isSelected = selectedContent?.id === content.id;
                                            return (
                                                <button key={content.id} onClick={() => { setSelectedContent(content); setContentTab('materials'); }} className={cn("w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-primary/5 rounded-lg transition-colors group", isSelected ? "bg-accent/10" : "")}>
                                                    <div className={cn("mt-0.5 shrink-0", isSelected ? "text-accent" : "text-primary/40 group-hover:text-primary")}>
                                                        {content.type === 'video' ? <Video className="h-4 w-4" /> : content.type === 'image' ? <ImageIcon className="h-4 w-4" /> : content.type === 'audio' ? <Music className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className={cn("text-sm font-medium line-clamp-2 leading-tight", isSelected ? "text-accent font-bold" : "text-primary/70 group-hover:text-primary")}>{content.title}</p>
                                                        <span className="text-[9px] uppercase font-bold tracking-widest text-primary/40 mt-1 block">{content.type}</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area - Scrollable */}
                <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 overflow-y-auto w-full relative">
                    {token && (selectedModule.deliveryType === 'Virtual' || selectedModule.deliveryType === 'Hybrid') ? (
                        <LiveKitRoom
                            video={false}
                            audio={false}
                            token={token}
                            serverUrl={wsUrl}
                            data-lk-theme="default"
                            onDisconnected={handleDisconnect}
                            className="flex-1 flex flex-col max-w-[1200px] mx-auto w-full p-6 lg:p-10 gap-8 min-h-min"
                        >
                            {/* Live Video / Stream Viewer */}
                            <div className="w-full bg-black rounded-3xl overflow-hidden shadow-xl relative aspect-video xl:aspect-[21/9] flex-shrink-0">
                                <div className="absolute inset-0">
                                    <VideoConference />
                                    <RoomAudioRenderer />
                                </div>
                                {/* Video Controls Overlays */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10 shadow-2xl z-50">
                                    <MicrophoneToggle />
                                    <CameraToggle />
                                    <div className="h-8 w-px bg-white/20 mx-2"></div>
                                    <Button variant="destructive" className="h-12 px-6 rounded-xl font-bold font-body" onClick={handleDisconnect}>
                                        <PhoneOff className="h-5 w-5 mr-2" />
                                        End Class
                                    </Button>
                                </div>
                            </div>

                            {/* Below Video Content Tabs */}
                            <div className="w-full bg-white border border-primary/10 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[600px] flex-shrink-0 mb-20">
                                <Tabs value={contentTab} onValueChange={(val) => setContentTab(val as any)} className="w-full flex-1 flex flex-col">
                                    <div className="px-6 border-b border-primary/10 bg-gray-50/50 flex shrink-0 w-full overflow-x-auto no-scrollbar">
                                        <TabsList className="bg-transparent h-16 w-full justify-start gap-4 md:gap-8">
                                            <TabsTrigger value="materials" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-accent data-[state=active]:border-b-2 border-accent rounded-none h-full px-0 font-bold text-primary/60 tracking-tight"><FileText className="h-4 w-4 mr-2" /> Class Material</TabsTrigger>
                                            <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-accent data-[state=active]:border-b-2 border-accent rounded-none h-full px-0 font-bold text-primary/60 tracking-tight"><MessageSquare className="h-4 w-4 mr-2" /> Discussion</TabsTrigger>
                                            <TabsTrigger value="participants" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-accent data-[state=active]:border-b-2 border-accent rounded-none h-full px-0 font-bold text-primary/60 tracking-tight"><Users className="h-4 w-4 mr-2" /> Members ({allocatedLearners?.length || 0})</TabsTrigger>
                                            <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-accent data-[state=active]:border-b-2 border-accent rounded-none h-full px-0 font-bold text-primary/60 tracking-tight"><FileText className="h-4 w-4 mr-2" /> Resources</TabsTrigger>
                                            <TabsTrigger value="feedback" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-accent data-[state=active]:border-b-2 border-accent rounded-none h-full px-0 font-bold text-primary/60 tracking-tight"><BarChart3 className="h-4 w-4 mr-2" /> Feedback</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="flex-1 bg-white p-6 relative">
                                        <TabsContent value="materials" className="h-full m-0 min-h-[500px]">
                                            {selectedContent ? (
                                                <div className="w-full max-w-4xl mx-auto flex flex-col bg-white border border-primary/10 rounded-2xl overflow-hidden shadow-sm h-[600px]">
                                                    <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center bg-gray-50/50 shrink-0">
                                                        <h2 className="font-bold text-lg text-primary">{selectedContent.title}</h2>
                                                        <Button size="sm" asChild variant="outline" className="h-8 shadow-none font-bold text-xs bg-white">
                                                            <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">View Full Screen</a>
                                                        </Button>
                                                    </div>
                                                    <div className="bg-gray-100 flex-1 flex items-center justify-center p-4 min-h-0">
                                                        {selectedContent.type === 'video' ? <video src={selectedContent.fileUrl} controls className="w-full max-h-full rounded-xl shadow-lg border border-black/10 bg-black outline-none" /> :
                                                            selectedContent.type === 'image' ? <img src={selectedContent.fileUrl} alt={selectedContent.title} className="max-w-full max-h-full rounded-xl shadow-lg object-contain" /> :
                                                                selectedContent.type === 'audio' ? <audio src={selectedContent.fileUrl} controls className="w-full max-w-md outline-none" /> :
                                                                    (selectedContent.mimeType === 'application/pdf' || selectedContent.fileName?.endsWith('.pdf')) ? <iframe src={`${selectedContent.fileUrl}#toolbar=0`} className="w-full h-full rounded-xl border border-primary/10 shadow-sm bg-white" /> :
                                                                        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-primary/10 max-w-sm"><FileText className="h-16 w-16 text-primary/20 mx-auto mb-4" /><p className="text-sm font-medium text-primary/60 mb-4">No preview available.</p><a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm font-bold block">Download File</a></div>}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                                    <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
                                                        <BookOpen className="h-12 w-12 text-primary/20" />
                                                        <div className="absolute top-0 right-0 h-4 w-4 bg-accent rounded-full animate-ping"></div>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-primary mb-2">Select a content item</h3>
                                                    <p className="text-primary/60 max-w-md mx-auto">Click on any material in the course content outline on the left to view it here alongside the live class.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="chat" className="h-full m-0 min-h-[500px]">
                                            <div className="border border-primary/10 rounded-2xl overflow-hidden h-[600px] max-w-3xl mx-auto bg-white shadow-sm">
                                                <ChatPanel sessionId={selectedModule.id} />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="participants" className="h-full m-0 min-h-[500px]">
                                            <div className="border border-primary/10 rounded-2xl overflow-hidden h-[600px] max-w-3xl mx-auto bg-white shadow-sm">
                                                <ParticipantsList sessionId={selectedModule.id} raisedHands={raisedHands.map((h: any) => h.id)} />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="documents" className="h-full m-0 min-h-[500px]">
                                            <div className="max-w-4xl mx-auto border border-primary/10 rounded-2xl overflow-hidden bg-white shadow-sm h-[600px]">
                                                <DocumentPanel sessionId={selectedModule.id} isInstructor={true} />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="feedback" className="h-full m-0 min-h-[500px]">
                                            <div className="max-w-2xl mx-auto py-10">
                                                <div className="text-center mb-8">
                                                    <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <BarChart3 className="h-8 w-8 text-accent" />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-primary">Class Feedback & Surveys</h2>
                                                    <p className="text-primary/60 mt-2">Take a moment to provide feedback on this session.</p>
                                                </div>
                                                <FeedbackList />
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </LiveKitRoom>
                    ) : (
                        <div className="flex-1 flex flex-col p-8 lg:p-12 items-center text-center max-w-[1200px] mx-auto w-full min-h-[800px] mb-20">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <BookOpen className="h-12 w-12 text-primary/20" />
                            </div>
                            <h2 className="text-3xl font-bold text-primary mb-4">Self-Paced Material</h2>
                            <p className="text-primary/60 mb-12 max-w-xl text-lg">This module does not have a virtual live room assigned. You can review the course materials below at your own pace.</p>

                            {selectedContent ? (
                                <div className="w-full max-w-4xl flex flex-col bg-white border border-primary/10 rounded-3xl overflow-hidden shadow-lg text-left h-[700px]">
                                    <div className="px-8 py-5 border-b border-primary/10 flex justify-between items-center bg-gray-50 flex-shrink-0">
                                        <h2 className="font-bold text-lg text-primary">{selectedContent.title}</h2>
                                        <Button asChild size="sm" className="h-9 px-4 font-bold bg-accent hover:bg-accent/90 shadow-sm text-white rounded-lg">
                                            <a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">View Full Screen</a>
                                        </Button>
                                    </div>
                                    <div className="bg-white p-6 relative flex-1 flex items-center justify-center overflow-hidden min-h-0">
                                        {selectedContent.type === 'video' ? <video src={selectedContent.fileUrl} controls className="w-full max-h-full rounded-2xl shadow-md border border-primary/10 bg-black outline-none" /> :
                                            selectedContent.type === 'image' ? <img src={selectedContent.fileUrl} alt={selectedContent.title} className="max-w-full max-h-full object-contain rounded-2xl shadow-md" /> :
                                                selectedContent.type === 'audio' ? <audio src={selectedContent.fileUrl} controls className="w-full max-w-md outline-none" /> :
                                                    (selectedContent.mimeType === 'application/pdf' || selectedContent.fileName?.endsWith('.pdf')) ? <iframe src={`${selectedContent.fileUrl}#toolbar=0`} className="w-full h-full rounded-2xl border border-primary/10 shadow-sm" /> :
                                                        <div className="text-center p-12 bg-gray-50 rounded-2xl shadow-sm border border-primary/10 max-w-sm mx-auto"><FileText className="h-16 w-16 text-primary/20 mx-auto mb-4" /><p className="text-base font-medium text-primary/60 mb-6">Preview unavailable.</p><Button asChild className="bg-accent rounded-lg" size="lg"><a href={selectedContent.fileUrl} target="_blank" rel="noopener noreferrer">Download Material</a></Button></div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 border-2 border-dashed border-primary/20 rounded-3xl w-full max-w-3xl flex-shrink-0">
                                    <p className="text-primary/40 font-bold uppercase tracking-widest text-sm">Select material from the content outline to view.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MicrophoneToggle() {
    const { localParticipant } = useLocalParticipant();
    return (
        <Button variant="ghost" size="icon" onClick={() => localParticipant?.setMicrophoneEnabled(!localParticipant?.isMicrophoneEnabled)} className={cn("h-12 w-12 rounded-xl transition-all", localParticipant?.isMicrophoneEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white shadow-lg")}>
            {localParticipant?.isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
    )
}

function CameraToggle() {
    const { localParticipant } = useLocalParticipant();
    return (
        <Button variant="ghost" size="icon" onClick={() => localParticipant?.setCameraEnabled(!localParticipant?.isCameraEnabled)} className={cn("h-12 w-12 rounded-xl transition-all", localParticipant?.isCameraEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white shadow-lg")}>
            {localParticipant?.isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
    )
}

function FeedbackList() {
    const firestore = useFirestore();
    const queryCycles = useMemo(() => firestore ? query(collection(firestore, 'feedbackCycles'), where('status', '==', 'active')) : null, [firestore]);
    const { data: cycles, loading } = useCollection<FeedbackCycle>(queryCycles as any);

    if (loading) return <div className="text-primary/50 text-center text-sm p-8">Loading feedback forms...</div>;

    if (!cycles || cycles.length === 0) {
        return (
            <div className="bg-gray-50 border border-primary/10 rounded-2xl p-10 text-center">
                <p className="text-primary/40 text-sm font-medium">No active feedback surveys available for this session.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 text-left">
            {cycles.map(c => (
                <div key={c.id} className="bg-white border border-primary/10 shadow-sm p-6 rounded-2xl flex md:flex-row flex-col gap-4 items-start md:items-center justify-between hover:border-accent/40 transition-colors">
                    <div className="flex-1">
                        <p className="font-bold text-primary text-lg">{c.title}</p>
                        <p className="text-primary/60 text-sm mt-1">{c.description}</p>
                    </div>
                    <Button
                        className="bg-accent hover:bg-accent/90 text-white font-bold shrink-0 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-10 px-6 shadow-md"
                        onClick={() => window.open(`/dashboard/feedback/${c.id}`, '_blank')}
                    >
                        Take Survey
                    </Button>
                </div>
            ))}
        </div>
    );
}
