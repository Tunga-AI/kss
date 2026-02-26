'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomEvent } from 'livekit-client';
import { useFirestore, useUser, useAuth, useCollection } from '@/firebase';
import { doc, updateDoc, addDoc, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2, Users, MessageSquare, FileText, BarChart3, Hand, X,
    Volume2, Mic, MicOff, Video, VideoOff, ExternalLink, Minimize2,
    PhoneOff, MonitorUp, MoreVertical, BookOpen, FileQuestion,
    Clock, Maximize2, PanelRightOpen, PanelRightClose, Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ClassroomSession, SharedDocument } from '@/lib/classroom-types';

import { DocumentPanel } from './document-panel';
import { QuizPanel } from './quiz-panel';
import { ParticipantsList } from './participants-list';
import { ChatPanel } from './chat-panel';

interface LiveRoomProps {
    session: ClassroomSession;
    isInstructor: boolean;
}

export function LiveRoom({ session, isInstructor }: LiveRoomProps) {
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const [token, setToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('chat');
    const [joinedAt] = useState(new Date());
    const [raisedHands, setRaisedHands] = useState<{ id: string; name: string; timestamp: number }[]>([]);
    const [isMyHandRaised, setIsMyHandRaised] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
    const [isVideoExpanded, setIsVideoExpanded] = useState(false);
    const [contentTab, setContentTab] = useState<'materials' | 'info'>('materials');

    // Get LiveKit token
    useEffect(() => {
        const getToken = async () => {
            if (!user || !auth?.currentUser) return;

            try {
                const idToken = await auth.currentUser.getIdToken();
                const response = await fetch('/api/livekit/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: session.liveKitRoomName || `session-${session.id}`,
                        participantName: user.displayName || user.email || 'Anonymous',
                        metadata: {
                            role: isInstructor ? 'instructor' : 'learner',
                            sessionId: session.id,
                        },
                        token: idToken,
                    }),
                });

                const data = await response.json();
                if (data.token) {
                    setToken(data.token);
                } else {
                    const errorMsg = data.error || 'Failed to get token';
                    toast({
                        title: 'Connection Error',
                        description: errorMsg,
                        variant: 'destructive',
                    });
                    throw new Error(errorMsg);
                }
            } catch (error: any) {
                console.error('Error getting LiveKit token:', error);
                if (!error.message.includes('token')) {
                    toast({
                        title: 'Connection Error',
                        description: error.message || 'Failed to connect to the session.',
                        variant: 'destructive',
                    });
                }
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        getToken();
    }, [user, session, isInstructor, router, auth]);

    // Track attendance
    useEffect(() => {
        if (!firestore || !user) return;

        const participantRef = collection(firestore, 'sessionParticipants');
        let participantDocId: string;

        const recordJoin = async () => {
            const docRef = await addDoc(participantRef, {
                sessionId: session.id,
                userId: user.uid,
                userName: user.displayName || user.email,
                userEmail: user.email,
                role: isInstructor ? 'instructor' : 'learner',
                joinedAt: serverTimestamp(),
                isOnline: true,
            });
            participantDocId = docRef.id;
        };

        recordJoin();

        return () => {
            if (participantDocId && firestore) {
                const participantDoc = doc(firestore, 'sessionParticipants', participantDocId);
                const duration = Math.floor((new Date().getTime() - joinedAt.getTime()) / 1000);
                updateDoc(participantDoc, {
                    leftAt: serverTimestamp(),
                    duration,
                    isOnline: false,
                }).catch(console.error);
            }
        };
    }, [firestore, user, session.id, isInstructor, joinedAt]);

    const handleDisconnect = useCallback(() => {
        router.back();
    }, [router]);

    const handleHandRaiseToggle = useCallback(async (room: any) => {
        if (!room?.localParticipant) return;

        const newRaisedState = !isMyHandRaised;
        setIsMyHandRaised(newRaisedState);

        const data = {
            type: 'hand_raise',
            participantId: room.localParticipant.identity,
            participantName: user?.displayName || user?.email || 'Anonymous',
            isRaised: newRaisedState,
            timestamp: Date.now(),
        };

        const payload = new TextEncoder().encode(JSON.stringify(data));
        await room.localParticipant.publishData(payload, {
            reliable: true,
        });

        setRaisedHands(prev => {
            if (newRaisedState) {
                if (prev.find(p => p.id === data.participantId)) return prev;
                return [...prev, { id: data.participantId, name: data.participantName, timestamp: data.timestamp }];
            } else {
                return prev.filter(p => p.id !== data.participantId);
            }
        });
    }, [isMyHandRaised, user]);

    const lowerHand = useCallback(async (participantId: string, room: any) => {
        if (!isInstructor || !room?.localParticipant) return;

        const data = {
            type: 'lower_hand_request',
            targetParticipantId: participantId,
        };

        const payload = new TextEncoder().encode(JSON.stringify(data));
        await room.localParticipant.publishData(payload, {
            reliable: true,
        });

        setRaisedHands(prev => prev.filter(p => p.id !== participantId));
    }, [isInstructor]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1a1a2e]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                            <Video className="h-8 w-8 text-white" />
                        </div>
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400 absolute -bottom-1 -right-1" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold">Connecting to class...</p>
                        <p className="text-white/40 text-sm mt-1">{session.title}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1a1a2e]">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md text-center">
                    <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <X className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                    <p className="text-white/50 mb-6">Unable to connect to the live session. Please try again.</p>
                    <Button onClick={() => router.back()} className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl h-11 px-6">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

    return (
        <div className="h-screen flex flex-col bg-[#1a1a2e] overflow-hidden">
            <LiveKitRoom
                video={false}
                audio={false}
                token={token}
                serverUrl={wsUrl}
                data-lk-theme="default"
                onDisconnected={handleDisconnect}
                className="flex-1 flex flex-col overflow-hidden"
            >
                {/* Top Header Bar */}
                <TopBar
                    session={session}
                    isInstructor={isInstructor}
                    isSidePanelOpen={isSidePanelOpen}
                    onToggleSidePanel={() => setIsSidePanelOpen(!isSidePanelOpen)}
                    onDisconnect={handleDisconnect}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Video + Content */}
                    <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
                        {/* Video Section */}
                        <div className={cn(
                            "relative rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 shrink-0",
                            isVideoExpanded ? "flex-1" : "h-[280px]"
                        )}>
                            {/* LiveKit Video */}
                            <div className="absolute inset-0 bg-[#0f0f23]">
                                <VideoConference />
                                <RoomAudioRenderer />
                                <RoomEventHandler
                                    sessionId={session.id}
                                    setRaisedHands={setRaisedHands}
                                    setIsMyHandRaised={setIsMyHandRaised}
                                    setActiveTab={setActiveTab}
                                />
                            </div>

                            {/* Video Overlay Controls */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                                    className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 rounded-lg"
                                    title={isVideoExpanded ? 'Minimize video' : 'Expand video'}
                                >
                                    {isVideoExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </Button>
                            </div>

                            {/* Hand Raise Queue (instructor only) */}
                            {isInstructor && raisedHands.length > 0 && (
                                <div className="absolute top-3 left-3 z-20">
                                    <HandRaiseQueue
                                        queue={raisedHands}
                                        onLowerHand={(id: any, room: any) => lowerHand(id, room)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Content Section (below video) */}
                        {!isVideoExpanded && (
                            <ContentPanel
                                session={session}
                                isInstructor={isInstructor}
                                contentTab={contentTab}
                                setContentTab={setContentTab}
                            />
                        )}
                    </div>

                    {/* Right: Side Panel */}
                    {isSidePanelOpen && (
                        <SidePanel
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            session={session}
                            isInstructor={isInstructor}
                            raisedHands={raisedHands}
                        />
                    )}
                </div>

                {/* Bottom Control Bar */}
                <BottomBar
                    isMyHandRaised={isMyHandRaised}
                    handleHandRaiseToggle={handleHandRaiseToggle}
                    handleDisconnect={handleDisconnect}
                    sessionTitle={session.title}
                />
            </LiveKitRoom>
        </div>
    );
}

/* ========================================
   TOP BAR
   ======================================== */
function TopBar({
    session,
    isInstructor,
    isSidePanelOpen,
    onToggleSidePanel,
    onDisconnect,
}: {
    session: ClassroomSession;
    isInstructor: boolean;
    isSidePanelOpen: boolean;
    onToggleSidePanel: () => void;
    onDisconnect: () => void;
}) {
    return (
        <div className="h-14 bg-[#16162a]/80 backdrop-blur-xl border-b border-white/5 px-4 flex items-center justify-between shrink-0 z-10">
            {/* Left: Session Info */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Video className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate">{session.title}</h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Live</span>
                            </div>
                            <span className="text-[10px] text-white/30">•</span>
                            <span className="text-[10px] text-white/40 font-medium">
                                {isInstructor ? 'Instructor' : 'Student'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidePanel}
                    className={cn(
                        "h-9 w-9 rounded-lg transition-all",
                        isSidePanelOpen
                            ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                    title={isSidePanelOpen ? 'Hide panel' : 'Show panel'}
                >
                    {isSidePanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}

/* ========================================
   CONTENT PANEL (materials & class info)
   ======================================== */
function ContentPanel({
    session,
    isInstructor,
    contentTab,
    setContentTab,
}: {
    session: ClassroomSession;
    isInstructor: boolean;
    contentTab: 'materials' | 'info';
    setContentTab: (tab: 'materials' | 'info') => void;
}) {
    const firestore = useFirestore();

    // Fetch shared documents for this session
    const documentsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'sharedDocuments'),
            where('sessionId', '==', session.id),
            where('sharedToClass', '==', true),
            orderBy('uploadedAt', 'desc')
        );
    }, [firestore, session.id]);

    const { data: documents } = useCollection<SharedDocument>(documentsQuery as any);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
        if (type.includes('image')) return '🖼️';
        return '📎';
    };

    return (
        <div className="flex-1 bg-[#16162a]/60 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
            {/* Content Header with Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setContentTab('materials')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            contentTab === 'materials'
                                ? "bg-white/10 text-white"
                                : "text-white/40 hover:text-white/70"
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Class Materials
                    </button>
                    <button
                        onClick={() => setContentTab('info')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            contentTab === 'info'
                                ? "bg-white/10 text-white"
                                : "text-white/40 hover:text-white/70"
                        )}
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        Class Info
                    </button>
                </div>
                {documents && documents.length > 0 && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold">
                        {documents.length} {documents.length === 1 ? 'file' : 'files'}
                    </Badge>
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {contentTab === 'materials' ? (
                    <>
                        {documents && documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all cursor-pointer"
                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl shrink-0">{getFileIcon(doc.fileType)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                                    {doc.fileName}
                                                </p>
                                                <p className="text-[10px] text-white/30 mt-1">
                                                    {formatFileSize(doc.fileSize)} • {doc.uploadedByName}
                                                </p>
                                                {doc.uploadedAt && (
                                                    <p className="text-[10px] text-white/20 mt-0.5">
                                                        {format(doc.uploadedAt.toDate(), 'MMM d, h:mm a')}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(doc.fileUrl, '_blank');
                                                }}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-12">
                                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-white/15" />
                                </div>
                                <p className="text-white/30 font-medium text-sm">No materials shared yet</p>
                                <p className="text-white/15 text-xs mt-1">
                                    {isInstructor
                                        ? 'Share documents with your class from the Files tab'
                                        : 'Your instructor will share materials here'}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-4">
                        {/* Session Description */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">About this class</h3>
                            <p className="text-sm text-white/70 leading-relaxed">
                                {session.description || 'No description provided for this class.'}
                            </p>
                        </div>

                        {/* Session Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Schedule</span>
                                </div>
                                <p className="text-sm font-medium text-white">
                                    {format(session.startDateTime.toDate(), 'MMM d, yyyy')}
                                </p>
                                <p className="text-xs text-white/50 mt-0.5">
                                    {format(session.startDateTime.toDate(), 'h:mm a')} — {format(session.endDateTime.toDate(), 'h:mm a')}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Video className="h-3.5 w-3.5 text-purple-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Type</span>
                                </div>
                                <p className="text-sm font-medium text-white">{session.type || 'Virtual'}</p>
                                <p className="text-xs text-white/50 mt-0.5">{session.location || 'Online session'}</p>
                            </div>
                        </div>

                        {/* Google Meet Link */}
                        {session.googleMeetLink && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExternalLink className="h-3.5 w-3.5 text-green-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Meeting Link</span>
                                </div>
                                <a
                                    href={session.googleMeetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors break-all"
                                >
                                    {session.googleMeetLink}
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ========================================
   SIDE PANEL
   ======================================== */
function SidePanel({ activeTab, setActiveTab, session, isInstructor, raisedHands }: any) {
    const { localParticipant } = useLocalParticipant();

    return (
        <div className="w-[340px] bg-[#16162a]/80 backdrop-blur-sm border-l border-white/5 flex flex-col shrink-0 m-3 ml-0 rounded-2xl overflow-hidden border border-white/5">
            {/* Tabs Header */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-2 pt-2 shrink-0">
                    <TabsList className="grid grid-cols-4 bg-white/5 rounded-xl h-10 p-0.5">
                        <TabsTrigger
                            value="chat"
                            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-lg gap-1.5 text-[11px] font-medium h-full"
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Chat</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="participants"
                            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-lg gap-1.5 text-[11px] font-medium h-full"
                        >
                            <Users className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">People</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="documents"
                            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-lg gap-1.5 text-[11px] font-medium h-full"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Files</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="quiz"
                            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-lg gap-1.5 text-[11px] font-medium h-full"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Polls</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <TabsContent value="chat" className="m-0 h-full overflow-auto [&>div]:h-full">
                        <ChatPanel sessionId={session.id} />
                    </TabsContent>
                    <TabsContent value="participants" className="m-0 h-full overflow-auto">
                        <ParticipantsList
                            sessionId={session.id}
                            raisedHands={raisedHands.map((h: any) => h.id)}
                        />
                    </TabsContent>
                    <TabsContent value="documents" className="m-0 h-full overflow-auto">
                        <DocumentPanel sessionId={session.id} isInstructor={isInstructor} />
                    </TabsContent>
                    <TabsContent value="quiz" className="m-0 h-full overflow-auto">
                        <QuizPanel
                            sessionId={session.id}
                            isInstructor={isInstructor}
                            room={{ localParticipant }}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

/* ========================================
   BOTTOM CONTROL BAR
   ======================================== */
function BottomBar({
    isMyHandRaised,
    handleHandRaiseToggle,
    handleDisconnect,
    sessionTitle,
}: {
    isMyHandRaised: boolean;
    handleHandRaiseToggle: (room: any) => void;
    handleDisconnect: () => void;
    sessionTitle: string;
}) {
    const { localParticipant } = useLocalParticipant();
    const room = { localParticipant };
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[72px] bg-[#16162a]/90 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between shrink-0">
            {/* Left: Time & Info */}
            <div className="flex items-center gap-3 w-[200px]">
                <span className="text-sm font-medium text-white/60">{format(currentTime, 'h:mm a')}</span>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-xs text-white/30 truncate">{sessionTitle}</span>
            </div>

            {/* Center: Media Controls */}
            <div className="flex items-center gap-2">
                {/* Mic Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => localParticipant?.setMicrophoneEnabled(!localParticipant?.isMicrophoneEnabled)}
                    className={cn(
                        "h-12 w-12 rounded-full transition-all duration-200",
                        localParticipant?.isMicrophoneEnabled
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "bg-red-500/90 text-white hover:bg-red-600"
                    )}
                    title={localParticipant?.isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                    {localParticipant?.isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                {/* Camera Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => localParticipant?.setCameraEnabled(!localParticipant?.isCameraEnabled)}
                    className={cn(
                        "h-12 w-12 rounded-full transition-all duration-200",
                        localParticipant?.isCameraEnabled
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "bg-red-500/90 text-white hover:bg-red-600"
                    )}
                    title={localParticipant?.isCameraEnabled ? 'Stop camera' : 'Start camera'}
                >
                    {localParticipant?.isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                {/* Hand Raise */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleHandRaiseToggle(room)}
                    className={cn(
                        "h-12 w-12 rounded-full transition-all duration-200",
                        isMyHandRaised
                            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 ring-2 ring-yellow-500/30"
                            : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                    )}
                    title={isMyHandRaised ? 'Lower hand' : 'Raise hand'}
                >
                    <Hand className={cn("h-5 w-5", isMyHandRaised && "fill-current animate-bounce")} />
                </Button>

                <div className="h-8 w-px bg-white/10 mx-1" />

                {/* Leave Call */}
                <Button
                    variant="ghost"
                    onClick={handleDisconnect}
                    className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 gap-2 font-medium"
                >
                    <PhoneOff className="h-4 w-4" />
                    Leave
                </Button>
            </div>

            {/* Right: Empty space for symmetry */}
            <div className="w-[200px]" />
        </div>
    );
}

/* ========================================
   ROOM EVENT HANDLER
   ======================================== */
function RoomEventHandler({
    sessionId,
    setRaisedHands,
    setIsMyHandRaised,
    setActiveTab
}: {
    sessionId: string;
    setRaisedHands: React.Dispatch<React.SetStateAction<{ id: string; name: string; timestamp: number }[]>>;
    setIsMyHandRaised: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveTab?: (tab: string) => void;
}) {
    const { localParticipant } = useLocalParticipant();

    useEffect(() => {
        if (!localParticipant) return;

        const handleDataReceived = (payload: Uint8Array, participant: any) => {
            const decoder = new TextDecoder();
            const data = JSON.parse(decoder.decode(payload));

            if (data.type === 'hand_raise') {
                setRaisedHands(prev => {
                    if (data.isRaised) {
                        if (prev.find(p => p.id === data.participantId)) return prev;
                        return [...prev, { id: data.participantId, name: data.participantName, timestamp: data.timestamp }];
                    } else {
                        return prev.filter(p => p.id !== data.participantId);
                    }
                });
            } else if (data.type === 'lower_hand_request') {
                if (data.targetParticipantId === localParticipant.identity) {
                    setIsMyHandRaised(false);
                    const lowerData = {
                        type: 'hand_raise',
                        participantId: localParticipant.identity,
                        isRaised: false,
                    };
                    localParticipant.publishData(new TextEncoder().encode(JSON.stringify(lowerData)), { reliable: true });
                }
            } else if (data.type === 'quiz_started') {
                toast({
                    title: 'New Poll/Quiz Started!',
                    description: data.question,
                    action: (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab?.('quiz')}
                        >
                            View
                        </Button>
                    ),
                });
            }
        };

        localParticipant.on(RoomEvent.DataReceived, handleDataReceived);
        return () => {
            localParticipant.off(RoomEvent.DataReceived, handleDataReceived);
        };
    }, [localParticipant, setRaisedHands, setIsMyHandRaised, setActiveTab]);

    return null;
}

/* ========================================
   HAND RAISE QUEUE
   ======================================== */
function HandRaiseQueue({ queue, onLowerHand }: any) {
    const { localParticipant } = useLocalParticipant();
    const room = { localParticipant };

    return (
        <div className="flex flex-col gap-2 pointer-events-auto max-w-[260px]">
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-yellow-500/10 px-3 py-2 border-b border-yellow-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hand className="h-3 w-3 text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Raised Hands</span>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] h-4 px-1.5">
                        {queue.length}
                    </Badge>
                </div>
                <div className="p-1.5 space-y-0.5 max-h-[200px] overflow-auto">
                    {queue.sort((a: any, b: any) => a.timestamp - b.timestamp).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 group hover:bg-white/10 transition-all">
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium text-white truncate">{p.name}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onLowerHand(p.id, room)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all rounded-md"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
