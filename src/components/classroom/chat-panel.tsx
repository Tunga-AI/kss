'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage } from '@/lib/classroom-types';

interface ChatPanelProps {
    sessionId: string;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'chatMessages'),
            where('sessionId', '==', sessionId),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, sessionId]);

    const { data: messages } = useCollection<ChatMessage>(messagesQuery as any);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !firestore || !user || isSending) return;

        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'chatMessages'), {
                sessionId,
                userId: user.uid,
                userName: user.displayName || user.email || 'Anonymous',
                message: message.trim(),
                timestamp: serverTimestamp(),
                type: 'text',
            });
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages && messages.length > 0 ? (
                        messages.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                isOwn={msg.userId === user?.uid}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 mx-auto text-primary/20 mb-2" />
                            <p className="text-sm text-primary/40">No messages yet</p>
                            <p className="text-xs text-primary/30 mt-1">Be the first to say something!</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-primary/10">
                <div className="flex gap-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={isSending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim() || isSending}
                        className="bg-primary hover:bg-accent"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}

function MessageItem({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
    return (
        <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {!isOwn && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {message.userName?.charAt(0) || 'U'}
                    </AvatarFallback>
                </Avatar>
            )}
            <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                <div className="flex items-baseline gap-2 mb-1">
                    <p className={`text-xs font-bold text-primary/60 ${isOwn ? 'order-2' : ''}`}>
                        {isOwn ? 'You' : message.userName}
                    </p>
                    <p className={`text-[10px] text-primary/40 ${isOwn ? 'order-1' : ''}`}>
                        {message.timestamp && format(message.timestamp.toDate(), 'HH:mm')}
                    </p>
                </div>
                <div
                    className={`inline-block p-3 rounded-lg ${isOwn
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-primary/10 text-primary rounded-tl-none'
                        }`}
                >
                    <p className="text-sm">{message.message}</p>
                </div>
            </div>
        </div>
    );
}
