'use client';

import { useState, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { DeviceCheck } from '@/components/classroom/device-check';
import { LiveRoom } from '@/components/classroom/live-room';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, RefreshCw, PlayCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function InstructorSessionPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();
    const [deviceCheckComplete, setDeviceCheckComplete] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const sessionRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'classroom', id);
    }, [firestore, id]);

    const { data: session, loading } = useDoc<ClassroomSession>(sessionRef as any);

    const handleStartSession = async () => {
        if (!firestore || !session) return;

        setIsStarting(true);
        try {
            const roomName = `class-${session.id}-${Date.now()}`;
            await updateDoc(doc(firestore, 'classroom', session.id), {
                status: 'In Progress',
                isLive: true,
                liveKitRoomName: roomName,
                liveKitRoomId: roomName,
            });

            toast({
                title: 'Session started',
                description: 'Students can now join the session',
            });

            setDeviceCheckComplete(true);
        } catch (error) {
            console.error('Error starting session:', error);
            toast({
                title: 'Failed to start session',
                description: 'Please try again',
                variant: 'destructive',
            });
        } finally {
            setIsStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        notFound();
    }

    const isLive = session.status === 'In Progress' || session.isLive;
    const isCompleted = session.status === 'Completed';
    const isCancelled = session.status === 'Cancelled';

    if (deviceCheckComplete && isLive) {
        return <LiveRoom session={session} isInstructor={true} />;
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="mb-4 gap-2 text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <Settings className="h-4 w-4" />
                            Back to Classroom
                        </Button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="h-16 w-16 bg-accent/20 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center flex-shrink-0">
                                    <Video className="h-8 w-8 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{session.title}</h1>
                                    <p className="text-white/80 text-lg font-medium">{session.description}</p>
                                    <div className="flex flex-wrap gap-4 text-sm mt-4">
                                        <div className="flex items-center gap-2 text-white/70">
                                            <Calendar className="h-4 w-4 text-accent" />
                                            {session.startDateTime && format(session.startDateTime.toDate(), 'EEEE, MMMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/70">
                                            <Clock className="h-4 w-4 text-accent" />
                                            {session.startDateTime && format(session.startDateTime.toDate(), 'h:mm a')} -
                                            {session.endDateTime && format(session.endDateTime.toDate(), 'h:mm a')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <Link href={`/admin/classroom/${id}`}>
                                        <Settings className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Badge className={
                                    isLive ? 'bg-green-500 text-white text-base px-4 py-2' :
                                        isCompleted ? 'bg-primary/40 text-white text-base px-4 py-2' :
                                            isCancelled ? 'bg-destructive text-white text-base px-4 py-2' :
                                                'bg-accent text-white text-base px-4 py-2'
                                }>
                                    {session.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Device Check or Start Session */}
                {!isLive ? (
                    <>
                        {isCompleted || isCancelled ? (
                            <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-8 text-center">
                                <Video className="h-16 w-16 mx-auto text-primary/20 mb-4" />
                                <h2 className="text-2xl font-bold text-primary mb-4">
                                    {isCompleted ? 'This session has ended' : 'This session is cancelled'}
                                </h2>
                                <p className="text-primary/60 mb-6 text-lg">
                                    {isCompleted ? 'View session analytics and recording' : 'You can reschedule this session from the edit page'}
                                </p>
                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={() => router.back()}
                                        variant="outline"
                                        className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold text-primary"
                                    >
                                        Back to Classroom
                                    </Button>
                                    <Button
                                        asChild
                                        className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold bg-primary hover:bg-accent"
                                    >
                                        <Link href={`/admin/classroom/${id}`}>
                                            Edit Session
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-8">
                                <div className="text-center mb-6">
                                    <PlayCircle className="h-16 w-16 mx-auto text-accent mb-4" />
                                    <h2 className="text-2xl font-bold text-primary mb-2">Ready to Start?</h2>
                                    <p className="text-primary/60">
                                        When you start the session, students will be able to join the live class
                                    </p>
                                </div>

                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mb-6">
                                    <h3 className="font-bold text-primary mb-2">Before you start:</h3>
                                    <ul className="space-y-2 text-sm text-primary/70">
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent">•</span>
                                            <span>Check your camera and microphone</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent">•</span>
                                            <span>Ensure you have a stable internet connection</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent">•</span>
                                            <span>Prepare any materials you want to share</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent">•</span>
                                            <span>For large classes (200+ students), most learners will join as viewers</span>
                                        </li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={handleStartSession}
                                    disabled={isStarting}
                                    className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-lg rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold"
                                >
                                    {isStarting ? (
                                        <>
                                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                            Starting Session...
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="h-5 w-5 mr-2" />
                                            Start Live Session
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                ) : deviceCheckComplete === false && (
                    <DeviceCheck
                        onContinue={() => setDeviceCheckComplete(true)}
                        onCancel={() => router.back()}
                    />
                )}
            </div>
        </div>
    );
}
