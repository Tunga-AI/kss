'use client';
import { notFound, useParams } from 'next/navigation';
import { SessionForm } from '../session-form';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditSessionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const sessionRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'classroom', id);
    }, [firestore, id]);

    const { data: session, loading } = useDoc<ClassroomSession>(sessionRef);

    if (loading) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!session) {
        notFound();
    }

    return <SessionForm session={session} />;
}
