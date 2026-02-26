'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, FileText, BarChart3, ArrowLeft, VideoOff } from 'lucide-react';
import type { ClassroomSession } from '@/lib/classroom-types';

import { DocumentPanel } from './document-panel';
import { QuizPanel } from './quiz-panel';
import { ParticipantsList } from './participants-list';
import { ChatPanel } from './chat-panel';

interface PastSessionViewProps {
    session: ClassroomSession;
}

export function PastSessionView({ session }: PastSessionViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('documents');

    return (
        <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="bg-[#111] text-white px-6 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-white/60 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">{session.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-medium uppercase">Archived</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Area (Placeholder for Recording) */}
                <div className="flex-1 relative bg-black flex flex-col items-center justify-center text-center p-8">
                    <div className="max-w-md space-y-4">
                        <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <VideoOff className="h-8 w-8 text-white/20" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Session Ended</h2>
                        <p className="text-white/60">
                            This live session has concluded. You can still access the chat history, shared documents, and poll results from the sidebar.
                        </p>
                        {/* Future: Add Video Player Here if recordingUrl exists */}
                    </div>
                </div>

                {/* Side Panel */}
                <div className="w-96 bg-white border-l border-primary/10 flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid grid-cols-4 rounded-none border-b shrink-0">
                            <TabsTrigger value="documents" className="gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="hidden lg:inline">Files</span>
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden lg:inline">Chat</span>
                            </TabsTrigger>
                            <TabsTrigger value="quiz" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden lg:inline">Polls</span>
                            </TabsTrigger>
                            <TabsTrigger value="participants" className="gap-2">
                                <Users className="h-4 w-4" />
                                <span className="hidden lg:inline">People</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-hidden">
                            <TabsContent value="participants" className="m-0 h-full overflow-auto">
                                <ParticipantsList
                                    sessionId={session.id}
                                    raisedHands={[]} // No hands in archive
                                    showOffline={true}
                                />
                            </TabsContent>
                            <TabsContent value="chat" className="m-0 h-full overflow-auto">
                                <ChatPanel sessionId={session.id} />
                            </TabsContent>
                            <TabsContent value="documents" className="m-0 h-full overflow-auto">
                                <DocumentPanel sessionId={session.id} isInstructor={false} />
                            </TabsContent>
                            <TabsContent value="quiz" className="m-0 h-full overflow-auto">
                                <QuizPanel
                                    sessionId={session.id}
                                    isInstructor={false}
                                    room={null} // No room connection
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
