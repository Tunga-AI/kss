'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Users, Circle, Hand } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SessionParticipant } from '@/lib/classroom-types';

interface ParticipantsListProps {
    sessionId: string;
    raisedHands?: string[]; // Array of participant identities
    showOffline?: boolean;
}

export function ParticipantsList({ sessionId, raisedHands = [], showOffline = false }: ParticipantsListProps) {
    const firestore = useFirestore();

    const participantsQuery = useMemo(() => {
        if (!firestore) return null;
        const constraints = [
            where('sessionId', '==', sessionId),
        ];

        if (!showOffline) {
            constraints.push(where('isOnline', '==', true));
        }

        return query(collection(firestore, 'sessionParticipants'), ...constraints);
    }, [firestore, sessionId, showOffline]);

    const { data: participants, loading } = useCollection<SessionParticipant>(participantsQuery as any);

    // Deduplicate participants by userId, keeping only the most recent connection
    const uniqueParticipants = useMemo(() => {
        if (!participants) return [];

        const participantMap = new Map<string, SessionParticipant>();

        // Group by userId and keep the most recent (by joinedAt)
        participants.forEach(participant => {
            // Skip if joinedAt is not yet set (serverTimestamp may be null initially)
            if (!participant.joinedAt) return;

            const existing = participantMap.get(participant.userId);
            const participantTime = participant.joinedAt.toMillis();

            if (!existing) {
                participantMap.set(participant.userId, participant);
            } else if (existing.joinedAt) {
                const existingTime = existing.joinedAt.toMillis();
                if (participantTime > existingTime) {
                    participantMap.set(participant.userId, participant);
                }
            }
        });

        return Array.from(participantMap.values());
    }, [participants]);

    const instructors = uniqueParticipants?.filter(p => p.role === 'instructor') || [];
    const learners = uniqueParticipants?.filter(p => p.role === 'learner') || [];
    const onlineCount = uniqueParticipants?.filter(p => p.isOnline).length || 0;

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Participants ({onlineCount}/{uniqueParticipants?.length || 0})
                    </h3>
                </div>

                {/* Instructors */}
                {instructors.length > 0 && (
                    <div>
                        <p className="text-xs font-bold uppercase text-primary/40 mb-3">Instructors</p>
                        <div className="space-y-2">
                            {instructors.map((participant) => (
                                <ParticipantItem
                                    key={participant.userId}
                                    participant={participant}
                                    isHandRaised={raisedHands.includes(participant.userId)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Learners */}
                {learners.length > 0 && (
                    <div>
                        <p className="text-xs font-bold uppercase text-primary/40 mb-3">Learners</p>
                        <div className="space-y-2">
                            {learners.map((participant) => (
                                <ParticipantItem
                                    key={participant.userId}
                                    participant={participant}
                                    isHandRaised={raisedHands.includes(participant.userId)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!loading && uniqueParticipants?.length === 0 && (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-primary/20 mb-2" />
                        <p className="text-sm text-primary/40">No participants yet</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}

function ParticipantItem({ participant, isHandRaised }: { participant: SessionParticipant; isHandRaised?: boolean }) {
    const isOnline = participant.isOnline;

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors relative">
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {participant.userName?.charAt(0) || 'U'}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-primary truncate flex items-center gap-2">
                    {participant.userName}
                    {isHandRaised && <Hand className="h-3 w-3 text-yellow-500 fill-current" />}
                </p>
                <p className="text-xs text-primary/50 truncate">{participant.userEmail}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {isOnline ? (
                    <div title="Online">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    </div>
                ) : (
                    <div title="Offline">
                        <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
                    </div>
                )}
            </div>
        </div>
    );
}
