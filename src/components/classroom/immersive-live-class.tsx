'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff,
    MessageSquare, FileText, Users, BarChart3, Download,
    Send, ImageIcon, Music, BookOpen, LayoutList, Radio
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { LearningCourse, LearningModule } from '@/lib/learning-types';
import type { ContentItem } from '@/lib/content-library-types';
import type { User as Learner } from '@/lib/user-types';
import type { FeedbackCycle } from '@/lib/feedback-types';
import type { ChatMessage } from '@/lib/classroom-types';

interface ImmersiveLiveClassProps {
    courseId: string;
    moduleId: string;
    backUrl: string;
}

type RightTab = 'chat' | 'materials' | 'participants';

export function ImmersiveLiveClass({ courseId, moduleId, backUrl }: ImmersiveLiveClassProps) {
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();

    const [token, setToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [rightTab, setRightTab] = useState<RightTab>('chat');
    const [sidebarOpen, setSidebarOpen] = useState(false); // hide module sidebar by default

    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    const [contentItems, setContentItems] = useState<Record<string, ContentItem>>({});
    const [joinedAt] = useState(new Date());

    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    // Fetch course
    const courseDoc = useMemo(() => firestore ? doc(firestore, 'learningCourses', courseId) : null, [firestore, courseId]);
    const { data: course, loading: courseLoading } = useDoc<LearningCourse>(courseDoc as any);

    // Fetch modules
    const modulesQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits'), where('courseId', '==', courseId)) : null, [firestore, courseId]);
    const { data: modules, loading: modulesLoading } = useCollection<LearningModule>(modulesQuery as any);

    // Fetch learners (for participants)
    const learnersQuery = useMemo(() => firestore && course?.cohortId ? query(collection(firestore, 'users'), where('cohortId', '==', course.cohortId)) : null, [firestore, course]);
    const { data: allocatedLearners } = useCollection<Learner>(learnersQuery as any);

    // Chat messages
    const chatQuery = useMemo(() => {
        if (!firestore || !selectedModule) return null;
        return query(collection(firestore, 'chatMessages'), where('sessionId', '==', selectedModule.id), orderBy('timestamp', 'asc'));
    }, [firestore, selectedModule]);
    const { data: messages } = useCollection<ChatMessage>(chatQuery as any);

    // Session participants (live)
    const participantsQuery = useMemo(() => {
        if (!firestore || !selectedModule) return null;
        return query(collection(firestore, 'sessionParticipants'), where('sessionId', '==', selectedModule.id), where('isOnline', '==', true));
    }, [firestore, selectedModule]);
    const { data: liveParticipants } = useCollection<any>(participantsQuery as any);

    // Set selected module
    useEffect(() => {
        if (modules && modules.length > 0 && !selectedModule) {
            const mod = modules.find(m => m.id === moduleId);
            setSelectedModule(mod || modules[0]);
        }
    }, [modules, moduleId, selectedModule]);

    // Fetch content items
    useEffect(() => {
        const fetchContent = async () => {
            if (!firestore || !modules || modules.length === 0) return;
            const allIds = modules.flatMap(m => m.contentIds || []);
            if (!allIds.length) return;
            const unique = Array.from(new Set(allIds));
            const map: Record<string, ContentItem> = {};
            for (let i = 0; i < unique.length; i += 10) {
                const chunk = unique.slice(i, i + 10);
                const q = query(collection(firestore, 'contentLibrary'), where(documentId(), 'in', chunk));
                const snap = await getDocs(q);
                snap.forEach(d => { map[d.id] = { id: d.id, ...d.data() } as ContentItem; });
            }
            setContentItems(map);
        };
        fetchContent();
    }, [firestore, modules]);

    // Get LiveKit token
    useEffect(() => {
        const getToken = async () => {
            if (!user || !auth?.currentUser || !selectedModule) return;
            if (selectedModule.deliveryType === 'Physical' || selectedModule.deliveryType === 'Self-paced') {
                setIsLoading(false);
                return;
            }
            try {
                const idToken = await auth.currentUser.getIdToken();
                const response = await fetch('/api/livekit/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: `course-${courseId}-module-${selectedModule.id}`,
                        participantName: user.displayName || user.email || 'Anonymous',
                        metadata: { role: 'instructor', sessionId: selectedModule.id },
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
        if (selectedModule) getToken();
    }, [user, auth, selectedModule, courseId]);

    // Track attendance
    useEffect(() => {
        if (!firestore || !user || !selectedModule) return;
        const participantRef = collection(firestore, 'sessionParticipants');
        let participantDocId: string;
        const recordJoin = async () => {
            const docRef = await addDoc(participantRef, {
                sessionId: selectedModule.id,
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

    // Auto-scroll chat
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !firestore || !user || isSending || !selectedModule) return;
        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'chatMessages'), {
                sessionId: selectedModule.id,
                userId: user.uid,
                userName: user.displayName || user.email || 'Instructor',
                message: chatInput.trim(),
                timestamp: serverTimestamp(),
                type: 'text',
            });
            setChatInput('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const handleDisconnect = () => router.push(backUrl);

    const isLive = selectedModule?.deliveryType === 'Virtual' || selectedModule?.deliveryType === 'Hybrid';
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

    if (courseLoading || modulesLoading || isLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-primary/60 font-semibold">Connecting to class...</p>
            </div>
        );
    }
    if (!course || !selectedModule) return null;

    const contentList = selectedModule.contentIds?.map(cid => contentItems[cid]).filter(Boolean) || [];

    const VideoPlaceholder = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
            <div className="bg-white/10 rounded-full p-6 mb-4 border border-white/10">
                <Radio className="h-10 w-10 text-white/50" />
            </div>
            <p className="text-white/70 font-bold text-base">Live Stream</p>
            <p className="text-white/40 text-sm mt-1">Session is active · Join to participate</p>
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col bg-slate-50 font-body overflow-hidden">
            {/* Top Header Banner - teal/dark */}
            <div className="bg-[#2d5c6e] text-white px-6 py-4 shrink-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <button onClick={handleDisconnect} className="text-white/60 hover:text-white mt-1 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="font-bold text-xl leading-tight">{course.title}</h1>
                            <p className="text-white/60 text-sm mt-0.5">{course.description || 'Join the interactive live session.'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-lg p-2.5 border border-white/10 transition-colors"
                    >
                        <LayoutList className="h-4 w-4" />
                    </button>
                </div>

                {/* Currently Active Module Card */}
                <div className="mt-4 bg-white/10 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-base">{selectedModule.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-white/60 flex items-center gap-1">
                                <Users className="h-3 w-3" />{liveParticipants?.length || 0} participants
                            </span>
                        </div>
                    </div>
                    {isLive && (
                        <div className="flex flex-col items-end gap-1.5">
                            <Badge className="bg-transparent border-green-400 text-green-400 text-[11px] font-black uppercase tracking-widest px-2 py-0.5 flex items-center gap-1.5">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />LIVE
                            </Badge>
                            <p className="text-white/50 text-[11px]">{liveParticipants?.length || 0}/35 participants</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Module Sidebar (hidden by default, shown on toggle) */}
                {sidebarOpen && (
                    <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest">Course Modules</h3>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {modules?.sort((a, b) => a.orderIndex - b.orderIndex).map((mod, idx) => (
                                    <button
                                        key={mod.id}
                                        onClick={() => setSelectedModule(mod)}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 hover:bg-slate-50 transition-colors",
                                            selectedModule?.id === mod.id && "bg-primary/5 border border-primary/10"
                                        )}
                                    >
                                        <span className={cn("h-5 w-5 rounded text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5", selectedModule?.id === mod.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500")}>{idx + 1}</span>
                                        <div>
                                            <p className={cn("text-xs font-bold line-clamp-2 leading-snug", selectedModule?.id === mod.id ? "text-primary" : "text-slate-700")}>{mod.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{mod.contentIds?.length || 0} items</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Video / Live Stream */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <div className="px-5 py-3 bg-white border-b border-slate-200 shrink-0">
                        <p className="font-bold text-sm text-slate-800">Live Session</p>
                    </div>

                    {token && isLive ? (
                        <LiveKitRoom
                            video={false}
                            audio={false}
                            token={token}
                            serverUrl={wsUrl}
                            data-lk-theme="default"
                            onDisconnected={handleDisconnect}
                            className="flex-1 relative overflow-hidden"
                        >
                            <VideoConference />
                            <RoomAudioRenderer />
                            {/* Controls overlay */}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl rounded-2xl px-5 py-2.5 border border-white/10 shadow-2xl">
                                    <MicrophoneToggle />
                                    <CameraToggle />
                                    <div className="h-7 w-px bg-white/20 mx-1" />
                                    <Button variant="destructive" className="h-10 px-5 rounded-xl font-bold text-sm" onClick={handleDisconnect}>
                                        <PhoneOff className="h-4 w-4 mr-2" />End
                                    </Button>
                                </div>
                            </div>
                        </LiveKitRoom>
                    ) : (
                        <div className="flex-1 relative bg-slate-800 overflow-hidden">
                            <VideoPlaceholder />
                            {/* End class button for non-live */}
                            {!isLive && (
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                                    <Button variant="destructive" className="h-10 px-6 rounded-xl font-bold" onClick={handleDisconnect}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />Leave Session
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 shrink-0 bg-white">
                        {(['chat', 'materials', 'participants'] as RightTab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setRightTab(tab)}
                                className={cn(
                                    "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors",
                                    rightTab === tab
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab === 'chat' ? 'Live Chat' : tab === 'materials' ? 'Materials' : 'Members'}
                            </button>
                        ))}
                    </div>

                    {/* Chat Tab */}
                    {rightTab === 'chat' && (
                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                                {!messages || messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400">No messages yet</p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">Be the first to say something!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className="space-y-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className={cn("text-xs font-bold", msg.userId === user?.uid ? "text-[#2d5c6e]" : "text-primary")}>
                                                    {msg.userId === user?.uid ? 'You' : msg.userName}
                                                </span>
                                                {msg.timestamp && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">{msg.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 shrink-0">
                                <div className="flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 h-9 text-xs rounded-lg border-slate-200"
                                        disabled={isSending}
                                    />
                                    <Button type="submit" size="icon" className="h-9 w-9 bg-[#2d5c6e] hover:bg-[#1d4a5c] rounded-lg shrink-0" disabled={!chatInput.trim() || isSending}>
                                        <Send className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Materials Tab */}
                    {rightTab === 'materials' && (
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-2">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-3">Class Materials</p>
                                {contentList.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400">No materials shared yet</p>
                                    </div>
                                ) : (
                                    contentList.map((content) => content && (
                                        <div key={content.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 transition-all group">
                                            <div className="bg-slate-100 p-1.5 rounded-md text-slate-500 shrink-0">
                                                {content.type === 'video' ? <Video className="h-3.5 w-3.5" /> :
                                                    content.type === 'image' ? <ImageIcon className="h-3.5 w-3.5" /> :
                                                        content.type === 'audio' ? <Music className="h-3.5 w-3.5" /> :
                                                            <FileText className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700 line-clamp-1">{content.title}</p>
                                                <p className="text-[10px] text-slate-400 uppercase">{content.type}</p>
                                            </div>
                                            <a href={content.fileUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-slate-300 hover:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    {/* Participants Tab */}
                    {rightTab === 'participants' && (
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-3">
                                    Online Now · {liveParticipants?.length || 0}
                                </p>
                                {liveParticipants && liveParticipants.length > 0 ? (
                                    liveParticipants.map((p: any) => (
                                        <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className="bg-[#2d5c6e]/10 text-[#2d5c6e] text-xs font-bold">
                                                    {(p.userName || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{p.userName}</p>
                                                <p className="text-[10px] text-slate-400">{p.role || 'Learner'}</p>
                                            </div>
                                            <span className="ml-auto h-2 w-2 rounded-full bg-green-400 shrink-0" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400">No one else is online</p>
                                    </div>
                                )}

                                {allocatedLearners && allocatedLearners.length > 0 && (
                                    <>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-4 pt-4 border-t border-slate-100">
                                            All Enrolled · {allocatedLearners.length}
                                        </p>
                                        {allocatedLearners.map(l => {
                                            const isOnline = liveParticipants?.some((p: any) => p.userId === l.id);
                                            return (
                                                <div key={l.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-bold">
                                                            {(l.name || 'L').charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{l.name}</p>
                                                        <p className="text-[10px] text-slate-400">{l.email}</p>
                                                    </div>
                                                    <span className={cn("ml-auto h-2 w-2 rounded-full shrink-0", isOnline ? "bg-green-400" : "bg-slate-200")} />
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}

function MicrophoneToggle() {
    const { localParticipant } = useLocalParticipant();
    return (
        <Button variant="ghost" size="icon" onClick={() => localParticipant?.setMicrophoneEnabled(!localParticipant?.isMicrophoneEnabled)}
            className={cn("h-10 w-10 rounded-xl transition-all", localParticipant?.isMicrophoneEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white")}>
            {localParticipant?.isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
    );
}

function CameraToggle() {
    const { localParticipant } = useLocalParticipant();
    return (
        <Button variant="ghost" size="icon" onClick={() => localParticipant?.setCameraEnabled(!localParticipant?.isCameraEnabled)}
            className={cn("h-10 w-10 rounded-xl transition-all", localParticipant?.isCameraEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white")}>
            {localParticipant?.isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
    );
}
