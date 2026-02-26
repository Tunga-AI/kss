'use client';
import { useDoc, useUsersFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { EventForm } from '../event-form';
import type { Event } from '@/lib/event-types';
import { RefreshCw } from 'lucide-react';

export default function EditEventPage({ params }: { params: { id: string } }) {
    const firestore = useUsersFirestore();
    const eventRef = firestore ? doc(firestore, 'events', params.id) : null;
    const { data: event, loading } = useDoc<Event>(eventRef as any);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-primary mb-2">Event Not Found</h1>
                <p className="text-primary/60">The event you are looking for does not exist or has been deleted.</p>
            </div>
        );
    }

    return <EventForm event={event} />;
}
